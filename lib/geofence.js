/**
 * Attendance geofencing — where the HCA must be to clock in or out.
 *
 * Pure functions only, so the maths can be unit-tested without a browser, a
 * database or a GPS chip. Everything that talks to the network lives in
 * lib/geoFix.js (browser) or pages/api/shifts/clock.js (server).
 *
 * Two ideas drive the design:
 *
 * 1. The reference point is the PATIENT'S care address, not the client
 *    account's. One client can have several patients at different addresses —
 *    the placement workflow explicitly supports one HCA serving multiple
 *    patients — so geofencing everyone to the account holder's pin puts an HCA
 *    "on site" at a house they have never visited. The client's coordinates
 *    remain the fallback, and which one was used is recorded.
 *
 * 2. A GPS fix is a circle, not a point. `coords.accuracy` is the radius, in
 *    metres, of the 68% confidence region. Comparing a distance derived from a
 *    ±300 m fix against a 10 m fence is arithmetic, not evidence. So a fix that
 *    is too vague to mean anything is rejected outright rather than silently
 *    accepted or silently refused, and the accuracy radius is added to the
 *    allowed distance (capped) before a borderline position is called a breach.
 */

// Defaults. Admin overrides these in platform_settings; a patient may narrow
// or widen the radius for their own address.
export const DEFAULT_GEOFENCE = {
  // How far from the care address still counts as "at work".
  //
  // The previous value was 10 m, which no consumer smartphone can honour
  // indoors: 5–20 m is a good outdoor fix and walls, tin roofs and dense
  // urban blocks routinely push it past 50 m. A 10 m fence does not catch
  // fraud, it just blocks HCAs from starting shifts they are standing inside.
  radiusM: 75,

  // A fix vaguer than this tells us nothing; ask for another one.
  maxAccuracyM: 100,

  // How much of the accuracy radius may be forgiven. Without a cap, a phone
  // reporting ±100 m would extend the fence to 175 m in every direction.
  accuracyGraceCapM: 50,

  // 'block' — refuse the clock-in/out.
  // 'warn'  — allow it, but record the exception for Admin.
  enforcement: 'block',

  // When no coordinates exist for the patient or the client, should the
  // clock-in be refused? False preserves today's behaviour (unchecked), but
  // the gap is now recorded either way so Admin can see which addresses are
  // unpinned instead of discovering it never checked anything.
  requireReference: false,
};

export const ENFORCEMENT_OPTIONS = [
  { value: 'block', label: 'Block', hint: 'Refuse the clock-in or clock-out when the HCA is outside the fence.' },
  { value: 'warn',  label: 'Warn and record', hint: 'Allow it, but log an attendance exception for review.' },
];

// Verdicts, worst to best. Anything other than 'inside' is worth a look.
export const VERDICTS = ['no_fix', 'low_confidence', 'no_reference', 'outside', 'borderline', 'inside'];

/** Great-circle distance in metres. */
export function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371008.8;                       // IUGG mean Earth radius
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Number(), minus the coercions that make a missing value look like a real
 * measurement. Number(null), Number('') and Number([]) are all 0 — which for
 * a latitude means "the equator" and for an accuracy radius means "perfect".
 * Both are the opposite of what the absent value meant.
 */
