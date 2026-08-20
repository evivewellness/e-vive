import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasIncident, notifyOnCardexEntry, sendDigests } from './cardexNotify.js';

// ── hasIncident ──────────────────────────────────────────────────────────────

test('written incident text counts as an incident', () => {
  assert.equal(hasIncident({ incidents: '10:15 — fall in the bathroom, no injury.' }), true);
});

test('empty or whitespace-only incident text does not', () => {
  assert.equal(hasIncident({ incidents: '' }), false);
  assert.equal(hasIncident({ incidents: '   \n ' }), false);
  assert.equal(hasIncident({}), false);
  assert.equal(hasIncident(null), false);
});

test('a flagged special-needs check is an incident by another name', () => {
  assert.equal(hasIncident({ special_needs_checks: [{ need: 'Wound care', flagged: true }] }), true);
  assert.equal(hasIncident({ special_needs_checks: [{ need: 'Wound care', flagged: false }] }), false);
  // Both the DB shape and the mapped camelCase shape reach this function.
  assert.equal(hasIncident({ specialNeedsChecks: [{ flagged: true }] }), true);
});

// ── notifyOnCardexEntry ──────────────────────────────────────────────────────

const CLIENT = {
  id: 'c-1', name: 'Jane Wanjiku', email: 'jane@example.com',
  patients: [{ id: 'p-1', name: 'Margaret' }],
};

/** Records what was inserted and what mail would have been sent. */
function fakeDb({ prefs = [], client = CLIENT, entries = [] } = {}) {
  const notifications = [];
  return {
    notifications,
    from(table) {
      const q = {
        _table: table, _filters: {},
        select() { return q; },
        eq(col, val) { q._filters[col] = val; return q; },
        gte() { return q; },
        maybeSingle() {
          if (table === 'clients') return Promise.resolve({ data: client });
          return Promise.resolve({ data: null });
        },
        insert(row) { if (table === 'notifications') notifications.push(row); return Promise.resolve({ error: null }); },
        then(resolve) {
          if (table === 'cardex_notify_prefs') return Promise.resolve({ data: prefs }).then(resolve);
          if (table === 'cardex_entries') return Promise.resolve({ data: entries }).then(resolve);
          return Promise.resolve({ data: [] }).then(resolve);
        },
      };
      return q;
    },
  };
}

const ENTRY = {
  client_id: 'c-1', patient_id: 'p-1', submitted_at: '2026-08-18T18:00:00.000Z',
  incidents: '', special_needs_checks: [],
};

test('an incident alerts the family even with no preferences row — alerts default on', async () => {
  const db = fakeDb({ prefs: [] });
  const r = await notifyOnCardexEntry(db, { ...ENTRY, incidents: 'Fall in the bathroom.' });
  assert.equal(r.sent, true);
  assert.equal(r.kind, 'incident');
  assert.equal(db.notifications.length, 1);
  assert.equal(db.notifications[0].type, 'cardex_incident');
});

test('a family that switched incident alerts off is not alerted', async () => {
  const db = fakeDb({ prefs: [{ client_id: 'c-1', patient_id: 'p-1', on_incident: false }] });
  const r = await notifyOnCardexEntry(db, { ...ENTRY, incidents: 'Fall in the bathroom.' });
  assert.equal(r.sent, false);
  assert.equal(db.notifications.length, 0);
});

test('an ordinary shift sends nothing unless every report was requested', async () => {
  const quiet = fakeDb({ prefs: [{ client_id: 'c-1', patient_id: 'p-1', on_incident: true }] });
  assert.equal((await notifyOnCardexEntry(quiet, ENTRY)).sent, false);

  const chatty = fakeDb({ prefs: [{ client_id: 'c-1', patient_id: 'p-1', on_new_report: true }] });
  const r = await notifyOnCardexEntry(chatty, ENTRY);
  assert.equal(r.kind, 'report');
});

test('an incident sends the incident alert, not two messages', async () => {
  const db = fakeDb({ prefs: [{ client_id: 'c-1', patient_id: 'p-1', on_incident: true, on_new_report: true }] });
  const r = await notifyOnCardexEntry(db, { ...ENTRY, incidents: 'Fall.' });
  assert.equal(r.kind, 'incident');
  assert.equal(db.notifications.length, 1);
});

test('a per-patient preference wins over the account-wide one', async () => {
  const db = fakeDb({
    prefs: [
      { client_id: 'c-1', patient_id: null, on_incident: false },
      { client_id: 'c-1', patient_id: 'p-1', on_incident: true },
    ],
  });
  assert.equal((await notifyOnCardexEntry(db, { ...ENTRY, incidents: 'Fall.' })).sent, true);
});

test('the account-wide preference applies when the patient has none', async () => {
  const db = fakeDb({ prefs: [{ client_id: 'c-1', patient_id: null, on_incident: false }] });
  assert.equal((await notifyOnCardexEntry(db, { ...ENTRY, incidents: 'Fall.' })).sent, false);
});

test('no clinical detail leaves the platform', async () => {
  const secret = 'BP 180/110, suspected stroke, ambulance called';
  const db = fakeDb({ prefs: [] });
  await notifyOnCardexEntry(db, { ...ENTRY, incidents: secret }, { origin: 'https://e-vive.test' });
  const sent = db.notifications[0];
  assert.ok(!sent.subject.includes('stroke'), 'a subject line is visible on a lock screen');
  assert.ok(!sent.body.includes(secret), 'the detail belongs behind the sign-in');
  assert.ok(sent.body.includes('/client/dashboard'), 'the message should point at where to read it');
});

test('an entry with no client is a no-op rather than a crash', async () => {
  assert.equal((await notifyOnCardexEntry(fakeDb(), { patient_id: 'p-1' })).sent, false);
});

// ── digests ──────────────────────────────────────────────────────────────────

test('a digest reports counts, not contents', async () => {
  const db = fakeDb({
    prefs: [{ client_id: 'c-1', patient_id: 'p-1', digest_frequency: 'weekly' }],
    entries: [
      { id: 1, incidents: 'Fall in the bathroom' },
      { id: 2, incidents: '' },
      { id: 3, incidents: '', special_needs_checks: [{ flagged: true }] },
    ],
  });
  const r = await sendDigests(db, 'weekly', { origin: 'https://e-vive.test' });
  assert.equal(r.sent, 1);
  const body = db.notifications[0].body;
  assert.ok(body.includes('3 care reports'));
  assert.ok(body.includes('2 shifts recorded an incident'));
  assert.ok(!body.includes('bathroom'));
});

test('a quiet period sends nothing — "0 reports" trains people to ignore the sender', async () => {
  const db = fakeDb({
    prefs: [{ client_id: 'c-1', patient_id: 'p-1', digest_frequency: 'weekly' }],
    entries: [],
  });
  const r = await sendDigests(db, 'weekly');
  assert.equal(r.sent, 0);
  assert.equal(r.skipped, 1);
  assert.equal(db.notifications.length, 0);
});

test('an unknown frequency is refused rather than guessed at', async () => {
  const r = await sendDigests(fakeDb(), 'hourly');
  assert.equal(r.sent, 0);
  assert.match(r.error, /unknown frequency/);
});

test('singular and plural read correctly', async () => {
  const db = fakeDb({
    prefs: [{ client_id: 'c-1', digest_frequency: 'daily' }],
    entries: [{ id: 1, incidents: 'One thing' }],
  });
  await sendDigests(db, 'daily');
  const body = db.notifications[0].body;
  assert.ok(body.includes('1 care report filed'), body);
  assert.ok(body.includes('1 shift recorded an incident'), body);
});
