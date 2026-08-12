import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineM, isCoord, resolveCareLocation, normaliseRadius,
  evaluateFix, describeVerdict, bestFix, policyFromSettings,
  DEFAULT_GEOFENCE,
} from './geofence.js';

// A real Nairobi reference point (Lavington) and points a known distance away.
const HOME = { lat: -1.2833, lng: 36.7667 };

// ── distance ────────────────────────────────────────────────────────────────
test('haversine: identical points are zero', () => {
  assert.equal(Math.round(haversineM(HOME.lat, HOME.lng, HOME.lat, HOME.lng)), 0);
});

test('haversine: 0.001° of latitude is ~111 m anywhere', () => {
  const d = haversineM(HOME.lat, HOME.lng, HOME.lat + 0.001, HOME.lng);
  assert.ok(d > 110 && d < 112, `expected ~111 m, got ${d}`);
});

test('haversine: 0.001° of longitude shrinks with latitude', () => {
  const atEquator = haversineM(0, 36, 0, 36.001);
  const atNairobi = haversineM(-1.2833, 36, -1.2833, 36.001);
  assert.ok(atNairobi < atEquator);
  assert.ok(atNairobi > 111 * Math.cos(1.2833 * Math.PI / 180) - 1);
});

test('haversine: Nairobi to Mombasa is roughly 440 km', () => {
  const d = haversineM(-1.2921, 36.8219, -4.0435, 39.6682) / 1000;
  assert.ok(d > 430 && d < 450, `got ${d} km`);
});

// ── coordinate validation ───────────────────────────────────────────────────
test('isCoord rejects null, empty string and NaN', () => {
  assert.equal(isCoord(null, 36), false);
  assert.equal(isCoord('', 36), false);
  assert.equal(isCoord(NaN, 36), false);
  assert.equal(isCoord(undefined, undefined), false);
});

test('isCoord rejects out-of-range values', () => {
  assert.equal(isCoord(91, 36), false);
  assert.equal(isCoord(-1.28, 181), false);
});

test('isCoord accepts a genuine zero component but rejects null island', () => {
  assert.equal(isCoord(0, 36.8), true);     // equator, valid in Kenya
  assert.equal(isCoord(-1.28, 0), true);
  assert.equal(isCoord(0, 0), false);
});

// ── reference point resolution ──────────────────────────────────────────────
test('patient care coordinates win over the client account premises', () => {
  const r = resolveCareLocation(
    { lat: -1.30, lng: 36.80, name: 'Client' },
    { careLat: -1.28, careLng: 36.76, name: 'Margaret', careAddress: 'Lavington' },
  );
  assert.equal(r.source, 'patient');
  assert.equal(r.lat, -1.28);
  assert.equal(r.label, 'Lavington');
});

test('falls back to the client premises when the patient has no pin', () => {
  const r = resolveCareLocation({ lat: -1.30, lng: 36.80, location: 'Karen' }, { name: 'Margaret' });
  assert.equal(r.source, 'client');
  assert.equal(r.label, 'Karen');
});

test('reports no reference when neither is pinned', () => {
  const r = resolveCareLocation({ name: 'Client' }, { name: 'Patient' });
  assert.equal(r.source, null);
  assert.equal(r.lat, null);
});

test('a per-patient radius override is carried through and clamped', () => {
  const wide = resolveCareLocation(null, { careLat: -1.28, careLng: 36.76, geofenceRadiusM: 500 });
  assert.equal(wide.radiusM, 500);
  assert.equal(normaliseRadius(5), 20);        // floor
  assert.equal(normaliseRadius(99999), 2000);  // ceiling
  assert.equal(normaliseRadius(0), null);
  assert.equal(normaliseRadius('abc'), null);
});

// ── the geofence decision ───────────────────────────────────────────────────
const target = { ...HOME, source: 'patient', radiusM: null };

test('a tight fix at the address is inside', () => {
  const r = evaluateFix({ lat: HOME.lat, lng: HOME.lng, accuracyM: 8, target });
  assert.equal(r.verdict, 'inside');
  assert.equal(r.ok, true);
  assert.equal(r.distanceM, 0);
  assert.equal(r.referenceSource, 'patient');
});

test('a fix outside the fence but inside the accuracy grace is borderline, and allowed', () => {
  // ~111 m north of the address, with a ±50 m fix: 75 + 50 = 125 m allowed.
  const r = evaluateFix({ lat: HOME.lat + 0.001, lng: HOME.lng, accuracyM: 50, target });
  assert.equal(r.verdict, 'borderline');
  assert.equal(r.ok, true);
  assert.equal(r.allowedM, 125);
});

test('the same position with a tight fix is a genuine breach', () => {
  // ~111 m away, ±5 m: 75 + 5 = 80 m allowed. No excuse for the gap.
  const r = evaluateFix({ lat: HOME.lat + 0.001, lng: HOME.lng, accuracyM: 5, target });
  assert.equal(r.verdict, 'outside');
  assert.equal(r.ok, false);
});