export function num(v) {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** A usable coordinate. Rejects null, '', NaN and out-of-range values.
 *  Note 0 is a legal latitude and longitude — a truthiness check silently
 *  disables the fence on the equator and the prime meridian. */
export function isCoord(lat, lng) {
  const a = num(lat), b = num(lng);
  return Number.isFinite(a) && Number.isFinite(b)
      && Math.abs(a) <= 90 && Math.abs(b) <= 180
      && !(a === 0 && b === 0);              // 0,0 is the null-island sentinel
}

/**
 * Where this shift is supposed to happen.
 *
 * Prefers the patient's own care address, falls back to the client account's
 * premises, and always says which it used so the audit trail is honest about
 * the precision of its own reference point.
 */
export function resolveCareLocation(client, patient) {
  if (patient && isCoord(patient.careLat, patient.careLng)) {
    return {
      lat: Number(patient.careLat),
      lng: Number(patient.careLng),
      source: 'patient',
      label: patient.careAddress || patient.name || 'Patient address',
      radiusM: normaliseRadius(patient.geofenceRadiusM),
    };
  }
  if (client && isCoord(client.lat, client.lng)) {
    return {
      lat: Number(client.lat),
      lng: Number(client.lng),
      source: 'client',
      label: client.location || client.address || client.name || 'Client premises',
      radiusM: null,
    };
  }
  return { lat: null, lng: null, source: null, label: null, radiusM: null };
}

/** A per-patient radius override, or null when unset/nonsensical. */
export function normaliseRadius(v) {
  const n = Math.round(num(v));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(2000, Math.max(20, n));
}

/**
 * Decide whether a fix puts the HCA at the care address.
 *
 * Returns the full working — distance, allowed distance, accuracy and the
 * reference point used — not just a boolean, because that is what gets stored
 * on the shift and what an Admin needs in order to judge a disputed shift.
 */
export function evaluateFix({
  lat, lng, accuracyM,
  target,
  policy = DEFAULT_GEOFENCE,
} = {}) {
  const p = { ...DEFAULT_GEOFENCE, ...(policy || {}) };
  const radiusM = target?.radiusM || p.radiusM;

  const acc = num(accuracyM);
  const base = {
    lat: Number.isFinite(num(lat)) ? num(lat) : null,
    lng: Number.isFinite(num(lng)) ? num(lng) : null,
    accuracyM: Number.isFinite(acc) && acc >= 0 ? Math.round(acc) : null,
    distanceM: null,
    allowedM: null,
    radiusM,
    referenceSource: target?.source || null,
    enforcement: p.enforcement,
  };

  if (!isCoord(lat, lng)) {
    return { ...base, verdict: 'no_fix', ok: false };
  }

  // A fix we cannot trust must not be used in either direction.
  if (base.accuracyM === null || base.accuracyM > p.maxAccuracyM) {
    return { ...base, verdict: 'low_confidence', ok: false };
  }

  if (!target || !isCoord(target.lat, target.lng)) {
    // Nothing to measure against. Fail closed only if Admin asked us to.
    return { ...base, verdict: 'no_reference', ok: !p.requireReference };
  }

  const distanceM = Math.round(haversineM(base.lat, base.lng, target.lat, target.lng));
  const grace     = Math.min(base.accuracyM, p.accuracyGraceCapM);
  const allowedM  = radiusM + grace;

  if (distanceM <= radiusM) {
    return { ...base, distanceM, allowedM, verdict: 'inside', ok: true };
  }
  if (distanceM <= allowedM) {
    // Inside once the fix's own uncertainty is allowed for. Permitted, but
    // recorded — a run of these on one HCA is a pattern Admin should see.
    return { ...base, distanceM, allowedM, verdict: 'borderline', ok: true };
  }
  return {
    ...base, distanceM, allowedM, verdict: 'outside',
    ok: p.enforcement === 'warn',
  };
}

/** Wording shown to the HCA. Plain, actionable, never accusatory — a bad fix
 *  is usually a concrete wall, not a dishonest worker. */
export function describeVerdict(r, action = 'clock in') {
  switch (r?.verdict) {
    case 'no_fix':
      return 'Your location could not be read. Turn on location services and try again.';
    case 'low_confidence':
      return `Your phone could only place you to within ${r.accuracyM ? `${r.accuracyM} m` : 'an unknown distance'}, which is not precise enough to ${action}. Step outside or near a window, wait a few seconds and try again.`;
    case 'no_reference':
      return r.ok
        ? 'No GPS address is set for this patient, so your location could not be checked. This has been recorded.'
        : `No GPS address is set for this patient yet, so you cannot ${action} here. Contact your E-Vive coordinator.`;
    case 'outside':
      return r.ok
        ? `You appear to be ${formatDistance(r.distanceM)} from the patient's address. This has been recorded.`
        : `You appear to be ${formatDistance(r.distanceM)} from the patient's address. You must be within ${r.radiusM} m to ${action}.`;
    case 'borderline':
      return `Location confirmed (${formatDistance(r.distanceM)} away, ±${r.accuracyM} m).`;
    case 'inside':
      return `Location confirmed (${formatDistance(r.distanceM)} from the patient's address, ±${r.accuracyM} m).`;
    default:
      return '';
  }
}

export function formatDistance(m) {
  if (!Number.isFinite(m)) return 'an unknown distance';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

/**
 * Pick the most trustworthy of several fixes.
 *
 * getCurrentPosition typically answers first from the network (cell/Wi-Fi),
 * which can be hundreds of metres out, and sharpens over the next few seconds
 * as satellites lock. Taking the single first fix is the main reason honest
 * clock-ins get refused, so we sample and keep the tightest.
 */
export function bestFix(samples) {
  const usable = (samples || []).filter(s => s && isCoord(s.lat, s.lng) && Number.isFinite(num(s.accuracyM)));
  if (!usable.length) return null;
  return usable.reduce((best, s) => (num(s.accuracyM) < num(best.accuracyM) ? s : best));
}

/** Settings shape → the policy object evaluateFix expects. */
export function policyFromSettings(s = {}) {
  return {
    radiusM:           s.geofenceRadiusM        ?? DEFAULT_GEOFENCE.radiusM,
    maxAccuracyM:      s.geofenceMaxAccuracyM   ?? DEFAULT_GEOFENCE.maxAccuracyM,
    accuracyGraceCapM: s.geofenceGraceCapM      ?? DEFAULT_GEOFENCE.accuracyGraceCapM,
    enforcement:       s.geofenceEnforcement    ?? DEFAULT_GEOFENCE.enforcement,
    requireReference:  s.geofenceRequireReference ?? DEFAULT_GEOFENCE.requireReference,
  };
}
