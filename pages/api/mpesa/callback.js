/**
 * M-Pesa STK Push callback handler.
 * Safaricom POSTs a JSON body here after the customer completes or dismisses the prompt.
 * This endpoint must be publicly reachable (no auth header).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = req.body;
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      console.warn('[mpesa/callback] Unexpected payload shape:', JSON.stringify(body));
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    if (ResultCode === 0) {
      // Payment successful — extract metadata items
      const items = CallbackMetadata?.Item || [];
      const get   = name => items.find(i => i.Name === name)?.Value;

      const record = {
        merchantRequestId:  MerchantRequestID,
        checkoutRequestId:  CheckoutRequestID,
        resultDesc:         ResultDesc,
        amount:             get('Amount'),
        mpesaReceiptNumber: get('MpesaReceiptNumber'),
        transactionDate:    get('TransactionDate'),
        phoneNumber:        get('PhoneNumber'),
      };

      console.info('[mpesa/callback] Payment confirmed:', JSON.stringify(record));
      // TODO: persist record to Supabase or notify client once real backend is wired
    } else {
      console.warn('[mpesa/callback] Payment failed/cancelled:', ResultCode, ResultDesc);
    }

    // Safaricom requires HTTP 200 with this body to acknowledge receipt
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[mpesa/callback] Error processing callback:', err.message);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
