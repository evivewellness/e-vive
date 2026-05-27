/**
 * E-Vive Shared Data Store
 * All data is persisted in localStorage.
 * Use these helpers everywhere — never read/write localStorage keys directly.
 */

// ─── Key constants ────────────────────────────────────────────────────────────
const KEYS = {
  CLIENTS:          'evive_clients',
  CLIENT_REGISTRY:  'evive_client_registry',   // legacy auth list
  CLIENT_SESSION:   'evive_client_session',
  HCA_APPLICATIONS: 'evive_hca_applications',
  HCA_PROFILES:     'evive_hca_profiles',
  HCA_SESSION:      'evive_hca_session',
  PLACEMENTS:       'evive_placements',
  SHIFTS:           'evive_shifts',
  CARDEX:           'evive_cardex',
  INVOICES:         'evive_invoices',
  CALENDAR:         'evive_calendar',
  ACTIVITY:         'evive_activity',
  NOTIFICATIONS:    'evive_notifications',
};

// ─── Journey stages (in order) ───────────────────────────────────────────────
export const JOURNEY_STAGES = [
  'account_created',
  'tc_accepted',
  'acknowledged',
  'call_made',
  'visit_scheduled',
  'visit_done',
  'hca_matched',
  'payment_pending',
  'payment_confirmed',
  'placement_active',
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

// ─── Utility ──────────────────────────────────────────────────────────────────
function uid() {
  // Use cryptographically secure randomness when available (browser & Node ≥ 15)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return Date.now().toString(36) + arr[0].toString(36) + arr[1].toString(36);
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function load(key) {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function save(key, value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Activity log ─────────────────────────────────────────────────────────────
export function logActivity(entry) {
  const log = load(KEYS.ACTIVITY) || [];
  log.unshift({ id: uid(), timestamp: new Date().toISOString(), ...entry });
  save(KEYS.ACTIVITY, log.slice(0, 500)); // cap at 500 entries
}

export function getActivityLog() {
  return load(KEYS.ACTIVITY) || [];
}

// ─── CLIENT store ─────────────────────────────────────────────────────────────

/**
 * Full client record shape:
 * {
 *   id, name, email, mobile, password,
 *   location, address,
 *   patients: [{ id, name, age, relationship, conditions, notes }],
 *   journeyStage: 'account_created' | ... | 'placement_active',
 *   journeyDates: { call_made: ISO, visit_scheduled: ISO, ... },
 *   visitDate: ISO | null,
 *   assignedHcaId: string | null,
 *   status: 'active' | 'suspended' | 'inactive',
 *   createdAt: ISO,
 * }
 */
export function getAllClients() {
  return load(KEYS.CLIENTS) || [];
}

export function getClientByEmail(email) {
  return getAllClients().find(c => c.email === email) || null;
}

export function getClientById(id) {
  return getAllClients().find(c => c.id === id) || null;
}

export function createClient({ name, email, mobile, password, location, address, patients = [] }) {
  const clients = getAllClients();
  if (clients.find(c => c.email === email)) {
    throw new Error('An account with this email already exists.');
  }
  const client = {
    id: uid(),
    name, email, mobile, password,
    location: location || '',
    address: address || '',
    patients: patients.map(p => ({ id: uid(), ...p })),
    journeyStage: 'account_created',
    journeyDates: { account_created: new Date().toISOString() },
    visitDate: null,
    assignedHcaId: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  save(KEYS.CLIENTS, clients);

  // also write legacy registry key so old login code still works
  const registry = load(KEYS.CLIENT_REGISTRY) || [];
  registry.push({ name, email, mobile, password });
  save(KEYS.CLIENT_REGISTRY, registry);

  logActivity({ type: 'client_registered', clientId: client.id, clientName: name, email });
  return client;
}

export function updateClient(id, patch) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Client not found');
  clients[idx] = { ...clients[idx], ...patch };
  save(KEYS.CLIENTS, clients);
  return clients[idx];
}

/** Advance a client's journey stage and record the timestamp */
export function advanceClientJourney(clientId, stage, meta = {}) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  clients[idx].journeyStage = stage;
  clients[idx].journeyDates = {
    ...clients[idx].journeyDates,
    [stage]: new Date().toISOString(),
  };
  if (meta.visitDate) clients[idx].visitDate = meta.visitDate;
  if (meta.assignedHcaId) clients[idx].assignedHcaId = meta.assignedHcaId;
  save(KEYS.CLIENTS, clients);
  logActivity({ type: `journey_${stage}`, clientId, clientName: clients[idx].name, ...meta });
  return clients[idx];
}

// Client session
export function setClientSession(client) {
  save(KEYS.CLIENT_SESSION, {
    id: client.id,
    name: client.name,
    email: client.email,
    mobile: client.mobile,
  });
}

export function getClientSession() {
  return load(KEYS.CLIENT_SESSION);
}

export function clearClientSession() {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.CLIENT_SESSION);
}

// Authenticate client (email + password)
export function authenticateClient(email, password) {
  const client = getClientByEmail(email);
  if (!client) return null;
  if (client.password !== password) return null;
  return client;
}

// ─── HCA Applications ─────────────────────────────────────────────────────────

/**
 * Application record shape:
 * { id, status: 'pending'|'approved'|'rejected', appliedAt, ...formData }
 */
export function getAllHcaApplications() {
  return load(KEYS.HCA_APPLICATIONS) || [];
}

export function createHcaApplication(formData) {
  const apps = getAllHcaApplications();
  const app = {
    id: uid(),
    status: 'pending',
    appliedAt: new Date().toISOString(),
    ...formData,
  };
  apps.push(app);
  save(KEYS.HCA_APPLICATIONS, apps);
  logActivity({ type: 'hca_applied', hcaName: formData.fullName || formData.name, email: formData.email });
  return app;
}

export function updateHcaApplication(id, patch) {
  const apps = getAllHcaApplications();
  const idx = apps.findIndex(a => a.id === id);
  if (idx === -1) throw new Error('Application not found');
  apps[idx] = { ...apps[idx], ...patch };
  save(KEYS.HCA_APPLICATIONS, apps);
  return apps[idx];
}

// ─── HCA Profiles (approved HCAs) ────────────────────────────────────────────

/**
 * Profile shape (promoted from application):
 * { id, applicationId, employeeId, name, email, mobile, specialisations[],
 *   certLevel, yearsExp, status: 'active'|'inactive'|'suspended',
 *   rate, rateSetAt, approvedAt }
 */
export function getAllHcaProfiles() {
  return load(KEYS.HCA_PROFILES) || [];
}

export function getHcaProfileById(id) {
  return getAllHcaProfiles().find(h => h.id === id) || null;
}

export function getHcaProfileByEmail(email) {
  return getAllHcaProfiles().find(h => h.email === email) || null;
}

export function createHcaProfile(data) {
  const profiles = getAllHcaProfiles();
  const empNum = String(1000 + profiles.length + 1);
  const profile = {
    id: uid(),
    employeeId: `HCA-${empNum}`,
    status: 'active',
    approvedAt: new Date().toISOString(),
    ...data,
  };
  profiles.push(profile);
  save(KEYS.HCA_PROFILES, profiles);
  logActivity({ type: 'hca_approved', hcaId: profile.id, name: profile.name, employeeId: profile.employeeId });
  return profile;
}

export function updateHcaProfile(id, patch) {
  const profiles = getAllHcaProfiles();
  const idx = profiles.findIndex(h => h.id === id);
  if (idx === -1) throw new Error('HCA profile not found');
  profiles[idx] = { ...profiles[idx], ...patch };
  save(KEYS.HCA_PROFILES, profiles);
  return profiles[idx];
}

// HCA session
export function setHcaSession(profile) {
  save(KEYS.HCA_SESSION, {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    employeeId: profile.employeeId,
  });
}

export function getHcaSession() {
  return load(KEYS.HCA_SESSION);
}

export function clearHcaSession() {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.HCA_SESSION);
}

export function authenticateHca(email, password) {
  const profile = getHcaProfileByEmail(email);
  if (!profile) return null;
  if (profile.password !== password) return null;
  return profile;
}

// ─── Placements ───────────────────────────────────────────────────────────────

/**
 * { id, clientId, patientId, hcaId, startDate, endDate?,
 *   ratePerShift, status: 'active'|'paused'|'ended', createdAt }
 */
export function getAllPlacements() {
  return load(KEYS.PLACEMENTS) || [];
}

export function getPlacementsByClient(clientId) {
  return getAllPlacements().filter(p => p.clientId === clientId);
}

export function getPlacementsByHca(hcaId) {
  return getAllPlacements().filter(p => p.hcaId === hcaId);
}

export function createPlacement(data) {
  const placements = getAllPlacements();
  const placement = {
    id: uid(),
    status: 'active',
    createdAt: new Date().toISOString(),
    ...data,
  };
  placements.push(placement);
  save(KEYS.PLACEMENTS, placements);
  logActivity({ type: 'placement_created', placementId: placement.id, clientId: data.clientId, hcaId: data.hcaId });
  return placement;
}

export function updatePlacement(id, patch) {
  const placements = getAllPlacements();
  const idx = placements.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Placement not found');
  placements[idx] = { ...placements[idx], ...patch };
  save(KEYS.PLACEMENTS, placements);
  return placements[idx];
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

/**
 * { id, placementId, hcaId, clientId, patientId,
 *   date (YYYY-MM-DD), type: 'day'|'night'|'live-in',
 *   status: 'scheduled'|'in-progress'|'completed'|'missed',
 *   clockIn: ISO | null, clockOut: ISO | null,
 *   clockInLat, clockInLng, clockOutLat, clockOutLng }
 */
export function getAllShifts() {
  return load(KEYS.SHIFTS) || [];
}

export function getShiftsByHca(hcaId) {
  return getAllShifts().filter(s => s.hcaId === hcaId);
}

export function getShiftsByClient(clientId) {
  return getAllShifts().filter(s => s.clientId === clientId);
}

export function createShift(data) {
  const shifts = getAllShifts();
  const shift = {
    id: uid(),
    status: 'scheduled',
    clockIn: null, clockOut: null,
    ...data,
  };
  shifts.push(shift);
  save(KEYS.SHIFTS, shifts);
  return shift;
}

export function updateShift(id, patch) {
  const shifts = getAllShifts();
  const idx = shifts.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Shift not found');
  shifts[idx] = { ...shifts[idx], ...patch };
  save(KEYS.SHIFTS, shifts);
  return shifts[idx];
}

// ─── Cardex entries ───────────────────────────────────────────────────────────

/**
 * { id, shiftId, hcaId, patientId, clientId,
 *   date: ISO, submittedAt: ISO,
 *   vitals: { bp, pulse, temp, spo2, rr, weight, pain },
 *   medications: [{ name, dose, time, given }],
 *   mood, mobility, appetite, hydration, bowels, sleep,
 *   observations, incidents }
 */
export function getAllCardex() {
  return load(KEYS.CARDEX) || [];
}

export function getCardexByPatient(patientId) {
  return getAllCardex().filter(c => c.patientId === patientId);
}

export function getCardexByHca(hcaId) {
  return getAllCardex().filter(c => c.hcaId === hcaId);
}

export function createCardexEntry(data) {
  const entries = getAllCardex();
  const entry = {
    id: uid(),
    submittedAt: new Date().toISOString(),
    ...data,
  };
  entries.push(entry);
  save(KEYS.CARDEX, entries);
  logActivity({ type: 'cardex_submitted', hcaId: data.hcaId, patientId: data.patientId });
  return entry;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

/**
 * { id, invoiceNum, clientId, patientId, placementId?,
 *   description, lineItems: [{ label, amount }],
 *   subtotal, total, currency: 'KES',
 *   dueDate: YYYY-MM-DD, issuedAt: ISO,
 *   status: 'draft'|'sent'|'paid'|'overdue'|'disputed',
 *   paidAt: ISO | null, approvedBy: string | null }
 */
export function getAllInvoices() {
  return load(KEYS.INVOICES) || [];
}

export function getInvoicesByClient(clientId) {
  return getAllInvoices().filter(i => i.clientId === clientId);
}

export function createInvoice(data) {
  const invoices = getAllInvoices();
  const num = String(1000 + invoices.length + 1);
  const invoice = {
    id: uid(),
    invoiceNum: `INV-${num}`,
    currency: 'KES',
    status: 'sent',
    issuedAt: new Date().toISOString(),
    paidAt: null,
    approvedBy: null,
    ...data,
  };
  invoices.push(invoice);
  save(KEYS.INVOICES, invoices);
  logActivity({ type: 'invoice_created', invoiceId: invoice.id, invoiceNum: invoice.invoiceNum, clientId: data.clientId });
  return invoice;
}

export function updateInvoice(id, patch) {
  const invoices = getAllInvoices();
  const idx = invoices.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Invoice not found');
  invoices[idx] = { ...invoices[idx], ...patch };
  save(KEYS.INVOICES, invoices);
  return invoices[idx];
}

export function approveInvoicePayment(id, approvedBy) {
  const invoice = updateInvoice(id, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    approvedBy,
  });
  logActivity({ type: 'invoice_paid', invoiceId: id, invoiceNum: invoice.invoiceNum, approvedBy });
  return invoice;
}

// ─── Calendar events ──────────────────────────────────────────────────────────

/**
 * { id, title, date: YYYY-MM-DD, time?: HH:MM,
 *   type: 'visit'|'shift'|'offday'|'training'|'meeting'|'other',
 *   clientId?, hcaId?, patientId?,
 *   notes?, createdAt, createdBy }
 */
export function getAllCalendarEvents() {
  return load(KEYS.CALENDAR) || [];
}

export function getCalendarEventsByDate(date) {
  return getAllCalendarEvents().filter(e => e.date === date);
}

export function getCalendarEventsByHca(hcaId) {
  return getAllCalendarEvents().filter(e => e.hcaId === hcaId);
}

export function getCalendarEventsByClient(clientId) {
  return getAllCalendarEvents().filter(e => e.clientId === clientId);
}

export function createCalendarEvent(data) {
  const events = getAllCalendarEvents();
  const event = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  events.push(event);
  save(KEYS.CALENDAR, events);
  return event;
}

export function updateCalendarEvent(id, patch) {
  const events = getAllCalendarEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) throw new Error('Calendar event not found');
  events[idx] = { ...events[idx], ...patch };
  save(KEYS.CALENDAR, events);
  return events[idx];
}

export function deleteCalendarEvent(id) {
  const events = getAllCalendarEvents().filter(e => e.id !== id);
  save(KEYS.CALENDAR, events);
}

// ─── Convenience: seed demo data for development ──────────────────────────────
export function seedDemoDataIfEmpty() {
  if (typeof window === 'undefined') return;
  if (getAllClients().length > 0) return; // already seeded

  // Demo client
  const client = createClient({
    name: 'Demo Client',
    email: 'demo@client.com',
    password: 'demo1234',
    mobile: '+254700000001',
    location: 'Nairobi',
    address: 'Karen, Nairobi',
    patients: [{ name: 'Margaret Wanjiku', age: 74, relationship: 'Mother', conditions: 'Diabetes, Hypertension', notes: '' }],
  });
  advanceClientJourney(client.id, 'tc_accepted');
  advanceClientJourney(client.id, 'acknowledged');
  updateClient(client.id, { lat: -1.3173, lng: 36.7069 }); // Karen, Nairobi

  // Demo HCA application → profile
  const app = createHcaApplication({
    fullName: 'Grace Akinyi',
    email: 'grace@hca.com',
    password: 'demo1234',
    mobile: '+254711000001',
    nationalId: '12345678',
    county: 'Nairobi',
    certLevel: 'Certificate III',
    yearsExp: 4,
    specialisations: ['Elderly Care', 'Dementia Care'],
  });
  const hcaProfile = createHcaProfile({
    applicationId: app.id,
    name: app.fullName,
    email: app.email,
    password: app.password,
    mobile: app.mobile,
    certLevel: app.certLevel,
    yearsExp: app.yearsExp,
    specialisations: app.specialisations,
    rate: 1800,
    rateSetAt: new Date().toISOString(),
  });
  updateHcaProfile(hcaProfile.id, { lat: -1.2708, lng: 36.8117 }); // Westlands

  // Demo invoice
  createInvoice({
    clientId: client.id,
    patientId: client.patients[0]?.id,
    description: 'Onboarding & Assessment Fee',
    lineItems: [{ label: 'Initial assessment visit', amount: 3500 }],
    subtotal: 3500,
    total: 3500,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  // Demo calendar event
  createCalendarEvent({
    title: 'Initial Assessment Visit – Demo Client',
    date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    time: '10:00',
    type: 'visit',
    clientId: client.id,
    hcaId: hcaProfile.id,
    createdBy: 'system',
  });
}

// ─── Patient management ────────────────────────────────────────────────────────

/** Add a patient to an existing client record */
export function addPatientToClient(clientId, patientData) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  const newPatient = { id: uid(), ...patientData };
  clients[idx].patients = [...(clients[idx].patients || []), newPatient];
  save(KEYS.CLIENTS, clients);
  logActivity({ type: 'patient_added', clientId, clientName: clients[idx].name, patientName: patientData.name });
  return clients[idx];
}

/** Update a patient record within a client */
export function updatePatient(clientId, patientId, patch) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  clients[idx].patients = (clients[idx].patients || []).map(p =>
    p.id === patientId ? { ...p, ...patch } : p
  );
  save(KEYS.CLIENTS, clients);
  return clients[idx];
}

/** Remove a patient from a client record */
export function removePatient(clientId, patientId) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  clients[idx].patients = (clients[idx].patients || []).filter(p => p.id !== patientId);
  save(KEYS.CLIENTS, clients);
  return clients[idx];
}

