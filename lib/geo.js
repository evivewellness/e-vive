/**
 * Distance on the surface of the earth, and the attendance rule built on it.
 *
 * Used by the clock-in check, which is the one place in the platform where a
 * number decides whether someone gets paid for a shift — so the tolerance
 * matters as much as the maths.
 *
 * The original check was `> 10 m`, in browser code. Both halves were wrong:
 * consumer GPS is routinely 10–30 m out and considerably worse indoors and
 * under a roof, which is exactly where home care happens, so a 10 m fence
 * rejects honest carers standing in the client's living room; and a check the
 * browser performs is advice, not a rule. The default here is 150 m — close
 * enough that being at the wrong house fails, loose enough that a real arrival
 * at the right one does not — and it is enforced server-side.
 */

const EARTH_RADIUS_M = 6371000;

const toRad = deg => (deg * Math.PI) / 180;

/**
 * Strict numeric coercion. `Number(null)` is 0 and `Number('')` is 0, which
 * would quietly turn "we have no location for this client" into "the client is
 * at 0°N 0°E" — a point in the Atlantic that every clock-in in Kenya is
 * thousands of kilometres from. Absent must read as absent.
 */
export function coord(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Great-circle distance in metres. Returns null if either point is missing. */
export function distanceMetres(lat1, lng1, lat2, lng2) {
  const nums = [lat1, lng1, lat2, lng2].map(coord);
  if (nums.some(n => n === null)) return null;
  const [a1, o1, a2, o2] = nums;

  const dLat = toRad(a2 - a1);
  const dLng = toRad(o2 - o1);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Metres. Wide enough for real GPS error, tight enough to mean "here". */
export const DEFAULT_CLOCK_IN_RADIUS_M = 150;

/**
 * Decide a clock-in.
 *
 * Returns `{ verified, distance, reason }`. `verified` is only ever true when
 * a real comparison happened and passed — when the client has no recorded
 * coordinates, or the radius is configured to 0, the clock-in is allowed but
 * recorded as unverified rather than quietly counted as checked. The
 * distinction is the point: an unverified clock-in is a fact the payroll
 * reviewer can see, not an absence of one.
 */
export function checkClockInLocation({ lat, lng, clientLat, clientLng, radiusM = DEFAULT_CLOCK_IN_RADIUS_M }) {
  if (coord(lat) === null || coord(lng) === null) {
    return { allowed: true, verified: false, distance: null, reason: 'no_device_location' };
  }
  if (coord(clientLat) === null || coord(clientLng) === null) {
    return { allowed: true, verified: false, distance: null, reason: 'no_client_location' };
  }

  const distance = distanceMetres(lat, lng, clientLat, clientLng);
  const radius = coord(radiusM);

  if (radius === null || radius <= 0) {
    return { allowed: true, verified: false, distance, reason: 'checks_disabled' };
  }
  if (distance > radius) {
    return { allowed: false, verified: false, distance, reason: 'too_far' };
  }
  return { allowed: true, verified: true, distance, reason: 'within_radius' };
}
