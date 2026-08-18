/**
 * What each role may do with each table.
 *
 * The browser used to talk to Postgres directly with the public anon key, which
 * meant "what the UI happens to ask for" was the only limit on what anyone
 * could read or write. This file is the replacement: one declarative table that
 * /api/db enforces before any query runs, using the service-role key.
 *
 * Reading this file should tell you the whole authorisation story. Four rules
 * govern it:
 *
 *   1. Absent means denied. A table with no entry for a role, or an action not
 *      listed, is refused — new tables are locked until someone opts them in.
 *   2. `select` lists the columns a role may read. A request for `*` expands to
 *      exactly that list; an explicit request is intersected with it, so a
 *      column that is not listed cannot come back even if it is asked for.
 *   3. `scope` is a mandatory row filter, ANDed onto whatever the caller sent.
 *      It is derived from the session — never from the request.
 *   4. `insert` / `update` list the writable columns and are strict: a write
 *      naming any other column is rejected rather than silently trimmed,
 *      because a write that half-happens is worse than one that fails.
 *
 * `force` pins column values on insert (a contact-form message cannot be filed
 * as outbound admin mail). `writeScope` narrows updates further than reads.
 * `returning` lists what a role with no read access may see of the row it just
 * wrote — usually just its id, so a form can confirm it saved without gaining
 * a way to read the table back.
 */

export const ROLES = ['anon', 'client', 'hca', 'admin'];

// ── Column sets ──────────────────────────────────────────────────────────────

// What a visitor to /match may see about an HCA. No email, no phone, no date of
// birth, no password, no application id.
const HCA_PUBLIC = [
  'id', 'employee_id', 'name', 'cert_level', 'years_exp', 'specialisations',
  'rate', 'status', 'rating', 'lat', 'lng', 'approved_at', 'gender', 'languages',
  'shift_preferences', 'period_preference', 'travel_options', 'bio', 'age_range',
  'available', 'review_count', 'placement_count', 'education', 'cultural_exp',
  'smartphone', 'location',
];

// A signed-in family additionally sees the care team's photo and how to reach
// them — they are the people coming into their home.
const HCA_FOR_CLIENT = [...HCA_PUBLIC, 'photo', 'mobile', 'email', 'journey_stage'];

// What an HCA may change about their own record. Deliberately only what the
// dashboard actually does: record a journey milestone, ask for their account to
// be deleted, and set how they present and how reachable they are.
//
// Not `rate` — that is E-Vive's commercial decision. Not `status`, `rating`,
// `employee_id`, `review_count` or `placement_count` — those are the platform's
// account of them, and a worker who could edit them could market themselves as
// something they are not. Not `email`, which is a sign-in identifier.
const HCA_SELF_WRITABLE = [
  'journey_stage', 'journey_dates',
  'deletion_requested', 'deletion_requested_at',
  'bio', 'languages', 'shift_preferences', 'period_preference', 'travel_options',
  'available', 'gender', 'age_range', 'photo', 'mobile', 'location', 'smartphone',
  'education', 'cultural_exp',
];

const CLIENT_SELF = [
  'id', 'name', 'email', 'mobile', 'location', 'address', 'patients',
  'journey_stage', 'journey_dates', 'visit_date', 'assigned_hca_id', 'status',
  'shortlisted_hcas', 'requested_hca_id', 'requested_hca_notes', 'requested_hca_at',
  'deletion_requested', 'deletion_requested_at', 'lat', 'lng', 'created_at',
];

// What an HCA may see about a family they are placed with: enough to do the
// work and reach them, and nothing about billing or account state.
const CLIENT_FOR_HCA = [
  'id', 'name', 'mobile', 'location', 'address', 'patients', 'assigned_hca_id',
];

// A family may edit their own contact details, their patients, their shortlist,
// and ask for an HCA. Not `status`, not `assigned_hca_id` (who is actually
// placed is an E-Vive decision, not a self-service field), not `password_hash`
// — that goes through /api/auth/change-password.
const CLIENT_SELF_WRITABLE = [
  'name', 'mobile', 'location', 'address', 'patients', 'shortlisted_hcas',
  'journey_stage', 'journey_dates', 'deletion_requested', 'deletion_requested_at',
  'requested_hca_id', 'requested_hca_notes', 'requested_hca_at', 'lat', 'lng',
];

const SHIFT_COLUMNS = [
  'id', 'hca_id', 'client_id', 'patient_id', 'date', 'type', 'start_time',
  'end_time', 'status', 'clock_in', 'clock_out', 'clock_in_lat', 'clock_in_lng',
  'notes', 'placement_id', 'linked_event_id', 'created_at',
];

