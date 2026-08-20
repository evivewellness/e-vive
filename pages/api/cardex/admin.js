/**
 * Admin Cardex access: full QA review list, and QA comments.
 *
 * Requires an admin session cookie, which means an admin_users row must
 * exist — the legacy browser-side SHA-256 login issues no cookie and so
 * cannot reach this route.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { requirePermission, sessionSecretConfigured } from '../../../lib/serverAuth';
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
    qaComments: r.qa_comments || [], flagged: r.flagged,
  };
}

export default async function handler(req, res) {
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);
  // Cardex is clinical data; reading it is the 'quality' permission, not
  // merely being an admin.
  const auth = requirePermission(req, 'quality');
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const db = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db.from('cardex_entries')
      .select(cardexColumnsFor('admin'))
      .order('submitted_at', { ascending: false }).limit(300);
    if (error) return res.status(500).json({ error: error.message });

    // Welfare notes concern staff wellbeing, not care quality, and are gated
    // separately from general admin access (admin_users.can_read_welfare_notes).
    const entries = (data || []).map(mapRow).map(e =>
      auth.session.canReadWelfareNotes ? e : { ...e, welfareNote: undefined, shiftRating: undefined }
    );
    return res.status(200).json({ entries, canReadWelfareNotes: !!auth.session.canReadWelfareNotes });
  }

  if (req.method === 'POST') {
    const { entryId, comment, flagged } = req.body || {};
    if (!entryId || !String(comment || '').trim()) {
      return res.status(400).json({ error: 'entryId and comment are required.' });
    }
    const { data: existing } = await db.from('cardex_entries')
      .select('qa_comments, flagged').eq('id', entryId).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Cardex entry not found.' });

    const qa = [...(existing.qa_comments || []), {
      id: `qa-${Date.now()}`, adminId: auth.session.email || 'admin',
      comment: String(comment).trim(), flagged: !!flagged, createdAt: new Date().toISOString(),
    }];
    const { error } = await db.from('cardex_entries')
      .update({ qa_comments: qa, flagged: existing.flagged || !!flagged }).eq('id', entryId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    // Used by deleteHcaProfile's cascade, which can no longer reach the table
    // from the browser.
    const { hcaId } = req.body || {};
    if (!hcaId) return res.status(400).json({ error: 'hcaId is required.' });
    const { error } = await db.from('cardex_entries').delete().eq('hca_id', hcaId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
