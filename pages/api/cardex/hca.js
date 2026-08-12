/**
 * HCA's own Cardex entries: read their history, submit a new one.
 *
 * RLS denies the anon key on cardex_entries, so these can no longer go
 * directly from the browser. Identity comes from the signed session cookie —
 * an HCA can only ever read or write rows for their own hca_id.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';
import { cardexColumnsFor, redactCardexListFor } from '../../../lib/cardexAccess';

function mapRow(r) {
  return {
    id: r.id, shiftId: r.shift_id, hcaId: r.hca_id, patientId: r.patient_id,
    clientId: r.client_id, submittedAt: r.submitted_at, date: r.submitted_at,
    vitals: r.vitals || {}, medications: r.medications || [],
    intakes: r.intakes || [], nutrition: r.nutrition || {},
    hygiene: r.hygiene || {}, mobility: r.mobility || {},
    elimination: r.elimination || {}, mentalState: r.mental_state || {},
    specialNeedsChecks: r.special_needs_checks || [], incidents: r.incidents,
    handover: r.handover, shiftRating: r.shift_rating, welfareNote: r.welfare_note,
  };
}

export default async function handler(req, res) {
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);
  const session = getSession(req);
  if (!session || session.role !== 'hca') return res.status(401).json({ error: 'Not signed in.' });

  const db = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db.from('cardex_entries')
      .select(cardexColumnsFor('hca'))
      .eq('hca_id', session.id)                     // ← from the cookie
      .order('submitted_at', { ascending: false }).limit(300);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entries: redactCardexListFor((data || []).map(mapRow), 'hca') });
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    // hca_id is taken from the session, never from the body.
    const { data, error } = await db.from('cardex_entries').insert({
      shift_id: b.shiftId || null, hca_id: session.id,
      patient_id: b.patientId || null, client_id: b.clientId || null,
      vitals: b.vitals || {}, medications: b.medications || [], intakes: b.intakes || [],
      nutrition: b.nutrition || {}, hygiene: b.hygiene || {}, mobility: b.mobility || {},
      elimination: b.elimination || {}, mental_state: b.mentalState || {},
      incidents: b.incidents || '', handover: b.handover || '',
      shift_rating: b.shiftRating || 0,
      special_needs_checks: b.specialNeedsChecks || [],
      welfare_note: b.welfareNote || '',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    await db.from('activity_log').insert({ type: 'cardex_submitted', data: { hcaId: session.id, patientId: b.patientId } }).select().maybeSingle();
    return res.status(200).json({ entry: mapRow(data) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
