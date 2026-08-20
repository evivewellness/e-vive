/**
 * Client self-registration.
 *
 * Runs server-side so the password is hashed with scrypt before it is ever
 * stored — new accounts never exist as plaintext, and the browser is never
 * given the ability to insert a `clients` row of its own shape.
 *
 * On success the caller is signed in immediately: the same signed HttpOnly
 * cookie that /api/auth/login issues.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import {
  createSessionToken, sessionCookie, hashPassword, sessionSecretConfigured,
} from '../../../lib/serverAuth';
import { consumeRateLimit, clientIp, tooManyRequests, LIMITS } from '../../../lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const { name, email, mobile, password, location, address, patients } = req.body || {};

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanName) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (String(password || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  }

  const db = getSupabaseAdmin();

  const gate = await consumeRateLimit(db, { key: `register:ip:${clientIp(req)}`, ...LIMITS.registerPerIp });
  if (!gate.ok) return tooManyRequests(res, gate.retryAfter, 'Too many accounts created from here. Please try again later.');

  const { data: existing } = await db.from('clients').select('id').ilike('email', cleanEmail).maybeSingle();
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  // Only the fields registration is allowed to set. Anything else a caller
  // sends — status, journey_stage, assigned_hca_id — is ignored.
  const seededPatients = (Array.isArray(patients) ? patients : []).slice(0, 10).map(p => ({
    id: uid(),
    name: String(p?.name || '').trim(),
    gender: String(p?.gender || '').trim(),
    careType: String(p?.careType || '').trim(),
    conditions: String(p?.conditions || p?.careType || '').trim(),
    notes: String(p?.notes || '').trim(),
    relationship: String(p?.relationship || 'Patient').trim(),
  }));

  const now = new Date().toISOString();
  const { data, error } = await db.from('clients').insert({
    name: cleanName,
    email: cleanEmail,
    mobile: String(mobile || '').trim(),
    password_hash: hashPassword(password),
    password_algo: 'scrypt',
    location: String(location || '').trim(),
    address: String(address || '').trim(),
    patients: seededPatients,
    journey_stage: 'account_created',
    journey_dates: { account_created: now },
    status: 'active',
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Same row shape lib/store.js logActivity() writes: { type, data }.
  await db.from('activity_log').insert({
    type: 'client_registered',
    data: { clientId: data.id, clientName: cleanName, email: cleanEmail },
  }).then(() => {}, () => {});   // an audit write must never fail the signup

  const session = { role: 'client', id: data.id, name: data.name, email: data.email, mobile: data.mobile };
  res.setHeader('Set-Cookie', sessionCookie(createSessionToken(session)));
  return res.status(200).json({ ok: true, client: { id: data.id, name: data.name, email: data.email, mobile: data.mobile } });
}
