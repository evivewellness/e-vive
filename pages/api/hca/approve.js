/**
 * Approve an HCA application: create the profile, and issue the initial
 * password.
 *
 * This is a route rather than a table insert for one reason — the password.
 * It is generated here with `crypto.randomBytes` (the browser used
 * `Math.random`, which is not a source of secrets), hashed with scrypt before
 * the row is written, and returned to the caller exactly once so the admin
 * screen can show it and email it. The database never holds a readable
 * password, not even between approval and the HCA's first sign-in.
 *
 * Everything else the browser used to do — deriving the next employee ID,
 * carrying the application's photo, certificates and DOB forward — moves with
 * it, because splitting the write in two would leave a profile that exists
 * without its documents if the second half failed.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { requirePermission, sessionSecretConfigured, hashPassword } from '../../../lib/serverAuth';
import { randomInt } from 'crypto';

// No look-alike characters: this is read off a screen and typed from an email.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const PASSWORD_LENGTH = 12;

function generateInitialPassword() {
  let out = '';
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return out;
}

async function nextEmployeeId(db) {
  // Derived from the highest existing suffix rather than the row count: after
  // any profile is deleted, count-based numbering reissues an ID that still
  // belongs to a surviving row and trips the unique constraint.
  const { data } = await db.from('hca_profiles').select('employee_id');
  let maxNum = 1000;
  for (const row of data || []) {
    const m = /^HCA-(\d+)$/.exec(row.employee_id || '');
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  return `HCA-${maxNum + 1}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const auth = requirePermission(req, 'hcas');
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const {
    applicationId, name, email, mobile, certLevel, yearsExp, specialisations,
    rate, gender, languages, shiftPreferences, periodPreference, travelOptions,
    bio, ageRange, lat, lng,
  } = req.body || {};

  const db = getSupabaseAdmin();

  // Carry the application's submitted detail forward — DOB, photo,
  // certificates, education. These otherwise lived only in the application's
  // form_data and vanished the moment it was approved.
  let sourceApp = null;
  if (applicationId) {
    const { data } = await db.from('hca_applications').select('*').eq('id', applicationId).maybeSingle();
    sourceApp = data;
  }
  const fd = sourceApp?.form_data || {};
  const now = new Date().toISOString();

  const certifications = (fd.certifications || []).map(c => ({
    name: c.name || '', issuer: c.issuer || '', year: c.year || '',
    fileName: c.fileName || null, fileType: c.fileType || null,
    filePath: c.filePath || null, fileDataUrl: c.fileDataUrl || null,
  }));

  const initialPassword = generateInitialPassword();

  const { data: row, error } = await db.from('hca_profiles').insert({
    application_id: applicationId || null,
    employee_id: await nextEmployeeId(db),
    name: name || sourceApp?.full_name || '',
    email: (email || sourceApp?.email || '').toLowerCase(),
    password: hashPassword(initialPassword),
    password_algo: 'scrypt',
    mobile: mobile || sourceApp?.mobile || '',
    cert_level: certLevel || '',
    years_exp: Number(yearsExp) || 0,
    specialisations: specialisations || [],
    rate: Number(rate) || 2000,
    rate_set_at: now,
    status: 'active',
    gender: gender || 'Not specified',
    languages: languages || ['English', 'Kiswahili'],
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
    journey_dates: { ...(sourceApp?.journey_dates || {}), approved: now },
    dob: fd.dob || null,
    photo: fd.profilePhoto?.filePath || fd.profilePhoto?.fileDataUrl || null,
    certifications,
    education: fd.education || '',
    cultural_exp: fd.culturalExp || '',
    smartphone: fd.smartphone || '',
    location: fd.address || sourceApp?.county || '',
    lat: lat ?? fd.homeLat ?? null,
    lng: lng ?? fd.homeLng ?? null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  if (applicationId) {
    await db.from('hca_applications').update({ status: 'approved' }).eq('id', applicationId);
  }

  await db.from('activity_log').insert({
    type: 'hca_approved',
    data: { hcaId: row.id, name: row.name, employeeId: row.employee_id, approvedBy: auth.session.email },
  }).then(() => {}, () => {});

  // The only time this password is ever readable. The caller shows it once and
  // emails it; the stored value is a hash.
  return res.status(200).json({
    profile: { id: row.id, employeeId: row.employee_id, name: row.name, email: row.email },
    initialPassword,
  });
}
