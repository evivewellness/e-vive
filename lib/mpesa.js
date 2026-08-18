/**
 * Shared M-Pesa helpers. SERVER ONLY.
 *
 * The callback endpoint has to be publicly reachable — Safaricom posts to it
 * with no credentials of any kind — so the URL itself carries the secret. The
 * push we send names the callback; a caller who does not know MPESA_CALLBACK_SECRET
 * cannot forge a "payment received" for someone else's invoice.
 *
 * If the secret is unset the endpoint still accepts callbacks (so an existing
 * sandbox deployment keeps working) but says so loudly in the logs.
 */

export function callbackSecret() {
  return process.env.MPESA_CALLBACK_SECRET || '';
}

export function siteOrigin(req) {
  return (process.env.NEXT_PUBLIC_SITE_URL || `https://${req?.headers?.host || 'e-vive.vercel.app'}`)
    .replace(/\/$/, '');
}

export function callbackUrl(req) {
  const secret = callbackSecret();
  const base = `${siteOrigin(req)}/api/mpesa/callback`;
  return secret ? `${base}?k=${encodeURIComponent(secret)}` : base;
}

/**
 * Constant-time-ish comparison of the callback secret. Returns true when the
 * caller is authorised, or when no secret is configured at all.
 */
export function callbackAuthorised(req) {
  const expected = callbackSecret();
  if (!expected) {
    console.warn('[mpesa/callback] MPESA_CALLBACK_SECRET is not set — callbacks are unauthenticated.');
    return true;
  }
  const provided = String(req.query?.k || '');
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
