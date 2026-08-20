/**
 * HCA application intake.
 *
 * Anonymous, but not unmediated. Three reasons this is a route rather than a
 * table insert:
 *
 *  1. The applicant chooses a password. It is hashed with scrypt here, so an
 *     application has never held a readable password.
 *  2. The duplicate check reads every application and profile. That is a
 *     reasonable thing for the server to do and an unreasonable thing to hand
 *     to an anonymous browser, which is what used to happen.
 *  3. `status` and `journey_stage` are set here, so nobody can apply as
 *     already-approved.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { hashPassword } from '../../../lib/serverAuth';
import { consumeRateLimit, clientIp, tooManyRequests, LIMITS } from '../../../lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizeEmail = v => String(v || '').trim().toLowerCase();

// Kenyan-number-aware normalization so "0722…", "+254722…", "254722…" and
// "722…" all compare equal. Same rule lib/store.js used before this moved
// server-side — duplicate detection must not change meaning in the move.
function normalizeMobile(m) {
  if (!m) return '';
  const digits = String(m).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return '254' + digits.slice(1);
  if (digits.length === 9) return '254' + digits;
  return digits;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured()) return configError(res);

  const {
    fullName, name, email, password, mobile, homeLat, homeLng, county,
    certLevel, yearsExp, specialisations, plan, bio, tcAccepted, ...rest
  } = req.body || {};

  const applicantName = String(fullName || name || '').trim();
  const cleanEmail = normalizeEmail(email);
  if (!applicantName) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const db = getSupabaseAdmin();

  // Applications carry file uploads; unthrottled they are an easy way to fill
  // the database.
  const gate = await consumeRateLimit(db, { key: `apply:ip:${clientIp(req)}`, ...LIMITS.applicationPerIp });
  if (!gate.ok) return tooManyRequests(res, gate.retryAfter, 'Too many applications from here. Please try again later.');

  const dup = await findDuplicate(db, cleanEmail, mobile);
  if (dup) {
    if (dup.kind === 'profile') {
      return res.status(409).json({ error: 'An HCA account with this email or mobile number already exists. Please log in instead of applying again.' });
    }
    return res.status(409).json({
      error: dup.row.status === 'pending'
        ? 'An application with this email or mobile number is already pending review. Please wait for our team to respond before submitting again.'
        : 'This email or mobile number is already registered as an approved HomeCare Assistant.',
    });
  }

  const now = new Date().toISOString();
  const journeyDates = tcAccepted
    ? { application_submitted: now, tc_accepted: now }
    : { application_submitted: now };

  const { data, error } = await db.from('hca_applications').insert({
    status: 'pending',
    full_name: applicantName,
    email: cleanEmail,
    // Hashed on the way in. The approval flow copies this value onto the new
    // profile, which is why hca_profiles.password_algo is set from its shape.
    password: password ? hashPassword(password) : '',
    mobile: String(mobile || '').trim(),
    county: county || '',
    cert_level: certLevel || '',
    years_exp: Number(yearsExp) || 0,
    specialisations: specialisations || [],
    plan: plan || 'Review and Listing Fee',
    bio: bio || '',
    form_data: { ...rest, homeLat: homeLat || null, homeLng: homeLng || null },
    journey_stage: tcAccepted ? 'tc_accepted' : 'application_submitted',
    journey_dates: journeyDates,
  }).select('id, status, applied_at, full_name, email, mobile, county, cert_level, years_exp, specialisations, plan, bio, journey_stage, journey_dates').single();

  if (error) {
    // The check above is not atomic — two near-simultaneous submissions can
    // both pass it. The partial unique index on active applications' email is
    // what actually holds the line.
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An application with this email address is already pending review or already an approved HomeCare Assistant. Please wait for our team to respond, or log in if you are already approved.' });
    }
    return res.status(500).json({ error: error.message });
  }

  await db.from('activity_log').insert({
    type: 'hca_applied',
    data: { hcaName: applicantName, email: cleanEmail },
  }).then(() => {}, () => {});

  return res.status(200).json({ application: data });
}

async function findDuplicate(db, normEmail, mobile) {
  const normMobile = normalizeMobile(mobile);
  if (!normEmail && !normMobile) return null;

  const [{ data: apps }, { data: profiles }] = await Promise.all([
    db.from('hca_applications').select('id, status, email, mobile'),
    db.from('hca_profiles').select('id, email, mobile'),
  ]);

  const matches = row =>
    (normEmail && normalizeEmail(row.email) === normEmail) ||
    (normMobile && normalizeMobile(row.mobile) === normMobile);

  const dupProfile = (profiles || []).find(matches);
  if (dupProfile) return { kind: 'profile', row: dupProfile };

  const dupApp = (apps || []).find(a => a.status !== 'rejected' && matches(a));
  if (dupApp) return { kind: 'application', row: dupApp };

  return null;
}
