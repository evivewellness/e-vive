/**
 * M-Pesa STK Push callback handler.
 *
 * Safaricom POSTs here after the customer completes or dismisses the prompt.
 * The endpoint must be publicly reachable — Safaricom sends no credentials — so
 * authorisation rides in the URL as MPESA_CALLBACK_SECRET, which only ever
 * appears in the CallBackURL we hand to Safaricom.
 *
 * What happens here is the whole point of the integration: the payment row is
 * completed, the invoice is marked paid, and the family is told. Previously
 * this function logged the confirmation and dropped it.
 *
 * Safaricom retries on any non-200, so every path returns 200 with their
 * acknowledgement body — including the paths where we reject the caller.
 */
import { getSupabaseAdmin, serviceRoleConfigured } from '../../../lib/supabaseAdmin';
import { callbackAuthorised, siteOrigin } from '../../../lib/mpesa';

const ACK = { ResultCode: 0, ResultDesc: 'Accepted' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!callbackAuthorised(req)) {
    console.warn('[mpesa/callback] rejected a callback with a bad or missing secret');
    return res.status(200).json(ACK);
  }

  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      console.warn('[mpesa/callback] Unexpected payload shape:', JSON.stringify(req.body));
      return res.status(200).json(ACK);
    }

    const {
      MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata,
    } = stkCallback;

    if (!serviceRoleConfigured()) {
      // Nothing can be persisted. Log the full event so the payment can be
      // reconciled by hand rather than lost.
      console.error('[mpesa/callback] SUPABASE_SERVICE_ROLE_KEY unset; unpersisted callback:',
        JSON.stringify(stkCallback));
      return res.status(200).json(ACK);
    }

    const db = getSupabaseAdmin();
    const items = CallbackMetadata?.Item || [];
    const get = name => items.find(i => i.Name === name)?.Value;

    const succeeded = Number(ResultCode) === 0;
    const receipt = get('MpesaReceiptNumber');
    const now = new Date().toISOString();

    const { data: payment } = await db.from('payments')
      .select('*').eq('checkout_request_id', CheckoutRequestID).maybeSingle();

    const patch = {
      status:               succeeded ? 'success' : (Number(ResultCode) === 1032 ? 'cancelled' : 'failed'),
      result_code:          Number(ResultCode),
      result_desc:          ResultDesc || '',
      mpesa_receipt_number: receipt || null,
      transaction_date:     get('TransactionDate') ? String(get('TransactionDate')) : null,
      raw_callback:         stkCallback,
      completed_at:         now,
    };

    if (payment) {
      await db.from('payments').update(patch).eq('id', payment.id);
    } else {
      // No initiation row — the insert in stkpush failed, or this deployment
      // was redeployed mid-flight. Record it anyway; an unmatched payment that
      // exists can be reconciled, one that was only logged cannot.
      console.warn('[mpesa/callback] no payment row for', CheckoutRequestID, '— inserting orphan');
      await db.from('payments').insert({
        account_reference:   'unknown',
        amount:              Number(get('Amount')) || 0,
        phone:               String(get('PhoneNumber') || ''),
        merchant_request_id: MerchantRequestID,
        checkout_request_id: CheckoutRequestID,
        ...patch,
      });
    }

    if (!succeeded) {
      console.warn('[mpesa/callback] payment not completed:', ResultCode, ResultDesc);
      return res.status(200).json(ACK);
    }

    // ── Reconcile the invoice ────────────────────────────────────────────────
    if (payment?.invoice_id) {
      const { data: invoice } = await db.from('invoices')
        .select('id, invoice_num, client_id, total, status').eq('id', payment.invoice_id).maybeSingle();

      if (invoice && invoice.status !== 'paid') {
        await db.from('invoices').update({
          status: 'paid', paid_at: now, payment_method: 'mpesa', payment_ref: receipt || null,
        }).eq('id', invoice.id);

        await db.from('activity_log').insert({
          type: 'invoice_paid',
          data: {
            invoiceId: invoice.id, invoiceNum: invoice.invoice_num,
            clientId: invoice.client_id, method: 'mpesa', receipt: receipt || null,
            amount: payment.amount,
          },
        }).then(() => {}, () => {});

        await notifyClient(db, req, invoice, receipt, payment.amount);
      }
    }

    return res.status(200).json(ACK);
  } catch (err) {
    console.error('[mpesa/callback] Error processing callback:', err.message);
    return res.status(200).json(ACK);
  }
}

/** In-app notification plus an email receipt. Never fails the callback. */
async function notifyClient(db, req, invoice, receipt, amount) {
  try {
    const { data: client } = await db.from('clients')
      .select('id, name, email').eq('id', invoice.client_id).maybeSingle();
    if (!client) return;

    const subject = `Payment received — ${invoice.invoice_num}`;
    const body =
      `Dear ${String(client.name || '').split(' ')[0] || 'there'},\n\n` +
      `We have received your payment of KES ${Number(amount || invoice.total).toLocaleString()} ` +
      `for invoice ${invoice.invoice_num}.\n\n` +
      (receipt ? `M-Pesa receipt: ${receipt}\n\n` : '') +
      `Your invoice is now settled. Thank you.\n\n` +
      `The E-Vive Team\n+254 141 888 340 | hello@e-vive.co.ke`;

    await db.from('notifications').insert({
      client_id: client.id, type: 'payment_confirmed', subject,
      body, email_to: client.email, read: false,
    });

    if (client.email) {
      await fetch(`${siteOrigin(req)}/api/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email, subject, text: body,
          origin: 'system', relatedClientId: client.id,
        }),
      });
    }
  } catch (err) {
    console.error('[mpesa/callback] notify failed (payment still recorded):', err.message);
  }
}
