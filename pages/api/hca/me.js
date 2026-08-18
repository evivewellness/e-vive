/**
 * An HCA's own profile, in full.
 *
 * Browsing other HCAs and reading your own record are different operations
 * with different column sets, so they are different endpoints. The table policy
 * gives an HCA the same public view of the directory that a family gets; this
 * route is the only way to read the private half — date of birth, uploaded
 * certificates, submitted application detail — and it can only ever return the
 * row named by the session cookie.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';

// Everything except `password` and `password_algo`.
const SELF_COLUMNS = [
  'id', 'application_id', 'employee_id', 'name', 'email', 'mobile', 'cert_level',
  'years_exp', 'specialisations', 'rate', 'rate_set_at', 'status', 'rating',
  'lat', 'lng', 'deletion_requested', 'deletion_requested_at', 'approved_at',
  'gender', 'languages', 'shift_preferences', 'period_preference',
  'travel_options', 'bio', 'age_range', 'available', 'review_count',
  'placement_count', 'dob', 'education', 'cultural_exp', 'smartphone',
  'location', 'journey_stage', 'journey_dates', 'photo', 'certifications',
  'submitted_info',
].join(', ');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  if (!session || session.role !== 'hca') return res.status(401).json({ error: 'Not signed in.' });

  const { data, error } = await getSupabaseAdmin()
    .from('hca_profiles').select(SELF_COLUMNS).eq('id', session.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ profile: data || null });
}
