/**
 * Server-side rate limiting. SERVER ONLY.
 *
 * Serverless functions do not share memory, and a given instance may live for
 * seconds — an in-process counter would reset constantly and protect nothing.
 * So attempts are counted in a table, as a sliding window: count what is in the
 * bucket for the last N seconds, and refuse if that already meets the limit.
 *
 * Two deliberate choices:
 *
 *  - **Failures are counted, successes are not.** Someone signing in correctly
 *    twenty times is using the product; someone failing twenty times is
 *    guessing. Callers record an attempt only when one fails.
 *  - **It fails open.** If the table is missing or the query errors, the
 *    request proceeds and the problem is logged. A rate limiter that takes the
 *    site down when its own storage hiccups is worse than the attack it
 *    prevents — but a limiter that is silently absent is worse still, hence the
 *    log line.
 */

const TABLE = 'rate_limits';

/** The caller's IP, as far as the platform will tell us. */
export function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Is this key over its limit?
 * Returns { ok: true } or { ok: false, retryAfter } (seconds).
 */
export async function checkRateLimit(db, { key, limit, windowSeconds }) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await db.from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('bucket', key)
      .gte('created_at', since);
    if (error) {
      console.warn(`[rateLimit] not enforced for ${key}: ${error.message}`);
      return { ok: true };
    }
    if ((count || 0) >= limit) {
      return { ok: false, retryAfter: windowSeconds };
    }
    return { ok: true };
  } catch (err) {
    console.warn(`[rateLimit] not enforced for ${key}: ${err.message}`);
    return { ok: true };
  }
}

/** Record one attempt against a key. Never throws. */
export async function recordAttempt(db, key) {
  try {
    await db.from(TABLE).insert({ bucket: key });
  } catch (err) {
    console.warn(`[rateLimit] could not record attempt for ${key}: ${err.message}`);
  }
}

/**
 * The common shape: check, and if allowed, count this one immediately. Use for
 * actions where every attempt costs something regardless of outcome — sending
 * mail, creating a record — rather than for sign-in, where only failures count.
 */
export async function consumeRateLimit(db, opts) {
  const result = await checkRateLimit(db, opts);
  if (result.ok) await recordAttempt(db, opts.key);
  return result;
}

/** Uniform 429, with the header clients and crawlers actually honour. */
export function tooManyRequests(res, retryAfter, message) {
  res.setHeader('Retry-After', String(retryAfter));
  return res.status(429).json({
    error: message || 'Too many attempts. Please wait a few minutes and try again.',
  });
}

/**
 * The limits, in one place so they can be read as a policy rather than found
 * scattered across routes.
 *
 * Sign-in is deliberately limited on two axes: by account, so one person's
 * password cannot be ground down, and by IP, so a single source cannot spray
 * attempts across many accounts and stay under the per-account limit.
 */
export const LIMITS = {
  loginPerAccount:   { limit: 8,  windowSeconds: 15 * 60 },
  loginPerIp:        { limit: 30, windowSeconds: 15 * 60 },
  registerPerIp:     { limit: 5,  windowSeconds: 60 * 60 },
  applicationPerIp:  { limit: 5,  windowSeconds: 60 * 60 },
  resetPerIp:        { limit: 10, windowSeconds: 60 * 60 },
  anonWritePerIp:    { limit: 20, windowSeconds: 60 * 60 },
  passwordChange:    { limit: 10, windowSeconds: 60 * 60 },
};
