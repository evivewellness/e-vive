import { Resend } from 'resend';
import { getSupabaseAdmin, serviceRoleConfigured } from '../../lib/supabaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'E-Vive Kenya <hello@e-vive.co.ke>';

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function fromNameOf(fromHeader) {
  const m = /^([^<]+)</.exec(fromHeader || '');
  return m ? m[1].trim() : null;
}

// Records every outbound send attempt (sent, failed, or skipped) in the
// `emails` table so it shows up in the admin Messages view, regardless of
// which part of the app triggered it.
async function logEmail({ to, cc, subject, text, html, replyTo, origin, relatedClientId, relatedHcaId, adminId, folder, status, resendId, error }) {
  if (!serviceRoleConfigured()) return;   // nothing to log to; never fail a send over it
  try {
    await getSupabaseAdmin().from('emails').insert({
      direction: 'outbound',
      origin: origin || 'system',
      folder,
      status,
      subject: subject || '',
      from_address: FROM,
      from_name: fromNameOf(FROM),
      to_addresses: toArray(to),
      cc_addresses: toArray(cc),
      reply_to: replyTo || null,
      body_text: text || '',
      body_html: html || null,
      resend_message_id: resendId || null,
      related_client_id: relatedClientId || null,
      related_hca_id: relatedHcaId || null,
      admin_id: adminId || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      metadata: error ? { error } : {},
    });
  } catch (e) {
    console.error('[send-email] failed to log to emails table:', e.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, cc, subject, text, replyTo, origin, relatedClientId, relatedHcaId, adminId } = req.body || {};
  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[send-email] RESEND_API_KEY is not set — email skipped.');
    await logEmail({ to, cc, subject, text, replyTo, origin, relatedClientId, relatedHcaId, adminId, folder: 'outbox', status: 'skipped' });
    // Silently skip — env var not configured yet
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Convert plain-text body to simple HTML
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;max-width:600px;margin:0 auto;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
  .logo{font-size:22px;font-weight:700;color:#004A99;margin-bottom:24px}
  .logo span{color:#0ea5e9}
  pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#333;margin:0}
  .footer{margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888}
</style></head>
<body>
  <div class="card">
    <div class="logo">e<span>-</span>vive</div>
    <pre>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
    <div class="footer">E-Vive Kenya · hello@e-vive.co.ke · +254 141 888 340</div>
  </div>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, cc, subject, text, html, reply_to: replyTo });

    if (error) {
      console.error('[send-email] Resend API error:', error);
      await logEmail({ to, cc, subject, text, html, replyTo, origin, relatedClientId, relatedHcaId, adminId, folder: 'outbox', status: 'failed', error: error.message });
      return res.status(500).json({ ok: false, error: error.message || 'Failed to send email' });
    }

    await logEmail({ to, cc, subject, text, html, replyTo, origin, relatedClientId, relatedHcaId, adminId, folder: 'sent', status: 'sent', resendId: data?.id });
    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[send-email] Unexpected error:', err.message);
    await logEmail({ to, cc, subject, text, html, replyTo, origin, relatedClientId, relatedHcaId, adminId, folder: 'outbox', status: 'failed', error: err.message });
    return res.status(500).json({ ok: false, error: err.message });
  }
}
