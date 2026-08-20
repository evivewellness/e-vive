/**
 * Server-side session and password primitives. SERVER ONLY — never import
 * from a component; it would pull SESSION_SECRET into the client bundle.
 *
 * Replaces the previous model, in which identity was a plain JSON object in
 * localStorage that any user could edit to become any other user. Sessions
 * here are HMAC-signed and delivered as HttpOnly cookies, so the browser can
 * present a session but cannot forge or read one.
 *
 * No new dependencies: HMAC and scrypt both come from node:crypto.
 */
import { createHmac, timingSafeEqual, randomBytes, scryptSync, createHash } from 'crypto';

const SECRET = process.env.SESSION_SECRET || '';
const COOKIE = 'evive_session';
const MAX_AGE_S = 60 * 60 * 12;  // 12h — matches the length of a shift

export function sessionSecretConfigured() { return SECRET.length >= 32; }

function assertSecret() {
  if (!sessionSecretConfigured()) {
    throw new Error(
      'SESSION_SECRET is not set (or is shorter than 32 chars). Generate one with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
}

const b64u  = (buf) => Buffer.from(buf).toString('base64url');
const unb64 = (str) => Buffer.from(str, 'base64url').toString('utf8');

function sign(payloadB64) {
  return createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
}

/** payload: { role: 'client'|'hca'|'admin', id, name, email } */
export function createSessionToken(payload) {
  assertSecret();
  const body = { ...payload, iat: Date.now(), exp: Date.now() + MAX_AGE_S * 1000 };
  const p = b64u(JSON.stringify(body));
  return `${p}.${sign(p)}`;
}

/** Returns the payload, or null. Never throws on malformed input. */
export function verifySessionToken(token) {
  if (!token || !sessionSecretConfigured()) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const p = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected;
  try { expected = sign(p); } catch { return null; }
  // Constant-time compare; length mismatch short-circuits before timingSafeEqual,
  // which throws on differing lengths.
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let body;
  try { body = JSON.parse(unb64(p)); } catch { return null; }
  if (!body?.exp || Date.now() > body.exp) return null;
  if (!body.role || !body.id) return null;
  return body;
}

export function sessionCookie(token) {
  const flags = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${MAX_AGE_S}`,
  ];
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  return flags.join('; ');
}

export function clearedSessionCookie() {
  const flags = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  return flags.join('; ');
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/**
 * THE way an API route learns who is calling. Reads the signed cookie only —
 * never a query parameter, body field or header the caller controls.
 */
export function getSession(req) {
  return verifySessionToken(parseCookies(req.headers?.cookie || '')[COOKIE]);
}

/**
 * Admin permission check. Permissions are resolved at sign-in and carried in
 * the signed cookie, so this reads the same token every other check does — a
 * browser cannot widen its own grant.
 */
export function requirePermission(req, perm) {
  const gate = requireRole(req, 'admin');
  if (!gate.ok) return gate;
  const perms = gate.session.permissions || [];
  if (!perms.includes('all') && !perms.includes(perm)) {
    return { ok: false, status: 403, error: `Your account does not have the "${perm}" permission.` };
  }
  return gate;
}

export function requireRole(req, role) {
  const s = getSession(req);
  if (!s) return { ok: false, status: 401, error: 'Not signed in.' };
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(s.role)) return { ok: false, status: 403, error: 'Not permitted.' };
  return { ok: true, session: s };
}

// ── Passwords ───────────────────────────────────────────────────────────────
// scrypt via node:crypto — a real password KDF, and no dependency to add.
// Stored as: scrypt$N$r$p$<salt-b64>$<hash-b64>

const N = 16384, r = 8, p = 1, KEYLEN = 32;

export function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(plain), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(plain, stored, algo = 'scrypt') {
  if (!stored) return false;
  // Legacy rows hold the literal password. Compared in constant time anyway,
  // and callers upgrade the row to scrypt on successful login.
  if (algo === 'plain' || !String(stored).startsWith('scrypt$')) {
    const a = Buffer.from(String(plain)), b = Buffer.from(String(stored));
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [, sN, sr, sp, saltB64, hashB64] = String(stored).split('$');
  try {
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = scryptSync(String(plain), salt, expected.length,
      { N: Number(sN), r: Number(sr), p: Number(sp) });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

export function isLegacyPassword(stored, algo) {
  return algo === 'plain' || !String(stored || '').startsWith('scrypt$');
}

// ── Share tokens ────────────────────────────────────────────────────────────
// The token goes in the emailed link; only its hash is stored, so a database
// dump does not yield working access links.

export function generateShareToken() {
  return randomBytes(32).toString('base64url');   // 256 bits
}
export function hashShareToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}
/** Short human-readable second factor, passed to the recipient out-of-band. */
export function generateAccessCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no look-alikes
  return Array.from(randomBytes(6)).map(b => alphabet[b % alphabet.length]).join('');
}
