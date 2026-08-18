/**
 * The browser's data client.
 *
 * This used to be a real Supabase client holding the public anon key, which
 * meant every table was one devtools console away from anyone. It is now a thin
 * shim with the same shape: it records what the caller asked for and posts that
 * description to /api/db, which resolves the caller from the signed session
 * cookie, applies lib/dbPolicy.js, and runs the query with the service-role key.
 *
 * Keeping the query-builder shape means lib/store.js reads exactly as it did —
 * the authorisation boundary moved without a thousand call sites moving with
 * it. What changed is that the browser can no longer ask for anything the
 * policy does not allow.
 *
 * Supported, because it is what lib/store.js actually uses:
 *
 *   .select(cols, { count, head })   .insert(row)     .update(patch)
 *   .upsert(row)                     .delete()
 *   .eq .neq .gt .gte .lt .lte .like .ilike .is .in .contains .or
 *   .order(col, { ascending })       .limit(n)
 *   .single()                        .maybeSingle()
 *
 * Anything else throws where it is called rather than silently returning
 * everything, which is the failure mode that matters.
 */

const ENDPOINT = '/api/db';

const FILTER_METHODS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains'];

class Query {
  constructor(table) {
    this.req = { table, action: 'select', filters: [] };
    this.req.columns = '*';
  }

  select(columns = '*', opts) {
    // After a write, .select() means "return the affected rows", not "start a
    // new read" — the same distinction supabase-js makes.
    if (this.req.action === 'select') {
      this.req.columns = columns;
      if (opts?.count) { this.req.count = opts.count; this.req.head = Boolean(opts.head); }
    } else {
      this.req.columns = columns;
    }
    return this;
  }

  insert(payload) { this.req.action = 'insert'; this.req.payload = payload; this.req.columns = undefined; return this; }
  update(payload) { this.req.action = 'update'; this.req.payload = payload; this.req.columns = undefined; return this; }
  upsert(payload) { this.req.action = 'upsert'; this.req.payload = payload; this.req.columns = undefined; return this; }
  delete()        { this.req.action = 'delete'; this.req.columns = undefined; return this; }

  or(expression) { this.req.filters.push({ or: expression }); return this; }

  order(column, opts) { this.req.order = { column, ascending: opts?.ascending !== false }; return this; }
  limit(n) { this.req.limit = n; return this; }

  single()      { this.req.single = 'single'; return this; }
  maybeSingle() { this.req.single = 'maybeSingle'; return this; }

  async _run() {
    if (typeof window === 'undefined') {
      throw new Error(
        'lib/supabase.js is the browser data client and cannot run server-side. ' +
        'API routes should use lib/supabaseAdmin.js (service role) instead.'
      );
    }
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.req),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: { message: body?.error?.message || body?.error || `Request failed (${res.status})` }, count: null };
      }
      return { data: body.data ?? null, error: body.error ?? null, count: body.count ?? null };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Network error' }, count: null };
    }
  }

  // Thenable, so `await supabase.from(...).select(...)` works unchanged.
  then(resolve, reject) { return this._run().then(resolve, reject); }
  catch(onRejected)     { return this._run().catch(onRejected); }
  finally(onFinally)    { return this._run().finally(onFinally); }
}

for (const op of FILTER_METHODS) {
  Query.prototype[op] = function (column, value) {
    this.req.filters.push({ column, op, value });
    return this;
  };
}

export const supabase = {
  from(table) { return new Query(table); },
};
