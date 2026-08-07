/**
 * Client notification preferences, per patient. Opt-in, except incident
 * alerts which default on.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';

const FREQ = ['none', 'daily', 'weekly', 'monthly'];

export default async function handler(req, res) {
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);
  const session = getSession(req);
  if (!session || session.role !== 'client') return res.status(401).json({ error: 'Not signed in.' });

  const db = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data } = await db.from('cardex_notify_prefs').select('*').eq('client_id', session.id);
    return res.status(200).json({ prefs: data || [] });
  }

  if (req.method === 'POST') {
    const { patientId, onNewReport, digestFrequency, onIncident } = req.body || {};
    const { data: client } = await db.from('clients').select('patients').eq('id', session.id).maybeSingle();
    if (patientId && !(client?.patients || []).some(p => p.id === patientId)) {
      return res.status(400).json({ error: 'Unknown patient.' });
    }
    const { data, error } = await db.from('cardex_notify_prefs').upsert({
      client_id: session.id,
      patient_id: patientId || null,
      on_new_report: Boolean(onNewReport),
      digest_frequency: FREQ.includes(digestFrequency) ? digestFrequency : 'none',
      on_incident: onIncident !== false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id,patient_id' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ pref: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
