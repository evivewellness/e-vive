import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLICY, policyFor, resolveSelect, resolveReturning, resolveWrite, resolveScope,
} from './dbPolicy.js';

const clientSession = { role: 'client', id: 'client-1' };
const hcaSession    = { role: 'hca',    id: 'hca-1' };
const adminSession  = { role: 'admin',  id: 'admin-1' };
const anonSession   = { role: 'anon',   id: null };

// ── Absent means denied ──────────────────────────────────────────────────────

test('a table with no entry for a role is denied', () => {
  assert.equal(policyFor('payroll_payments', 'client'), null);
  assert.equal(policyFor('payroll_payments', 'hca'), null);
  assert.equal(policyFor('payroll_payments', 'anon'), null);
  assert.ok(policyFor('payroll_payments', 'admin'));
});

test('an unknown table is denied for every role', () => {
  for (const role of ['anon', 'client', 'hca', 'admin']) {
    assert.equal(policyFor('secrets', role), null);
  }
});

test('anonymous callers cannot read clients, invoices, shifts or placements', () => {
  for (const table of ['invoices', 'shifts', 'placements', 'emails', 'notifications']) {
    const rule = policyFor(table, 'anon');
    assert.ok(!rule?.select, `anon should not select ${table}`);
  }
  assert.equal(resolveSelect(policyFor('clients', 'anon'), '*'), null);
});

test('no non-admin role may delete anything', () => {
  for (const [table, roles] of Object.entries(POLICY)) {
    for (const [role, rule] of Object.entries(roles)) {
      if (role === 'admin') continue;
      assert.ok(!rule.delete, `${role} must not delete from ${table}`);
    }
  }
});

// ── Column narrowing ─────────────────────────────────────────────────────────

test('a password column can never be read, however it is asked for', () => {
  for (const role of ['anon', 'client', 'hca']) {
    const rule = policyFor('hca_profiles', role);
    const star = resolveSelect(rule, '*');
    assert.ok(!star.includes('password'), `${role} got password via *`);
    const explicit = resolveSelect(rule, 'id, name, password');
    assert.ok(!explicit.includes('password'), `${role} got password by asking`);
  }
});

test('* expands to the allowed list, not to everything', () => {
  const cols = resolveSelect(policyFor('hca_profiles', 'anon'), '*');
  assert.ok(cols.includes('name'));
  assert.ok(!cols.includes('email'), 'anon must not see HCA email addresses');
  assert.ok(!cols.includes('mobile'), 'anon must not see HCA phone numbers');
  assert.ok(!cols.includes('dob'), 'anon must not see dates of birth');
});

test('a signed-in family sees more of their care team than a visitor does', () => {
  const anon = resolveSelect(policyFor('hca_profiles', 'anon'), '*');
  const client = resolveSelect(policyFor('hca_profiles', 'client'), '*');
  assert.ok(!anon.includes('photo'));
  assert.ok(client.includes('photo'));
  assert.ok(client.includes('mobile'));
});

test('an explicit request is intersected, and keeps id so rows stay addressable', () => {
  const cols = resolveSelect(policyFor('hca_profiles', 'anon'), 'name, email, rate');
  assert.equal(cols, 'id, name, rate');
});

test('a request for only disallowed columns is refused outright', () => {
  assert.equal(resolveSelect(policyFor('hca_profiles', 'anon'), 'password, dob'), null);
});

test('admin select is unrestricted', () => {
  assert.equal(resolveSelect(policyFor('clients', 'admin'), '*'), '*');
  assert.equal(resolveSelect(policyFor('clients', 'admin'), 'id, name'), 'id, name');
});

test('the public rota view exposes no client identity', () => {
  const cols = resolveSelect(policyFor('calendar_events', 'anon'), '*');
  assert.ok(cols.includes('hca_id'));
  assert.ok(cols.includes('date'));
  assert.ok(!cols.includes('client_id'), 'anon must not learn which family a shift is for');
  assert.ok(!cols.includes('notes'));
});

// ── Writes are strict ────────────────────────────────────────────────────────

