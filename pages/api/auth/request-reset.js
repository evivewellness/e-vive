/**
 * Step 1 of password reset: issue a single-use token and email it.
 *
 * Three properties matter:
 *
 *  1. The response is identical whether or not the account exists. A reset
 *     form that says "no account found" is an account-enumeration oracle.
 *  2. Only the SHA-256 of the token is stored, so a database dump yields no
 *     usable reset links.
 *  3. Tokens are short-lived, single-use, and any earlier unused token for the
 *     same account is invalidated when a new one is issued.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import {
  generateShareToken, hashShareToken, sessionSecretConfigured,
} from '../../../lib/serverAuth';
import { consumeRateLimit, clientIp, tooManyRequests, LIMITS } from '../../../lib/rateLimit';

const TTL_MINUTES = 45;
const MAX_PER_HOUR = 5;      // per account, to keep the mailbox from being used as a weapon

const ROLES = {
  client: { table: 'clients',      idCols: ['email', 'mobile'], nameCol: 'name' },
  hca:    { table: 'hca_profiles', idCols: ['email', 'mobile', 'employee_id'], nameCol: 'name' },
};

const OK = { ok: true, message: 'If that account exists, a reset link is on its way.' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const { role, identifier } = req.body || {};
  const cfg = ROLES[role];
  if (!cfg || !String(identifier || '').trim()) {
    return res.status(400).json({ error: 'role and identifier are required.' });
  }

  const db = getSupabaseAdmin();
  const ident = String(identifier).trim();

  // The per-account limit below stops one mailbox being flooded; this stops one
  // source walking a list of addresses.
  const gate = await consumeRateLimit(db, { key: `reset:ip:${clientIp(req)}`, ...LIMITS.resetPerIp });
  if (!gate.ok) return tooManyRequests(res, gate.retryAfter);

  let row = null;
  for (const col of cfg.idCols) {
    const value = col === 'email' ? ident.toLowerCase() : ident;
    const { data } = await db.from(cfg.table).select('id, email, ' + cfg.nameCol).ilike(col, value).maybeSingle();
    if (data) { row = data; break; }
  }
  // Deliberately the same answer either way.
  if (!row?.email) return res.status(200).json(OK);

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db.from('password_resets')
    .select('id', { count: 'exact', head: true })
    .eq('role', role).eq('subject_id', row.id).gte('created_at', since);
  if ((count || 0) >= MAX_PER_HOUR) return res.status(200).json(OK);

  // One live token per account.
  await db.from('password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('role', role).eq('subject_id', row.id).is('used_at', null);

  const token = generateShareToken();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();
  const { error } = await db.from('password_resets').insert({
    role, subject_id: row.id, email: row.email,
    token_hash: hashShareToken(token), expires_at: expiresAt,
  });
  if (error) return res.status(500).json({ error: 'Could not start the reset. Please try again.' });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
  const link = `${origin}/auth/reset/${token}`;
  const firstName = String(row[cfg.nameCol] || '').split(' ')[0] || 'there';

  try {
    await fetch(`${origin}/api/send-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: row.email,
        subject: 'Reset your E-Vive password',
        text:
          `Hello ${firstName},\n\n` +
          `Someone asked to reset the password on your E-Vive account.\n\n` +
          `Set a new password here: ${link}\n\n` +
          `This link works once and expires in ${TTL_MINUTES} minutes.\n` +
          `If you did not ask for this, you can ignore this email — your password has not changed.\n\n` +
          `E-Vive HomeCare\n+254 141 888 340 | hello@e-vive.co.ke`,
        origin: 'system',
      }),
    });
  } catch { /* the token stands; the user can request another */ }

  return res.status(200).json(OK);
}
