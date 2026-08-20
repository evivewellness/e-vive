/**
 * Read a stored document.
 *
 * The bucket is private, so this mints a short-lived signed URL rather than
 * serving bytes — Supabase does the range handling and caching, and the link
 * expires on its own.
 *
 * Who may ask:
 *   - an **admin** with the `hcas` permission, reviewing an application;
 *   - the **HCA** the document belongs to.
 *
 * Nobody else, including other HCAs. A certificate is somebody's identity
 * document.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';
import { hasPermission } from '../../../lib/permissions';
import { BUCKET } from '../uploads';

const SIGNED_URL_SECONDS = 300;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not signed in.' });

  const path = (Array.isArray(req.query.path) ? req.query.path : [req.query.path]).join('/');
  if (!path || path.includes('..')) return res.status(400).json({ error: 'Bad path.' });

  const db = getSupabaseAdmin();

  if (session.role === 'admin') {
    if (!hasPermission(session.permissions || [], 'hcas')) {
      return res.status(403).json({ error: 'Your account does not have the "hcas" permission.' });
    }
  } else if (session.role === 'hca') {
    if (!(await belongsToHca(db, session.id, path))) {
      return res.status(404).json({ error: 'Not found.' });
    }
  } else {
    return res.status(403).json({ error: 'Not permitted.' });
  }

  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) {
    return res.status(404).json({ error: 'Not found.' });
  }
  return res.status(200).json({ url: data.signedUrl, expiresIn: SIGNED_URL_SECONDS });
}

/** Is this path referenced by the HCA's own profile or application? */
async function belongsToHca(db, hcaId, path) {
  const { data: profile } = await db.from('hca_profiles')
    .select('photo, certifications, application_id').eq('id', hcaId).maybeSingle();
  if (!profile) return false;

  if (profile.photo === path) return true;
  if ((profile.certifications || []).some(c => c?.filePath === path)) return true;

  if (profile.application_id) {
    const { data: app } = await db.from('hca_applications')
      .select('form_data').eq('id', profile.application_id).maybeSingle();
    const fd = app?.form_data || {};
    if (fd.profilePhoto?.filePath === path) return true;
    if ((fd.certifications || []).some(c => c?.filePath === path)) return true;
  }
  return false;
}