test('an HCA cannot raise their own rate or approve themselves', () => {
  const rule = policyFor('hca_profiles', 'hca');
  const bad = resolveWrite(rule, 'update', { rate: 99999 }, hcaSession);
  assert.equal(bad.ok, false);
  assert.match(bad.error, /rate/);

  const alsoBad = resolveWrite(rule, 'update', { status: 'active' }, hcaSession);
  assert.equal(alsoBad.ok, false);

  for (const col of ['rating', 'review_count', 'placement_count', 'employee_id', 'email']) {
    assert.equal(resolveWrite(rule, 'update', { [col]: 'x' }, hcaSession).ok, false,
      `${col} must not be self-writable`);
  }

  const good = resolveWrite(rule, 'update', { bio: 'Ten years in dementia care.' }, hcaSession);
  assert.equal(good.ok, true);
});

test('an HCA may record their own journey milestones and ask to be deleted', () => {
  const rule = policyFor('hca_profiles', 'hca');
  assert.equal(resolveWrite(rule, 'update', { journey_stage: 'account_activated', journey_dates: {} }, hcaSession).ok, true);
  assert.equal(resolveWrite(rule, 'update', { deletion_requested: true, deletion_requested_at: 'now' }, hcaSession).ok, true);
});

test('a family may ask for an HCA but not assign one to themselves', () => {
  const rule = policyFor('clients', 'client');
  assert.equal(resolveWrite(rule, 'update', { requested_hca_id: 'hca-9' }, clientSession).ok, true);
  assert.equal(resolveWrite(rule, 'update', { assigned_hca_id: 'hca-9' }, clientSession).ok, false);
  assert.equal(resolveWrite(rule, 'update', { password_hash: 'x' }, clientSession).ok, false);
});

test('applications are closed to everyone but admin — intake has its own route', () => {
  for (const role of ['anon', 'client', 'hca']) {
    assert.equal(policyFor('hca_applications', role), null,
      `${role} must reach hca_applications only through /api/applications/*`);
  }
  assert.ok(policyFor('hca_applications', 'admin').select);
});

test('a write can be confirmed without becoming a way to read the table', () => {
  for (const table of ['emails', 'hub_referrals', 'lms_submissions', 'activity_log']) {
    const rule = policyFor(table, 'anon') || policyFor(table, 'client');
    assert.ok(!rule.select, `${table} must not be readable`);
    const back = resolveReturning(rule, '*');
    assert.ok(back, `${table} should confirm the write`);
    assert.ok(back.split(',').every(c => ['id', 'created_at'].includes(c.trim())),
      `${table} read-back should be minimal, got ${back}`);
  }
});

test('read-back for a readable table goes through the same column policy', () => {
  const back = resolveReturning(policyFor('hca_profiles', 'hca'), '*');
  assert.ok(!back.includes('password'));
});

test('an inserted row is pinned to the session, not to what the caller claims', () => {
  const rule = policyFor('shifts', 'hca');
  const w = resolveWrite(rule, 'insert', {
    hca_id: 'someone-else', client_id: 'c-9', date: '2026-08-18', type: 'day',
  }, hcaSession);
  assert.equal(w.ok, true);
  assert.equal(w.row.hca_id, 'hca-1', 'hca_id must come from the session');
});

test('a contact message cannot be filed as an outbound admin email', () => {
  const rule = policyFor('emails', 'anon');
  const w = resolveWrite(rule, 'insert', {
    subject: 'Hello', from_address: 'x@example.com', body_text: 'Hi',
    direction: 'outbound', folder: 'sent',
  }, anonSession);
  assert.equal(w.ok, true, 'pinned columns are overridden, not rejected');
  assert.equal(w.row.direction, 'inbound');
  assert.equal(w.row.folder, 'inbox');
  assert.equal(w.row.status, 'received');
});

test('an HCA request keeps its own origin and back-reference', () => {
  const w = resolveWrite(policyFor('emails', 'hca'), 'insert', {
    subject: 'Off day', origin: 'hca_off_day_request', related_hca_id: 'hca-1',
    from_address: 'h@example.com', body_text: 'Please',
  }, hcaSession);
  assert.equal(w.ok, true);
  assert.equal(w.row.origin, 'hca_off_day_request');
  assert.equal(w.row.direction, 'inbound');
});

