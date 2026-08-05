/**
 * Tests for the placement scheduling primitives.
 *
 * Run with:  node --test lib/scheduling.test.mjs
 * And in the production timezone, which is where the date bugs live:
 *            TZ=Africa/Nairobi node --test lib/scheduling.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shiftInterval, intervalsOverlap, dateRange, addDays, toIso,
  findScheduleConflicts, describeConflicts, shiftStartTime,
} from './scheduling.js';

// ── Date handling ────────────────────────────────────────────────────────────
// Kenya is UTC+3. Any date maths that round-trips through toISOString()
// silently shifts back a day here, which would date every generated shift
// one day early — so these must hold in the production timezone, not just UTC.

test('dateRange returns the exact inclusive range asked for', () => {
  assert.deepEqual(
    dateRange('2026-08-10', '2026-08-12'),
    ['2026-08-10', '2026-08-11', '2026-08-12'],
  );
});

test('dateRange is single-day safe', () => {
  assert.deepEqual(dateRange('2026-08-10', '2026-08-10'), ['2026-08-10']);
});

test('dateRange crosses a month boundary', () => {
  assert.deepEqual(
    dateRange('2026-08-30', '2026-09-02'),
    ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'],
  );
});

test('dateRange crosses a year boundary', () => {
  assert.deepEqual(
    dateRange('2026-12-30', '2027-01-02'),
    ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'],
  );
});

test('dateRange handles a leap day', () => {
  assert.deepEqual(
    dateRange('2028-02-28', '2028-03-01'),
    ['2028-02-28', '2028-02-29', '2028-03-01'],
  );
});

test('addDays does not drift across timezones', () => {
  assert.equal(addDays('2026-08-10', 1), '2026-08-11');
  assert.equal(addDays('2026-08-10', -1), '2026-08-09');
  assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('toIso reports the local calendar date, not the UTC one', () => {
  // Midnight local on the 10th is still "the 10th" wherever you are.
  assert.equal(toIso(new Date('2026-08-10T00:00:00')), '2026-08-10');
  assert.equal(toIso(new Date('2026-08-10T23:59:59')), '2026-08-10');
});

// ── Shift interval overlap ───────────────────────────────────────────────────

test('two day shifts on the same date overlap', () => {
  assert.ok(intervalsOverlap(shiftInterval('2026-08-10', 'day'), shiftInterval('2026-08-10', 'day')));
});

test('day and night on the same date do NOT overlap', () => {
  // Day 07:00–19:00, night 19:00–07:00 — they touch but never overlap, which
  // is what makes round-the-clock cover by two HCAs possible.
  assert.ok(!intervalsOverlap(shiftInterval('2026-08-10', 'day'), shiftInterval('2026-08-10', 'night')));
});

test("a night shift overlaps the NEXT day's night shift boundary correctly", () => {
  // Night on the 10th runs to 07:00 on the 11th; night on the 11th starts
  // 19:00 on the 11th. No overlap.
  assert.ok(!intervalsOverlap(shiftInterval('2026-08-10', 'night'), shiftInterval('2026-08-11', 'night')));
});

test("a night shift does NOT overlap the next day's day shift", () => {
  // Night ends 07:00 on the 11th, day starts 07:00 on the 11th — touching.
  assert.ok(!intervalsOverlap(shiftInterval('2026-08-10', 'night'), shiftInterval('2026-08-11', 'day')));
});

test('live-in overlaps both a day and a night shift on the same date', () => {
  assert.ok(intervalsOverlap(shiftInterval('2026-08-10', 'live-in'), shiftInterval('2026-08-10', 'day')));
  assert.ok(intervalsOverlap(shiftInterval('2026-08-10', 'live-in'), shiftInterval('2026-08-10', 'night')));
});

test("live-in overlaps the PREVIOUS day's night shift, which runs into it", () => {
  // Night on the 9th runs 19:00→07:00 on the 10th; live-in on the 10th
  // starts at 00:00. They genuinely collide.
  assert.ok(intervalsOverlap(shiftInterval('2026-08-10', 'live-in'), shiftInterval('2026-08-09', 'night')));
});

test('shifts on unrelated dates do not overlap', () => {
  assert.ok(!intervalsOverlap(shiftInterval('2026-08-10', 'day'), shiftInterval('2026-08-14', 'day')));
});

test('unknown shift types fall back to day hours', () => {
  assert.deepEqual(shiftInterval('2026-08-10', 'something-else'), shiftInterval('2026-08-10', 'day'));
});

// ── Conflict detection ───────────────────────────────────────────────────────

const SHIFT = (date, type, extra = {}) => ({ id: `s-${date}-${type}`, date, type, ...extra });

test('a free range produces no conflicts', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-12', shiftType: 'day',
    existingShifts: [SHIFT('2026-09-01', 'day')],
  });
  assert.deepEqual(c, {});
});

test('an existing day shift blocks a new day shift on that date only', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-12', shiftType: 'day',
    existingShifts: [SHIFT('2026-08-11', 'day')],
  });
  assert.deepEqual(Object.keys(c), ['2026-08-11']);
  assert.equal(c['2026-08-11'][0].kind, 'shift');
});

test('an existing NIGHT shift does not block a new DAY placement', () => {
  // The whole point of allowing one HCA multiple concurrent placements.
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-12', shiftType: 'day',
    existingShifts: [SHIFT('2026-08-10', 'night'), SHIFT('2026-08-11', 'night')],
  });
  assert.deepEqual(c, {});
});

test('an existing day shift DOES block a new live-in placement', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-10', shiftType: 'live-in',
    existingShifts: [SHIFT('2026-08-10', 'day')],
  });
  assert.deepEqual(Object.keys(c), ['2026-08-10']);
});

test('an approved off-day blocks any shift type', () => {
  for (const type of ['day', 'night', 'live-in']) {
    const c = findScheduleConflicts({
      startDate: '2026-08-10', endDate: '2026-08-10', shiftType: type,
      offDays: [{ id: 'o1', date: '2026-08-10' }],
    });
    assert.deepEqual(Object.keys(c), ['2026-08-10'], `${type} should be blocked by an off-day`);
    assert.equal(c['2026-08-10'][0].kind, 'offday');
  }
});

test("an off-day on the 10th blocks the 9th's night shift, which runs into it", () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-09', endDate: '2026-08-09', shiftType: 'night',
    offDays: [{ id: 'o1', date: '2026-08-10' }],
  });
  assert.deepEqual(Object.keys(c), ['2026-08-09']);
});

test('excludePlacementId ignores the placement being extended', () => {
  const existing = [SHIFT('2026-08-11', 'day', { placement_id: 'p1' })];
  const withoutExclusion = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-12', shiftType: 'day', existingShifts: existing,
  });
  assert.deepEqual(Object.keys(withoutExclusion), ['2026-08-11']);

  const withExclusion = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-12', shiftType: 'day',
    existingShifts: existing, excludePlacementId: 'p1',
  });
  assert.deepEqual(withExclusion, {}, 'a placement must not conflict with its own shifts');
});

test('multiple conflicting days are all reported', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-14', shiftType: 'day',
    existingShifts: [SHIFT('2026-08-10', 'day'), SHIFT('2026-08-13', 'day')],
    offDays: [{ id: 'o1', date: '2026-08-12' }],
  });
  assert.deepEqual(Object.keys(c).sort(), ['2026-08-10', '2026-08-12', '2026-08-13']);
});

test('conflicts survive a month boundary', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-30', endDate: '2026-09-02', shiftType: 'day',
    existingShifts: [SHIFT('2026-09-01', 'day')],
  });
  assert.deepEqual(Object.keys(c), ['2026-09-01']);
});

// ── Messaging ────────────────────────────────────────────────────────────────

test('describeConflicts names the clashing client when known', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-10', shiftType: 'day',
    existingShifts: [SHIFT('2026-08-10', 'day', { client_id: 'c1' })],
  });
  const msg = describeConflicts(c, [{ id: 'c1', name: 'Jane Wanjiku' }]);
  assert.match(msg, /day shift for Jane Wanjiku/);
  assert.match(msg, /2026-08-10/);
});

test('describeConflicts reports an off-day distinctly', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-10', shiftType: 'day',
    offDays: [{ id: 'o1', date: '2026-08-10' }],
  });
  assert.match(describeConflicts(c, []), /approved off-day/);
});

test('describeConflicts counts multi-day clashes', () => {
  const c = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-12', shiftType: 'day',
    existingShifts: [SHIFT('2026-08-10', 'day'), SHIFT('2026-08-11', 'day')],
  });
  assert.match(describeConflicts(c, []), /2 conflicting day\(s\) total/);
});

test('describeConflicts is empty for no conflicts', () => {
  assert.equal(describeConflicts({}, []), '');
});

// ── Start times ──────────────────────────────────────────────────────────────

test('shiftStartTime matches the interval each type occupies', () => {
  assert.equal(shiftStartTime('day'), '07:00');
  assert.equal(shiftStartTime('night'), '19:00');
  assert.equal(shiftStartTime('live-in'), '00:00');
  assert.equal(shiftStartTime('24-hour'), '00:00');
});

// ── Round-the-clock cover, the scenario the workflow is built for ────────────

test('two HCAs can cover one patient 24/7 via day + night placements', () => {
  const hcaA = [];                                   // day HCA, nothing booked
  const hcaB = dateRange('2026-08-10', '2026-08-16')  // night HCA already booked
    .map(d => SHIFT(d, 'night'));

  // Day placement for HCA A over the same week — must be free.
  assert.deepEqual(findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-16', shiftType: 'day', existingShifts: hcaA,
  }), {});

  // A SECOND night placement for HCA B over the same week — must clash.
  const clash = findScheduleConflicts({
    startDate: '2026-08-10', endDate: '2026-08-16', shiftType: 'night', existingShifts: hcaB,
  });
  assert.equal(Object.keys(clash).length, 7);
});

test('one HCA can hold two day placements for different patients on non-overlapping weeks', () => {
  const booked = dateRange('2026-08-10', '2026-08-16').map(d => SHIFT(d, 'day', { placement_id: 'p1' }));
  assert.deepEqual(findScheduleConflicts({
    startDate: '2026-08-17', endDate: '2026-08-23', shiftType: 'day', existingShifts: booked,
  }), {}, 'the following week must be bookable');
});
