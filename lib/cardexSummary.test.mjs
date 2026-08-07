import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterEntries, seriesFor, summariseVital, precedingPeriod, derivedMeasures,
  buildSummary, buildLineChart, typicalRangeNote, fmtValue,
} from './cardexSummary.js';

const entry = (day, vitals = {}, extra = {}) => ({
  id: `e-${day}`, submittedAt: `${day}T19:00:00Z`, patientId: extra.patientId || 'p1',
  vitals, medications: extra.medications || [], intakes: extra.intakes || [],
  nutrition: extra.nutrition || {}, hygiene: extra.hygiene || {},
  incidents: extra.incidents || '',
});

// ── Filtering ────────────────────────────────────────────────────────────────

test('filters inclusively by date range', () => {
  const es = [entry('2026-08-01'), entry('2026-08-05'), entry('2026-08-10')];
  const got = filterEntries(es, { start: '2026-08-01', end: '2026-08-05' });
  assert.equal(got.length, 2, 'both boundary days included');
});

test('never mixes patients', () => {
  const es = [entry('2026-08-01', {}, { patientId: 'p1' }), entry('2026-08-02', {}, { patientId: 'p2' })];
  assert.equal(filterEntries(es, { patientId: 'p2' }).length, 1);
  assert.equal(filterEntries(es, { patientId: 'p2' })[0].patientId, 'p2');
});

test('incidents-only surfaces just shifts with something recorded', () => {
  const es = [entry('2026-08-01'), entry('2026-08-02', {}, { incidents: 'Fall in bathroom' }), entry('2026-08-03', {}, { incidents: '   ' })];
  const got = filterEntries(es, { incidentsOnly: true });
  assert.equal(got.length, 1);
  assert.match(got[0].incidents, /Fall/);
});

// ── Series + summary ─────────────────────────────────────────────────────────

test('series drops blank/non-numeric readings and sorts chronologically', () => {
  const es = [
    entry('2026-08-03', { pulse: '80' }),
    entry('2026-08-01', { pulse: '70' }),
    entry('2026-08-02', { pulse: '' }),
    entry('2026-08-04', { pulse: 'n/a' }),
  ];
  assert.deepEqual(seriesFor(es, 'pulse').map(p => p.value), [70, 80]);
  assert.deepEqual(seriesFor(es, 'pulse').map(p => p.day), ['2026-08-01', '2026-08-03']);
});

test('summarises latest, mean, min, max and count', () => {
  const es = [entry('2026-08-01', { pulse: '60' }), entry('2026-08-02', { pulse: '80' }), entry('2026-08-03', { pulse: '70' })];
  const s = summariseVital(es, 'pulse');
  assert.equal(s.count, 3);
  assert.equal(s.latest, 70, 'latest is the most recent by date, not the largest');
  assert.equal(s.mean, 70);
  assert.equal(s.min, 60);
  assert.equal(s.max, 80);
});

test('reports change against the preceding period', () => {
  const cur   = [entry('2026-08-10', { pulse: '80' })];
  const prior = [entry('2026-08-05', { pulse: '70' })];
  const s = summariseVital(cur, 'pulse', { priorEntries: prior });
  assert.equal(s.priorMean, 70);
  assert.equal(s.changeVsPrior, 10);
});

test('a vital with no readings summarises to count 0 rather than NaN', () => {
  const s = summariseVital([entry('2026-08-01', {})], 'pulse');
  assert.equal(s.count, 0);
  assert.ok(!Number.isNaN(s.mean ?? 0));
});

test('precedingPeriod returns the equal-length window immediately before', () => {
  assert.deepEqual(precedingPeriod('2026-08-08', '2026-08-14'), { start: '2026-08-01', end: '2026-08-07' });
  assert.deepEqual(precedingPeriod('2026-08-10', '2026-08-10'), { start: '2026-08-09', end: '2026-08-09' });
});

test('precedingPeriod crosses a month boundary', () => {
  assert.deepEqual(precedingPeriod('2026-09-01', '2026-09-03'), { start: '2026-08-29', end: '2026-08-31' });
});

// ── Derived measures ─────────────────────────────────────────────────────────

test('converts fluid units and reports a daily average', () => {
  const es = [
    entry('2026-08-01', {}, { intakes: [{ amount: '500', unit: 'ml' }, { amount: '1', unit: 'L' }] }),
    entry('2026-08-02', {}, { intakes: [{ amount: '2', unit: 'cups' }] }),
  ];
  const m = derivedMeasures(es);
  assert.equal(m.fluidMlTotal, 500 + 1000 + 500);
  assert.equal(m.daysCovered, 2);
  assert.equal(m.fluidMlPerDay, 1000);
});

test('counts doses, meals, repositioning and incidents', () => {
  const es = [
    entry('2026-08-01', {}, { medications: [{ drug: 'A' }, { drug: 'B' }], nutrition: { breakfast: 'Full', lunch: 'Half' }, hygiene: { reposition: true } }),
    entry('2026-08-02', {}, { medications: [{ drug: 'A' }], nutrition: {}, incidents: 'Refused lunch' }),
  ];
  const m = derivedMeasures(es);
  assert.equal(m.dosesRecorded, 3);
  assert.equal(m.mealsRecorded, 2);
  assert.equal(m.repositioningShifts, 1);
  assert.equal(m.repositioningRate, 50);
  assert.equal(m.incidentCount, 1);
});