test('nobody but an admin may read the mailbox', () => {
  for (const role of ['anon', 'client', 'hca']) {
    assert.ok(!policyFor('emails', role).select, `${role} must not read emails`);
  }
});

test('a write naming an unlisted column fails loudly rather than being trimmed', () => {
  const rule = policyFor('clients', 'client');
  const w = resolveWrite(rule, 'update', { name: 'New Name', status: 'vip' }, clientSession);
  assert.equal(w.ok, false);
  assert.match(w.error, /status/);
});

test('a family cannot change their own journey billing state through unlisted columns', () => {
  const rule = policyFor('clients', 'client');
  assert.equal(resolveWrite(rule, 'update', { assigned_hca_id: 'hca-9' }, clientSession).ok, false);
  assert.equal(resolveWrite(rule, 'insert', { name: 'x' }, clientSession).ok, false);
});

test('a client may only mark notifications read', () => {
  const rule = policyFor('notifications', 'client');
  assert.equal(resolveWrite(rule, 'update', { read: true }, clientSession).ok, true);
  assert.equal(resolveWrite(rule, 'update', { body: 'rewritten' }, clientSession).ok, false);
});

test('admin writes are unrestricted but still get forced defaults where set', () => {
  const w = resolveWrite(policyFor('clients', 'admin'), 'update', { status: 'suspended' }, adminSession);
  assert.equal(w.ok, true);
  assert.equal(w.row.status, 'suspended');
});

test('array payloads are validated element by element', () => {
  const rule = policyFor('activity_log', 'client');
  const ok = resolveWrite(rule, 'insert', [{ type: 'a', data: {} }, { type: 'b', data: {} }], clientSession);
  assert.equal(ok.ok, true);
  assert.equal(ok.row.length, 2);
  const bad = resolveWrite(rule, 'insert', [{ type: 'a' }, { type: 'b', secret: 1 }], clientSession);
  assert.equal(bad.ok, false);
});

// ── Scopes ───────────────────────────────────────────────────────────────────

test('a family is scoped to their own rows', async () => {
  assert.deepEqual(await resolveScope(policyFor('clients', 'client'), clientSession),
    { column: 'id', op: 'eq', value: 'client-1' });
  assert.deepEqual(await resolveScope(policyFor('invoices', 'client'), clientSession),
    { column: 'client_id', op: 'eq', value: 'client-1' });
  assert.deepEqual(await resolveScope(policyFor('shifts', 'client'), clientSession),
    { column: 'client_id', op: 'eq', value: 'client-1' });
});

test('an HCA is scoped to their own rows', async () => {
  assert.deepEqual(await resolveScope(policyFor('shifts', 'hca'), hcaSession),
    { column: 'hca_id', op: 'eq', value: 'hca-1' });
});

test('an HCA browses the directory but may only write their own row', async () => {
  const rule = policyFor('hca_profiles', 'hca');
  // Reading: the same active-only directory a family sees.
  assert.deepEqual(await resolveScope(rule, hcaSession, null, 'select'),
    { column: 'status', op: 'in', value: ['active', 'approved'] });
  // Writing: their own row and no other.
  for (const action of ['update', 'upsert', 'delete']) {
    assert.deepEqual(await resolveScope(rule, hcaSession, null, action),
      { column: 'id', op: 'eq', value: 'hca-1' }, action);
  }
});

test('an HCA browsing the directory sees no more than a family does', () => {
  const asHca = resolveSelect(policyFor('hca_profiles', 'hca'), '*');
  const asClient = resolveSelect(policyFor('hca_profiles', 'client'), '*');
  assert.equal(asHca, asClient);
  assert.ok(!asHca.includes('dob'), 'private fields belong to /api/hca/me, not the directory');
  assert.ok(!asHca.includes('password'));
});

test('notifications include broadcasts but no other family\'s mail', async () => {
  const scope = await resolveScope(policyFor('notifications', 'client'), clientSession);
  assert.equal(scope.or, 'client_id.eq.client-1,client_id.is.null');
  assert.ok(!scope.or.includes('client-2'));
});

