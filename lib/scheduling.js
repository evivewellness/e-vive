/**
 * E-Vive scheduling primitives — pure, dependency-free logic behind the
 * placement conflict checker in store.js.
 *
 * Kept in its own module (rather than private to store.js) so the overlap
 * rules that decide whether an HCA can take a placement are testable in
 * isolation: everything here is deterministic given its arguments, with no
 * Supabase or browser dependency. See lib/scheduling.test.mjs.
 */

// Shift "type" → the hours of the day it occupies. Night wraps past
// midnight, so hours are expressed on a 0–31 scale where 24+ means "the
// following morning" — that makes day+1 arithmetic fall out of plain
// number comparison instead of needing special cases.
export function shiftHourWindow(type) {
  if (type === 'night') return [19, 31];
  if (type === 'live-in' || type === '24-hour') return [0, 24];
  return [7, 19]; // day
}

// Absolute [startMs, endMs) for a given calendar date + shift type.
export function shiftInterval(dateStr, type) {
  const [startH, endH] = shiftHourWindow(type);
  const base = Date.parse(`${dateStr}T00:00:00Z`);
  return [base + startH * 3600000, base + endH * 3600000];
}

// Half-open overlap: two shifts that merely touch (one ends exactly as the
// next begins, e.g. a day shift ending 19:00 and a night shift starting
// 19:00) do NOT conflict.
export function intervalsOverlap(a, b) {
  return a[0] < b[1] && b[0] < a[1];
}

// Inclusive list of 'YYYY-MM-DD' between two dates.
export function dateRange(startDate, endDate) {
  const out = [];
  const end = new Date(`${endDate}T00:00:00`);
  for (let d = new Date(`${startDate}T00:00:00`); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toIso(d));
  }
  return out;
}

// Local-date ISO string. Deliberately NOT toISOString().slice(0,10), which
// converts to UTC first and so returns the previous day for any timezone
// east of UTC — Kenya is UTC+3, so that would shift every generated date
// back by one for anything at/after 00:00 local.
export function toIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Shifts an ISO date string by N days without timezone drift.
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

// Today's date as the user sees it on their own calendar. Same reason as
// toIso: new Date().toISOString().slice(0,10) reports the UTC day, which in
// Kenya (UTC+3) is still "yesterday" between midnight and 03:00 local.
export function todayIso() {
  return toIso(new Date());
}

/**
 * The core rule: given one HCA's existing shifts and approved off-days,
 * which days in [startDate, endDate] would a new `shiftType` placement
 * clash with?
 *
 * Returns { 'YYYY-MM-DD': [conflict, ...] } — an empty object means the
 * whole range is free. Callers fetch the rows; this decides.
 *
 * @param existingShifts rows of { id, date, type, placement_id, client_id }
 * @param offDays        rows of { id, date }
 */
export function findScheduleConflicts({
  startDate, endDate, shiftType,
  existingShifts = [], offDays = [],
  excludePlacementId = null,
}) {
  const conflicts = {};
  for (const d of dateRange(startDate, endDate)) {
    const candidate = shiftInterval(d, shiftType);
    const hits = [];
    for (const r of existingShifts) {
      if (excludePlacementId && r.placement_id === excludePlacementId) continue;
      if (intervalsOverlap(candidate, shiftInterval(r.date, r.type))) {
        hits.push({ kind: 'shift', date: d, type: r.type, clientId: r.client_id, shiftId: r.id });
      }
    }
    for (const r of offDays) {
      if (intervalsOverlap(candidate, shiftInterval(r.date, 'live-in'))) {
        hits.push({ kind: 'offday', date: d });
      }
    }
    if (hits.length) conflicts[d] = hits;
  }
  return conflicts;
}

// Human-readable summary of the first conflict, for surfacing to Admin.
export function describeConflicts(conflicts, clients = []) {
  const days = Object.keys(conflicts).sort();
  if (!days.length) return '';
  const first = conflicts[days[0]][0];
  const clientName = first.clientId ? (clients.find(c => c.id === first.clientId)?.name || 'another client') : null;
  const what = first.kind === 'offday'
    ? 'an approved off-day'
    : `a ${first.type} shift${clientName ? ` for ${clientName}` : ''}`;
  return `This HCA already has ${what} on ${days[0]}. Choose a different date range, shift type, or HCA.` +
    (days.length > 1 ? ` (${days.length} conflicting day(s) total.)` : '');
}

// Start time each shift type begins at, used when generating shift rows.
export function shiftStartTime(type) {
  if (type === 'night') return '19:00';
  if (type === 'live-in' || type === '24-hour') return '00:00';
  return '07:00';
}