test('accuracy grace is capped, so a vague fix cannot stretch the fence indefinitely', () => {
  const r = evaluateFix({ lat: HOME.lat + 0.001, lng: HOME.lng, accuracyM: 95, target });
  assert.equal(r.allowedM, 75 + DEFAULT_GEOFENCE.accuracyGraceCapM);   // not 75 + 95
});

test('a fix vaguer than the maximum is refused rather than guessed at', () => {
  const r = evaluateFix({ lat: HOME.lat, lng: HOME.lng, accuracyM: 400, target });
  assert.equal(r.verdict, 'low_confidence');
  assert.equal(r.ok, false);
  assert.equal(r.distanceM, null, 'must not publish a distance it cannot stand behind');
});

test('a missing accuracy reading is treated as untrustworthy, not as perfect', () => {
  const r = evaluateFix({ lat: HOME.lat, lng: HOME.lng, accuracyM: null, target });
  assert.equal(r.verdict, 'low_confidence');
  assert.equal(r.ok, false);
});

test('no position at all is no_fix', () => {
  assert.equal(evaluateFix({ lat: null, lng: null, accuracyM: 10, target }).verdict, 'no_fix');
});

test('an unpinned address passes by default but is recorded', () => {
  const r = evaluateFix({ lat: HOME.lat, lng: HOME.lng, accuracyM: 10, target: { lat: null, lng: null } });
  assert.equal(r.verdict, 'no_reference');
  assert.equal(r.ok, true);
});

test('requireReference makes an unpinned address fail closed', () => {
  const r = evaluateFix({
    lat: HOME.lat, lng: HOME.lng, accuracyM: 10,
    target: { lat: null, lng: null },
    policy: { requireReference: true },
  });
  assert.equal(r.verdict, 'no_reference');
  assert.equal(r.ok, false);
});

test('warn enforcement lets a breach through but still calls it a breach', () => {
  const r = evaluateFix({
    lat: HOME.lat + 0.01, lng: HOME.lng, accuracyM: 5, target,
    policy: { enforcement: 'warn' },
  });
  assert.equal(r.verdict, 'outside');
  assert.equal(r.ok, true);
});

test('a far-away fix is refused however good it is', () => {
  const r = evaluateFix({ lat: -4.0435, lng: 39.6682, accuracyM: 3, target });   // Mombasa
  assert.equal(r.verdict, 'outside');
  assert.equal(r.ok, false);
  assert.ok(r.distanceM > 400000);
});

test('a patient radius override widens the fence for that address only', () => {
  const rural = { ...HOME, source: 'patient', radiusM: 300 };
  const r = evaluateFix({ lat: HOME.lat + 0.002, lng: HOME.lng, accuracyM: 10, target: rural });
  assert.equal(r.verdict, 'inside');
  assert.equal(r.radiusM, 300);
});

// ── sampling ────────────────────────────────────────────────────────────────
test('bestFix keeps the tightest sample, not the first', () => {
  const b = bestFix([
    { lat: -1.29, lng: 36.80, accuracyM: 850 },   // first, network-derived
    { lat: -1.2833, lng: 36.7667, accuracyM: 12 },
    { lat: -1.2834, lng: 36.7668, accuracyM: 40 },
  ]);
  assert.equal(b.accuracyM, 12);
});

test('bestFix ignores unusable samples and returns null when none remain', () => {
  assert.equal(bestFix([]), null);
  assert.equal(bestFix(null), null);
  assert.equal(bestFix([{ lat: null, lng: null, accuracyM: 5 }]), null);
  assert.equal(bestFix([{ lat: -1.28, lng: 36.76, accuracyM: NaN }]), null);
});

// ── policy plumbing ─────────────────────────────────────────────────────────
test('policyFromSettings falls back to defaults for anything unset', () => {
  const p = policyFromSettings({ geofenceRadiusM: 120 });
  assert.equal(p.radiusM, 120);
  assert.equal(p.maxAccuracyM, DEFAULT_GEOFENCE.maxAccuracyM);
  assert.equal(p.enforcement, 'block');
});

// ── messages ────────────────────────────────────────────────────────────────
test('messages tell the HCA what to do, and never accuse them of lying', () => {
  const low = describeVerdict(evaluateFix({ lat: HOME.lat, lng: HOME.lng, accuracyM: 400, target }));
  assert.match(low, /not precise enough/);
  assert.match(low, /window|outside/);

  const out = describeVerdict(evaluateFix({ lat: HOME.lat + 0.01, lng: HOME.lng, accuracyM: 5, target }), 'clock out');
  assert.match(out, /clock out/);
  assert.doesNotMatch(out, /fraud|lying|dishonest/i);
});

test('a confirmed location reports the distance and the uncertainty together', () => {
  const msg = describeVerdict(evaluateFix({ lat: HOME.lat, lng: HOME.lng, accuracyM: 9, target }));
  assert.match(msg, /±9 m/);
});
