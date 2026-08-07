/**
 * Platform settings — retention, consent ownership, sharing defaults.
 * Admin only, verified from the signed session cookie.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../lib/supabaseAdmin';
import { requireRole, sessionSecretConfigured } from '../../lib/serverAuth';
import { settingsFromDb, settingsToDb } from '../../lib/platformSettings';

export default async function handler(req, res) {
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);
  const auth = requireRole(req, 'admin');
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const db = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data } = await db.from('platform_settings').select('*').eq('id', 1).maybeSingle();
    return res.status(200).json({ settings: settingsFromDb(data) });
  }

  if (req.method === 'POST') {
    const patch = settingsToDb({ ...(req.body || {}), updatedBy: auth.session.email || 'admin' });
    const { data, error } = await db.from('platform_settings').upsert(patch).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ settings: settingsFromDb(data) });
  }

  if (req.method === 'PUT') {   // run retention purge now
    const { data, error } = await db.rpc('purge_expired_cardex_data');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ purged: data?.[0] || null });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
