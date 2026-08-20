/**
 * Authorising scheduled jobs. SERVER ONLY.
 *
 * A cron endpoint is a public URL that does privileged work, so it needs a
 * credential of its own. Two callers are supported:
 *
 *   - **Vercel Cron**, which sends `Authorization: Bearer $CRON_SECRET` when
 *     that variable is set on the project.
 *   - **Anything else** — pg_cron, an external scheduler, a manual curl —
 *     which can pass `?k=<secret>` instead.
 *
 * Unlike the rate limiter, this fails *closed*. A missing secret means the
 * endpoint refuses every caller rather than letting anyone trigger a retention
 * purge, because the cost of the job not running for a day is a message that
 * arrives late, and the cost of anyone being able to run it is deleted records.
 */

export function cronAuthorised(req) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) {
    console.error('[cron] CRON_SECRET is not set — scheduled jobs are disabled.');
    return false;
  }

  const header = String(req.headers?.authorization || '');
  if (header.startsWith('Bearer ') && safeEqual(header.slice(7), secret)) return true;

  return safeEqual(String(req.query?.k || ''), secret);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