test('an HCA sees only the families they are connected to', async () => {
  const db = fakeDb({
    placements: [{ client_id: 'c-1' }],
    shifts: [{ client_id: 'c-2' }, { client_id: null }],
    clients: [{ id: 'c-3' }],
  });
  const scope = await resolveScope(policyFor('clients', 'hca'), hcaSession, db);
  assert.equal(scope.column, 'id');
  assert.equal(scope.op, 'in');
  assert.deepEqual([...scope.value].sort(), ['c-1', 'c-2', 'c-3']);
});

test('an HCA with no placements matches no clients, rather than all of them', async () => {
  const db = fakeDb({ placements: [], shifts: [], clients: [] });
  const scope = await resolveScope(policyFor('clients', 'hca'), hcaSession, db);
  assert.equal(scope.op, 'in');
  assert.equal(scope.value.length, 1);
  assert.equal(scope.value[0], '00000000-0000-0000-0000-000000000000');
});

test('only active HCA profiles are visible to visitors and families', async () => {
  for (const role of ['anon', 'client']) {
    const scope = await resolveScope(policyFor('hca_profiles', role), { role, id: null });
    assert.equal(scope.column, 'status');
    assert.deepEqual(scope.value, ['active', 'approved']);
  }
});

test('admin reads carry no row scope', async () => {
  assert.equal(await resolveScope(policyFor('clients', 'admin'), adminSession), null);
});

/** Minimal stand-in for the supabase client: .from(t).select(c).eq(c,v) → rows */
function fakeDb(tables) {
  return {
    from(table) {
      return {
        select() { return this; },
        eq() { return Promise.resolve({ data: tables[table] || [] }); },
      };
    },
  };
}


// ── Call-site coverage ───────────────────────────────────────────────────────
// Every (table, action) a non-admin page actually performs must be permitted.
// If a page starts using a new table, this fails rather than the page silently
// returning nothing in production.

const CALL_SITES = {
  anon: [
    ['hca_profiles', 'select'], ['calendar_events', 'select'], ['lms_courses', 'select'],
    ['emails', 'insert'], ['hub_referrals', 'insert'], ['hub_access_requests', 'insert'],
    ['lms_submissions', 'insert'], ['activity_log', 'insert'],
  ],
  client: [
    ['clients', 'select'], ['clients', 'update'], ['hca_profiles', 'select'],
    ['invoices', 'select'], ['shifts', 'select'], ['placements', 'select'],
    ['notifications', 'select'], ['notifications', 'update'], ['notifications', 'insert'],
    ['lms_courses', 'select'], ['lms_enrollments', 'select'], ['lms_enrollments', 'insert'],
    ['lms_enrollments', 'update'], ['lms_submissions', 'insert'],
    ['hub_referrals', 'insert'], ['hub_access_requests', 'insert'],
    ['emails', 'insert'], ['activity_log', 'insert'],
  ],
  hca: [
    ['hca_profiles', 'select'], ['hca_profiles', 'update'],
    ['clients', 'select'], ['shifts', 'select'], ['shifts', 'insert'], ['shifts', 'update'],
    ['placements', 'select'], ['calendar_events', 'select'], ['calendar_events', 'insert'],
    ['emails', 'insert'], ['lms_courses', 'select'], ['lms_enrollments', 'select'],
    ['lms_enrollments', 'insert'], ['lms_enrollments', 'update'],
    ['lms_submissions', 'insert'], ['hub_referrals', 'insert'], ['hub_access_requests', 'insert'],
    ['activity_log', 'insert'],
  ],
};

test('every table access the app actually makes is permitted', () => {
  for (const [role, sites] of Object.entries(CALL_SITES)) {
    for (const [table, action] of sites) {
      const rule = policyFor(table, role);
      assert.ok(rule, `${role} needs ${action} on ${table}, but has no policy for it`);
      const permitted = action === 'select' ? Boolean(rule.select || rule.allowCount) : Boolean(rule[action]);
      assert.ok(permitted, `${role} needs ${action} on ${table}, which the policy denies`);
    }
  }
});

test('the public client count is a count and nothing more', () => {
  const rule = policyFor('clients', 'anon');
  assert.equal(rule.allowCount, true);
  assert.equal(rule.select, undefined, 'anon must not read client rows');
});
