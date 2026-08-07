/**
 * Cardex field access classification — THE single definition of who may see
 * which parts of a Cardex entry. Every query, API route, report builder and
 * email must derive its field list from here rather than hardcoding one.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE USING IT
 *
 * This module is a *data-shaping* helper. On its own it is NOT access
 * control. Two things have to be true for a field to be genuinely protected:
 *
 *   1. The query must not select it        (use cardexColumnsFor)
 *   2. The response must not contain it    (use redactCardexFor)
 *
 * Filtering only at render time — fetching the whole row and declining to
 * display part of it — leaves the data sitting in the network response and
 * in React state, readable by anyone with devtools. That is the specific
 * mistake this module exists to prevent.
 *
 * The client-facing read path is served by /api/cardex/* only, which verify
 * the session cookie server-side before querying. See
 * docs/cardex-security.md.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Audiences, most restricted first.
export const CARDEX_AUDIENCES = ['shared', 'client', 'hca', 'admin'];

// Identification columns every audience needs to make sense of an entry.
const BASE = ['id', 'shift_id', 'hca_id', 'patient_id', 'client_id', 'submitted_at'];

// The clinical record itself — care that was delivered. Visible to everyone,
// including a family and anyone they lawfully share a report with.
const CLINICAL = [
  'vitals', 'medications', 'intakes', 'nutrition',
  'hygiene', 'mobility', 'elimination', 'mental_state',
  'special_needs_checks', 'incidents',
];

// Handover is clinical but written HCA-to-HCA. Families get it; whether it
// belongs in a report forwarded to a third party is a judgement call, so it
// is opt-in for `shared` rather than automatic (see SHAREABLE_OPTIONAL).
const HANDOVER = ['handover'];

// The HCA's confidential account of their OWN shift. Never leaves E-Vive.
// welfare_note in particular may describe the very household that would be
// requesting a report — exposing it is both a broken promise to the worker
// and a safeguarding risk to them.
const STAFF_CONFIDENTIAL = ['shift_rating', 'welfare_note'];

// Internal quality assurance. Admin only.
const INTERNAL_QA = ['qa_comments', 'flagged'];

const COLUMNS = {
  // `shared` deliberately omits handover — see SHAREABLE_OPTIONAL.
  shared: [...BASE, ...CLINICAL],
  client: [...BASE, ...CLINICAL, ...HANDOVER],
  hca:    [...BASE, ...CLINICAL, ...HANDOVER, ...STAFF_CONFIDENTIAL],
  admin:  [...BASE, ...CLINICAL, ...HANDOVER, ...STAFF_CONFIDENTIAL, ...INTERNAL_QA],
};

// Fields a client may CHOOSE to add to an outward share. Excluded by default
// (data minimisation, DPA 2019 §7 of the brief): a share carries the least
// that serves the purpose unless the client deliberately opts in. Anything
// not listed here can never appear in a shared report, under any option.
export const SHAREABLE_OPTIONAL = [...HANDOVER];

/**
 * Explicit column list for a `select()`. Never use select('*') on
 * cardex_entries for anything other than an admin/service-role context.
 */
export function cardexColumnsFor(audience, opts) {
  return cardexFieldsFor(audience, opts).join(', ');
}

/**
 * `include` may only ever add fields listed in SHAREABLE_OPTIONAL. Passing
 * anything else — welfare_note, qa_comments — is ignored, so a caller cannot
 * widen access by supplying a field name from user input.
 */
export function cardexFieldsFor(audience, { include = [] } = {}) {
  const cols = COLUMNS[audience];
  if (!cols) throw new Error(`Unknown Cardex audience: ${audience}`);
  const extra = include.filter(f => SHAREABLE_OPTIONAL.includes(f) && !cols.includes(f));
  return [...cols, ...extra];
}

export function isCardexFieldVisibleTo(dbField, audience, opts) {
  return cardexFieldsFor(audience, opts).includes(dbField);
}

// camelCase (as produced by cardexFromDb) → snake_case column, so the same
// classification governs both raw rows and mapped objects.
const CAMEL_TO_DB = {
  id: 'id', shiftId: 'shift_id', hcaId: 'hca_id', patientId: 'patient_id',
  clientId: 'client_id', submittedAt: 'submitted_at', date: 'submitted_at',
  vitals: 'vitals', medications: 'medications', intakes: 'intakes',
  nutrition: 'nutrition', hygiene: 'hygiene', mobility: 'mobility',
  elimination: 'elimination', mentalState: 'mental_state',
  specialNeedsChecks: 'special_needs_checks', incidents: 'incidents',
  handover: 'handover', shiftRating: 'shift_rating',
  welfareNote: 'welfare_note', qaComments: 'qa_comments', flagged: 'flagged',
};

/**
 * Defence in depth: strip anything the audience may not see from an
 * already-mapped entry. Use in addition to a narrow select, never instead
 * of one — by the time a value is here it has already crossed the wire.
 *
 * `omit` additionally drops fields the client deselected when sharing.
 */
export function redactCardexFor(entry, audience, { omit = [], include = [] } = {}) {
  if (!entry) return null;
  const allowed = cardexFieldsFor(audience, { include });
  const out = {};
  for (const [key, value] of Object.entries(entry)) {
    const dbField = CAMEL_TO_DB[key];
    if (!dbField) continue;                        // unclassified → drop, fail closed
    if (!allowed.includes(dbField)) continue;
    if (omit.includes(dbField) || omit.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

export function redactCardexListFor(entries, audience, opts) {
  return (entries || []).map(e => redactCardexFor(e, audience, opts));
}

// ── Display helpers (presentation, shared by every Cardex renderer) ──────────

// The form captures systolic and diastolic separately; every display of blood
// pressure should combine them here rather than inventing its own `bp` field.
export function formatBloodPressure(vitals = {}) {
  const { bpSys, bpDia } = vitals;
  if (!bpSys && !bpDia) return null;
  return `${bpSys || '—'}/${bpDia || '—'}`;
}

// label, unit, and the vitals key each maps to. Order is the order shown.
export const VITAL_FIELDS = [
  { key: 'temp',  label: 'Temperature',      unit: '°C'     },
  { key: 'pulse', label: 'Pulse',            unit: 'bpm'    },
  { key: 'bp',    label: 'Blood Pressure',   unit: 'mmHg'   }, // derived, see formatBloodPressure
  { key: 'spo2',  label: 'SpO₂',             unit: '%'      },
  { key: 'rr',    label: 'Respiratory Rate', unit: 'br/min' },
  { key: 'gcs',   label: 'GCS',              unit: '/15'    },
  { key: 'pain',  label: 'Pain Score',       unit: '/10'    },
  { key: 'bgl',   label: 'Blood Glucose',    unit: 'mmol/L' },
];

// Shown alongside any Cardex-derived summary or report. Non-negotiable:
// this is a record of care delivered, not a clinical assessment.
export const CARDEX_STANDING_NOTE =
  'This is a record of care delivered during a shift, not a medical assessment. ' +
  'It does not replace advice from a doctor or nurse.';
