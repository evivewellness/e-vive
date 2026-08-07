/**
 * Client-facing Cardex ("Care Reports") read path.
 *
 * The ONLY way a family reaches Cardex data. Three properties matter:
 *
 *  1. client_id comes from the signed session cookie — never from the query
 *     string, body, or any header the caller controls.
 *  2. The select lists explicit columns from lib/cardexAccess. welfare_note,
 *     shift_rating, qa_comments and flagged are never requested, so they
 *     cannot appear in the response even by accident.
 *  3. The result is redacted again before serialising (defence in depth).
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';
import { cardexColumnsFor, redactCardexListFor } from '../../../lib/cardexAccess';

function mapRow(r) {
  return {
    id: r.id, shiftId: r.shift_id, hcaId: r.hca_id,
    patientId: r.patient_id, clientId: r.client_id,
    submittedAt: r.submitted_at,
    vitals: r.vitals || {}, medications: r.medications || [],
    intakes: r.intakes || [], nutrition: r.nutrition || {},
    hygiene: r.hygiene || {}, mobility: r.mobility || {},
    elimination: r.elimination || {}, mentalState: r.mental_state || {},
    specialNeedsChecks: r.special_needs_checks || [],
    incidents: r.incidents, handover: r.handover,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  if (!session || session.role !== 'client') {
    return res.status(401).json({ error: 'Not signed in.' });
  }

  const db = getSupabaseAdmin();

  // Optional narrowing. patientId is validated against this client's OWN
  // patients below — a caller cannot read another family's patient by id.
  const { start, end, patientId } = req.query;

  const { data: client, error: cErr } = await db
    .from('clients').select('id, name, patients').eq('id', session.id).maybeSingle();
  if (cErr) return res.status(500).json({ error: 'Could not load your account.' });
  if (!client) return res.status(401).json({ error: 'Not signed in.' });

  const patients = client.patients || [];
  if (patientId && !patients.some(p => p.id === patientId)) {
    // Do not distinguish "not yours" from "does not exist".
    return res.status(200).json({ entries: [], patients, hcaNames: {} });
  }

  let q = db.from('cardex_entries')
    .select(cardexColumnsFor('client'))
    .eq('client_id', session.id)                 // ← from the cookie, not the caller
    .order('submitted_at', { ascending: false })
    .limit(500);
  if (patientId) q = q.eq('patient_id', patientId);
  if (start)     q = q.gte('submitted_at', `${start}T00:00:00`);
  if (end)       q = q.lte('submitted_at', `${end}T23:59:59`);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: 'Could not load care reports.' });

  const entries = redactCardexListFor((data || []).map(mapRow), 'client');

  // Assistant display names, so the family sees a person rather than a UUID.
  const hcaIds = [...new Set(entries.map(e => e.hcaId).filter(Boolean))];
  const hcaNames = {};
  if (hcaIds.length) {
    const { data: hcas } = await db.from('hca_profiles').select('id, name').in('id', hcaIds);
    for (const h of hcas || []) hcaNames[h.id] = h.name;
  }

  return res.status(200).json({ entries, patients, hcaNames });
}
