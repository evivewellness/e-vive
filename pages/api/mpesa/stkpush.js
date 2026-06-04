export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const consumerKey    = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey        = process.env.MPESA_PASSKEY;
  const shortcode      = process.env.MPESA_SHORTCODE || '4165689';
  const env            = process.env.MPESA_ENV || 'sandbox';
  const siteUrl        = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-vive.vercel.app';

  if (!consumerKey || !consumerSecret || !passkey) {
    return res.status(503).json({ error: 'M-Pesa credentials not configured' });
  }

  const { phone, amount, accountRef, description } = req.body;
  if (!phone || !amount || !accountRef) {
    return res.status(400).json({ error: 'phone, amount, and accountRef are required' });
  }

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
    return res.status(502).json({ error: 'Failed to authenticate with M-Pesa', detail: err.message });
  }

  // 2. Build STK Push request
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: shortcode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            Math.ceil(Number(amount)),
    PartyA:            normalised,
    PartyB:            shortcode,
    PhoneNumber:       normalised,
    CallBackURL:       `${siteUrl}/api/mpesa/callback`,
    AccountReference:  String(accountRef).slice(0, 12),
    TransactionDesc:   String(description || 'E-Vive Payment').slice(0, 13),
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
        error:   pushData.errorMessage || pushData.ResponseDescription || 'STK Push failed',
        detail:  pushData,
      });
    }

    return res.status(200).json({
      success:         true,
      checkoutRequestId: pushData.CheckoutRequestID,
      merchantRequestId: pushData.MerchantRequestID,
      responseDescription: pushData.ResponseDescription,
      customerMessage:   pushData.CustomerMessage,
    });
  } catch (err) {
    console.error('[mpesa/stkpush] Fetch error:', err.message);
    return res.status(502).json({ error: 'Network error contacting M-Pesa', detail: err.message });
  }
}
