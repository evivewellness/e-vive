/**
 * Platform settings — retention periods, consent ownership and sharing
 * defaults. These are policy decisions owned by the business, configured in
 * Admin → Settings, not constants in the source.
 *
 * Shape and defaults live here so the API routes, the admin form and the
 * migration all agree. Safe to import from either side (no secrets).
 */

export const DEFAULT_PLATFORM_SETTINGS = {
  // Retention, in days. 0 = keep indefinitely.
  retainCardexDays:        2555,   // ~7 years — clinical record
  retainShareTokensDays:   30,
  retainShareAuditDays:    2555,
  retainNotificationsDays: 365,
  retainGeneratedPdfsDays: 0,      // 0 = never persisted; generated on demand

  // Who may authorise an outward share.
  consentOwner:     'client',      // client | patient | either
  consentStatement: 'I confirm I have the authority to share this patient’s health information, and that each recipient has a legitimate reason to receive it.',

  // Sharing defaults.
  shareDefaultExpiryDays:  7,
  shareMaxExpiryDays:      30,
  shareMaxRecipients:      5,
  shareMaxPerHour:         5,
  shareRequireAccessCode:  true,
  shareIncludeHandover:    false,  // data minimisation: opt-in
  shareMinJustificationLen: 20,

  // Attendance geofence. See lib/geofence.js for why these values and not
  // the 10 m the dashboard originally hardcoded.
  geofenceRadiusM:          75,
  geofenceMaxAccuracyM:     100,
  geofenceGraceCapM:        50,
  geofenceEnforcement:      'block',   // block | warn
  geofenceRequireReference: false,
};

export const CONSENT_OWNER_OPTIONS = [
  { value: 'client',  label: 'Client only',              hint: 'The account holder may share on the patient’s behalf.' },
  { value: 'patient', label: 'Patient consent required', hint: 'A recorded patient consent is required before any share.' },
  { value: 'either',  label: 'Client, patient noted',    hint: 'Client may act; patient consent recorded where available.' },
];

export const RETENTION_FIELDS = [
  { key: 'retainCardexDays',        label: 'Cardex entries',        hint: 'Clinical record. Kenyan practice is commonly 7 years.' },
  { key: 'retainShareTokensDays',   label: 'Expired share links',   hint: 'How long a used/expired recipient token is kept after expiry.' },
  { key: 'retainShareAuditDays',    label: 'Share audit log',       hint: 'Evidence of who disclosed what, to whom, and why.' },
  { key: 'retainNotificationsDays', label: 'Notifications',         hint: 'In-app notification history.' },
  { key: 'retainGeneratedPdfsDays', label: 'Generated reports',     hint: '0 = never stored on disk (recommended).' },
];

export const GEOFENCE_FIELDS = [
  { key: 'geofenceRadiusM',      label: 'Clock-in radius (m)', min: 20, max: 2000,
    hint: 'How far from the patient’s address still counts as on site. Consumer GPS is 5–20 m outdoors and much worse indoors — a radius under about 50 m will refuse honest clock-ins.' },
  { key: 'geofenceMaxAccuracyM', label: 'Worst usable fix (m)', min: 20, max: 1000,
    hint: 'A position vaguer than this is refused and the HCA is asked to try again, rather than being judged on a reading that means nothing.' },
  { key: 'geofenceGraceCapM',    label: 'Accuracy allowance cap (m)', min: 0, max: 500,
    hint: 'How much of a fix’s own uncertainty may be added to the radius before a position counts as outside. Caps how far a vague fix can stretch the fence.' },
];