test('coverage is null when no schedule is known, rather than a made-up 100%', () => {
  assert.equal(derivedMeasures([entry('2026-08-01')]).coverageRate, null);
  assert.equal(derivedMeasures([entry('2026-08-01')], { scheduledShifts: 2 }).coverageRate, 50);
});

test('buildSummary omits vitals with no readings', () => {
  const es = [entry('2026-08-01', { pulse: '70' })];
  const s = buildSummary(es, { start: '2026-08-01', end: '2026-08-07' });
  const keys = s.vitals.map(v => v.key);
  assert.ok(keys.includes('pulse'));
  assert.ok(!keys.includes('bgl'), 'no blood glucose recorded, so not shown');
});

// ── Charts ───────────────────────────────────────────────────────────────────

test('returns null rather than an empty chart when there is no data', () => {
  assert.equal(buildLineChart([]), null);
});

test('gaps render as gaps — no line drawn across missing days', () => {
  const pts = [
    { day: '2026-08-01', value: 70 }, { day: '2026-08-02', value: 72 },
    // 10-day gap
    { day: '2026-08-12', value: 80 }, { day: '2026-08-13', value: 78 },
  ];
  const c = buildLineChart(pts, { gapDays: 2 });
  const moves = (c.primary.path.match(/M/g) || []).length;
  assert.equal(moves, 2, 'two separate segments, not one continuous line');
});

test('consecutive days form a single segment', () => {
  const pts = [{ day: '2026-08-01', value: 70 }, { day: '2026-08-02', value: 72 }, { day: '2026-08-03', value: 71 }];
  const c = buildLineChart(pts, { gapDays: 2 });
  assert.equal((c.primary.path.match(/M/g) || []).length, 1);
});

test('an isolated reading still gets a dot even though it has no line', () => {
  const pts = [{ day: '2026-08-01', value: 70 }, { day: '2026-09-01', value: 90 }];
  const c = buildLineChart(pts, { gapDays: 2 });
  assert.equal(c.primary.path, '', 'no segment has 2+ points, so no path');
  assert.equal(c.primary.dots.length, 2, 'but both readings are still visible');
});

test('flat series does not divide by zero', () => {
  const pts = [{ day: '2026-08-01', value: 70 }, { day: '2026-08-02', value: 70 }];
  const c = buildLineChart(pts);
  for (const d of c.primary.dots) assert.ok(Number.isFinite(d.cy), 'y coordinate is finite');
});

test('systolic and diastolic share one axis', () => {
  const sys = [{ day: '2026-08-01', value: 120 }, { day: '2026-08-02', value: 130 }];
  const dia = [{ day: '2026-08-01', value: 80 },  { day: '2026-08-02', value: 85 }];
  const c = buildLineChart(sys, { secondary: dia, secondaryLabel: 'Diastolic' });
  assert.ok(c.secondary, 'second line present');
  assert.ok(c.yAxis.lo < 80 && c.yAxis.hi > 130, 'axis spans both series');
});

test('all coordinates stay inside the viewbox', () => {
  const pts = [{ day: '2026-08-01', value: 1 }, { day: '2026-08-15', value: 999 }];
  const c = buildLineChart(pts, { width: 400, height: 150, pad: 20 });
  for (const d of c.primary.dots) {
    assert.ok(d.cx >= 0 && d.cx <= 400, `x ${d.cx} in range`);
    assert.ok(d.cy >= 0 && d.cy <= 150, `y ${d.cy} in range`);
  }
});

// ── Clinical safety ──────────────────────────────────────────────────────────

test('in-range values produce no note at all', () => {
  assert.equal(typicalRangeNote('pulse', 72), null);
  assert.equal(typicalRangeNote('temp', 36.8), null);
});

test('out-of-range wording is neutral and never grades severity', () => {
  const note = typicalRangeNote('bpSys', 180);
  assert.ok(note, 'a note is produced');
  assert.match(note, /typical adult range/);
  assert.match(note, /discussing with your doctor/);
  for (const banned of [/\bhigh\b/i, /\blow\b/i, /danger/i, /abnormal/i, /critical/i, /concern/i, /deteriorat/i, /severe/i, /urgent/i]) {
    assert.ok(!banned.test(note), `wording must not contain ${banned}`);
  }
});

test('unknown vitals and missing values produce no note', () => {
  assert.equal(typicalRangeNote('unknownVital', 5), null);
  assert.equal(typicalRangeNote('pulse', null), null);
  assert.equal(typicalRangeNote('pulse', undefined), null);
});

test('fmtValue handles absent values without printing NaN', () => {
  assert.equal(fmtValue(null), '—');
  assert.equal(fmtValue(undefined), '—');
  assert.equal(fmtValue(NaN), '—');
  assert.equal(fmtValue(36.849, 1), '36.8');
  assert.equal(fmtValue(72.6, 0), '73');
});
