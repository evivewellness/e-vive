/**
 * Applicant self-service edit, authenticated by the edit link alone.
 *
 * The applicant has no account and no session — the token in the emailed link
 * is the credential. That makes this the wrong shape for the table policy in
 * lib/dbPolicy.js (which authorises by role), so the flow lives here instead
 * and `hca_applications` stays closed to anonymous reads entirely.
 *
 * What the token permits is deliberately narrow: it returns only the fields
 * the admin opened for correction, accepts only those fields back, and is
 * spent on submission.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';

const NEUTRAL = 'This edit link is invalid or has expired.';

// Mirrors lib/store.js submitApplicationEdit — the fields an admin can ask an
// applicant to correct.
const TEXT_FIELDS = ['fullName', 'email', 'mobile', 'county', 'certLevel', 'bio', 'specialisations'];
const COLUMN = {
  fullName: 'full_name', email: 'email', mobile: 'mobile', county: 'county',
  certLevel: 'cert_level', bio: 'bio', specialisations: 'specialisations',
  yearsExp: 'years_exp',
};

export default async function handler(req, res) {
  if (!serviceRoleConfigured()) return configError(res);

  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ error: NEUTRAL });

  const db = getSupabaseAdmin();
  const { data: row } = await db.from('hca_applications')
    .select('*').eq('edit_token', token).maybeSingle();

  const editAccess = row?.form_data?.editAccess;
  if (!row || !editAccess) return res.status(404).json({ error: NEUTRAL });

  const allowed = editAccess.fields || [];

  if (req.method === 'GET') {
    // Only what the applicant needs to see to make the correction.
    return res.status(200).json({
      application: {
        id: row.id,
        fullName: row.full_name, email: row.email, mobile: row.mobile,
        county: row.county, certLevel: row.cert_level, yearsExp: row.years_exp,
        specialisations: row.specialisations || [], bio: row.bio,
        formData: {
          profilePhoto: row.form_data?.profilePhoto || null,
          certifications: row.form_data?.certifications || [],
          editAccess,
        },
      },
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const patch = req.body || {};
  const dbPatch = { edit_token: null };   // single-use — spend it on submission

  for (const key of TEXT_FIELDS) {
    if (allowed.includes(key) && patch[key] !== undefined) dbPatch[COLUMN[key]] = patch[key];
  }
  if (allowed.includes('yearsExp') && patch.yearsExp !== undefined) {
    dbPatch.years_exp = Number(patch.yearsExp) || 0;
  }

  const newFormData = { ...(row.form_data || {}) };
  if (allowed.includes('profilePhoto') && patch.profilePhoto !== undefined) {
    newFormData.profilePhoto = patch.profilePhoto;
  }
  if (allowed.includes('certifications') && patch.certifications !== undefined) {
    newFormData.certifications = patch.certifications;
  }
  newFormData.editAccess = { ...editAccess, submitted: true, submittedAt: new Date().toISOString() };
  dbPatch.form_data = newFormData;

  const { error } = await db.from('hca_applications').update(dbPatch).eq('id', row.id);
  if (error) return res.status(500).json({ error: 'Could not save your updates. Please try again.' });

  await db.from('activity_log').insert({
    type: 'hca_application_edited',
    data: { applicationId: row.id, hcaName: dbPatch.full_name || row.full_name, fields: allowed },
  }).then(() => {}, () => {});

  return res.status(200).json({ ok: true });
}