const PLACEMENT_COLUMNS = [
  'id', 'client_id', 'patient_id', 'hca_id', 'start_date', 'end_date',
  'shift_type', 'rate_per_shift', 'status', 'notes', 'created_at', 'ended_at',
];

const INVOICE_COLUMNS = [
  'id', 'invoice_num', 'client_id', 'patient_id', 'placement_id', 'description',
  'line_items', 'subtotal', 'total', 'currency', 'due_date', 'issued_at',
  'created_at', 'status', 'paid_at', 'approved_by', 'payment_method', 'payment_ref',
];

const EVENT_PUBLIC = ['id', 'hca_id', 'date', 'type', 'title'];
const EVENT_FULL = [
  ...EVENT_PUBLIC, 'time', 'client_id', 'patient_id', 'shift_id', 'notes',
  'created_at', 'created_by',
];

const NOTIFICATION_COLUMNS = [
  'id', 'client_id', 'hca_id', 'type', 'subject', 'body', 'email_to', 'read', 'created_at',
];

const COURSE_COLUMNS = [
  'id', 'title', 'description', 'target', 'lessons', 'duration', 'level',
  'cover_emoji', 'status', 'created_at',
];

const ENROLLMENT_COLUMNS = [
  'id', 'user_id', 'user_type', 'course_id', 'progress_pct', 'completed_lessons',
  'completed_at', 'enrolled_at',
];

// Anything a non-admin submits lands as an inbound message in the admin inbox:
// contact-form enquiries, and the off-day / training / welfare requests HCAs
// raise. `direction`, `folder` and `status` are pinned below so a submission
// cannot be filed as outbound mail that appears to have come from E-Vive.
// `origin` is caller-set but bounded by the table's own check constraint.
const HUB_REFERRAL_INSERT = ['name', 'phone', 'email', 'message'];
const HUB_ACCESS_INSERT   = ['name', 'email', 'organisation', 'message'];

const LMS_SUBMISSION_INSERT = [
  'org_name', 'contact_email', 'course_title', 'description', 'content_url', 'target',
];

const CONTACT_INSERT = [
  'subject', 'from_address', 'from_name', 'to_addresses', 'body_text', 'metadata',
  'origin', 'related_hca_id', 'related_client_id',
];

const ALL = '*';   // admin: no column restriction

// ── The policy ───────────────────────────────────────────────────────────────

