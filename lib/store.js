/**
 * E-Vive Data Store — Supabase-backed async layer
 * All data functions are async. Session helpers stay synchronous (localStorage tokens only).
 */

import { supabase } from './supabase';

// ─── Journey stages ───────────────────────────────────────────────────────────
export const JOURNEY_STAGES = [
  'account_created','tc_accepted','acknowledged','call_made',
  'visit_scheduled','visit_done','hca_matched','payment_pending',
  'payment_confirmed','placement_active',
];
export const JOURNEY_LABELS = {
  account_created:   'Account Created',
  tc_accepted:       'T&Cs Accepted',
  acknowledged:      'Acknowledged',
  call_made:         'Call Made',
  visit_scheduled:   'Visit Scheduled',
  visit_done:        'Visit Completed',
  hca_matched:       'HCA Matched',
  payment_pending:   'Payment Pending',
  payment_confirmed: 'Payment Confirmed',
  placement_active:  'Placement Active',
};

// HCA journey — spans the application record (pre-approval) then the
// profile record (post-approval); the dashboard reads both to render one
// continuous timeline.
export const HCA_JOURNEY_STAGES = [
  'application_submitted', 'tc_accepted', 'under_review',
  'approved', 'account_activated', 'placement_assigned',
];
export const HCA_JOURNEY_LABELS = {
  application_submitted: 'Application Submitted',
  tc_accepted:            'T&Cs Accepted',
  under_review:           'Under Review',
  approved:               'Approved',
  account_activated:      'Account Activated',
  placement_assigned:     'Placement Assigned',
};

// ─── RBAC constants ───────────────────────────────────────────────────────────
export const ROLE_DEFAULTS = {
  super_admin:        { label:'Super Admin',         permissions:['all'] },
  finance_admin:      { label:'Finance Admin',        permissions:['finance','overview'] },
  client_coordinator: { label:'Client Coordinator',  permissions:['clients','calendar','overview'] },
  hca_manager:        { label:'HCA Account Manager', permissions:['hcas','calendar','overview'] },
  hr_admin:           { label:'HR / Training Admin', permissions:['training','calendar','hcas','overview'] },
};
export const ALL_PERMISSIONS = [
  { key:'overview',  label:'Overview / Dashboard'  },
  { key:'hcas',      label:'HCA Management'         },
  { key:'clients',   label:'Client Management'      },
  { key:'quality',   label:'Care Quality'           },
  { key:'training',  label:'Training'               },
  { key:'calendar',  label:'Calendar / HR'          },
  { key:'finance',   label:'Finance'                },
  { key:'settings',  label:'Settings / RBAC'        },
];

// ─── Row mappers (DB snake_case → JS camelCase) ───────────────────────────────
function clientFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, name: r.name, email: r.email, mobile: r.mobile,
    password: r.password_hash,
    location: r.location, address: r.address,
    patients: r.patients || [],
    journeyStage: r.journey_stage,
    journeyDates: r.journey_dates || {},
    visitDate: r.visit_date,
    assignedHcaId: r.assigned_hca_id,
    shortlistedHcas: r.shortlisted_hcas || [],
    requestedHcaId: r.requested_hca_id,
    requestedHcaNotes: r.requested_hca_notes,
    requestedHcaAt: r.requested_hca_at,
    status: r.status, lat: r.lat, lng: r.lng,
    deletionRequested: r.deletion_requested,
    deletionRequestedAt: r.deletion_requested_at,
    createdAt: r.created_at,
  };
}

function hcaAppFromDb(r) {
  if (!r) return null;
  const fd = r.form_data || {};
  return {
    id: r.id, status: r.status, appliedAt: r.applied_at,
    fullName: r.full_name, name: r.full_name,
    email: r.email, password: r.password, mobile: r.mobile,
    homeLat: fd.homeLat || null, homeLng: fd.homeLng || null, county: r.county,
    certLevel: r.cert_level, yearsExp: r.years_exp,
    specialisations: r.specialisations || [],
    plan: r.plan, bio: r.bio,
    formData: fd,
    editToken: r.edit_token || null,
    journeyStage: r.journey_stage || 'application_submitted',
    journeyDates: r.journey_dates || {},
  };
}

function hcaProfileFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, applicationId: r.application_id,
    employeeId: r.employee_id,
    name: r.name, email: r.email, password: r.password, mobile: r.mobile,
    certLevel: r.cert_level, yearsExp: r.years_exp,
    specialisations: r.specialisations || [],
    rate: r.rate, rateSetAt: r.rate_set_at,
    status: r.status, rating: r.rating,
    lat: r.lat, lng: r.lng,
    deletionRequested: r.deletion_requested,
    deletionRequestedAt: r.deletion_requested_at,
    approvedAt: r.approved_at,
    gender: r.gender || 'Not specified',
    languages: r.languages || ['English','Kiswahili'],
    shiftPreferences: r.shift_preferences || ['Day Shift'],
    periodPreference: r.period_preference || 'Long Term (2+ wks)',
    travelOptions: r.travel_options || ['Local Travel'],
    bio: r.bio || '',
    ageRange: r.age_range || '',
    available: r.available !== false,
    rating: r.rating || 0,
    reviewCount: r.review_count || 0,
    placementCount: r.placement_count || 0,
    dob: r.dob || null,
    photo: r.photo || null,
    certifications: r.certifications || [],
    education: r.education || '',
    culturalExp: r.cultural_exp || '',
    smartphone: r.smartphone || '',
    location: r.location || '',
    journeyStage: r.journey_stage || 'approved',
    journeyDates: r.journey_dates || {},
  };
}

function placementFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, clientId: r.client_id, patientId: r.patient_id,
    hcaId: r.hca_id, startDate: r.start_date, endDate: r.end_date,
    ratePerShift: r.rate_per_shift, status: r.status, createdAt: r.created_at,
  };
}

function shiftFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, placementId: r.placement_id,
    hcaId: r.hca_id, clientId: r.client_id, patientId: r.patient_id,
    date: r.date, type: r.type, startTime: r.start_time,
    status: r.status,
    clockIn: r.clock_in, clockOut: r.clock_out,
    clockInLat: r.clock_in_lat, clockInLng: r.clock_in_lng,
    clockOutLat: r.clock_out_lat, clockOutLng: r.clock_out_lng,
    notes: r.notes, linkedEventId: r.linked_event_id,
    createdAt: r.created_at,
  };
}

function cardexFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, shiftId: r.shift_id,
    hcaId: r.hca_id, patientId: r.patient_id, clientId: r.client_id,
    submittedAt: r.submitted_at, date: r.submitted_at,
    vitals: r.vitals || {}, medications: r.medications || [],
    intakes: r.intakes || [], nutrition: r.nutrition || {},
    hygiene: r.hygiene || {}, mobility: r.mobility || {},
    elimination: r.elimination || {}, mentalState: r.mental_state || {},
    incidents: r.incidents, handover: r.handover,
    shiftRating: r.shift_rating,
    specialNeedsChecks: r.special_needs_checks || [],
    flagged: r.flagged, qaComments: r.qa_comments || [],
    welfareNote: r.welfare_note,
  };
}

function invoiceFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, invoiceNum: r.invoice_num,
    clientId: r.client_id, patientId: r.patient_id, placementId: r.placement_id,
    description: r.description, lineItems: r.line_items || [],
    subtotal: r.subtotal, total: r.total, currency: r.currency,
    dueDate: r.due_date, issuedAt: r.issued_at, createdAt: r.created_at,
    status: r.status, paidAt: r.paid_at, approvedBy: r.approved_by,
  };
}

function eventFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, title: r.title, date: r.date, time: r.time, type: r.type,
    clientId: r.client_id, hcaId: r.hca_id, patientId: r.patient_id,
    shiftId: r.shift_id, notes: r.notes,
    createdAt: r.created_at, createdBy: r.created_by,
  };
}

function notifFromDb(r) {
  if (!r) return null;
  return {
    id: r.id, clientId: r.client_id, hcaId: r.hca_id,
    type: r.type, subject: r.subject, body: r.body,
    emailTo: r.email_to, read: r.read, createdAt: r.created_at,
  };
}

