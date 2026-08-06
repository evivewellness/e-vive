/**
 * Tests for Cardex field access classification.
 *
 * These cover the data-shaping half of the guarantee only. They prove that
 * given an audience, the right columns are requested and the wrong fields are
 * stripped. They CANNOT prove the server refuses to serve another client's
 * rows — that needs authenticated requests against a running database.
 *
 * Run: node --test lib/cardexAccess.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cardexColumnsFor, cardexFieldsFor, isCardexFieldVisibleTo,
  redactCardexFor, redactCardexListFor, formatBloodPressure,
  CARDEX_AUDIENCES, SHAREABLE_OPTIONAL,
} from './cardexAccess.js';

// A fully-populated mapped entry, as cardexFromDb would produce it.
const FULL = {
  id: 'cx1', shiftId: 's1', hcaId: 'h1', patientId: 'p1', clientId: 'c1',
  submittedAt: '2026-08-10T19:00:00Z', date: '2026-08-10T19:00:00Z',
  vitals: { temp: '36.8', pulse: '74', bpSys: '120', bpDia: '80' },
  medications: [{ time: '08:00', drug: 'Donepezil' }],
  intakes: [{ type: 'Water', amount: '200', unit: 'ml' }],
  nutrition: { breakfast: 'Full' },
  hygiene: { bath: true }, mobility: { exercises: true },
  elimination: { urine: 'Yes' }, mentalState: { mood: 'Calm' },
  specialNeedsChecks: [{ need: 'Diabetes', done: true }],
  incidents: 'Complained of knee pain.',
  handover: 'Watch fluid intake overnight.',
  shiftRating: 2,
  welfareNote: 'The family were hostile toward me during this shift.',
  qaComments: [{ id: 'q1', adminId: 'admin', comment: 'Reviewed' }],
  flagged: true,
};

// The four fields that must never reach a family or a shared recipient.
const STAFF_AND_INTERNAL = ['welfareNote', 'shiftRating', 'qaComments', 'flagged'];

test('every audience is known and returns a non-empty column list', () => {
  for (const a of CARDEX_AUDIENCES) {
    assert.ok(cardexFieldsFor(a).length > 0, `${a} has columns`);
    assert.ok(cardexColumnsFor(a).includes('vitals'), `${a} can see vitals`);
  }
});

test('an unknown audience throws rather than defaulting open', () => {
  assert.throws(() => cardexColumnsFor('everyone'), /Unknown Cardex audience/);
  assert.throws(() => cardexFieldsFor(undefined), /Unknown Cardex audience/);
  assert.throws(() => isCardexFieldVisibleTo('vitals', 'guest'), /Unknown Cardex audience/);
});

test('welfare_note, shift_rating, qa_comments and flagged are NOT in the client column list', () => {
  const cols = cardexColumnsFor('client');
  for (const f of ['welfare_note', 'shift_rating', 'qa_comments', 'flagged']) {
    assert.ok(!cols.includes(f), `client select must not request ${f}`);
  }
});

test('the same four are NOT in the shared column list', () => {
  const cols = cardexColumnsFor('shared');
  for (const f of ['welfare_note', 'shift_rating', 'qa_comments', 'flagged']) {
    assert.ok(!cols.includes(f), `shared select must not request ${f}`);
  }
});

test('no client-facing column list is a wildcard', () => {
  for (const a of ['client', 'shared']) {
    assert.ok(!cardexColumnsFor(a).includes('*'), `${a} must not select *`);
  }
});

test('redaction strips staff-confidential and QA fields for a client', () => {
  const out = redactCardexFor(FULL, 'client');
  for (const f of STAFF_AND_INTERNAL) {
    assert.equal(out[f], undefined, `client must not receive ${f}`);
    assert.ok(!(f in out), `${f} key must be absent, not merely undefined`);
  }
  // …while keeping the care record itself.
  assert.equal(out.incidents, FULL.incidents);
  assert.equal(out.handover, FULL.handover);
  assert.deepEqual(out.vitals, FULL.vitals);
});

test('a shared recipient gets the minimal set by default; handover is opt-in', () => {
  const out = redactCardexFor(FULL, 'shared');
  for (const f of STAFF_AND_INTERNAL) assert.ok(!(f in out), `shared must not receive ${f}`);
  // Data minimisation: not included unless the client deliberately adds it.
  assert.ok(!('handover' in out), 'handover must be excluded by default');
  assert.ok(SHAREABLE_OPTIONAL.includes('handover'));

  const withHandover = redactCardexFor(FULL, 'shared', { include: ['handover'] });
  assert.equal(withHandover.handover, FULL.handover, 'opt-in adds it');
  for (const f of STAFF_AND_INTERNAL) assert.ok(!(f in withHandover));
});

test('include[] cannot widen access beyond SHAREABLE_OPTIONAL', () => {
  // A caller passing field names straight from user input must not be able to
  // unlock staff-confidential or internal QA data.
  const out = redactCardexFor(FULL, 'shared', {
    include: ['welfare_note', 'shift_rating', 'qa_comments', 'flagged'],
  });
  for (const f of STAFF_AND_INTERNAL) assert.ok(!(f in out), `include must not unlock ${f}`);
  const cols = cardexColumnsFor('client', { include: ['welfare_note', 'qa_comments'] });
  assert.ok(!cols.includes('welfare_note'));
  assert.ok(!cols.includes('qa_comments'));
});

test('omit can never be used to REVEAL a hidden field', () => {
  // Even asking for it explicitly must not resurrect it.
  const out = redactCardexFor(FULL, 'client', { omit: [] });
  assert.ok(!('welfareNote' in out));
});

test('an HCA sees their own welfare note and rating, but not QA', () => {
  const out = redactCardexFor(FULL, 'hca');
  assert.equal(out.welfareNote, FULL.welfareNote);
  assert.equal(out.shiftRating, 2);
  assert.ok(!('qaComments' in out), 'QA notes are internal to admin');
  assert.ok(!('flagged' in out), 'QA flag is internal to admin');
});

test('admin sees everything', () => {
  const out = redactCardexFor(FULL, 'admin');
  for (const f of STAFF_AND_INTERNAL) assert.ok(f in out, `admin should see ${f}`);
});

test('unknown/injected fields are dropped rather than passed through', () => {
  const tainted = { ...FULL, hcaNationalId: '12345678', hcaPayRate: 2000, secret: 'x' };
  const out = redactCardexFor(tainted, 'client');
  assert.ok(!('hcaNationalId' in out), 'fails closed on unclassified fields');
  assert.ok(!('hcaPayRate' in out));
  assert.ok(!('secret' in out));
});

test('redaction handles null and lists', () => {
  assert.equal(redactCardexFor(null, 'client'), null);
  const list = redactCardexListFor([FULL, FULL], 'client');
  assert.equal(list.length, 2);
  for (const e of list) assert.ok(!('welfareNote' in e));
  assert.deepEqual(redactCardexListFor(null, 'client'), []);
});

test('every audience gets a serialisable object with no leaked keys', () => {
  for (const a of CARDEX_AUDIENCES) {
    const out = redactCardexFor(FULL, a);
    const allowed = new Set(cardexFieldsFor(a));
    // map camel keys back through the same rule the module uses
    for (const k of Object.keys(out)) {
      assert.ok(
        isCardexFieldVisibleTo(
          { shiftId:'shift_id', hcaId:'hca_id', patientId:'patient_id', clientId:'client_id',
            submittedAt:'submitted_at', date:'submitted_at', mentalState:'mental_state',
            specialNeedsChecks:'special_needs_checks', shiftRating:'shift_rating',
            welfareNote:'welfare_note', qaComments:'qa_comments' }[k] || k, a),
        `${a} leaked ${k}`);
      assert.ok(allowed.size > 0);
    }
  }
});

// ── Blood pressure: the field the broken admin panel invented ────────────────

test('formatBloodPressure combines the separately-captured systolic/diastolic', () => {
  assert.equal(formatBloodPressure({ bpSys: '120', bpDia: '80' }), '120/80');
});

test('formatBloodPressure degrades gracefully on partial or absent readings', () => {
  assert.equal(formatBloodPressure({ bpSys: '120' }), '120/—');
  assert.equal(formatBloodPressure({ bpDia: '80' }), '—/80');
  assert.equal(formatBloodPressure({}), null);
  assert.equal(formatBloodPressure(), null);
});