// ─── HCA Shortlisting ─────────────────────────────────────────────────────────

/** Toggle an HCA on/off a client's shortlist */
export function toggleHcaShortlist(clientId, hcaId) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  const list = clients[idx].shortlistedHcas || [];
  clients[idx].shortlistedHcas = list.includes(hcaId)
    ? list.filter(id => id !== hcaId)
    : [...list, hcaId];
  save(KEYS.CLIENTS, clients);
  logActivity({ type: 'hca_shortlisted', clientId, hcaId });
  return clients[idx];
}

/** Client selects a preferred HCA (sends request to admin) */
export function requestHcaMatch(clientId, hcaId, notes = '') {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  clients[idx].requestedHcaId = hcaId;
  clients[idx].requestedHcaNotes = notes;
  clients[idx].requestedHcaAt = new Date().toISOString();
  save(KEYS.CLIENTS, clients);
  logActivity({ type: 'hca_requested', clientId, clientName: clients[idx].name, hcaId });
  return clients[idx];
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Notification shape:
 * { id, clientId?, hcaId?, type, subject, body, read, createdAt }
 */
export function getAllNotifications() {
  return load(KEYS.NOTIFICATIONS) || [];
}

export function getNotificationsForClient(clientId) {
  return getAllNotifications().filter(n => n.clientId === clientId || n.clientId === '*');
}

export function createNotification({ clientId, hcaId, type, subject, body, emailTo }) {
  const notes = getAllNotifications();
  const n = {
    id: uid(),
    clientId: clientId || null,
    hcaId: hcaId || null,
    type,
    subject,
    body,
    emailTo: emailTo || null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notes.unshift(n);
  save(KEYS.NOTIFICATIONS, notes.slice(0, 200));
  return n;
}

export function markNotificationRead(id) {
  const notes = getAllNotifications();
  const idx = notes.findIndex(n => n.id === id);
  if (idx !== -1) { notes[idx].read = true; save(KEYS.NOTIFICATIONS, notes); }
}

export function markAllNotificationsRead(clientId) {
  const notes = getAllNotifications().map(n =>
    (n.clientId === clientId || !n.clientId) ? { ...n, read: true } : n
  );
  save(KEYS.NOTIFICATIONS, notes);
}

export function getUnreadCount(clientId) {
  return getNotificationsForClient(clientId).filter(n => !n.read).length;
}

// ─── Email template helpers ───────────────────────────────────────────────────

/** Trigger a welcome / onboarding email notification (stored in-app) */
export function sendWelcomeNotification(client) {
  return createNotification({
    clientId: client.id,
    type: 'welcome',
    subject: 'Welcome to E-Vive — Your account is ready',
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nWelcome to E-Vive HomeCare! Your client account has been successfully created.\n\nYour next step is to accept our Terms & Conditions in your dashboard — this will start your onboarding journey.\n\nOnce T&Cs are accepted, our team will acknowledge your application and reach out within 24 hours to discuss your care requirements.\n\nIf you have any questions, contact us:\n📧 hello@e-vive.co.ke\n📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
}

export function sendTcAcceptedNotification(client) {
  return createNotification({
    clientId: client.id,
    type: 'tc_accepted',
    subject: 'T&Cs Accepted — What happens next',
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nThank you for accepting the E-Vive Terms & Conditions.\n\nYour application is now in our queue. An E-Vive coordinator will:\n1. Acknowledge your application (within 24 hours)\n2. Call you to discuss your care needs\n3. Schedule a home visit\n4. Match you with the best HCA for your patients\n\nYou can track your journey at any time on your dashboard.\n\n📧 hello@e-vive.co.ke\n📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
}

export function sendVisitScheduledNotification(client, visitDate) {
  const d = visitDate ? new Date(visitDate).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : 'a date to be confirmed';
  return createNotification({
    clientId: client.id,
    type: 'visit_scheduled',
    subject: `Home Visit Confirmed — ${d}`,
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nYour E-Vive home assessment visit has been confirmed.\n\n📅 Date: ${d}\n📍 Location: ${client.address || client.location || 'Your home address'}\n\nWhat to expect:\n- An E-Vive coordinator will visit to assess your care environment\n- We will review your patients' specific needs\n- An HCA shortlist will be prepared following the visit\n\nPlease ensure someone is available to receive us.\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
}

export function sendInvoiceNotification(client, invoice) {
  return createNotification({
    clientId: client.id,
    type: 'invoice',
    subject: `Invoice ${invoice.invoiceNum} — KES ${(invoice.total||0).toLocaleString()} due ${invoice.dueDate}`,
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nAn invoice has been issued for your E-Vive account.\n\nInvoice: ${invoice.invoiceNum}\nDescription: ${invoice.description}\nAmount: KES ${(invoice.total||0).toLocaleString()}\nDue Date: ${invoice.dueDate}\n\nPayment options:\n📱 M-Pesa Paybill: 522100\n🏦 Equity Bank transfer\n\nPlease settle by the due date to avoid delays to your placement.\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Finance Team`,
  });
}

export function sendPasswordResetNotification(client, resetCode) {
  return createNotification({
    clientId: client.id,
    type: 'password_reset',
    subject: 'E-Vive Password Reset Code',
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nYou requested a password reset for your E-Vive account.\n\nYour one-time reset code is:\n\n    ${resetCode}\n\nThis code is valid for 15 minutes. Enter it on the password reset page.\n\nIf you did not request this reset, please contact us immediately:\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
}

export function sendHcaMatchedNotification(client, hcaName) {
  return createNotification({
    clientId: client.id,
    type: 'hca_matched',
    subject: `HCA Matched — ${hcaName} assigned to your account`,
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nGreat news! An HCA has been matched to your account.\n\n👩‍⚕️ Assigned HCA: ${hcaName}\n\nAn invoice will be issued shortly. Once payment is confirmed, your placement will become active and care can begin.\n\nYou can view your HCA's profile in the dashboard under the Patients tab.\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
}

export function sendPaymentConfirmedNotification(client) {
  return createNotification({
    clientId: client.id,
    type: 'payment_confirmed',
    subject: 'Payment Confirmed — Your placement is now active',
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nYour payment has been received and confirmed by E-Vive Finance.\n\n✅ Your placement is now ACTIVE.\n\nYour assigned HCA will begin care as per the agreed schedule. You can:\n- Track shifts and Cardex records in your dashboard\n- View invoices and payment history under Billing\n- Contact us at any time with questions\n\n📧 hello@e-vive.co.ke  📞 +254 720 053 455\n\nThank you for choosing E-Vive HomeCare.\n\nWarm regards,\nThe E-Vive Team`,
  });
}

// ─── Admin session (RBAC) ────────────────────────────────────────────────────

const ADMIN_KEYS = {
  SESSION: 'evive_admin_session',
  RBAC:    'evive_rbac',
};

/** Roles and their default permissions */
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

/** Return the RBAC rule map: { [userId]: { role, permissions[] } } */
export function getRbacRules() {
  return load(ADMIN_KEYS.RBAC) || {};
}

export function setRbacRule(userId, role, permissions) {
  const rules = getRbacRules();
  rules[userId] = { role, permissions, updatedAt: new Date().toISOString() };
  save(ADMIN_KEYS.RBAC, rules);
  logActivity({ type:'rbac_updated', userId, role });
  return rules[userId];
}

export function removeRbacRule(userId) {
  const rules = getRbacRules();
  delete rules[userId];
  save(ADMIN_KEYS.RBAC, rules);
}

/** Check if a given role/user has a specific permission */
export function hasPermission(roleOrPerms, perm) {
  if (!roleOrPerms) return false;
  const perms = Array.isArray(roleOrPerms) ? roleOrPerms : (ROLE_DEFAULTS[roleOrPerms]?.permissions || []);
  return perms.includes('all') || perms.includes(perm);
}

export function getAdminSession() {
  return load(ADMIN_KEYS.SESSION);
}

export function setAdminSession(user) {
  save(ADMIN_KEYS.SESSION, { ...user, loginAt: new Date().toISOString() });
}

export function clearAdminSession() {
  if (typeof window !== 'undefined') localStorage.removeItem(ADMIN_KEYS.SESSION);
}

// ─── HCA Schedule → Calendar sync ────────────────────────────────────────────

/**
 * Create a shift AND a linked calendar event in one call.
 * Returns { shift, event }.
 */
export function createShiftWithEvent(shiftData) {
  const shift = createShift(shiftData);

  // Map shift type to event type
  const typeMap = { day: 'shift', night: 'shift', 'live-in': 'shift' };

  // Find names for better event title
  const hcaName = (getAllHcaProfiles().find(h=>h.id===shiftData.hcaId)?.name) || 'HCA';
  const client  = getAllClients().find(c=>c.id===shiftData.clientId);
  const patient = client?.patients?.find(p=>p.id===shiftData.patientId);
  const patName = patient?.name || client?.name || 'Patient';

  const event = createCalendarEvent({
    title:    `${hcaName} — ${patName} (${shiftData.type||'Shift'})`,
    date:     shiftData.date,
    time:     shiftData.startTime || '07:00',
    type:     typeMap[shiftData.type] || 'shift',
    hcaId:    shiftData.hcaId,
    clientId: shiftData.clientId,
    shiftId:  shift.id,
    notes:    shiftData.notes || '',
    createdBy:'system',
  });

  return { shift, event };
}

/**
 * When an HCA clocks in (from the HCA dashboard), record it and
 * optionally create a calendar event if one doesn't exist for today.
 */
export function clockInHca(hcaId, { clientId, patientId, lat, lng } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const shifts = getAllShifts();
  // Find an existing scheduled shift for today
  const existing = shifts.find(s => s.hcaId === hcaId && s.date === today && s.status === 'scheduled');
  const now = new Date().toISOString();
  if (existing) {
    updateShift(existing.id, { status: 'in-progress', clockIn: now, clockInLat: lat, clockInLng: lng });
    logActivity({ type: 'hca_clock_in', hcaId, shiftId: existing.id, clientId });
    return existing;
  }
  // No scheduled shift — create ad-hoc
  const shift = createShift({ hcaId, clientId, patientId, date: today, type: 'day', status: 'in-progress', clockIn: now, clockInLat: lat, clockInLng: lng });
  logActivity({ type: 'hca_clock_in', hcaId, shiftId: shift.id, clientId });
  return shift;
}

export function clockOutHca(hcaId, shiftId) {
  const now = new Date().toISOString();
  const shift = updateShift(shiftId, { status: 'completed', clockOut: now });
  logActivity({ type: 'hca_clock_out', hcaId, shiftId });
  return shift;
}

/**
 * Get all calendar-displayable items (events + shifts) for a given month.
 * Each item has: { id, date (YYYY-MM-DD), title, type, source:'event'|'shift', ... }
 */
export function getCalendarItemsForMonth(year, month) {
  const prefix = `${year}-${String(month+1).padStart(2,'0')}`;
  const events = getAllCalendarEvents().filter(e => e.date?.startsWith(prefix));
  const shifts  = getAllShifts().filter(s => s.date?.startsWith(prefix));

  const hcaProfiles = getAllHcaProfiles();
  const clients     = getAllClients();

  const shiftItems = shifts.map(s => {
    const hca    = hcaProfiles.find(h => h.id === s.hcaId);
    const client = clients.find(c => c.id === s.clientId);
    const patient= client?.patients?.find(p => p.id === s.patientId);
    return {
      id:       s.id,
      date:     s.date,
      time:     s.startTime || '07:00',
      title:    `${hca?.name||'HCA'} — ${patient?.name||client?.name||'Patient'}`,
      type:     'shift',
      status:   s.status,
      hcaId:    s.hcaId,
      clientId: s.clientId,
      source:   'shift',
      shiftType: s.type,
    };
  });

  const eventItems = events.map(e => ({ ...e, source: 'event' }));

  // Deduplicate: if a shift already has a linked event (same shiftId), skip the event
  const linkedEventIds = new Set(shifts.map(s => s.linkedEventId).filter(Boolean));
  const filteredEvents = eventItems.filter(e => !linkedEventIds.has(e.id));

  return [...filteredEvents, ...shiftItems].sort((a,b) => (a.time||'').localeCompare(b.time||''));
}

// ─── Account deletion requests ────────────────────────────────────────────────

/** Client requests account deletion */
export function requestAccountDeletion(clientId) {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) throw new Error('Client not found');
  const client = clients[idx];
  if (client.deletionRequested) return client; // already requested
  clients[idx].deletionRequested = true;
  clients[idx].deletionRequestedAt = new Date().toISOString();
  save(KEYS.CLIENTS, clients);
  logActivity({ type: 'deletion_requested', clientId, clientName: client.name });
  createNotification({
    clientId,
    type: 'deletion_request',
    subject: 'Account Deletion Request Received',
    emailTo: client.email,
    body: `Dear ${client.name.split(' ')[0]},\n\nWe have received your request to close your E-Vive account.\n\nOur team will review your request and contact you within 2 business days. Please note:\n\n- Any outstanding invoices must be settled before account closure\n- You will receive 14 days' written notice before final account closure\n- Your data will be handled in accordance with Kenya's Data Protection Act 2019\n\nIf you submitted this request in error, please contact us immediately:\n📧 hello@e-vive.co.ke\n📞 +254 720 053 455\n\nWarm regards,\nThe E-Vive Team`,
  });
  return clients[idx];
}

/** HCA requests account/profile deletion */
export function requestHcaDeletion(hcaId) {
  const profiles = getAllHcaProfiles();
  const idx = profiles.findIndex(h => h.id === hcaId);
  if (idx === -1) throw new Error('HCA profile not found');
  if (profiles[idx].deletionRequested) return profiles[idx];
  profiles[idx].deletionRequested = true;
  profiles[idx].deletionRequestedAt = new Date().toISOString();
  save(KEYS.HCA_PROFILES, profiles);
  logActivity({ type: 'hca_deletion_requested', hcaId, name: profiles[idx].name });
  return profiles[idx];
}

// ─── Super Admin: Announcements ───────────────────────────────────────────────

export function getAllAnnouncements() {
  return load('evive_announcements') || [];
}

export function createAnnouncement({ title, body, target = 'all', type = 'info', priority = 'normal' }) {
  const items = getAllAnnouncements();
  const item = {
    id: uid(), title, body, target, type, priority,
    published: true,
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  save('evive_announcements', items);
  logActivity({ type: 'announcement_created', title });
  return item;
}

export function updateAnnouncement(id, patch) {
  const items = getAllAnnouncements();
  const idx = items.findIndex(a => a.id === id);
  if (idx === -1) throw new Error('Announcement not found');
  items[idx] = { ...items[idx], ...patch };
  save('evive_announcements', items);
  return items[idx];
}

export function deleteAnnouncement(id) {
  save('evive_announcements', getAllAnnouncements().filter(a => a.id !== id));
}

// ─── Super Admin: Newsletter ──────────────────────────────────────────────────

export function getAllNewsletters() {
  return load('evive_newsletter') || [];
}

export function createNewsletter({ name, subject, body, targetAudience = 'all' }) {
  const items = getAllNewsletters();
  const item = {
    id: uid(), name, subject, body, targetAudience,
    status: 'draft', sentAt: null, recipientCount: 0,
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  save('evive_newsletter', items);
  return item;
}

export function updateNewsletter(id, patch) {
  const items = getAllNewsletters();
  const idx = items.findIndex(n => n.id === id);
  if (idx === -1) throw new Error('Newsletter not found');
  items[idx] = { ...items[idx], ...patch };
  save('evive_newsletter', items);
  return items[idx];
}

export function deleteNewsletter(id) {
  save('evive_newsletter', getAllNewsletters().filter(n => n.id !== id));
}

export function markNewsletterSent(id) {
  const clients = getAllClients();
  const hcas    = getAllHcaProfiles();
  const nl = getAllNewsletters().find(n => n.id === id);
  if (!nl) throw new Error('Newsletter not found');
  const count = nl.targetAudience === 'clients' ? clients.length :
                nl.targetAudience === 'hcas'    ? hcas.length :
                clients.length + hcas.length;
  const updated = updateNewsletter(id, { status: 'sent', sentAt: new Date().toISOString(), recipientCount: count });
  logActivity({ type: 'newsletter_sent', subject: nl.subject, recipients: count });
  return updated;
}

// ─── Super Admin: Pricing & Discounts ─────────────────────────────────────────

const DEFAULT_PRICING = {
  rates: {
    day_shift:   { label: 'Day Shift (8h)',           kes: 3500  },
    night_shift: { label: 'Night Shift (12h)',         kes: 4500  },
    live_in:     { label: 'Live-In (monthly)',         kes: 35000 },
    per_hour:    { label: 'Per Hour',                  kes: 400   },
    assessment:  { label: 'Assessment Fee (one-time)', kes: 3500  },
    emergency:   { label: 'Emergency Call-Out',        kes: 6000  },
  },
};

export function getPricingConfig() {
  return load('evive_pricing') || DEFAULT_PRICING;
}

export function savePricingConfig(config) {
  save('evive_pricing', { ...config, updatedAt: new Date().toISOString() });
  logActivity({ type: 'pricing_updated' });
}

export function getAllDiscountCodes() {
  return load('evive_discounts') || [];
}

export function createDiscountCode({ code, type = 'percent', value, minSpend = 0, description = '', expiresAt = null }) {
  const items = getAllDiscountCodes();
  const normalized = code.toUpperCase().replace(/\s+/g, '');
  if (items.find(d => d.code === normalized)) throw new Error('Discount code already exists');
  const item = {
    id: uid(), code: normalized, type, value: Number(value),
    minSpend: Number(minSpend), description, expiresAt,
    active: true, usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  save('evive_discounts', items);
  logActivity({ type: 'discount_created', code: normalized });
  return item;
}

export function updateDiscountCode(id, patch) {
  const items = getAllDiscountCodes();
  const idx = items.findIndex(d => d.id === id);
  if (idx === -1) throw new Error('Discount code not found');
  items[idx] = { ...items[idx], ...patch };
  save('evive_discounts', items);
  return items[idx];
}

export function deleteDiscountCode(id) {
  save('evive_discounts', getAllDiscountCodes().filter(d => d.id !== id));
}

// ─── Super Admin: Cardex QA ───────────────────────────────────────────────────

export function getAllCardexEntries() {
  return load(KEYS.CARDEX) || [];
}

export function addCardexQaComment(entryId, { comment, flagged = false, adminId = 'super_admin' }) {
  const entries = getAllCardexEntries();
  const idx = entries.findIndex(e => e.id === entryId);
  if (idx === -1) throw new Error('Cardex entry not found');
  entries[idx].qaComments = [
    ...(entries[idx].qaComments || []),
    { id: uid(), comment, flagged, adminId, createdAt: new Date().toISOString() },
  ];
  if (flagged) entries[idx].flagged = true;
  save(KEYS.CARDEX, entries);
  logActivity({ type: 'cardex_qa_comment', entryId, adminId });
  return entries[idx];
}

// ─── Super Admin: Map Markers ─────────────────────────────────────────────────

export function updateClientCoords(clientId, lat, lng) {
  return updateClient(clientId, { lat: Number(lat), lng: Number(lng) });
}

export function updateHcaCoords(hcaId, lat, lng) {
  return updateHcaProfile(hcaId, { lat: Number(lat), lng: Number(lng) });
}

/**
 * All entities that have coordinates set — for Leaflet marker rendering.
 * type: 'client' | 'hca'
 * color: '#004A99' (client/navy) | '#059669' (HCA/green)
 */
export function getAllMapMarkers() {
  const markers = [];
  getAllClients().forEach(c => {
    if (c.lat && c.lng) {
      markers.push({
        id: c.id, type: 'client',
        lat: c.lat, lng: c.lng,
        label: c.name,
        sub: c.location || c.address || '',
        color: '#004A99',
        patients: (c.patients || []).map(p => p.name),
      });
      // Patient markers at same coords with slight label offset
      (c.patients || []).forEach((p, i) => {
        markers.push({
          id: `pat-${p.id}`, type: 'patient',
          lat: c.lat, lng: c.lng,
          label: p.name,
          sub: `Patient · ${c.name}`,
          color: '#d97706',
          patients: [],
          _offset: i + 1,
        });
      });
    }
  });
  getAllHcaProfiles().forEach(h => {
    if (h.lat && h.lng) {
      markers.push({
        id: h.id, type: 'hca',
        lat: h.lat, lng: h.lng,
        label: h.name,
        sub: `${h.certLevel || 'HCA'} · ${h.employeeId || ''}`,
        color: '#059669',
        patients: [],
      });
    }
  });
  return markers;
}

/**
 * All entities (with or without coords) for the map sidebar entity list.
 */
export function getAllMapEntities() {
  const entities = [];
  getAllClients().forEach(c => {
    entities.push({
      id: c.id, type: 'client',
      label: c.name, sub: c.location || c.address || '',
      lat: c.lat || null, lng: c.lng || null,
      color: '#004A99',
    });
    (c.patients || []).forEach(p => {
      entities.push({
        id: p.id, type: 'patient',
        label: p.name, sub: `Patient · ${c.name}`,
        lat: c.lat || null, lng: c.lng || null,
        color: '#d97706', parentClientId: c.id,
      });
    });
  });
  getAllHcaProfiles().forEach(h => {
    entities.push({
      id: h.id, type: 'hca',
      label: h.name, sub: `${h.certLevel || 'HCA'} · ${h.employeeId || ''}`,
      lat: h.lat || null, lng: h.lng || null,
      color: '#059669',
    });
  });
  return entities;
}