export const POLICY = {
  clients: {
    // The public "families served" counter, and nothing else: a count with no
    // rows returned.
    anon:   { allowCount: true },
    client: { select: CLIENT_SELF, update: CLIENT_SELF_WRITABLE, scope: selfId, allowCount: true },
    hca:    { select: CLIENT_FOR_HCA, scope: clientsLinkedToHca, allowCount: true },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  hca_profiles: {
    anon:   { select: HCA_PUBLIC, scope: activeOnly },
    client: { select: HCA_FOR_CLIENT, scope: activeOnly },
    // An HCA browses the directory on the same terms as a family, and may only
    // ever *change* their own row — hence the separate write scope. Reading
    // their own private fields (dob, certificates) goes through /api/hca/me.
    hca:    { select: HCA_FOR_CLIENT, scope: activeOnly, update: HCA_SELF_WRITABLE, writeScope: selfId },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  hca_applications: {
    // Applying and correcting an application both go through routes that
    // authenticate the act itself — /api/applications/create hashes the
    // password and runs the duplicate check, /api/applications/[token]
    // authenticates the emailed edit link. Neither is expressible as a role,
    // so the table is closed to everyone but Admin here.
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  placements: {
    client: { select: PLACEMENT_COLUMNS, scope: byClient },
    hca:    { select: PLACEMENT_COLUMNS, scope: byHca },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  shifts: {
    client: { select: SHIFT_COLUMNS, scope: byClient },
    // An HCA creates and closes their own shifts by clocking in and out.
    hca:    {
      select: SHIFT_COLUMNS, scope: byHca,
      insert: ['hca_id', 'client_id', 'patient_id', 'date', 'type', 'start_time', 'end_time', 'status', 'placement_id', 'notes'],
      update: ['status', 'clock_in', 'clock_out', 'clock_in_lat', 'clock_in_lng', 'notes', 'linked_event_id'],
      forceFromSession: { hca_id: 'id' },
    },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  invoices: {
    client: { select: INVOICE_COLUMNS, scope: byClient },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  calendar_events: {
    // /match shows a weekly availability rota. It needs who, when and what kind
    // — not which family, and not the notes.
    anon:   { select: EVENT_PUBLIC },
    client: { select: EVENT_FULL, scope: byClient },
    hca:    {
      select: EVENT_FULL, scope: byHca,
      insert: ['hca_id', 'title', 'date', 'time', 'type', 'notes'],
      forceFromSession: { hca_id: 'id' },
    },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  notifications: {
    client: {
      select: NOTIFICATION_COLUMNS,
      update: ['read'],
      insert: ['client_id', 'type', 'subject', 'body', 'email_to', 'read'],
      forceFromSession: { client_id: 'id' },
      scope: notificationsForClient,
      allowCount: true,
    },
    admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  invoices_count: null,   // placeholder guard: not a table, never resolvable

  emails: {
    anon:   { insert: CONTACT_INSERT, force: contactMessageDefaults(), returning: ['id', 'created_at'] },
    client: { insert: CONTACT_INSERT, force: contactMessageDefaults(), returning: ['id', 'created_at'] },
    // HCAs raise off-day and support requests, which land in the same inbox.
    hca:    { insert: CONTACT_INSERT, force: contactMessageDefaults(), returning: ['id', 'created_at'] },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  announcements: {
    client: { select: ['id', 'title', 'body', 'target', 'type', 'priority', 'created_at'], scope: announcementsFor('clients') },
    hca:    { select: ['id', 'title', 'body', 'target', 'type', 'priority', 'created_at'], scope: announcementsFor('hcas') },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  pricing_config: {
    anon:   { select: ALL },
    client: { select: ALL },
    hca:    { select: ALL },
    admin:  { select: ALL, insert: ALL, update: ALL, upsert: ALL, allowCount: true },
  },

  lms_courses: {
    anon:   { select: COURSE_COLUMNS },
    client: { select: COURSE_COLUMNS },
    hca:    { select: COURSE_COLUMNS },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  lms_enrollments: {
    client: {
      select: ENROLLMENT_COLUMNS, scope: enrollmentsForUser,
      insert: ['user_id', 'user_type', 'course_id', 'progress_pct', 'completed_lessons'],
      update: ['progress_pct', 'completed_lessons', 'completed_at'],
      forceFromSession: { user_id: 'id' },
    },
    hca: {
      select: ENROLLMENT_COLUMNS, scope: enrollmentsForUser,
      insert: ['user_id', 'user_type', 'course_id', 'progress_pct', 'completed_lessons'],
      update: ['progress_pct', 'completed_lessons', 'completed_at'],
      forceFromSession: { user_id: 'id' },
    },
    admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  lms_submissions: {
    // Partner organisations propose course content from the Family Hub.
    anon:   { insert: LMS_SUBMISSION_INSERT, force: { status: 'pending' }, returning: ['id'] },
    client: { insert: LMS_SUBMISSION_INSERT, force: { status: 'pending' }, returning: ['id'] },
    hca:    { insert: LMS_SUBMISSION_INSERT, force: { status: 'pending' }, returning: ['id'] },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  // The Family Hub's counselling-referral and partner-access forms are on the
  // same page for everyone, signed in or not.
  hub_referrals: {
    anon:   { insert: HUB_REFERRAL_INSERT, force: { status: 'new' }, returning: ['id'] },
    client: { insert: HUB_REFERRAL_INSERT, force: { status: 'new' }, returning: ['id'] },
    hca:    { insert: HUB_REFERRAL_INSERT, force: { status: 'new' }, returning: ['id'] },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  hub_access_requests: {
    anon:   { insert: HUB_ACCESS_INSERT, force: { status: 'pending' }, returning: ['id'] },
    client: { insert: HUB_ACCESS_INSERT, force: { status: 'pending' }, returning: ['id'] },
    hca:    { insert: HUB_ACCESS_INSERT, force: { status: 'pending' }, returning: ['id'] },
    admin:  { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true },
  },

  // Append-only audit trail: everyone may add to it, only admins may read it.
  activity_log: {
    anon:   { insert: ['type', 'data'], returning: ['id'] },
    client: { insert: ['type', 'data'], returning: ['id'] },
    hca:    { insert: ['type', 'data'], returning: ['id'] },
    admin:  { select: ALL, insert: ALL, allowCount: true },
  },

  // Admin-only tables.
  expenses:         { admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true } },
  payroll_payments: { admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true } },
  discount_codes:   { admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true } },
  newsletters:      { admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true } },
  map_markers:      { admin: { select: ALL, insert: ALL, update: ALL, delete: true, allowCount: true } },
  rbac_rules:       { admin: { select: ALL, insert: ALL, update: ALL, upsert: ALL, delete: true, allowCount: true } },
};

// Not a real table — guards against a typo above resolving to something.
delete POLICY.invoices_count;

// ── Scopes ───────────────────────────────────────────────────────────────────
// A scope returns a filter that is ANDed onto the caller's own filters. It may
// be async, so it can resolve "which rows is this HCA connected to" with a
// query of its own.

function selfId(session) {
  return { column: 'id', op: 'eq', value: session.id };
}

function byClient(session) {
  return { column: 'client_id', op: 'eq', value: session.id };
}

function byHca(session) {
  return { column: 'hca_id', op: 'eq', value: session.id };
}

function activeOnly() {
  return { column: 'status', op: 'in', value: ['active', 'approved'] };
}

function enrollmentsForUser(session) {
  return { column: 'user_id', op: 'eq', value: session.id };
}

/** Own notifications plus platform-wide broadcasts (client_id is null). */
function notificationsForClient(session) {
  return { or: `client_id.eq.${session.id},client_id.is.null` };
}

function announcementsFor(audience) {
  return () => ({ or: `target.eq.all,target.eq.${audience}` });
}

/**
 * The families an HCA is actually connected to: assigned to them, or sharing a
 * placement or a shift with them. Resolved server-side, so the HCA dashboard's
 * "look up the client on this shift" keeps working without handing every HCA
 * the whole client list.
 */
async function clientsLinkedToHca(session, db) {
  const ids = new Set();
  const [placements, shifts, assigned] = await Promise.all([
    db.from('placements').select('client_id').eq('hca_id', session.id),
    db.from('shifts').select('client_id').eq('hca_id', session.id),
    db.from('clients').select('id').eq('assigned_hca_id', session.id),
  ]);
  for (const r of placements.data || []) if (r.client_id) ids.add(r.client_id);
  for (const r of shifts.data || []) if (r.client_id) ids.add(r.client_id);
  for (const r of assigned.data || []) if (r.id) ids.add(r.id);
  // An empty IN list must match nothing, not everything.
  return { column: 'id', op: 'in', value: ids.size ? [...ids] : ['00000000-0000-0000-0000-000000000000'] };
}

function contactMessageDefaults() {
  return { direction: 'inbound', folder: 'inbox', status: 'received' };
}

// ── Resolution ───────────────────────────────────────────────────────────────

export function policyFor(table, role) {
  const entry = POLICY[table];
  if (!entry) return null;
  return entry[role] || null;
}

/**
 * Columns a role may read. `requested` is whatever the caller asked for;
 * anything outside the allowed set is dropped rather than returned. Returns
 * null when the role may not select at all.
 */
/**
 * What a write may read back, for a role that cannot otherwise read the table.
 * Returns null when the role may see nothing of what it just wrote.
 */
export function resolveReturning(rule, requested) {
  if (rule?.select) return resolveSelect(rule, requested);
  if (!rule?.returning) return null;
  return rule.returning.join(', ');
}

export function resolveSelect(rule, requested) {
  if (!rule?.select) return null;
  if (rule.select === ALL) return requested && requested !== '*' ? requested : '*';
  const allowed = rule.select;
  if (!requested || requested === '*') return allowed.join(', ');
  const asked = String(requested).split(',').map(c => c.trim()).filter(Boolean);
  const kept = asked.filter(c => allowed.includes(c));
  // `id` is how rows are addressed; without it a response is not usable.
  if (!kept.length) return null;
  if (allowed.includes('id') && !kept.includes('id')) kept.unshift('id');
  return kept.join(', ');
}

/**
 * Validate a write. Strict by design: a payload naming a column the role may
 * not set is rejected outright, so a write never half-happens.
 * Returns { ok: true, row } or { ok: false, error }.
 */
export function resolveWrite(rule, action, payload, session) {
  const allowed = rule?.[action];
  if (!allowed) return { ok: false, error: `Not permitted to ${action} this record.` };

  const rows = Array.isArray(payload) ? payload : [payload];
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') return { ok: false, error: 'Malformed payload.' };
    if (allowed !== ALL) {
      const forced = { ...(rule.force || {}) };
      for (const [col, field] of Object.entries(rule.forceFromSession || {})) forced[col] = session[field];
      const stray = Object.keys(row).filter(c => !allowed.includes(c) && !(c in forced));
      if (stray.length) return { ok: false, error: `Not permitted to set: ${stray.join(', ')}.` };
      out.push({ ...row, ...forced });
    } else {
      out.push({ ...row, ...(rule.force || {}) });
    }
  }
  return { ok: true, row: Array.isArray(payload) ? out : out[0] };
}

/**
 * The mandatory row filter for this action. Writes may be scoped more tightly
 * than reads — an HCA reads the whole active directory but may only ever change
 * their own row.
 */
export async function resolveScope(rule, session, db, action = 'select') {
  const isWrite = action === 'update' || action === 'upsert' || action === 'delete';
  const scope = (isWrite && rule?.writeScope) || rule?.scope;
  if (!scope) return null;
  return scope(session, db);
}
