/**
 * Aggregation and inline-SVG trend charts for Cardex entries.
 *
 * Pure and dependency-free — no charting library (the CSP blocks external
 * scripts) and no data access. Everything here is testable in isolation; see
 * lib/cardexSummary.test.mjs.
 *
 * CLINICAL SAFETY: nothing in this module grades, scores, classifies or
 * interprets. It reports what was recorded and how it changed. Reference
 * ranges are provided for optional display only, always labelled as typical
 * adult ranges, and never rendered as "abnormal", a colour-coded warning, or
 * a risk level. Do not add that here.
 */

export const DATA_TYPES = [
  { key: 'vitals',     label: 'Vital signs' },
  { key: 'medications',label: 'Medications' },
  { key: 'nutrition',  label: 'Nutrition & fluids' },
  { key: 'care',       label: 'Personal care' },
  { key: 'mental',     label: 'Mental state' },
  { key: 'incidents',  label: 'Incidents' },
];

// Numeric vitals we can trend. `key` indexes entry.vitals.
export const NUMERIC_VITALS = [
  { key: 'temp',  label: 'Temperature',      unit: '°C',     dp: 1 },
  { key: 'pulse', label: 'Pulse',            unit: 'bpm',    dp: 0 },
  { key: 'bpSys', label: 'Systolic BP',      unit: 'mmHg',   dp: 0 },
  { key: 'bpDia', label: 'Diastolic BP',     unit: 'mmHg',   dp: 0 },
  { key: 'spo2',  label: 'SpO₂',             unit: '%',      dp: 0 },
  { key: 'rr',    label: 'Respiratory rate', unit: 'br/min', dp: 0 },
  { key: 'pain',  label: 'Pain score',       unit: '/10',    dp: 0 },
  { key: 'bgl',   label: 'Blood glucose',    unit: 'mmol/L', dp: 1 },
  { key: 'gcs',   label: 'GCS',              unit: '/15',    dp: 0 },
];

// Typical adult reference ranges, for optional display only. Deliberately not
// used to classify anything — see the module note above.
export const TYPICAL_ADULT_RANGES = {
  temp:  [36.1, 37.2], pulse: [60, 100], bpSys: [90, 120], bpDia: [60, 80],
  spo2:  [95, 100],    rr:    [12, 20],  bgl:   [4, 7.8],  gcs:   [15, 15],
};

export const RANGE_PRESETS = [
  { key: '7',   label: 'Last 7 days',  days: 7 },
  { key: '30',  label: 'Last 30 days', days: 30 },
  { key: '90',  label: 'Last 90 days', days: 90 },
];

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const isoDay = (d) => String(d || '').slice(0, 10);

/** Inclusive date filter on submitted_at, plus optional patient + incidents-only. */
export function filterEntries(entries, { start, end, patientId, incidentsOnly } = {}) {
  return (entries || []).filter(e => {
    const day = isoDay(e.submittedAt || e.date);
    if (start && day < start) return false;
    if (end && day > end) return false;
    if (patientId && e.patientId !== patientId) return false;
    if (incidentsOnly && !String(e.incidents || '').trim()) return false;
    return true;
  });
}

