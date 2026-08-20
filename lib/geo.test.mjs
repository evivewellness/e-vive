import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceMetres, checkClockInLocation, DEFAULT_CLOCK_IN_RADIUS_M } from './geo.js';

// Two real Nairobi points, roughly 8.5 km apart: Karen and Westlands, the
// coordinates the demo data uses.
const KAREN = { lat: -1.3173, lng: 36.7069 };
const WESTLANDS = { lat: -1.2708, lng: 36.8117 };

test('distance between two known points is right to within a percent', () => {
  const d = distanceMetres(KAREN.lat, KAREN.lng, WESTLANDS.lat, WESTLANDS.lng);
  assert.ok(d > 12000 && d < 13000, `expected ~12.6 km, got ${Math.round(d)} m`);
});

test('a point is zero metres from itself', () => {
  assert.equal(distanceMetres(KAREN.lat, KAREN.lng, KAREN.lat, KAREN.lng), 0);
});

test('distance is symmetric', () => {
  const a = distanceMetres(KAREN.lat, KAREN.lng, WESTLANDS.lat, WESTLANDS.lng);
  const b = distanceMetres(WESTLANDS.lat, WESTLANDS.lng, KAREN.lat, KAREN.lng);
  assert.ok(Math.abs(a - b) < 1e-6);
});

test('a missing or unparseable coordinate gives null, not NaN', () => {
  assert.equal(distanceMetres(null, 36.7, -1.3, 36.8), null);
  assert.equal(distanceMetres(-1.3, undefined, -1.3, 36.8), null);
  assert.equal(distanceMetres('not a number', 36.7, -1.3, 36.8), null);
});

test('standing at the address is verified', () => {
  const r = checkClockInLocation({ ...KAREN, clientLat: KAREN.lat, clientLng: KAREN.lng, radiusM: 150 });
  assert.equal(r.allowed, true);
  assert.equal(r.verified, true);
  assert.equal(r.distance, 0);
});

test('across town is refused, and says how far', () => {
  const r = checkClockInLocation({
    lat: WESTLANDS.lat, lng: WESTLANDS.lng,
    clientLat: KAREN.lat, clientLng: KAREN.lng, radiusM: 150,
  });
  assert.equal(r.allowed, false);
  assert.equal(r.verified, false);
  assert.equal(r.reason, 'too_far');
  assert.ok(r.distance > 12000);
});

test('the default radius tolerates real GPS error but not the wrong house', () => {
  // ~100 m north of the client: a plausible fix from inside the building.
  const near = { lat: KAREN.lat + 0.0009, lng: KAREN.lng };
  const ok = checkClockInLocation({ ...near, clientLat: KAREN.lat, clientLng: KAREN.lng });
  assert.equal(ok.allowed, true, `100 m should pass a ${DEFAULT_CLOCK_IN_RADIUS_M} m fence`);
  assert.equal(ok.verified, true);

  // ~500 m away: a different street.
  const far = { lat: KAREN.lat + 0.0045, lng: KAREN.lng };
  assert.equal(checkClockInLocation({ ...far, clientLat: KAREN.lat, clientLng: KAREN.lng }).allowed, false);

  // The old 10 m rule would have rejected the honest one.
  const strict = checkClockInLocation({ ...near, clientLat: KAREN.lat, clientLng: KAREN.lng, radiusM: 10 });
  assert.equal(strict.allowed, false);
});

test('no device location is allowed but never counted as verified', () => {
  const r = checkClockInLocation({ lat: null, lng: null, clientLat: KAREN.lat, clientLng: KAREN.lng });
  assert.equal(r.allowed, true, 'a denied GPS permission must not stop someone starting work');
  assert.equal(r.verified, false);
  assert.equal(r.reason, 'no_device_location');
});

test('a client with no coordinates on file is allowed but unverified', () => {
  const r = checkClockInLocation({ ...KAREN, clientLat: null, clientLng: null });
  assert.equal(r.allowed, true);
  assert.equal(r.verified, false, 'a missing database field must not read as a passed check');
  assert.equal(r.reason, 'no_client_location');
});

test('a zero radius disables the check without faking a pass', () => {
  const r = checkClockInLocation({
    lat: WESTLANDS.lat, lng: WESTLANDS.lng,
    clientLat: KAREN.lat, clientLng: KAREN.lng, radiusM: 0,
  });
  assert.equal(r.allowed, true);
  assert.equal(r.verified, false);
  assert.equal(r.reason, 'checks_disabled');
  assert.ok(r.distance > 12000, 'the distance is still recorded');
});

test('verified is never true unless a real comparison passed', () => {
  const cases = [
    { lat: null, lng: null, clientLat: KAREN.lat, clientLng: KAREN.lng },
    { ...KAREN, clientLat: null, clientLng: null },
    { ...KAREN, clientLat: KAREN.lat, clientLng: KAREN.lng, radiusM: 0 },
    { ...KAREN, clientLat: KAREN.lat, clientLng: KAREN.lng, radiusM: -5 },
  ];
  for (const c of cases) assert.equal(checkClockInLocation(c).verified, false);
});
