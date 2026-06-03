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
  return {
    id: r.id, status: r.status, appliedAt: r.applied_at,
    fullName: r.full_name, name: r.full_name,
    email: r.email, password: r.password, mobile: r.mobile,
    nationalId: r.national_id, county: r.county,
    certLevel: r.cert_level, yearsExp: r.years_exp,
    specialisations: r.specialisations || [],
    plan: r.plan, bio: r.bio,
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
    body: `Dear ${client.name.split(' ')[0]},\n\nWe have received your request to close your E-Vive account.\n\nOur team will review your request and contact you within 2 business days.\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
  return updated;
}

// ─── HCA APPLICATIONS ─────────────────────────────────────────────────────────
export async function getAllHcaApplications() {
  const { data } = await supabase.from('hca_applications').select('*').order('applied_at', { ascending: false });
  return (data || []).map(hcaAppFromDb);
}

export async function createHcaApplication(formData) {
  const { fullName, name, email, password, mobile, nationalId, county,
          certLevel, yearsExp, specialisations, plan, bio, ...rest } = formData;
  const { data, error } = await supabase.from('hca_applications').insert({
    full_name: fullName || name || '',
    email: email || '', password: password || '',
    mobile: mobile || '', national_id: nationalId || '',
    county: county || '', cert_level: certLevel || '',
    years_exp: yearsExp || 0,
    specialisations: specialisations || [],
    plan: plan || 'Professional', bio: bio || '',
    form_data: rest,
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'hca_applied', hcaName: fullName || name, email });
  return hcaAppFromDb(data);
}

export async function updateHcaApplication(id, patch) {
  const map = { status:'status', fullName:'full_name', email:'email', certLevel:'cert_level' };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; else db[k] = v; }
  const { data, error } = await supabase.from('hca_applications').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return hcaAppFromDb(data);
}

// ─── HCA PROFILES ────────────────────────────────────────────────────────────
export async function getAllHcaProfiles() {
  const { data } = await supabase.from('hca_profiles').select('*').order('approved_at', { ascending: false });
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
  const { count } = await supabase.from('hca_profiles').select('*', { count:'exact', head:true });
  const empId = `HCA-${1001 + (count || 0)}`;
  const { applicationId, name, email, password, mobile, certLevel, yearsExp,
          specialisations, rate, rateSetAt,
          gender, languages, shiftPreferences, periodPreference, travelOptions,
          bio, ageRange, ...rest } = data;
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
    ...Object.fromEntries(Object.entries(rest).filter(([k]) =>
      ['lat','lng'].includes(k)
    )),
  }).select().single();
  if (error) throw new Error(error.message);
  await logActivity({ type: 'hca_approved', hcaId: row.id, name: row.name, employeeId: empId });
  return hcaProfileFromDb(row);
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
  };
  const db = {};
  for (const [k, v] of Object.entries(patch)) { if (map[k]) db[map[k]] = v; }
  const { data, error } = await supabase.from('hca_profiles').update(db).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return hcaProfileFromDb(data);
}

export async function requestHcaDeletion(hcaId) {
  const profile = await getHcaProfileById(hcaId);
  if (!profile) throw new Error('HCA profile not found');
  if (profile.deletionRequested) return profile;
  return updateHcaProfile(hcaId, { deletionRequested:true, deletionRequestedAt:new Date().toISOString() });
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
  if (typeof window === 'undefined' || !to) return;
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text }),
    });
  } catch { /* non-blocking — notification DB record already saved */ }
}

// ── Notification helpers ──────────────────────────────────────────────────────
export async function sendWelcomeNotification(client) {
  const subject = 'Welcome to E-Vive — Your account is ready';
  const body = `Dear ${client.name.split(' ')[0]},\n\nWelcome to E-Vive HomeCare! Your account is ready.\n\nYour next step is to accept our Terms & Conditions in your dashboard.\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`;
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
  const body = `Dear ${client.name.split(' ')[0]},\n\nYour home assessment visit is confirmed for ${d}.\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`;
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
      sub: h.employeeId || '',
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
    mobile:'+254711000001', nationalId:'12345678', county:'Nairobi',
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
