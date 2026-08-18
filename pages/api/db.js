/**
 * The data gateway. Every database read and write the browser makes now goes
 * through here.
 *
 * The browser sends a *description* of the query it wants — table, action,
 * filters, ordering — not SQL and not a Supabase request. This route resolves
 * who is asking from the signed session cookie, looks the request up in
 * lib/dbPolicy.js, narrows the columns, ANDs on the mandatory row scope, and
 * only then runs the query with the service-role key.
 *
 * Three properties are worth stating plainly:
 *
 *  1. The caller's identity comes from the cookie alone. No table, filter or
 *     body field can change who the server thinks you are.
 *  2. The scope filter is applied *in addition to* the caller's filters, never
 *     instead of them. Supabase ANDs them, so a caller can only ever narrow
 *     their own result set, never widen it.
 *  3. Anything not named in the policy is refused. New tables are locked until
 *     someone opts them in deliberately.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../lib/serverAuth';
import { policyFor, resolveSelect, resolveReturning, resolveWrite, resolveScope } from '../../lib/dbPolicy';

// Only these may appear in a request. `or` is included because three call sites
// legitimately need it; it is ANDed with the scope, so it cannot widen a result.
const FILTER_OPS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains']);
const ACTIONS = new Set(['select', 'insert', 'update', 'upsert', 'delete']);
const MAX_FILTERS = 12;
const MAX_LIMIT = 1000;

function deny(res, status, error) {
  return res.status(status).json({ data: null, error: { message: error }, count: null });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req) || { role: 'anon', id: null };
  const role = session.role || 'anon';

  const {
    table, action = 'select', columns, payload,
    filters = [], order, limit, single, count, head,
  } = req.body || {};

  if (typeof table !== 'string' || !ACTIONS.has(action)) {
    return deny(res, 400, 'Malformed request.');
  }
  if (!Array.isArray(filters) || filters.length > MAX_FILTERS) {
    return deny(res, 400, 'Too many filters.');
  }

  const rule = policyFor(table, role);
  if (!rule) return deny(res, 403, `Not permitted to read or write ${table}.`);

  const db = getSupabaseAdmin();

  // ── Column resolution ──────────────────────────────────────────────────────
  const countOnly = Boolean(head) && Boolean(count);
  let selectCols = null;
  if (action === 'select') {
    if (countOnly && !rule.select && rule.allowCount) {
      selectCols = 'id';            // head:true returns no rows, only the count
    } else {
      selectCols = resolveSelect(rule, columns);
      if (!selectCols) return deny(res, 403, `Not permitted to read ${table}.`);
    }
  } else if (columns !== undefined && columns !== null) {
    // insert/update/upsert/delete with `.select()` chained on. A role that can
    // read the table reads back through exactly the same column policy; one
    // that cannot sees only what `returning` allows — usually the new row's id,
    // so a form can confirm it saved without gaining a way to read the table.
    selectCols = resolveReturning(rule, columns);
    if (!selectCols) return deny(res, 403, `Not permitted to read back from ${table}.`);
  }

  // ── Build the query ────────────────────────────────────────────────────────
  let q;
  try {
    if (action === 'select') {
      q = db.from(table).select(selectCols, count ? { count, head: Boolean(head) } : undefined);
    } else if (action === 'delete') {
      if (!rule.delete) return deny(res, 403, `Not permitted to delete from ${table}.`);
      q = db.from(table).delete();
    } else {
      const write = resolveWrite(rule, action, payload, session);
      if (!write.ok) return deny(res, 403, write.error);
      q = action === 'insert' ? db.from(table).insert(write.row) : (
          action === 'upsert' ? db.from(table).upsert(write.row) :
                                db.from(table).update(write.row));
    }
  } catch (err) {
    return deny(res, 400, err.message || 'Could not build the query.');
  }

  // ── Mandatory scope, then the caller's own filters ────────────────────────
  // Insert is the one action with no rows to scope; `force`/`forceFromSession`
  // in the policy is what pins an inserted row to its owner instead.
  if (action !== 'insert') {
    const scope = await resolveScope(rule, session, db, action);
    if (scope) q = applyFilter(q, scope);
    if (!scope && action !== 'select' && (rule.scope || rule.writeScope)) {
      return deny(res, 403, 'Could not determine what you are allowed to change.');
    }
  }

  for (const f of filters) {
    if (f?.or) {
      if (typeof f.or !== 'string' || f.or.length > 512) return deny(res, 400, 'Malformed filter.');
      q = q.or(f.or);
      continue;
    }
    if (!f?.column || !FILTER_OPS.has(f.op)) return deny(res, 400, 'Unsupported filter.');
    q = applyFilter(q, f);
  }

  // ── Modifiers ─────────────────────────────────────────────────────────────
  if (order?.column) {
    q = q.order(String(order.column), { ascending: order.ascending !== false });
  }
  if (limit != null) {
    const n = Number(limit);
    if (!Number.isFinite(n) || n < 1) return deny(res, 400, 'Invalid limit.');
    q = q.limit(Math.min(n, MAX_LIMIT));
  }
  if (action !== 'select' && selectCols) q = q.select(selectCols);
  if (single === 'single') q = q.single();
  else if (single === 'maybeSingle') q = q.maybeSingle();

  const { data, error, count: total } = await q;
  if (error) {
    // PGRST116 is "no rows" from .single(); pass it through so callers keep
    // their existing error handling rather than seeing a 500.
    return res.status(200).json({ data: null, error: { message: error.message, code: error.code }, count: null });
  }
  return res.status(200).json({ data: data ?? null, error: null, count: total ?? null });
}

function applyFilter(q, f) {
  switch (f.op) {
    case 'in':       return q.in(f.column, Array.isArray(f.value) ? f.value : [f.value]);
    case 'is':       return q.is(f.column, f.value);
    case 'contains': return q.contains(f.column, f.value);
    default:         return q[f.op](f.column, f.value);
  }
}
