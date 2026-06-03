import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'E-Vive Kenya <hello@e-vive.co.ke>';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, subject, text } = req.body || {};
  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
  }

  if (!process.env.RESEND_API_KEY) {
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
    <div class="footer">E-Vive Kenya · hello@e-vive.co.ke · +254 720 053 455</div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({ from: FROM, to, subject, text, html });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-email]', err.message);
    // Non-fatal — return 200 so the caller doesn't crash
    return res.status(200).json({ ok: false, error: err.message });
  }
}
