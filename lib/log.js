/**
 * Structured logging. SERVER ONLY.
 *
 * Vercel captures stdout per invocation, so the question is not where logs go
 * but whether they can be searched. A line reading `Error: fetch failed` is
 * indistinguishable from every other one; the same line as JSON, carrying the
 * route and the outcome, can be filtered to "every failed M-Pesa callback
 * today".
 *
 * The rule that matters here: **log what happened, never what it was about.**
 * No patient names, no clinical text, no tokens, no passwords, no email bodies.
 * Identifiers are fine — they are how you find the record in a system that
 * checks whether you may read it. The `redact` helper below is applied to every
 * field so a careless caller cannot leak a token into a log line that is then
 * retained far longer than the token.
 */

const SENSITIVE_KEYS = /^(password|token|secret|authorization|cookie|apiKey|access_code|accessCode)$/i;

/** Keys that name a secret are replaced; long opaque strings are truncated. */
function redact(value, key = '') {
  if (SENSITIVE_KEYS.test(key)) return '[redacted]';
  if (typeof value === 'string' && value.length > 200) return `${value.slice(0, 200)}…`;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  }
  return value;
}

function emit(level, event, fields = {}) {
  const line = {
    level,
    event,
    at: new Date().toISOString(),
    ...redact(fields),
  };
  const text = JSON.stringify(line);
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.info(text);
}

export const log = {
  info: (event, fields) => emit('info', event, fields),
  warn: (event, fields) => emit('warn', event, fields),
  error: (event, fields) => emit('error', event, fields),
};

/**
 * Wrap an API handler so every request produces one structured line: the
 * route, the method, the status, and how long it took. Unhandled errors are
 * logged and turned into a 500 rather than a stack trace in the response.
 */
export function withLogging(name, handler) {
  return async function loggedHandler(req, res) {
    const started = Date.now();
    try {
      await handler(req, res);
      log.info('request', {
        route: name, method: req.method,
        status: res.statusCode, ms: Date.now() - started,
      });
    } catch (err) {
      log.error('unhandled', {
        route: name, method: req.method,
        message: err?.message, stack: err?.stack?.split('\n').slice(0, 4).join(' | '),
        ms: Date.now() - started,
      });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }
  };
}