function emailFromDb(r) {
  if (!r) return null;
  return {
    id: r.id,
    direction: r.direction,
    origin: r.origin,
    folder: r.folder,
    status: r.status,
    subject: r.subject || '',
    fromAddress: r.from_address,
    fromName: r.from_name,
    toAddresses: r.to_addresses || [],
    ccAddresses: r.cc_addresses || [],
    replyTo: r.reply_to,
    bodyText: r.body_text || '',
    bodyHtml: r.body_html,
    resendMessageId: r.resend_message_id,
    threadId: r.thread_id,
    relatedClientId: r.related_client_id,
    relatedHcaId: r.related_hca_id,
    adminId: r.admin_id,
    read: !!r.read,
    starred: !!r.starred,
    metadata: r.metadata || {},
    createdAt: r.created_at,
    sentAt: r.sent_at,
    deletedAt: r.deleted_at,
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const a = new Uint32Array(2); crypto.getRandomValues(a);
    return Date.now().toString(36) + a[0].toString(36) + a[1].toString(36);
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// localStorage helpers (only for session tokens — not data)
function lsGet(key) {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(val));
}
function lsDel(key) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ─── Activity log ─────────────────────────────────────────────────────────────
export async function logActivity(entry) {
  try {
    const { type: entryType, ...rest } = entry;
    await supabase.from('activity_log').insert({ type: entryType, data: rest });
  } catch { /* non-critical */ }
}

export async function getActivityLog() {
  const { data } = await supabase
    .from('activity_log').select('*')
    .order('created_at', { ascending: false }).limit(500);
  return (data || []).map(r => ({ id: r.id, timestamp: r.created_at, type: r.type, ...r.data }));
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
export async function getAllClients() {
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  return (data || []).map(clientFromDb);
}

export async function getClientByEmail(email) {
  const { data } = await supabase.from('clients').select('*').eq('email', email).maybeSingle();
  return clientFromDb(data);
}

export async function getClientById(id) {
  const { data } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  return clientFromDb(data);
}

export async function createClient({ name, email, mobile, password, location, address, patients = [] }) {
  const existing = await getClientByEmail(email);
  if (existing) throw new Error('An account with this email already exists.');
  const seededPatients = patients.map(p => ({ id: uid(), ...p }));
  const { data, error } = await supabase.from('clients').insert({
    name, email, mobile: mobile || '',
    password_hash: password || '',
    location: location || '', address: address || '',
    patients: seededPatients,
    journey_stage: 'account_created',
    journey_dates: { account_created: new Date().toISOString() },
    status: 'active',
  }).select().single();
  if (error) throw new Error(error.message);
  // legacy registry (still write so old login code works during transition)
  const reg = lsGet('evive_client_registry') || [];
  reg.push({ name, email, mobile, password });
  lsSet('evive_client_registry', reg);
  await logActivity({ type: 'client_registered', clientId: data.id, clientName: name, email });
  return clientFromDb(data);
}

export async function updateClient(id, patch) {
  const map = {
    name:'name', email:'email', mobile:'mobile', password:'password_hash',
    location:'location', address:'address', patients:'patients',
    journeyStage:'journey_stage', journeyDates:'journey_dates',
    visitDate:'visit_date', assignedHcaId:'assigned_hca_id',
    shortlistedHcas:'shortlisted_hcas', requestedHcaId:'requested_hca_id',
    requestedHcaNotes:'requested_hca_notes', requestedHcaAt:'requested_hca_at',
    status:'status', lat:'lat', lng:'lng',
    deletionRequested:'deletion_requested', deletionRequestedAt:'deletion_requested_at',
  };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('clients').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return clientFromDb(data);
}

export async function advanceClientJourney(clientId, stage, meta = {}) {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  const patch = {
    journeyStage: stage,
    journeyDates: { ...client.journeyDates, [stage]: new Date().toISOString() },
  };
  if (meta.visitDate)     patch.visitDate     = meta.visitDate;
  if (meta.assignedHcaId) patch.assignedHcaId = meta.assignedHcaId;
  const updated = await updateClient(clientId, patch);
  await logActivity({ type: `journey_${stage}`, clientId, clientName: client.name, ...meta });
  return updated;
}

// ── Client sessions (localStorage — ephemeral) ────────────────────────────────
export function setClientSession(client) {
  lsSet('evive_client_session', { id:client.id, name:client.name, email:client.email, mobile:client.mobile });
}
export function getClientSession() { return lsGet('evive_client_session'); }
export function clearClientSession() { lsDel('evive_client_session'); }

export async function authenticateClient(email, password) {
  const client = await getClientByEmail(email);
  if (!client) return null;
  if (client.password !== password) return null;
  return client;
}

// ── Patient management (embedded JSONB in clients) ────────────────────────────
export async function addPatientToClient(clientId, patientData) {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  const patients = [...(client.patients || []), { id: uid(), ...patientData }];
  const updated = await updateClient(clientId, { patients });
  await logActivity({ type: 'patient_added', clientId, clientName: client.name, patientName: patientData.name });
  return updated;
}

export async function updatePatient(clientId, patientId, patch) {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  const patients = (client.patients || []).map(p => p.id === patientId ? { ...p, ...patch } : p);
  return updateClient(clientId, { patients });
}

export async function removePatient(clientId, patientId) {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  const patients = (client.patients || []).filter(p => p.id !== patientId);
  return updateClient(clientId, { patients });
}

export async function toggleHcaShortlist(clientId, hcaId) {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  const list = client.shortlistedHcas || [];
  const shortlistedHcas = list.includes(hcaId) ? list.filter(id => id !== hcaId) : [...list, hcaId];
  const updated = await updateClient(clientId, { shortlistedHcas });
  await logActivity({ type: 'hca_shortlisted', clientId, hcaId });
  return updated;
}

export async function requestHcaMatch(clientId, hcaId, notes = '') {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  const updated = await updateClient(clientId, {
    requestedHcaId: hcaId, requestedHcaNotes: notes,
    requestedHcaAt: new Date().toISOString(),
  });
  await logActivity({ type: 'hca_requested', clientId, clientName: client.name, hcaId });
  return updated;
}

export async function requestAccountDeletion(clientId) {
  const client = await getClientById(clientId);
  if (!client) throw new Error('Client not found');
  if (client.deletionRequested) return client;
  const updated = await updateClient(clientId, {
    deletionRequested: true, deletionRequestedAt: new Date().toISOString(),
  });
  await logActivity({ type: 'deletion_requested', clientId, clientName: client.name });
  await createNotification({
    clientId, type: 'deletion_request', subject: 'Account Deletion Request Received',
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nWe have received your request to close your E-Vive account.\n\nOur team will review your request and contact you within 2 business days.\n\n📧 hello@e-vive.co.ke  📞 +254 141 888 340\n\nWarm regards,\nThe E-Vive Team`,
  });
  return updated;
}

export async function deleteClient(id) {
  const client = await getClientById(id);
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({ type: 'client_deleted', clientId: id, clientName: client?.name });
}

// ─── HCA APPLICATIONS ─────────────────────────────────────────────────────────
// List views never need form_data — it holds base64-encoded certificate/photo
// uploads that can be several MB per row, and pulling that for every
// application is what was blowing the statement timeout on a plain SELECT *.
const HCA_APPLICATION_LIST_COLUMNS = 'id, status, applied_at, full_name, email, password, mobile, county, cert_level, years_exp, specialisations, plan, bio';

// Kenyan-number-aware normalization so "0722...", "+254722...", "254722..."
// and "722..." all compare equal for duplicate detection.
function normalizeMobile(m) {
  if (!m) return '';
  const digits = String(m).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return '254' + digits.slice(1);
  if (digits.length === 9) return '254' + digits;
  return digits;
}
function normalizeEmail(e) { return (e || '').trim().toLowerCase(); }

export async function getAllHcaApplications() {
  const { data, error } = await supabase.from('hca_applications').select(HCA_APPLICATION_LIST_COLUMNS).order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(hcaAppFromDb);
}

export async function getHcaApplicationById(id) {
  const { data, error } = await supabase.from('hca_applications').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return hcaAppFromDb(data);
}

// Blocks a new application when the email or mobile already belongs to a
// non-rejected application or an existing HCA profile. Rejected applicants
// are allowed to reapply. Comparisons use normalized values so formatting
// differences (0722… vs +254722… vs 254722…) don't let duplicates through.
async function findDuplicateHcaApplicant(email, mobile) {
  const normEmail = normalizeEmail(email);
  const normMobile = normalizeMobile(mobile);
  if (!normEmail && !normMobile) return null;

  const [{ data: apps }, { data: profiles }] = await Promise.all([
    supabase.from('hca_applications').select('id,status,email,mobile'),
    supabase.from('hca_profiles').select('id,email,mobile'),
  ]);

  const matches = (row) =>
    (normEmail && normalizeEmail(row.email) === normEmail) ||
    (normMobile && normalizeMobile(row.mobile) === normMobile);

  const dupProfile = (profiles || []).find(matches);
  if (dupProfile) return { kind: 'profile', row: dupProfile };

  const dupApp = (apps || []).find(a => a.status !== 'rejected' && matches(a));
  if (dupApp) return { kind: 'application', row: dupApp };

  return null;
}

export async function createHcaApplication(formData) {
  const { fullName, name, email, password, mobile, homeLat, homeLng, county,
          certLevel, yearsExp, specialisations, plan, bio, tcAccepted, ...rest } = formData;

  const dup = await findDuplicateHcaApplicant(email, mobile);
  if (dup) {
    if (dup.kind === 'profile') {
      throw new Error('An HCA account with this email or mobile number already exists. Please log in instead of applying again.');
    }
    throw new Error(dup.row.status === 'pending'
      ? 'An application with this email or mobile number is already pending review. Please wait for our team to respond before submitting again.'
      : 'This email or mobile number is already registered as an approved HomeCare Assistant.');
  }

  const now = new Date().toISOString();
  const journeyDates = tcAccepted ? { application_submitted: now, tc_accepted: now } : { application_submitted: now };

  const { data, error } = await supabase.from('hca_applications').insert({
    status: 'pending',
    full_name: fullName || name || '',
    email: email || '', password: password || '',
    mobile: mobile || '',
    county: county || '', cert_level: certLevel || '',
    years_exp: yearsExp || 0,
    specialisations: specialisations || [],
    plan: plan || 'Review and Listing Fee', bio: bio || '',
    form_data: { ...rest, homeLat: homeLat || null, homeLng: homeLng || null },
    journey_stage: tcAccepted ? 'tc_accepted' : 'application_submitted',
    journey_dates: journeyDates,
  }).select().single();
  if (error) {
    // Belt-and-braces backstop for the findDuplicateHcaApplicant check above:
    // that check-then-insert isn't atomic, so two near-simultaneous
    // submissions (double-click, duplicate tabs) can both pass it before
    // either row lands. The DB-level partial unique index on active
    // (non-rejected) applications' email catches what the race lets through.
    if (error.code === '23505') {
      throw new Error('An application with this email address is already pending review or already an approved HomeCare Assistant. Please wait for our team to respond, or log in if you are already approved.');
    }
    throw new Error(error.message);
  }
  await logActivity({ type: 'hca_applied', hcaName: fullName || name, email });
  return hcaAppFromDb(data);
}

export async function advanceHcaApplicationJourney(applicationId, stage) {
  const app = await getHcaApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  if (HCA_JOURNEY_STAGES.indexOf(stage) <= HCA_JOURNEY_STAGES.indexOf(app.journeyStage)) return app;
  const { data, error } = await supabase.from('hca_applications').update({
    journey_stage: stage,
    journey_dates: { ...app.journeyDates, [stage]: new Date().toISOString() },
  }).eq('id', applicationId).select().single();
  if (error) throw new Error(error.message);
  return hcaAppFromDb(data);
}

// One-off repair for applications inserted before `status` was explicitly
// set on write — they exist (and log to Recent Activity) but never enter the
// Pending Applications queue because their status column is empty.
export async function repairHcaApplicationStatuses() {
  const { data, error } = await supabase
    .from('hca_applications')
    .update({ status: 'pending' })
    .or('status.is.null,status.eq.')
    .select();
  if (error) throw new Error(error.message);
  const count = data?.length || 0;
  if (count) await logActivity({ type: 'hca_applications_repaired', count });
  return count;
}

export function generateInitialPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export async function updateHcaApplication(id, patch) {
  const map = {
    status:'status', fullName:'full_name', email:'email', mobile:'mobile',
    certLevel:'cert_level', yearsExp:'years_exp', specialisations:'specialisations',
    county:'county', plan:'plan', bio:'bio', formData:'form_data', editToken:'edit_token',
    journeyStage:'journey_stage', journeyDates:'journey_dates',
  };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('hca_applications').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return hcaAppFromDb(data);
}

export async function deleteHcaApplication(id) {
  const { error } = await supabase.from('hca_applications').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({ type: 'hca_application_deleted', applicationId: id });
}

// ── Applicant self-service edit access ─────────────────────────────────────
// Admin can unlock specific fields (including photo/certificates) for the
// applicant to correct themselves via a tokenized link, instead of the
// informal "email us the file" workaround. No schema change needed — the
// grant lives inside the existing form_data JSONB column.
export const HCA_APPLICATION_EDITABLE_FIELDS = [
  { key: 'fullName',        label: 'Full Name' },
  { key: 'email',            label: 'Email Address' },
  { key: 'mobile',           label: 'Mobile Number' },
  { key: 'county',           label: 'County' },
  { key: 'certLevel',        label: 'Certificate Level' },
  { key: 'yearsExp',         label: 'Years of Experience' },
  { key: 'bio',               label: 'Bio' },
  { key: 'specialisations',  label: 'Specialisations' },
  { key: 'profilePhoto',     label: 'Profile Photo' },
  { key: 'certifications',   label: 'Certificates' },
];
const APPLICATION_FIELD_LABELS = Object.fromEntries(HCA_APPLICATION_EDITABLE_FIELDS.map(f => [f.key, f.label]));

export async function enableApplicationEdit(applicationId, { fields = [], note = '', adminId = 'admin' } = {}) {
  const app = await getHcaApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  const token = uid();
  const editAccess = {
    fields, note,
    grantedAt: new Date().toISOString(), grantedBy: adminId,
    submitted: false,
  };
  // The token itself lives in its own indexed column (edit_token), not
  // inside form_data — filtering on a JSON path buried in the same column
  // that holds base64 certificate/photo blobs forces a full sequential scan
  // reading every row's form_data, which is exactly what caused the
  // statement-timeout bug this table already hit once before.
  const updated = await updateHcaApplication(applicationId, { formData: { ...app.formData, editAccess }, editToken: token });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://e-vive.co.ke';
  const link = `${origin}/hca/apply/edit/${token}`;
  const fieldLabels = fields.map(f => APPLICATION_FIELD_LABELS[f] || f).join(', ') || '(none selected)';
  const safeName = (app.fullName || app.name || 'Applicant').split(' ')[0];
  const subject = 'Action Needed — Update Your E-Vive Application';
  const body = `Dear ${safeName},\n\nOur team reviewed your HomeCare Assistant application and needs you to update the following before we can proceed:\n\n${fieldLabels}\n${note ? `\nNote from our team: ${note}\n` : ''}\nPlease use this secure link to make the updates yourself — no need to email us documents:\n\n${link}\n\nThis link is unique to your application. Once you submit your updates, our team will review them again.\n\nThe E-Vive Team\n+254 141 888 340 | hello@e-vive.co.ke`;
  try { await dispatchEmail(app.email, subject, body); } catch (_) { /* non-critical */ }

  await logActivity({ type: 'hca_application_edit_enabled', applicationId, hcaName: app.fullName, fields });
  return updated;
}

export async function getHcaApplicationByEditToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .from('hca_applications')
    .select('*')
    .eq('edit_token', token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return hcaAppFromDb(data);
}

export async function submitApplicationEdit(token, patch = {}) {
  const app = await getHcaApplicationByEditToken(token);
  if (!app) throw new Error('This edit link is invalid or has expired.');
  const editAccess = app.formData?.editAccess;
  if (!editAccess) throw new Error('This edit link is invalid or has expired.');

  const allowed = editAccess.fields || [];
  const dbPatch = { editToken: null }; // single-use — invalidate immediately
  for (const key of ['fullName', 'email', 'mobile', 'county', 'certLevel', 'bio', 'specialisations']) {
    if (allowed.includes(key) && patch[key] !== undefined) dbPatch[key] = patch[key];
  }
  if (allowed.includes('yearsExp') && patch.yearsExp !== undefined) dbPatch.yearsExp = Number(patch.yearsExp) || 0;

  const newFormData = { ...app.formData };
  if (allowed.includes('profilePhoto') && patch.profilePhoto !== undefined) newFormData.profilePhoto = patch.profilePhoto;
  if (allowed.includes('certifications') && patch.certifications !== undefined) newFormData.certifications = patch.certifications;
  newFormData.editAccess = { ...editAccess, submitted: true, submittedAt: new Date().toISOString() };
  dbPatch.formData = newFormData;

  const updated = await updateHcaApplication(app.id, dbPatch);
  await logActivity({ type: 'hca_application_edited', applicationId: app.id, hcaName: dbPatch.fullName || app.fullName, fields: allowed });
  return updated;
}

// ─── HCA PROFILES ────────────────────────────────────────────────────────────
// List views (admin table, /match browse, login lookup, shift/calendar name
// joins, newsletter counts...) never need `photo` or `certifications` — both
// can hold several MB of base64 file data per row, and this function is
// called from most pages in the app. Pulling that for every row on every
// load is exactly what caused the statement-timeout bugs already fixed on
// hca_applications; excluding them here keeps every one of those call sites
// fast without changing behaviour, since none of them render a photo or
// certificate list from this data. Anywhere that genuinely needs those two
// columns (the HCA's own dashboard, Admin's Edit HCA modal) already fetches
// the single full row via getHcaProfileById instead.
const HCA_PROFILE_LIST_COLUMNS = 'id, application_id, employee_id, name, email, password, mobile, cert_level, years_exp, specialisations, rate, rate_set_at, status, rating, lat, lng, deletion_requested, deletion_requested_at, approved_at, gender, languages, shift_preferences, period_preference, travel_options, bio, age_range, available, review_count, placement_count, dob, education, cultural_exp, smartphone, location, journey_stage, journey_dates';

export async function getAllHcaProfiles() {
  const { data, error } = await supabase.from('hca_profiles').select(HCA_PROFILE_LIST_COLUMNS).order('approved_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(hcaProfileFromDb);
}

export async function getHcaProfileById(id) {
  const { data } = await supabase.from('hca_profiles').select('*').eq('id', id).maybeSingle();
  return hcaProfileFromDb(data);
}

export async function getHcaProfileByEmail(email) {
  const { data } = await supabase.from('hca_profiles').select('*').eq('email', email).maybeSingle();
  return hcaProfileFromDb(data);
}

export async function createHcaProfile(data) {
  // Derive the next employee ID from the highest existing numeric suffix
  // rather than the row count — after any profile is deleted, count-based
  // numbering regenerates an ID that already belongs to a surviving row,
  // tripping the hca_profiles_employee_id_key unique constraint.
  const { data: existingIds } = await supabase.from('hca_profiles').select('employee_id');
  let maxNum = 1000;
  for (const row of existingIds || []) {
    const m = /^HCA-(\d+)$/.exec(row.employee_id || '');
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  const empId = `HCA-${maxNum + 1}`;
  const { applicationId, name, email, password, mobile, certLevel, yearsExp,
          specialisations, rate, rateSetAt,
          gender, languages, shiftPreferences, periodPreference, travelOptions,
          bio, ageRange, ...rest } = data;

  // Carry the application-phase journey and submitted info (DOB, photo,
  // certificates, education, etc.) forward onto the new profile — these
  // otherwise only ever lived in the application's form_data and vanished
  // the moment it was approved (or later deleted as test/duplicate cleanup).
  const sourceApp = applicationId ? await getHcaApplicationById(applicationId) : null;
  const fd = sourceApp?.formData || {};
  const now = new Date().toISOString();
  const journeyDates = { ...(sourceApp?.journeyDates || {}), approved: now };
  const certifications = (fd.certifications || []).map(c => ({
    name: c.name || '', issuer: c.issuer || '', year: c.year || '',
    fileName: c.fileName || null, fileType: c.fileType || null, fileDataUrl: c.fileDataUrl || null,
  }));

  const { data: row, error } = await supabase.from('hca_profiles').insert({
    application_id: applicationId,
    employee_id: empId,
    name: name || '', email: email || '', password: password || '',
    mobile: mobile || '', cert_level: certLevel || '',
    years_exp: yearsExp || 0, specialisations: specialisations || [],
    rate: rate || 2000, rate_set_at: rateSetAt || new Date().toISOString(),
    status: 'active',
    gender: gender || 'Not specified',
    languages: languages || ['English','Kiswahili'],
    shift_preferences: shiftPreferences || ['Day Shift'],
    period_preference: periodPreference || 'Long Term (2+ wks)',
    travel_options: travelOptions || ['Local Travel'],
    bio: bio || '',
    age_range: ageRange || '',
    available: true,
    rating: 0,
    review_count: 0,
    placement_count: 0,
    journey_stage: 'approved',
    journey_dates: journeyDates,
    dob: fd.dob || null,
    photo: fd.profilePhoto?.fileDataUrl || null,
    certifications,
    education: fd.education || '',
    cultural_exp: fd.culturalExp || '',
    smartphone: fd.smartphone || '',
    location: fd.address || sourceApp?.county || '',
    lat: rest.lat ?? fd.homeLat ?? null,
    lng: rest.lng ?? fd.homeLng ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'hca_approved', hcaId: row.id, name: row.name, employeeId: empId });
  return hcaProfileFromDb(row);
}

export async function advanceHcaJourney(hcaId, stage) {
  const profile = await getHcaProfileById(hcaId);
  if (!profile) throw new Error('HCA profile not found');
  if (HCA_JOURNEY_STAGES.indexOf(stage) <= HCA_JOURNEY_STAGES.indexOf(profile.journeyStage)) return profile;
  const { data, error } = await supabase.from('hca_profiles').update({
    journey_stage: stage,
    journey_dates: { ...profile.journeyDates, [stage]: new Date().toISOString() },
  }).eq('id', hcaId).select().single();
  if (error) throw new Error(error.message);
  return hcaProfileFromDb(data);
}

// One-off repair for HCAs approved before createHcaProfile carried the
// application's dob/photo/certificates/education/culturalExp/smartphone/
// location/lat/lng forward (see 0004/0006 migrations) — that data still
// sits untouched in their original application's form_data and just needs
// copying across. Only fills fields that are currently empty, so it never
// overwrites anything already corrected by Admin or the HCA themselves.
export async function backfillHcaProfilesFromApplications() {
  // Needs the full row (photo/certifications included) to correctly detect
  // what's already set vs. missing — getAllHcaProfiles() deliberately omits
  // those columns for speed, which would make this always think they're
  // empty and re-overwrite them from the application every run.
  const { data, error } = await supabase.from('hca_profiles').select('*');
  if (error) throw new Error(error.message);
  const profiles = (data || []).map(hcaProfileFromDb);
  let count = 0;
  for (const p of profiles) {
    if (!p.applicationId) continue;
    const app = await getHcaApplicationById(p.applicationId);
    if (!app) continue;
    const fd = app.formData || {};
    const patch = {};
    if (!p.dob && fd.dob) patch.dob = fd.dob;
    if (!p.photo && fd.profilePhoto?.fileDataUrl) patch.photo = fd.profilePhoto.fileDataUrl;
    if ((!p.certifications || p.certifications.length === 0) && (fd.certifications || []).length) {
      patch.certifications = fd.certifications.map(c => ({
        name: c.name || '', issuer: c.issuer || '', year: c.year || '',
        fileName: c.fileName || null, fileType: c.fileType || null, fileDataUrl: c.fileDataUrl || null,
      }));
    }
    if (!p.education && fd.education) patch.education = fd.education;
    if (!p.culturalExp && fd.culturalExp) patch.culturalExp = fd.culturalExp;
    if (!p.smartphone && fd.smartphone) patch.smartphone = fd.smartphone;
    if (!p.location && (fd.address || app.county)) patch.location = fd.address || app.county;
    if (!p.lat && fd.homeLat) patch.lat = fd.homeLat;
    if (!p.lng && fd.homeLng) patch.lng = fd.homeLng;
    if (Object.keys(patch).length === 0) continue;
    await updateHcaProfile(p.id, patch);
    count++;
  }
  if (count) await logActivity({ type: 'hca_profiles_backfilled', count });
  return count;
}

export async function updateHcaProfile(id, patch) {
  const map = {
    name:'name', email:'email', password:'password', mobile:'mobile',
    certLevel:'cert_level', yearsExp:'years_exp', specialisations:'specialisations',
    rate:'rate', rateSetAt:'rate_set_at', status:'status', rating:'rating',
    lat:'lat', lng:'lng', deletionRequested:'deletion_requested',
    deletionRequestedAt:'deletion_requested_at',
    gender:'gender', languages:'languages', shiftPreferences:'shift_preferences',
    periodPreference:'period_preference', travelOptions:'travel_options', bio:'bio',
    ageRange:'age_range', available:'available', rating:'rating',
    reviewCount:'review_count', placementCount:'placement_count',
    journeyStage:'journey_stage', journeyDates:'journey_dates',
    dob:'dob', photo:'photo', certifications:'certifications',
    education:'education', culturalExp:'cultural_exp', smartphone:'smartphone',
    location:'location',
  };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('hca_profiles').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return hcaProfileFromDb(data);
}

export async function deleteHcaProfile(id) {
  const profile = await getHcaProfileById(id);
  // Shifts, cardex entries, placements etc. all carry a foreign key back to
  // this profile — deleting it outright fails with a foreign key violation
  // while those rows still exist. Detach/clean them up first — these seven
  // cleanup queries touch unrelated tables, so run them concurrently rather
  // than one round-trip at a time.
  await Promise.all([
    supabase.from('shifts').delete().eq('hca_id', id),
    supabase.from('cardex_entries').delete().eq('hca_id', id),
    supabase.from('placements').delete().eq('hca_id', id),
    supabase.from('calendar_events').delete().eq('hca_id', id),
    supabase.from('payroll_payments').delete().eq('hca_id', id),
    supabase.from('notifications').delete().eq('hca_id', id),
    supabase.from('clients').update({ assigned_hca_id: null }).eq('assigned_hca_id', id),
    supabase.from('clients').update({ requested_hca_id: null }).eq('requested_hca_id', id),
  ]);
  const { error } = await supabase.from('hca_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({ type: 'hca_profile_deleted', hcaId: id, name: profile?.name, employeeId: profile?.employeeId });
}

export async function requestHcaDeletion(hcaId) {
  const profile = await getHcaProfileById(hcaId);
  if (!profile) throw new Error('HCA profile not found');
  if (profile.deletionRequested) return profile;
  return updateHcaProfile(hcaId, { deletionRequested:true, deletionRequestedAt:new Date().toISOString() });
}

// Suspend an already-approved HCA (non-compliant docs, pending re-verification,
// etc.) with a logged reason, distinct from the plain active/inactive
// availability toggle. Reinstate brings them back to active.
export async function suspendHcaProfile(hcaId, reason = '', adminId = 'admin') {
  const updated = await updateHcaProfile(hcaId, { status: 'suspended' });
  await logActivity({ type: 'hca_profile_suspended', hcaId, reason, adminId });
  return updated;
}
export async function reinstateHcaProfile(hcaId, adminId = 'admin') {
  const updated = await updateHcaProfile(hcaId, { status: 'active' });
  await logActivity({ type: 'hca_profile_reinstated', hcaId, adminId });
  return updated;
}

// ── HCA sessions (localStorage — ephemeral) ───────────────────────────────────
export function setHcaSession(profile) {
  lsSet('evive_hca_session', { id:profile.id, name:profile.name, email:profile.email, employeeId:profile.employeeId });
}
export function getHcaSession() { return lsGet('evive_hca_session'); }
export function clearHcaSession() { lsDel('evive_hca_session'); }

export async function authenticateHca(identifier, password) {
  // identifier can be empId, email, or mobile
  const all = await getAllHcaProfiles();
  const profile = all.find(h =>
    h.email === identifier || h.employeeId === identifier || h.mobile === identifier
  );
  if (!profile || profile.password !== password) return null;
  return profile;
}

// ─── PLACEMENTS ───────────────────────────────────────────────────────────────
export async function getAllPlacements() {
  const { data } = await supabase.from('placements').select('*').order('created_at', { ascending: false });
  return (data || []).map(placementFromDb);
}

export async function getPlacementsByClient(clientId) {
  const { data } = await supabase.from('placements').select('*').eq('client_id', clientId);
  return (data || []).map(placementFromDb);
}

export async function getPlacementsByHca(hcaId) {
  const { data } = await supabase.from('placements').select('*').eq('hca_id', hcaId);
  return (data || []).map(placementFromDb);
}

export async function createPlacement(data) {
  const { clientId, patientId, hcaId, startDate, endDate, ratePerShift } = data;
  const { data: row, error } = await supabase.from('placements').insert({
    client_id: clientId, patient_id: patientId, hca_id: hcaId,
    start_date: startDate, end_date: endDate,
    rate_per_shift: ratePerShift || 2000, status: 'active',
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'placement_created', placementId: row.id, clientId, hcaId });
  return placementFromDb(row);
}

export async function updatePlacement(id, patch) {
  const map = { clientId:'client_id', patientId:'patient_id', hcaId:'hca_id',
    startDate:'start_date', endDate:'end_date', ratePerShift:'rate_per_shift', status:'status' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; else db[k] = v; }
  const { data, error } = await supabase.from('placements').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return placementFromDb(data);
}

// ─── SHIFTS ───────────────────────────────────────────────────────────────────
export async function getAllShifts() {
  const { data } = await supabase.from('shifts').select('*').order('date', { ascending: false });
  return (data || []).map(shiftFromDb);
}

export async function getShiftsByHca(hcaId) {
  const { data } = await supabase.from('shifts').select('*').eq('hca_id', hcaId).order('date', { ascending: false });
  return (data || []).map(shiftFromDb);
}

export async function getShiftsByClient(clientId) {
  const { data } = await supabase.from('shifts').select('*').eq('client_id', clientId).order('date', { ascending: false });
  return (data || []).map(shiftFromDb);
}

export async function createShift(data) {
  const { placementId, hcaId, clientId, patientId, date, type, startTime, notes, linkedEventId } = data;
  const { data: row, error } = await supabase.from('shifts').insert({
    placement_id: placementId, hca_id: hcaId, client_id: clientId, patient_id: patientId,
    date, type: type || 'day', start_time: startTime || '07:00',
    status: 'scheduled', clock_in: null, clock_out: null,
    notes: notes || '', linked_event_id: linkedEventId || null,
  }).select().single();
  if (error) throw new Error(error.message);
  return shiftFromDb(row);
}

export async function updateShift(id, patch) {
  const map = {
    placementId:'placement_id', hcaId:'hca_id', clientId:'client_id', patientId:'patient_id',
    date:'date', type:'type', startTime:'start_time', status:'status',
    clockIn:'clock_in', clockOut:'clock_out',
    clockInLat:'clock_in_lat', clockInLng:'clock_in_lng',
    clockOutLat:'clock_out_lat', clockOutLng:'clock_out_lng',
    notes:'notes', linkedEventId:'linked_event_id',
  };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('shifts').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return shiftFromDb(data);
}

export async function clockInHca(hcaId, { clientId, patientId, lat, lng } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase.from('shifts')
    .select('*').eq('hca_id', hcaId).eq('date', today).eq('status', 'scheduled').maybeSingle();
  const now = new Date().toISOString();
  if (existing) {
    const shift = await updateShift(existing.id, { status:'in-progress', clockIn:now, clockInLat:lat, clockInLng:lng });
    await logActivity({ type:'hca_clock_in', hcaId, shiftId:existing.id, clientId });
    return shift;
  }
  const shift = await createShift({ hcaId, clientId, patientId, date:today, type:'day', startTime:'07:00' });
  const updated = await updateShift(shift.id, { status:'in-progress', clockIn:now, clockInLat:lat, clockInLng:lng });
  await logActivity({ type:'hca_clock_in', hcaId, shiftId:shift.id, clientId });
  return updated;
}

export async function clockOutHca(hcaId, shiftId) {
  const shift = await updateShift(shiftId, { status:'completed', clockOut:new Date().toISOString() });
  await logActivity({ type:'hca_clock_out', hcaId, shiftId });
  return shift;
}

// ─── CARDEX ───────────────────────────────────────────────────────────────────
export async function getAllCardex() {
  const { data } = await supabase.from('cardex_entries').select('*').order('submitted_at', { ascending: false });
  return (data || []).map(cardexFromDb);
}
export async function getAllCardexEntries() { return getAllCardex(); }

export async function getCardexByPatient(patientId) {
  const { data } = await supabase.from('cardex_entries').select('*').eq('patient_id', patientId).order('submitted_at', { ascending: false });
  return (data || []).map(cardexFromDb);
}

export async function getCardexByHca(hcaId) {
  const { data } = await supabase.from('cardex_entries').select('*').eq('hca_id', hcaId).order('submitted_at', { ascending: false });
  return (data || []).map(cardexFromDb);
}

export async function createCardexEntry(data) {
  const { shiftId, hcaId, patientId, clientId, vitals, medications, intakes,
          nutrition, hygiene, mobility, elimination, mentalState, incidents,
          handover, shiftRating, specialNeedsChecks, welfareNote } = data;
  const { data: row, error } = await supabase.from('cardex_entries').insert({
    shift_id: shiftId, hca_id: hcaId, patient_id: patientId, client_id: clientId,
    vitals: vitals || {}, medications: medications || [], intakes: intakes || [],
    nutrition: nutrition || {}, hygiene: hygiene || {}, mobility: mobility || {},
    elimination: elimination || {}, mental_state: mentalState || {},
    incidents: incidents || '', handover: handover || '',
    shift_rating: shiftRating || 0,
    special_needs_checks: specialNeedsChecks || [],
    welfare_note: welfareNote || '',
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type:'cardex_submitted', hcaId, patientId });
  return cardexFromDb(row);
}

export async function addCardexQaComment(entryId, { comment, flagged = false, adminId = 'super_admin' }) {
  const { data: existing } = await supabase.from('cardex_entries').select('qa_comments,flagged').eq('id', entryId).single();
  if (!existing) throw new Error('Cardex entry not found');
  const qaComments = [...(existing.qa_comments || []), {
    id: uid(), comment, adminId, flagged, createdAt: new Date().toISOString(),
  }];
  const { data, error } = await supabase.from('cardex_entries')
    .update({ qa_comments: qaComments, flagged: flagged || existing.flagged })
    .eq('id', entryId).select().single();
  if (error) throw new Error(error.message);
  return cardexFromDb(data);
}

// ─── INVOICES ────────────────────────────────────────────────────────────────
export async function getAllInvoices() {
  const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  return (data || []).map(invoiceFromDb);
}

export async function getInvoicesByClient(clientId) {
  const { data } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data || []).map(invoiceFromDb);
}

export async function createInvoice(data) {
  const { count } = await supabase.from('invoices').select('*', { count:'exact', head:true });
  const invoiceNum = `INV-${1001 + (count || 0)}`;
  const { clientId, patientId, placementId, description, lineItems, subtotal, total, dueDate } = data;
  const { data: row, error } = await supabase.from('invoices').insert({
    invoice_num: invoiceNum,
    client_id: clientId, patient_id: patientId, placement_id: placementId,
    description: description || '', line_items: lineItems || [],
    subtotal: subtotal || 0, total: total || 0,
    currency: 'KES', due_date: dueDate || null,
    status: 'sent',
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type:'invoice_created', invoiceId:row.id, invoiceNum, clientId });
  return invoiceFromDb(row);
}

export async function updateInvoice(id, patch) {
  const map = { status:'status', paidAt:'paid_at', approvedBy:'approved_by',
    dueDate:'due_date', description:'description', total:'total', subtotal:'subtotal' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('invoices').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return invoiceFromDb(data);
}

export async function approveInvoicePayment(id, approvedBy) {
  const invoice = await updateInvoice(id, { status:'paid', paidAt:new Date().toISOString(), approvedBy });
  await logActivity({ type:'invoice_paid', invoiceId:id, invoiceNum:invoice.invoiceNum, approvedBy });
  return invoice;
}

// ─── CALENDAR EVENTS ─────────────────────────────────────────────────────────
export async function getAllCalendarEvents() {
  const { data } = await supabase.from('calendar_events').select('*').order('date', { ascending: true });
  return (data || []).map(eventFromDb);
}

export async function getCalendarEventsByDate(date) {
  const { data } = await supabase.from('calendar_events').select('*').eq('date', date);
  return (data || []).map(eventFromDb);
}

export async function getCalendarEventsByHca(hcaId) {
  const { data } = await supabase.from('calendar_events').select('*').eq('hca_id', hcaId).order('date');
  return (data || []).map(eventFromDb);
}

export async function getCalendarEventsByClient(clientId) {
  const { data } = await supabase.from('calendar_events').select('*').eq('client_id', clientId).order('date');
  return (data || []).map(eventFromDb);
}

export async function createCalendarEvent(data) {
  const { title, date, time, type, clientId, hcaId, patientId, shiftId, notes, createdBy } = data;
  const { data: row, error } = await supabase.from('calendar_events').insert({
    title, date, time: time || '09:00', type: type || 'other',
    client_id: clientId || null, hca_id: hcaId || null, patient_id: patientId || null,
    shift_id: shiftId || null, notes: notes || '',
    created_by: createdBy || 'admin',
  }).select().single();
  if (error) throw new Error(error.message);
  return eventFromDb(row);
}

export async function updateCalendarEvent(id, patch) {
  const map = { title:'title', date:'date', time:'time', type:'type',
    clientId:'client_id', hcaId:'hca_id', patientId:'patient_id',
    shiftId:'shift_id', notes:'notes', createdBy:'created_by' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('calendar_events').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return eventFromDb(data);
}

export async function deleteCalendarEvent(id) {
  await supabase.from('calendar_events').delete().eq('id', id);
}

export async function createShiftWithEvent(shiftData) {
  const shift = await createShift(shiftData);
  const [profiles, clients] = await Promise.all([getAllHcaProfiles(), getAllClients()]);
  const hca     = profiles.find(h => h.id === shiftData.hcaId);
  const client  = clients.find(c => c.id === shiftData.clientId);
  const patient = client?.patients?.find(p => p.id === shiftData.patientId);
  const event = await createCalendarEvent({
    title:    `${hca?.name||'HCA'} — ${patient?.name||client?.name||'Patient'}`,
    date:     shiftData.date,
    time:     shiftData.startTime || '07:00',
    type:     'shift',
    hcaId:    shiftData.hcaId,
    clientId: shiftData.clientId,
    shiftId:  shift.id,
    notes:    shiftData.notes || '',
    createdBy:'system',
  });
  return { shift, event };
}

export async function getCalendarItemsForMonth(year, month) {
  const prefix = `${year}-${String(month+1).padStart(2,'0')}`;
  const [events, shifts, profiles, clients] = await Promise.all([
    supabase.from('calendar_events').select('*').like('date', `${prefix}%`).then(r => (r.data||[]).map(eventFromDb)),
    supabase.from('shifts').select('*').like('date', `${prefix}%`).then(r => (r.data||[]).map(shiftFromDb)),
    getAllHcaProfiles(),
    getAllClients(),
  ]);
  const shiftItems = shifts.map(s => {
    const hca    = profiles.find(h => h.id === s.hcaId);
    const client = clients.find(c => c.id === s.clientId);
    const patient= client?.patients?.find(p => p.id === s.patientId);
    return { ...s, title:`${hca?.name||'HCA'} — ${patient?.name||client?.name||'Patient'}`, source:'shift', shiftType:s.type };
  });
  const linkedIds = new Set(shifts.map(s => s.linkedEventId).filter(Boolean));
  const filteredEvents = events.filter(e => !linkedIds.has(e.id)).map(e => ({ ...e, source:'event' }));
  return [...filteredEvents, ...shiftItems].sort((a,b) => (a.time||'').localeCompare(b.time||''));
}

// ─── HCA SELF-SERVICE REQUESTS (Training / Welfare) ───────────────────────────
// Training requests and Welfare/off-day requests land in the same unified
// `emails` table as Contact page and Resend mail (tagged by origin) so they
// show up in the admin Messages inbox immediately, searchable and linked
// back to the requesting HCA via related_hca_id — no new table needed.
export async function createHcaRequest({ hcaId, hcaName, hcaEmail, origin, subject, message }) {
  const { data: row, error } = await supabase.from('emails').insert({
    direction: 'inbound',
    origin,
    folder: 'inbox',
    status: 'received',
    subject,
    from_address: hcaEmail || '',
    from_name: hcaName || null,
    to_addresses: ['hello@e-vive.co.ke'],
    body_text: message || '',
    related_hca_id: hcaId || null,
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'hca_request_submitted', hcaId, origin, subject });
  return emailFromDb(row);
}

// ─── CONTACT MESSAGES ───────────────────────────────────────────────────────
// Contact page submissions land directly in the unified `emails` table
// (tagged origin: 'contact_page'), alongside Resend and admin-composed mail,
// so they show up in the admin Messages Inbox instead of a separate table.
export async function createContactMessage(data) {
  const { fname, lname, email, phone, subject, message } = data;
  const name = [fname, lname].filter(Boolean).join(' ').trim();
  const { data: row, error } = await supabase.from('emails').insert({
    direction: 'inbound',
    origin: 'contact_page',
    folder: 'inbox',
    status: 'received',
    subject: subject || 'Contact form submission',
    from_address: email || '',
    from_name: name || null,
    to_addresses: ['hello@e-vive.co.ke'],
    body_text: phone ? `${message}\n\nPhone: ${phone}` : (message || ''),
    metadata: { fname, lname, phone },
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'contact_message_received', email, subject });
  return emailFromDb(row);
}

// ─── EMAILS (admin Messages: inbox/sent/outbox/trash) ─────────────────────────
export async function getAllEmails() {
  const { data, error } = await supabase.from('emails').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  return (data || []).map(emailFromDb);
}

export async function getEmailById(id) {
  const { data, error } = await supabase.from('emails').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return emailFromDb(data);
}

export async function markEmailRead(id, read = true) {
  const { error } = await supabase.from('emails').update({ read }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleEmailStar(id, starred) {
  const { error } = await supabase.from('emails').update({ starred }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function moveEmailToTrash(id) {
  const { error } = await supabase.from('emails').update({ folder: 'trash', deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function restoreEmailFromTrash(id, folder) {
  const { error } = await supabase.from('emails').update({ folder, deleted_at: null }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEmailPermanently(id) {
  const { error } = await supabase.from('emails').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Admin-composed outbound email — goes through the same /api/send-email route
// used for system notifications, tagged so it's distinguishable in Messages.
export async function sendAdminEmail({ to, cc, subject, text, replyTo, relatedClientId, relatedHcaId, adminId = 'super_admin' }) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to, cc, subject, text, replyTo,
      origin: 'admin_composed',
      relatedClientId, relatedHcaId, adminId,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) throw new Error(body.error || `Email API returned HTTP ${res.status}`);
  return body;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export async function getAllNotifications() {
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
  return (data || []).map(notifFromDb);
}

export async function getNotificationsForClient(clientId) {
  const { data } = await supabase.from('notifications').select('*')
    .or(`client_id.eq.${clientId},client_id.is.null`)
    .order('created_at', { ascending: false });
  return (data || []).map(notifFromDb);
}

export async function createNotification({ clientId, hcaId, type, subject, body, emailTo }) {
  const { data, error } = await supabase.from('notifications').insert({
    client_id: clientId || null, hca_id: hcaId || null,
    type, subject, body: body || '', email_to: emailTo || null, read: false,
  }).select().single();
  if (error) return null;
  return notifFromDb(data);
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead(clientId) {
  await supabase.from('notifications').update({ read: true }).eq('client_id', clientId);
}

export async function getUnreadCount(clientId) {
  const { count } = await supabase.from('notifications')
    .select('*', { count:'exact', head:true })
    .eq('client_id', clientId).eq('read', false);
  return count || 0;
}

// ── Email delivery (calls server-side API route) ──────────────────────────────
async function dispatchEmail(to, subject, text) {
  if (typeof window === 'undefined' || !to) return { ok: false, error: 'No recipient' };
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      const error = body.error || `Email API returned HTTP ${res.status}`;
      console.error('[dispatchEmail] failed:', error);
      return { ok: false, skipped: !!body.skipped, error };
    }
    if (body.skipped) console.warn('[dispatchEmail] skipped — RESEND_API_KEY is not configured on the server.');
    return { ok: true, skipped: !!body.skipped };
  } catch (e) {
    console.error('[dispatchEmail] network error:', e.message);
    return { ok: false, error: e.message || 'Network error' };
  }
}

// ── Notification helpers ──────────────────────────────────────────────────────
export async function sendWelcomeNotification(client) {
  const subject = 'Welcome to E-Vive — Your account is ready';
  const body = `Dear ${client.name.split(' ')[0]},\n\nWelcome to E-Vive HomeCare! Your account is ready.\n\nYour next step is to accept our Terms & Conditions in your dashboard.\n\n📧 hello@e-vive.co.ke  📞 +254 141 888 340\n\nWarm regards,\nThe E-Vive Team`;
  const notif = await createNotification({ clientId:client.id, type:'welcome', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}
export async function sendTcAcceptedNotification(client) {
  const subject = 'T&Cs Accepted — What happens next';
  const body = `Dear ${client.name.split(' ')[0]},\n\nThank you for accepting the E-Vive Terms & Conditions. An E-Vive coordinator will reach out within 24 hours.\n\n📧 hello@e-vive.co.ke\n\nWarm regards,\nThe E-Vive Team`;
  const notif = await createNotification({ clientId:client.id, type:'tc_accepted', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}
export async function sendVisitScheduledNotification(client, visitDate) {
  const d = visitDate ? new Date(visitDate).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : 'a date to be confirmed';
  const subject = `Home Visit Confirmed — ${d}`;
  const body = `Dear ${client.name.split(' ')[0]},\n\nYour home assessment visit is confirmed for ${d}.\n\n📧 hello@e-vive.co.ke  📞 +254 141 888 340\n\nWarm regards,\nThe E-Vive Team`;
  const notif = await createNotification({ clientId:client.id, type:'visit_scheduled', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}
export async function sendInvoiceNotification(client, invoice) {
  const subject = `Invoice ${invoice.invoiceNum} — KES ${(invoice.total||0).toLocaleString()} due ${invoice.dueDate}`;
  const body = `Dear ${client.name.split(' ')[0]},\n\nInvoice ${invoice.invoiceNum} for KES ${(invoice.total||0).toLocaleString()} is due on ${invoice.dueDate}.\n\n📧 hello@e-vive.co.ke\n\nWarm regards,\nE-Vive Finance`;
  const notif = await createNotification({ clientId:client.id, type:'invoice', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}
export async function sendPasswordResetNotification(client, resetCode) {
  const subject = 'E-Vive Password Reset Code';
  const body = `Dear ${client.name.split(' ')[0]},\n\nYour one-time reset code is:\n\n    ${resetCode}\n\nValid for 15 minutes.\n\n📧 hello@e-vive.co.ke\n\nWarm regards,\nThe E-Vive Team`;
  const notif = await createNotification({ clientId:client.id, type:'password_reset', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}
export async function sendHcaOnboardingNotification(hcaId, email, name, empId, initPwd) {
  const safeName = name || 'Applicant';
  const subject = 'Welcome to E-Vive — Your Application Has Been Approved';
  const body = `Dear ${safeName.split(' ')[0]},\n\nCongratulations! Your HomeCare Assistant application to E-Vive has been approved.\n\nYour Employee ID: ${empId}\nYour Initial Password: ${initPwd}\n\nPlease log in at https://e-vive.co.ke/hca/login using your registered email address and the password above.\n\nYou will be prompted to change your password upon first login.\n\nWelcome to the E-Vive family!\n\nThe E-Vive Team\n+254 141 888 340 | hello@e-vive.co.ke`;
  const notif = await createNotification({ hcaId, type: 'hca_approved', subject, emailTo: email, body });
  const emailResult = await dispatchEmail(email, subject, body);
  return { notif, ...emailResult };
}
export async function sendHcaMatchedNotification(client, hcaName) {
  const subject = `HCA Matched — ${hcaName} assigned to your account`;
  const body = `Dear ${client.name.split(' ')[0]},\n\n👩‍⚕️ ${hcaName} has been matched to your account. An invoice will follow shortly.\n\n📧 hello@e-vive.co.ke\n\nWarm regards,\nThe E-Vive Team`;
  const notif = await createNotification({ clientId:client.id, type:'hca_matched', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}
export async function sendPaymentConfirmedNotification(client) {
  const subject = 'Payment Confirmed — Your placement is now active';
  const body = `Dear ${client.name.split(' ')[0]},\n\n✅ Payment confirmed. Your placement is now ACTIVE.\n\n📧 hello@e-vive.co.ke\n\nWarm regards,\nThe E-Vive Team`;
  const notif = await createNotification({ clientId:client.id, type:'payment_confirmed', subject, emailTo:client.email, body });
  dispatchEmail(client.email, subject, body);
  return notif;
}

// ─── ADMIN SESSION (localStorage — synchronous) ───────────────────────────────
export function getAdminSession()   { return lsGet('evive_admin_session'); }
export function setAdminSession(u)  { lsSet('evive_admin_session', { ...u, loginAt: new Date().toISOString() }); }
export function clearAdminSession() { lsDel('evive_admin_session'); }

export function hasPermission(roleOrPerms, perm) {
  if (!roleOrPerms) return false;
  const perms = Array.isArray(roleOrPerms) ? roleOrPerms : (ROLE_DEFAULTS[roleOrPerms]?.permissions || []);
  return perms.includes('all') || perms.includes(perm);
}

// ─── RBAC ────────────────────────────────────────────────────────────────────
export async function getRbacRules() {
  const { data } = await supabase.from('rbac_rules').select('*');
  const map = {};
  for (const r of (data || [])) {
    map[r.user_id] = { role: r.role, permissions: r.permissions, updatedAt: r.updated_at };
  }
  return map;
}

export async function setRbacRule(userId, role, permissions) {
  await supabase.from('rbac_rules').upsert({ user_id: userId, role, permissions, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  await logActivity({ type:'rbac_updated', userId, role });
}

export async function removeRbacRule(userId) {
  await supabase.from('rbac_rules').delete().eq('user_id', userId);
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export async function getAllAnnouncements() {
  const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({ id:r.id, title:r.title, body:r.body, target:r.target, type:r.type, priority:r.priority, published:r.published, createdAt:r.created_at }));
}

export async function createAnnouncement({ title, body, target='all', type='info', priority='normal' }) {
  const { data, error } = await supabase.from('announcements').insert({ title, body, target, type, priority, published:true }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type:'announcement_created', title });
  return { id:data.id, title:data.title, body:data.body, target:data.target, type:data.type, priority:data.priority, published:data.published, createdAt:data.created_at };
}

export async function updateAnnouncement(id, patch) {
  const { data, error } = await supabase.from('announcements').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return { id:data.id, title:data.title, body:data.body, target:data.target, type:data.type, priority:data.priority, published:data.published, createdAt:data.created_at };
}

export async function deleteAnnouncement(id) {
  await supabase.from('announcements').delete().eq('id', id);
}

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
export async function getAllNewsletters() {
  const { data } = await supabase.from('newsletters').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({ id:r.id, name:r.name, subject:r.subject, body:r.body, targetAudience:r.target_audience, status:r.status, sentAt:r.sent_at, recipientCount:r.recipient_count, createdAt:r.created_at }));
}

export async function createNewsletter({ name, subject, body, targetAudience='all' }) {
  const { data, error } = await supabase.from('newsletters').insert({ name, subject, body, target_audience:targetAudience, status:'draft', recipient_count:0 }).select().single();
  if (error) throw new Error(error.message);
  return { id:data.id, name:data.name, subject:data.subject, body:data.body, targetAudience:data.target_audience, status:data.status, sentAt:data.sent_at, recipientCount:data.recipient_count, createdAt:data.created_at };
}

export async function updateNewsletter(id, patch) {
  const map = { name:'name', subject:'subject', body:'body', targetAudience:'target_audience', status:'status', sentAt:'sent_at', recipientCount:'recipient_count' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; else db[k] = v; }
  const { data, error } = await supabase.from('newsletters').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return { id:data.id, name:data.name, subject:data.subject, body:data.body, targetAudience:data.target_audience, status:data.status, sentAt:data.sent_at, recipientCount:data.recipient_count, createdAt:data.created_at };
}

export async function deleteNewsletter(id) {
  await supabase.from('newsletters').delete().eq('id', id);
}

export async function markNewsletterSent(id) {
  const [clients, hcas, nl] = await Promise.all([getAllClients(), getAllHcaProfiles(), getAllNewsletters().then(n => n.find(x => x.id === id))]);
  if (!nl) throw new Error('Newsletter not found');
  const count = nl.targetAudience === 'clients' ? clients.length : nl.targetAudience === 'hcas' ? hcas.length : clients.length + hcas.length;
  const updated = await updateNewsletter(id, { status:'sent', sentAt:new Date().toISOString(), recipientCount:count });
  await logActivity({ type:'newsletter_sent', subject:nl.subject, recipients:count });
  return updated;
}

// ─── PRICING & DISCOUNTS ──────────────────────────────────────────────────────
const DEFAULT_PRICING = {
  rates: {
    day_shift:   { label:'Day Shift (8h)',           kes:2000  },
    night_shift: { label:'Night Shift (12h)',         kes:2000  },
    live_in:     { label:'Live-In (monthly)',         kes:35000 },
    per_hour:    { label:'Per Hour',                  kes:300   },
    assessment:  { label:'Assessment Fee (one-time)', kes:3500  },
    emergency:   { label:'Emergency Call-Out',        kes:6000  },
  },
  plans: {
    basic:        { name:'Basic',        badge:'Starter',   price:75,  per:'/month', feats:['Search listing','1 active placement','Basic profile','Email support'] },
    professional: { name:'Professional', badge:'Popular ★', price:100, per:'/month', feats:['Priority listing','3 placements','Certificate badges','WhatsApp support','Training access'] },
    premium:      { name:'Premium',      badge:'Top Tier',  price:150, per:'/month', feats:['Top-of-search placement','Unlimited placements','Verified badge','Dedicated HCA manager','International eligible'] },
  },
};

export async function getPricingConfig() {
  const { data } = await supabase.from('pricing_config').select('*').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_PRICING;
  return {
    rates: data.rates || DEFAULT_PRICING.rates,
    plans: data.plans || DEFAULT_PRICING.plans,
    updatedAt: data.updated_at,
  };
}

export async function savePricingConfig(config) {
  await supabase.from('pricing_config').upsert(
    { id:1, rates:config.rates, plans:config.plans, updated_at:new Date().toISOString() },
    { onConflict:'id' }
  );
  await logActivity({ type:'pricing_updated' });
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────
export async function getAllExpenses() {
  const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  return (data || []).map(r => ({
    id: r.id, icon: r.icon, category: r.category, description: r.description,
    date: r.date, amount: r.amount, createdAt: r.created_at,
  }));
}

export async function createExpense({ icon='💳', category, description, date, amount }) {
  const { data, error } = await supabase.from('expenses').insert({
    icon, category, description, date, amount: Number(amount),
  }).select().single();
  if (error) throw new Error(error.message);
  return { id:data.id, icon:data.icon, category:data.category, description:data.description, date:data.date, amount:data.amount, createdAt:data.created_at };
}

export async function deleteExpense(id) {
  await supabase.from('expenses').delete().eq('id', id);
}

// ─── PAYROLL PAYMENTS ─────────────────────────────────────────────────────────
export async function getPayrollPayments(month, year) {
  const { data } = await supabase
    .from('payroll_payments')
    .select('*')
    .eq('period_month', month)
    .eq('period_year', year)
    .order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id, hcaId: r.hca_id, hcaName: r.hca_name, employeeId: r.employee_id,
    periodMonth: r.period_month, periodYear: r.period_year,
    shifts: r.shifts, hours: r.hours, rate: r.rate,
    gross: r.gross, deductions: r.deductions, net: r.net,
    paidBy: r.paid_by, notes: r.notes, createdAt: r.created_at,
  }));
}

export async function createPayrollPayment({ hcaId, hcaName, employeeId, periodMonth, periodYear, shifts, hours, rate, gross, deductions, net, paidBy='Finance Admin', notes='' }) {
  const { data, error } = await supabase.from('payroll_payments').insert({
    hca_id: hcaId, hca_name: hcaName, employee_id: employeeId,
    period_month: periodMonth, period_year: periodYear,
    shifts, hours, rate, gross, deductions, net, paid_by: paidBy, notes,
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'payroll_paid', hcaId, hcaName, net, periodMonth, periodYear });
  return data;
}

export async function getAllDiscountCodes() {
  const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({ id:r.id, code:r.code, type:r.type, value:r.value, minSpend:r.min_spend, description:r.description, expiresAt:r.expires_at, active:r.active, usageCount:r.usage_count, createdAt:r.created_at }));
}

export async function createDiscountCode({ code, type='percent', value, minSpend=0, description='', expiresAt=null }) {
  const normalized = code.toUpperCase().replace(/\s+/g,'');
  const { data, error } = await supabase.from('discount_codes').insert({ code:normalized, type, value:Number(value), min_spend:Number(minSpend), description, expires_at:expiresAt, active:true, usage_count:0 }).select().single();
  if (error) throw new Error(error.code === '23505' ? 'Discount code already exists' : error.message);
  await logActivity({ type:'discount_created', code:normalized });
  return { id:data.id, code:data.code, type:data.type, value:data.value, minSpend:data.min_spend, description:data.description, expiresAt:data.expires_at, active:data.active, usageCount:data.usage_count, createdAt:data.created_at };
}

export async function updateDiscountCode(id, patch) {
  const map = { code:'code', type:'type', value:'value', minSpend:'min_spend', description:'description', expiresAt:'expires_at', active:'active', usageCount:'usage_count' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  await supabase.from('discount_codes').update(db).eq('id', id);
}

export async function deleteDiscountCode(id) {
  await supabase.from('discount_codes').delete().eq('id', id);
}

// ─── MAP MARKERS ─────────────────────────────────────────────────────────────
export async function getAllMapMarkers() {
  const entities = await getAllMapEntities();
  return entities.filter(e => e.lat && e.lng);
}

export async function getAllMapEntities() {
  const [clients, profiles] = await Promise.all([getAllClients(), getAllHcaProfiles()]);
  const entities = [];
  for (const c of clients) {
    entities.push({
      id: c.id, type: 'client', label: c.name,
      sub: c.location || c.address || '',
      lat: c.lat || null, lng: c.lng || null,
      color: '#004A99',
    });
    for (const p of (c.patients || [])) {
      entities.push({
        id: p.id, type: 'patient', label: p.name,
        sub: `Patient of ${c.name}`,
        lat: c.lat || null, lng: c.lng || null,
        color: '#d97706',
        parentClientId: c.id,
      });
    }
  }
  for (const h of profiles) {
    entities.push({
      id: h.id, type: 'hca', label: h.name,
      sub: [h.employeeId, h.location].filter(Boolean).join(' · '),
      lat: h.lat || null, lng: h.lng || null,
      color: '#059669',
    });
  }
  return entities;
}

export async function updateClientCoords(clientId, lat, lng) {
  return updateClient(clientId, { lat, lng });
}

export async function updateHcaCoords(hcaId, lat, lng) {
  return updateHcaProfile(hcaId, { lat, lng });
}

export async function createMapMarker({ label, type='client', lat, lng, refId, notes='' }) {
  const { data, error } = await supabase.from('map_markers').insert({ label, type, lat, lng, ref_id:refId||null, notes }).select().single();
  if (error) throw new Error(error.message);
  return { id:data.id, label:data.label, type:data.type, lat:data.lat, lng:data.lng, refId:data.ref_id, notes:data.notes, createdAt:data.created_at };
}

export async function updateMapMarker(id, patch) {
  const map = { label:'label', type:'type', lat:'lat', lng:'lng', refId:'ref_id', notes:'notes' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  await supabase.from('map_markers').update(db).eq('id', id);
}

export async function deleteMapMarker(id) {
  await supabase.from('map_markers').delete().eq('id', id);
}

// ─── LMS ─────────────────────────────────────────────────────────────────────
export async function getLmsCourses(target = null) {
  let q = supabase.from('lms_courses').select('*').eq('status', 'active').order('created_at');
  if (target && target !== 'all') {
    q = q.or(`target.eq.all,target.eq.${target}`);
  }
  const { data } = await q;
  return data || [];
}

export async function getLmsCourse(id) {
  const { data } = await supabase.from('lms_courses').select('*').eq('id', id).maybeSingle();
  return data || null;
}

export async function getEnrollmentsForUser(userId, userType) {
  const { data } = await supabase.from('lms_enrollments').select('*')
    .eq('user_id', userId).eq('user_type', userType);
  return data || [];
}

export async function enrollInCourse(userId, userType, courseId) {
  const { data: existing } = await supabase.from('lms_enrollments')
    .select('*').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase.from('lms_enrollments').insert({
    user_id: userId, user_type: userType, course_id: courseId,
    progress_pct: 0, completed_lessons: [],
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'lms_enrolled', userId, userType, courseId });
  return data;
}

export async function updateCourseProgress(userId, courseId, lessonIdx, totalLessons) {
  const { data: existing } = await supabase.from('lms_enrollments')
    .select('*').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
  if (!existing) return null;
  const completed = Array.from(new Set([...(existing.completed_lessons || []), lessonIdx]));
  const progressPct = Math.round((completed.length / totalLessons) * 100);
  const completedAt = progressPct === 100 ? new Date().toISOString() : existing.completed_at;
  const { data } = await supabase.from('lms_enrollments')
    .update({ completed_lessons: completed, progress_pct: progressPct, completed_at: completedAt })
    .eq('id', existing.id).select().single();
  return data;
}

export async function submitPartnerCourse({ orgName, contactEmail, courseTitle, description, contentUrl, target = 'all' }) {
  const { data, error } = await supabase.from('lms_submissions').insert({
    org_name: orgName, contact_email: contactEmail, course_title: courseTitle,
    description: description || '', content_url: contentUrl || '', target,
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'lms_submission', orgName, courseTitle });
  return data;
}

export async function getLmsSubmissions() {
  const { data } = await supabase.from('lms_submissions').select('*').order('submitted_at', { ascending: false });
  return data || [];
}

export async function updateLmsSubmission(id, patch) {
  const { data, error } = await supabase.from('lms_submissions').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── FAMILY HUB — Admin ───────────────────────────────────────────────────────
export async function createLmsCourse(data) {
  const { title, description, category, difficulty, duration_mins, cover_emoji, target, tags, lessons } = data;
  const { data: row, error } = await supabase.from('lms_courses').insert({
    title, description: description || '',
    category: category || 'General',
    difficulty: difficulty || 'Beginner',
    duration_mins: duration_mins || 60,
    cover_emoji: cover_emoji || '📚',
    target: target || 'all',
    tags: tags || [],
    lessons: lessons || [],
    status: 'active',
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'lms_course_created', title });
  return row;
}

export async function updateLmsCourse(id, patch) {
  const { data, error } = await supabase.from('lms_courses').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLmsCourse(id) {
  await supabase.from('lms_courses').delete().eq('id', id);
}

export async function getAllLmsEnrollments() {
  const { data } = await supabase.from('lms_enrollments').select('*').order('enrolled_at', { ascending: false });
  return data || [];
}

export async function getHubReferrals() {
  const { data } = await supabase.from('hub_referrals').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function updateHubReferral(id, patch) {
  const { data, error } = await supabase.from('hub_referrals').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createHubReferral({ name, phone, email, message }) {
  const { data, error } = await supabase.from('hub_referrals').insert({ name, phone: phone || '', email: email || '', message: message || '' }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getHubAccessRequests() {
  const { data } = await supabase.from('hub_access_requests').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createHubAccessRequest({ name, email, organisation, message }) {
  const { data, error } = await supabase.from('hub_access_requests').insert({ name, email, organisation: organisation || '', message: message || '' }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateHubAccessRequest(id, patch) {
  const { data, error } = await supabase.from('hub_access_requests').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Demo seed ────────────────────────────────────────────────────────────────
export async function seedDemoDataIfEmpty() {
  if (typeof window === 'undefined') return;
  const existing = await getAllClients();
  if (existing.length > 0) return;

  const client = await createClient({
    name:'Demo Client', email:'demo@client.com', password:'demo1234',
    mobile:'+254700000001', location:'Nairobi', address:'Karen, Nairobi',
    patients:[{ name:'Margaret Wanjiku', age:74, relationship:'Mother', conditions:'Diabetes, Hypertension', notes:'' }],
  });
  await advanceClientJourney(client.id, 'tc_accepted');
  await advanceClientJourney(client.id, 'acknowledged');
  await updateClient(client.id, { lat:-1.3173, lng:36.7069 });

  const app = await createHcaApplication({
    fullName:'Grace Akinyi', email:'grace@hca.com', password:'demo1234',
    mobile:'+254711000001', homeLat:-1.2921, homeLng:36.8219, county:'Nairobi',
    certLevel:'Certificate III', yearsExp:4,
    specialisations:['Elderly Care','Dementia Care'],
  });
  const hcaProfile = await createHcaProfile({
    applicationId:app.id, name:app.fullName, email:app.email, password:app.password,
    mobile:app.mobile, certLevel:app.certLevel, yearsExp:app.yearsExp,
    specialisations:app.specialisations, rate:2000, rateSetAt:new Date().toISOString(),
  });
  await updateHcaProfile(hcaProfile.id, { lat:-1.2708, lng:36.8117 });

  const updated = await getClientById(client.id);
  await createInvoice({
    clientId:client.id, patientId:updated.patients[0]?.id,
    description:'Onboarding & Assessment Fee',
    lineItems:[{ label:'Initial assessment visit', amount:3500 }],
    subtotal:3500, total:3500,
    dueDate:new Date(Date.now()+7*86400000).toISOString().slice(0,10),
  });

  await createCalendarEvent({
    title:'Initial Assessment Visit – Demo Client',
    date:new Date(Date.now()+3*86400000).toISOString().slice(0,10),
    time:'10:00', type:'visit', clientId:client.id, hcaId:hcaProfile.id, createdBy:'system',
  });
}
