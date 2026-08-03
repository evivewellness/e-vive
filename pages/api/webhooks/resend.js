import { Webhook } from 'svix';
import { supabase } from '../../../lib/supabase';

// Resend signs webhooks using Svix. Disable Next's body parser so we can
// verify the signature against the exact raw bytes Resend sent.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Later events should not silently downgrade a "better" known status if
// webhook delivery arrives out of order.
const STATUS_RANK = { sent: 1, delayed: 2, delivered: 2, opened: 3, clicked: 4, bounced: 5, complained: 5 };

const OUTBOUND_STATUS_BY_TYPE = {
  'email.sent':             'sent',
  'email.delivered':        'delivered',
  'email.delivery_delayed': 'delayed',
  'email.complained':       'complained',
  'email.bounced':          'bounced',
  'email.opened':           'opened',
  'email.clicked':          'clicked',
};

function firstOf(v) {
  return Array.isArray(v) ? v[0] : v;
}
function arrayOf(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// Anything that isn't a recognized outbound lifecycle event is stored here
// rather than dropped — covers genuine inbound mail, but also protects
// against the inbound event's real `type` name (or payload shape) turning
// out to differ from what was assumed when this was built without access
// to a live payload to verify against. Worst case an unrecognized event
// shows up in the Inbox labelled with its raw type and full metadata,
// instead of vanishing with no trace.
async function handleInbound(type, event, data) {
  const { error } = await supabase.from('emails').insert({
    direction: 'inbound',
    origin: 'resend',
    folder: 'inbox',
    status: 'received',
    subject: data.subject || `[${type || 'unrecognized event'}]`,
    from_address: firstOf(data.from) || null,
    from_name: data.from_name || null,
    to_addresses: arrayOf(data.to),
    cc_addresses: arrayOf(data.cc),
    reply_to: data.reply_to || null,
    body_text: data.text || data.body_text || data.plain || '',
    body_html: data.html || data.body_html || null,
    resend_message_id: data.email_id || data.message_id || data.id || null,
    thread_id: data.headers?.['in-reply-to'] || data.headers?.references || null,
    metadata: event,
  });
  if (error) console.error('[webhooks/resend] failed to store inbound email:', error.message);
}

async function handleOutboundEvent(type, event, data) {
  const status = OUTBOUND_STATUS_BY_TYPE[type];
  const emailId = data.email_id || data.id;
  if (!status || !emailId) return;

  const { data: existing, error: findErr } = await supabase
    .from('emails').select('id, status, metadata')
    .eq('resend_message_id', emailId).maybeSingle();
  if (findErr || !existing) return; // nothing to reconcile against (e.g. sent before this table existed)

  const existingRank = STATUS_RANK[existing.status] || 0;
  const newRank = STATUS_RANK[status] || 0;
  if (newRank < existingRank) return; // don't regress a further-along status

  const { error: updateErr } = await supabase.from('emails').update({
    status,
    metadata: { ...(existing.metadata || {}), [type]: event },
  }).eq('id', existing.id);
  if (updateErr) console.error('[webhooks/resend] failed to update email status:', updateErr.message);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await readRawBody(req);
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  let event;
  if (secret) {
    try {
      const wh = new Webhook(secret);
      event = wh.verify(rawBody, {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature'],
      });
    } catch (err) {
      console.error('[webhooks/resend] signature verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } else {
    console.warn('[webhooks/resend] RESEND_WEBHOOK_SECRET is not set — accepting webhook WITHOUT signature verification. Set this env var before relying on this in production.');
    try { event = JSON.parse(rawBody); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const type = event?.type || '';
  const data = event?.data || {};

  try {
    if (OUTBOUND_STATUS_BY_TYPE[type]) {
      await handleOutboundEvent(type, event, data);
    } else {
      // Not a known outbound lifecycle event — treat as inbound so nothing
      // is silently dropped (see handleInbound for why).
      console.warn('[webhooks/resend] non-lifecycle event, storing as inbound:', type);
      await handleInbound(type, event, data);
    }
  } catch (e) {
    console.error('[webhooks/resend] error processing event:', e.message);
    // Still ack with 200 below — a processing bug shouldn't cause Resend to
    // retry-storm this endpoint.
  }

  return res.status(200).json({ received: true });
}
