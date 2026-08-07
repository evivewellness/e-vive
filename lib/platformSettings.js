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
    updated_at: new Date().toISOString(),
    updated_by: s.updatedBy || 'admin',
  };
}

export function clampInt(v, min, max) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
