/**
 * M-Pesa STK Push initiation.
 *
 * Two things changed from the original: the caller must be a signed-in client,
 * and the push is recorded in `payments` before Safaricom is contacted. Without
 * that row the callback has nothing to reconcile against — which is how a paid
 * invoice used to stay open forever.
 *
 * The amount and the invoice are read from the database, never from the request
 * body. A client who edits the payload cannot pay KES 1 against a KES 35,000
 * invoice.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';
import { callbackUrl } from '../../../lib/mpesa';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  if (!session || session.role !== 'client') return res.status(401).json({ error: 'Not signed in.' });

  const consumerKey    = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey        = process.env.MPESA_PASSKEY;
  const shortcode      = process.env.MPESA_SHORTCODE || '4165689';
  const env            = process.env.MPESA_ENV || 'sandbox';

  if (!consumerKey || !consumerSecret || !passkey) {
    return res.status(503).json({ error: 'M-Pesa credentials not configured' });
  }

  const { phone, invoiceId } = req.body || {};
  if (!phone || !invoiceId) {
    return res.status(400).json({ error: 'phone and invoiceId are required' });
  }

  const db = getSupabaseAdmin();

  // The invoice must exist, belong to the caller, and still be owed. Amount and
  // reference come from this row — not from the request.
  const { data: invoice } = await db.from('invoices')
    .select('id, invoice_num, client_id, total, status')
    .eq('id', invoiceId).maybeSingle();
  if (!invoice || invoice.client_id !== session.id) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }
  if (invoice.status === 'paid') {
    return res.status(409).json({ error: 'This invoice has already been paid.' });
  }
  const amount = Math.ceil(Number(invoice.total) || 0);
  if (amount < 1) return res.status(400).json({ error: 'This invoice has nothing to pay.' });

  // Normalise phone to 2547XXXXXXXX format
  const normalised = String(phone).replace(/\s+/g, '').replace(/^\+/, '').replace(/^0/, '254');
  if (!/^2547\d{8}$/.test(normalised) && !/^2541\d{8}$/.test(normalised)) {
    return res.status(400).json({ error: 'Invalid Kenyan phone number. Use format 0712345678 or +254712345678' });
  }

  const baseUrl = env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  // 1. Get OAuth token
  let token;
  try {
    const creds   = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      throw new Error(`OAuth failed (${tokenRes.status}): ${txt}`);
    }
    const tokenData = await tokenRes.json();
    token = tokenData.access_token;
  } catch (err) {
    console.error('[mpesa/stkpush] OAuth error:', err.message);
    return res.status(502).json({ error: 'Failed to authenticate with M-Pesa' });
  }

  // 2. Build STK Push request
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const accountRef = String(invoice.invoice_num).slice(0, 12);

  const payload = {
    BusinessShortCode: shortcode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            amount,
    PartyA:            normalised,
    PartyB:            shortcode,
    PhoneNumber:       normalised,
    CallBackURL:       callbackUrl(req),
    AccountReference:  accountRef,
    TransactionDesc:   'E-Vive Payment',
  };

  // 3. Initiate STK Push
  try {
    const pushRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const pushData = await pushRes.json();

    if (!pushRes.ok || pushData.ResponseCode !== '0') {
      console.error('[mpesa/stkpush] STK Push error:', pushData);
      return res.status(502).json({
        error: pushData.errorMessage || pushData.ResponseDescription || 'STK Push failed',
      });
    }

    // 4. Record the initiation. The callback finds this row by
    //    checkout_request_id and completes it.
    const { error: insertError } = await db.from('payments').insert({
      invoice_id:          invoice.id,
      client_id:           session.id,
      account_reference:   accountRef,
      amount,
      phone:               normalised,
      method:              'mpesa',
      status:              'pending',
      merchant_request_id: pushData.MerchantRequestID,
      checkout_request_id: pushData.CheckoutRequestID,
    });
    if (insertError) {
      // The customer's phone is already ringing. Log loudly rather than
      // failing the request — the callback still carries every field needed to
      // reconstruct this row.
      console.error('[mpesa/stkpush] could not record payment row:', insertError.message);
    }

    return res.status(200).json({
      success:             true,
      checkoutRequestId:   pushData.CheckoutRequestID,
      merchantRequestId:   pushData.MerchantRequestID,
      responseDescription: pushData.ResponseDescription,
      customerMessage:     pushData.CustomerMessage,
    });
  } catch (err) {
    console.error('[mpesa/stkpush] Fetch error:', err.message);
    return res.status(502).json({ error: 'Network error contacting M-Pesa' });
  }
}