/** Chronological { day, value } points for one numeric vital. */
export function seriesFor(entries, vitalKey) {
  return (entries || [])
    .map(e => ({ day: isoDay(e.submittedAt || e.date), value: num((e.vitals || {})[vitalKey]) }))
    .filter(p => p.day && p.value !== null)
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/**
 * latest / mean / min / max / count for a vital, plus the change against the
 * immediately preceding period of equal length (so "last 30 days" compares
 * with the 30 days before it).
 */
export function summariseVital(entries, vitalKey, { start, end, priorEntries } = {}) {
  const pts = seriesFor(entries, vitalKey);
  if (pts.length === 0) return { key: vitalKey, count: 0 };

  const values = pts.map(p => p.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const out = {
    key: vitalKey,
    count: values.length,
    latest: values[values.length - 1],
    latestDay: pts[pts.length - 1].day,
    mean,
    min: Math.min(...values),
    max: Math.max(...values),
  };

  const prior = priorEntries !== undefined
    ? seriesFor(priorEntries, vitalKey).map(p => p.value)
    : null;
  if (prior && prior.length) {
    const priorMean = prior.reduce((a, b) => a + b, 0) / prior.length;
    out.priorMean = priorMean;
    out.changeVsPrior = mean - priorMean;
  }
  return out;
}

/** The equal-length window immediately before [start, end]. */
export function precedingPeriod(start, end) {
  const s = new Date(`${start}T00:00:00`), e = new Date(`${end}T00:00:00`);
  const days = Math.round((e - s) / 86400000) + 1;
  const pe = new Date(s); pe.setDate(pe.getDate() - 1);
  const ps = new Date(pe); ps.setDate(ps.getDate() - (days - 1));
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { start: iso(ps), end: iso(pe) };
}

/** Derived, non-clinical measures — counts of what was recorded. */
export function derivedMeasures(entries, { scheduledShifts } = {}) {
  const list = entries || [];
  const days = new Set(list.map(e => isoDay(e.submittedAt || e.date)));

  let doses = 0, fluidMl = 0, meals = 0, repositioned = 0, incidents = 0;
  for (const e of list) {
    doses += (e.medications || []).length;
    for (const it of e.intakes || []) {
      const n = num(it.amount);
      if (n === null) continue;
      const u = String(it.unit || 'ml').toLowerCase();
      fluidMl += u === 'l' ? n * 1000 : u === 'cups' ? n * 250 : n;
    }
    meals += ['breakfast', 'lunch', 'dinner']
      .filter(m => String((e.nutrition || {})[m] || '').trim()).length;
    if ((e.hygiene || {}).reposition) repositioned++;
    if (String(e.incidents || '').trim()) incidents++;
  }

  return {
    reportCount: list.length,
    daysCovered: days.size,
    dosesRecorded: doses,
    fluidMlTotal: fluidMl,
    fluidMlPerDay: days.size ? Math.round(fluidMl / days.size) : 0,
    mealsRecorded: meals,
    repositioningShifts: repositioned,
    repositioningRate: list.length ? Math.round((repositioned / list.length) * 100) : null,
    incidentCount: incidents,
    shiftsScheduled: scheduledShifts ?? null,
    coverageRate: scheduledShifts ? Math.round((list.length / scheduledShifts) * 100) : null,
  };
}

export function buildSummary(entries, { start, end, patientId, priorEntries, scheduledShifts } = {}) {
  const scoped = filterEntries(entries, { start, end, patientId });
  const priorScoped = priorEntries ? filterEntries(priorEntries, { patientId }) : undefined;
  return {
    range: { start, end },
    vitals: NUMERIC_VITALS
      .map(v => ({ ...v, ...summariseVital(scoped, v.key, { start, end, priorEntries: priorScoped }) }))
      .filter(v => v.count > 0),
    measures: derivedMeasures(scoped, { scheduledShifts }),
    entryCount: scoped.length,
  };
}

// ── Inline SVG line chart ────────────────────────────────────────────────────
// No charting dependency (CSP blocks external scripts). Gaps render as gaps:
// consecutive points more than `gapDays` apart are NOT joined, so the chart
// never implies readings that were not taken.

export function buildLineChart(series, {
  width = 640, height = 180, pad = 28, gapDays = 2,
  label = '', unit = '', color = '#004A99', secondary = null, secondaryLabel = '', secondaryColor = '#0ea5e9',
} = {}) {
  const all = [...series, ...(secondary || [])];
  if (all.length === 0) return null;

  const days = [...new Set(all.map(p => p.day))].sort();
  const t0 = Date.parse(`${days[0]}T00:00:00Z`);
  const t1 = Date.parse(`${days[days.length - 1]}T00:00:00Z`);
  const span = Math.max(t1 - t0, 1);

  const values = all.map(p => p.value);
  let lo = Math.min(...values), hi = Math.max(...values);
  if (lo === hi) { lo -= 1; hi += 1; }
  const padY = (hi - lo) * 0.15;
  lo -= padY; hi += padY;

  const x = (day) => pad + ((Date.parse(`${day}T00:00:00Z`) - t0) / span) * (width - pad * 2);
  const y = (v)   => height - pad - ((v - lo) / (hi - lo)) * (height - pad * 2);

  // Split into segments, breaking wherever the gap exceeds gapDays.
  const segments = (pts) => {
    const segs = []; let cur = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const gap = (Date.parse(`${pts[i].day}T00:00:00Z`) - Date.parse(`${pts[i-1].day}T00:00:00Z`)) / 86400000;
        if (gap > gapDays) { if (cur.length) segs.push(cur); cur = []; }
      }
      cur.push(pts[i]);
    }
    if (cur.length) segs.push(cur);
    return segs;
  };

  const pathFor = (pts) => segments(pts)
    .filter(s => s.length > 1)
    .map(s => 'M' + s.map(p => `${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('L'))
    .join(' ');

  // Lone points (a segment of one) still need to be visible.
  const dotsFor = (pts) => pts.map(p => ({ cx: x(p.day), cy: y(p.value), day: p.day, value: p.value }));

  return {
    width, height,
    xAxis: { from: days[0], to: days[days.length - 1] },
    yAxis: { lo, hi },
    primary:   { path: pathFor(series), dots: dotsFor(series), color, label, unit },
    secondary: secondary ? { path: pathFor(secondary), dots: dotsFor(secondary), color: secondaryColor, label: secondaryLabel } : null,
    gridY: [lo, lo + (hi - lo) / 2, hi].map(v => ({ v, y: y(v) })),
  };
}

export function fmtValue(v, dp = 1) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return dp === 0 ? String(Math.round(v)) : v.toFixed(dp);
}

/**
 * Neutral wording only. Never "high", "low", "dangerous" or "deteriorating".
 * Returns null when the value sits inside the typical range, or when no range
 * is known for that vital.
 */
export function typicalRangeNote(vitalKey, value) {
  const range = TYPICAL_ADULT_RANGES[vitalKey];
  if (!range || value === null || value === undefined || !Number.isFinite(value)) return null;
  const [lo, hi] = range;
  if (value >= lo && value <= hi) return null;
  return 'outside the typical adult range — worth discussing with your doctor';
}
