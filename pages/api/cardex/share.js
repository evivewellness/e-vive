/**
 * Create / list / revoke outward shares of a care summary.
 *
 * Every disclosure is recorded with its lawful basis: who shared, which
 * patient, what range, each recipient's relationship and written
 * justification, and the consent statement they agreed to. That record is
 * what you produce if the disclosure is ever questioned.
 *
 * Recipients get a link containing an opaque single-use-per-recipient token.
 * Only the token's SHA-256 hash is stored, so a database dump does not yield
 * working links. The PDF is never attached to the email — attachments cannot
 * be expired, revoked or audited.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured, generateShareToken, hashShareToken, generateAccessCode } from '../../../lib/serverAuth';
import { settingsFromDb } from '../../../lib/platformSettings';
import { DATA_TYPES } from '../../../lib/cardexSummary';

const RELATIONSHIPS = ['treating_doctor', 'specialist', 'family', 'other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function loadSettings(db) {
  const { data } = await db.from('platform_settings').select('*').eq('id', 1).maybeSingle();
  return settingsFromDb(data);
}

async function audit(db, row) {
  await db.from('cardex_share_audit').insert(row);
}

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || null;
}

export default async function handler(req, res) {
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);
  const session = getSession(req);
  if (!session || session.role !== 'client') return res.status(401).json({ error: 'Not signed in.' });

  const db = getSupabaseAdmin();

  // ── List this client's sharing history ───────────────────────────────────
  if (req.method === 'GET') {
    const { data: shares } = await db.from('cardex_shares')
      .select('*').eq('client_id', session.id).order('created_at', { ascending: false }).limit(100);
    const ids = (shares || []).map(s => s.id);
    let recipients = [], events = [];
    if (ids.length) {
      // token_hash and access_code deliberately excluded — the client never
      // needs them back, and they should not sit in a browser response.
      ({ data: recipients } = await db.from('cardex_share_recipients')
        .select('id, share_id, full_name, email, relationship, relationship_other, justification, expires_at, revoked_at, last_access_at, access_count')
        .in('share_id', ids));
      ({ data: events } = await db.from('cardex_share_audit')
        .select('id, share_id, recipient_id, event, created_at').in('share_id', ids)
        .order('created_at', { ascending: false }).limit(300));
    }
    return res.status(200).json({ shares: shares || [], recipients: recipients || [], events: events || [] });
  }

  // ── Revoke one recipient's access ────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { recipientId } = req.body || {};
    if (!recipientId) return res.status(400).json({ error: 'recipientId is required.' });
    // Ownership check: the recipient must belong to a share owned by THIS client.
    const { data: rec } = await db.from('cardex_share_recipients')
      .select('id, share_id, cardex_shares!inner(client_id)').eq('id', recipientId).maybeSingle();
    if (!rec || rec.cardex_shares?.client_id !== session.id) {
      return res.status(404).json({ error: 'Not found.' });
    }
    await db.from('cardex_share_recipients').update({ revoked_at: new Date().toISOString() }).eq('id', recipientId);
    await audit(db, { share_id: rec.share_id, recipient_id: recipientId, event: 'revoked', ip: clientIp(req), detail: 'Revoked by client' });
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Create a share ────────────────────────────────────────────────────────
  const s = await loadSettings(db);
  const { patientId, rangeStart, rangeEnd, dataTypes, includeHandover, recipients, consentAgreed, expiryDays } = req.body || {};

  if (!consentAgreed) return res.status(400).json({ error: 'You must confirm the consent statement.' });
  if (!rangeStart || !rangeEnd) return res.status(400).json({ error: 'A date range is required.' });
  if (rangeEnd < rangeStart)   return res.status(400).json({ error: 'End date must not be before the start date.' });

  const { data: client } = await db.from('clients').select('id, name, patients').eq('id', session.id).maybeSingle();
  if (!client) return res.status(401).json({ error: 'Not signed in.' });
  const patient = (client.patients || []).find(p => p.id === patientId);
  if (patientId && !patient) return res.status(400).json({ error: 'Unknown patient.' });

  // Rate limit — a compromised account should not be able to fan out.
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count: recent } = await db.from('cardex_shares')
    .select('id', { count: 'exact', head: true }).eq('client_id', session.id).gte('created_at', since);
  if ((recent || 0) >= s.shareMaxPerHour) {
    return res.status(429).json({ error: `You can create at most ${s.shareMaxPerHour} shares per hour.` });
  }

  const list = Array.isArray(recipients) ? recipients : [];
  if (list.length === 0) return res.status(400).json({ error: 'Add at least one recipient.' });
  if (list.length > s.shareMaxRecipients) {
    return res.status(400).json({ error: `At most ${s.shareMaxRecipients} recipients per share.` });
  }

  for (const r of list) {
    if (!r?.fullName?.trim())            return res.status(400).json({ error: 'Every recipient needs a full name.' });
    if (!EMAIL_RE.test(String(r.email || '').trim())) return res.status(400).json({ error: `"${r.email}" is not a valid email address.` });
    if (!RELATIONSHIPS.includes(r.relationship))      return res.status(400).json({ error: 'Every recipient needs a relationship.' });
    if (r.relationship === 'other' && !r.relationshipOther?.trim()) {
      return res.status(400).json({ error: 'Describe the relationship when choosing "Other".' });
    }
    if (String(r.justification || '').trim().length < s.shareMinJustificationLen) {
      return res.status(400).json({ error: `Each justification must be at least ${s.shareMinJustificationLen} characters.` });
    }
  }

  const validTypes = (Array.isArray(dataTypes) ? dataTypes : []).filter(t => DATA_TYPES.some(d => d.key === t));
  if (validTypes.length === 0) return res.status(400).json({ error: 'Select at least one type of information to share.' });

  const days = Math.min(Number(expiryDays) || s.shareDefaultExpiryDays, s.shareMaxExpiryDays);
  const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();

  const { data: share, error: sErr } = await db.from('cardex_shares').insert({
    client_id: session.id,
    patient_id: patientId || null,
    patient_name: patient?.name || null,
    range_start: rangeStart, range_end: rangeEnd,
    data_types: validTypes,
    include_handover: Boolean(includeHandover) && s.shareIncludeHandover !== null,
    consent_statement: s.consentStatement,
    consent_owner: s.consentOwner,
    created_by_name: client.name,
  }).select().single();
  if (sErr) return res.status(500).json({ error: 'Could not create the share.' });

  // One token per recipient, so access is individually traceable and revocable.
  const issued = [];
  for (const r of list) {
    const token = generateShareToken();
    const accessCode = s.shareRequireAccessCode ? generateAccessCode() : null;
    const { data: rec } = await db.from('cardex_share_recipients').insert({
      share_id: share.id,
      full_name: String(r.fullName).trim(),
      email: String(r.email).trim().toLowerCase(),
      relationship: r.relationship,
      relationship_other: r.relationship === 'other' ? String(r.relationshipOther).trim() : null,
      justification: String(r.justification).trim(),
      token_hash: hashShareToken(token),
      access_code: accessCode,
      expires_at: expiresAt,
    }).select().single();
    issued.push({ recipient: rec, token, accessCode });
  }

  await audit(db, { share_id: share.id, event: 'created', ip: clientIp(req), user_agent: req.headers['user-agent'] || null,
    detail: `${issued.length} recipient(s), ${validTypes.join('/')}` });

  // Email each recipient a link and nothing else — no patient name, no
  // clinical detail, in body or subject. Failures must not corrupt the share.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
  for (const { recipient, token } of issued) {
    const link = `${origin}/report/${token}`;
    try {
      await fetch(`${origin}/api/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient.email,
          subject: 'A care summary has been shared with you',
          text:
            `Hello ${recipient.full_name},\n\n` +
            `${client.name} has shared a care summary with you through E-Vive.\n\n` +
            `Open it here: ${link}\n\n` +
            (recipient.access_code ? `You will be asked for an access code. ${client.name} will give it to you separately.\n\n` : '') +
            `This link expires on ${new Date(expiresAt).toLocaleDateString('en-GB')} and can be withdrawn at any time.\n` +
            `If you were not expecting this, please ignore this message.\n\n` +
            `E-Vive HomeCare`,
          origin: 'system',
        }),
      });
    } catch { /* delivery is best-effort; the share and its audit row stand */ }
  }

  // Tell the client the access codes ONCE so they can pass them on by phone.
  return res.status(200).json({
    ok: true,
    shareId: share.id,
    recipients: issued.map(i => ({ name: i.recipient.full_name, email: i.recipient.email, accessCode: i.accessCode })),
    expiresAt,
  });
}
