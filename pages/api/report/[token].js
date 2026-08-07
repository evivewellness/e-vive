/**
 * Token-gated access to a shared care summary.
 *
 * The report is assembled here, server-side, from the server's own
 * authorised query — never from parameters the caller supplies and never
 * from data handed to the browser first. The caller provides one thing: an
 * opaque token, which is looked up by hash.
 *
 * Every outcome — success and each distinct failure — is audited. Failures
 * return the same neutral message with no detail about *why*, so a token
 * cannot be probed for validity, and repeated failures are visible in the
 * audit log as the attack signal they are.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { hashShareToken, sessionSecretConfigured } from '../../../lib/serverAuth';
import { cardexColumnsFor, redactCardexListFor, CARDEX_STANDING_NOTE } from '../../../lib/cardexAccess';
import { buildSummary, DATA_TYPES } from '../../../lib/cardexSummary';

const NEUTRAL = 'This link is not valid. It may have expired or been withdrawn.';

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || null;
}

function mapRow(r) {
  return {
    id: r.id, shiftId: r.shift_id, hcaId: r.hca_id, patientId: r.patient_id,
    clientId: r.client_id, submittedAt: r.submitted_at,
    vitals: r.vitals || {}, medications: r.medications || [],
    intakes: r.intakes || [], nutrition: r.nutrition || {},
    hygiene: r.hygiene || {}, mobility: r.mobility || {},
    elimination: r.elimination || {}, mentalState: r.mental_state || {},
    specialNeedsChecks: r.special_needs_checks || [], incidents: r.incidents,
    handover: r.handover,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const db = getSupabaseAdmin();
  const token = String(req.query.token || '');
  const code  = String((req.body || {}).accessCode || '');
  const ip = clientIp(req), ua = req.headers['user-agent'] || null;

  const deny = async (event, shareId = null, recipientId = null) => {
    await db.from('cardex_share_audit').insert({ share_id: shareId, recipient_id: recipientId, event, ip, user_agent: ua });
    return res.status(404).json({ error: NEUTRAL });
  };

  if (!token || token.length < 20) return deny('denied_invalid');

  const { data: rec } = await db.from('cardex_share_recipients')
    .select('*').eq('token_hash', hashShareToken(token)).maybeSingle();
  if (!rec) return deny('denied_invalid');

  if (rec.revoked_at)                          return deny('denied_revoked', rec.share_id, rec.id);
  if (new Date(rec.expires_at) < new Date())   return deny('denied_expired', rec.share_id, rec.id);

  const { data: share } = await db.from('cardex_shares').select('*').eq('id', rec.share_id).maybeSingle();
  if (!share || share.revoked_at) return deny('denied_revoked', rec.share_id, rec.id);

  // Second factor, when the platform requires one.
  if (rec.access_code) {
    if (req.method === 'GET') {
      return res.status(200).json({ needsCode: true, recipientName: rec.full_name });
    }
    if (code.trim().toUpperCase() !== rec.access_code) {
      return deny('denied_code', rec.share_id, rec.id);
    }
  } else if (req.method === 'GET') {
    // No code required — GET may return the report directly.
  }

  // ── Authorised. Build the report from the server's own query. ─────────────
  const types = Array.isArray(share.data_types) ? share.data_types : [];
  const includeHandover = Boolean(share.include_handover);

  let q = db.from('cardex_entries')
    .select(cardexColumnsFor('shared', { include: includeHandover ? ['handover'] : [] }))
    .eq('client_id', share.client_id)
    .gte('submitted_at', `${share.range_start}T00:00:00`)
    .lte('submitted_at', `${share.range_end}T23:59:59`)
    .order('submitted_at', { ascending: false })
    .limit(500);
  if (share.patient_id) q = q.eq('patient_id', share.patient_id);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: 'Could not build the report.' });

  // Redact again, and drop whatever the client deselected.
  const omit = [];
  if (!types.includes('vitals'))      omit.push('vitals');
  if (!types.includes('medications')) omit.push('medications');
  if (!types.includes('nutrition'))   omit.push('intakes', 'nutrition');
  if (!types.includes('care'))        omit.push('hygiene', 'mobility', 'elimination');
  if (!types.includes('mental'))      omit.push('mental_state');
  if (!types.includes('incidents'))   omit.push('incidents');
  if (!includeHandover)               omit.push('handover');

  const entries = redactCardexListFor((data || []).map(mapRow), 'shared', {
    include: includeHandover ? ['handover'] : [], omit,
  });

  const summary = types.includes('vitals')
    ? buildSummary(entries, { start: share.range_start, end: share.range_end })
    : null;

  await db.from('cardex_share_recipients').update({
    last_access_at: new Date().toISOString(),
    access_count: (rec.access_count || 0) + 1,
  }).eq('id', rec.id);
  await db.from('cardex_share_audit').insert({
    share_id: share.id, recipient_id: rec.id, event: 'viewed', ip, user_agent: ua,
  });

  return res.status(200).json({
    report: {
      patientName: share.patient_name || 'Patient',
      rangeStart: share.range_start,
      rangeEnd: share.range_end,
      dataTypes: types.map(t => DATA_TYPES.find(d => d.key === t)?.label || t),
      sharedBy: share.created_by_name,
      sharedWith: rec.full_name,
      generatedAt: new Date().toISOString(),
      expiresAt: rec.expires_at,
      standingNote: CARDEX_STANDING_NOTE,
      entries,
      summary,
    },
  });
}