export function settingsFromDb(r) {
  if (!r) return { ...DEFAULT_PLATFORM_SETTINGS };
  return {
    retainCardexDays:        r.retain_cardex_days        ?? DEFAULT_PLATFORM_SETTINGS.retainCardexDays,
    retainShareTokensDays:   r.retain_share_tokens_days  ?? DEFAULT_PLATFORM_SETTINGS.retainShareTokensDays,
    retainShareAuditDays:    r.retain_share_audit_days   ?? DEFAULT_PLATFORM_SETTINGS.retainShareAuditDays,
    retainNotificationsDays: r.retain_notifications_days ?? DEFAULT_PLATFORM_SETTINGS.retainNotificationsDays,
    retainGeneratedPdfsDays: r.retain_generated_pdfs_days?? DEFAULT_PLATFORM_SETTINGS.retainGeneratedPdfsDays,
    consentOwner:            r.consent_owner             ?? DEFAULT_PLATFORM_SETTINGS.consentOwner,
    consentStatement:        r.consent_statement         ?? DEFAULT_PLATFORM_SETTINGS.consentStatement,
    shareDefaultExpiryDays:  r.share_default_expiry_days ?? DEFAULT_PLATFORM_SETTINGS.shareDefaultExpiryDays,
    shareMaxExpiryDays:      r.share_max_expiry_days     ?? DEFAULT_PLATFORM_SETTINGS.shareMaxExpiryDays,
    shareMaxRecipients:      r.share_max_recipients      ?? DEFAULT_PLATFORM_SETTINGS.shareMaxRecipients,
    shareMaxPerHour:         r.share_max_per_hour        ?? DEFAULT_PLATFORM_SETTINGS.shareMaxPerHour,
    shareRequireAccessCode:  r.share_require_access_code ?? DEFAULT_PLATFORM_SETTINGS.shareRequireAccessCode,
    shareIncludeHandover:    r.share_include_handover    ?? DEFAULT_PLATFORM_SETTINGS.shareIncludeHandover,
    shareMinJustificationLen:r.share_min_justification_len ?? DEFAULT_PLATFORM_SETTINGS.shareMinJustificationLen,
    geofenceRadiusM:         r.geofence_radius_m           ?? DEFAULT_PLATFORM_SETTINGS.geofenceRadiusM,
    geofenceMaxAccuracyM:    r.geofence_max_accuracy_m     ?? DEFAULT_PLATFORM_SETTINGS.geofenceMaxAccuracyM,
    geofenceGraceCapM:       r.geofence_grace_cap_m        ?? DEFAULT_PLATFORM_SETTINGS.geofenceGraceCapM,
    geofenceEnforcement:     r.geofence_enforcement        ?? DEFAULT_PLATFORM_SETTINGS.geofenceEnforcement,
    geofenceRequireReference:r.geofence_require_reference  ?? DEFAULT_PLATFORM_SETTINGS.geofenceRequireReference,
    updatedAt:               r.updated_at,
    updatedBy:               r.updated_by,
  };
}

export function settingsToDb(s) {
  return {
    id: 1,
    retain_cardex_days:        clampInt(s.retainCardexDays, 0, 36500),
    retain_share_tokens_days:  clampInt(s.retainShareTokensDays, 0, 36500),
    retain_share_audit_days:   clampInt(s.retainShareAuditDays, 0, 36500),
    retain_notifications_days: clampInt(s.retainNotificationsDays, 0, 36500),
    retain_generated_pdfs_days:clampInt(s.retainGeneratedPdfsDays, 0, 36500),
    consent_owner:             CONSENT_OWNER_OPTIONS.some(o => o.value === s.consentOwner) ? s.consentOwner : 'client',
    consent_statement:         String(s.consentStatement || DEFAULT_PLATFORM_SETTINGS.consentStatement).slice(0, 2000),
    share_default_expiry_days: clampInt(s.shareDefaultExpiryDays, 1, 365),
    share_max_expiry_days:     clampInt(s.shareMaxExpiryDays, 1, 365),
    share_max_recipients:      clampInt(s.shareMaxRecipients, 1, 50),
    share_max_per_hour:        clampInt(s.shareMaxPerHour, 1, 100),
    share_require_access_code: Boolean(s.shareRequireAccessCode),
    share_include_handover:    Boolean(s.shareIncludeHandover),
    share_min_justification_len: clampInt(s.shareMinJustificationLen, 0, 1000),
    geofence_radius_m:         clampInt(s.geofenceRadiusM, 20, 2000),
    geofence_max_accuracy_m:   clampInt(s.geofenceMaxAccuracyM, 20, 1000),
    geofence_grace_cap_m:      clampInt(s.geofenceGraceCapM, 0, 500),
    geofence_enforcement:      s.geofenceEnforcement === 'warn' ? 'warn' : 'block',
    geofence_require_reference: Boolean(s.geofenceRequireReference),
    updated_at: new Date().toISOString(),
    updated_by: s.updatedBy || 'admin',
  };
}

export function clampInt(v, min, max) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
