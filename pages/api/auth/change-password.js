/**
 * Change your own password.
 *
 * The current password is verified server-side against the stored scrypt hash
 * — the browser never receives a password column to compare against, and never
 * decides whether the old password was right. The account changed is always the
 * one in the session cookie, so this cannot be aimed at someone else.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import {
  getSession, hashPassword, verifyPassword, sessionSecretConfigured,
} from '../../../lib/serverAuth';
import { checkRateLimit, recordAttempt, tooManyRequests, LIMITS } from '../../../lib/rateLimit';

const MIN_PASSWORD = 8;
const ACCOUNT = {
  client: { table: 'clients',      pwCol: 'password_hash' },
  hca:    { table: 'hca_profiles', pwCol: 'password' },
  admin:  { table: 'admin_users',  pwCol: 'password_hash' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  const cfg = session && ACCOUNT[session.role];
  if (!cfg) return res.status(401).json({ error: 'Not signed in.' });

  const { currentPassword, newPassword } = req.body || {};
  if (String(newPassword || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD} characters.` });
  }

  const db = getSupabaseAdmin();

  // Guessing the current password is guessing a password.
  const key = `pwchange:${session.role}:${session.id}`;
  const gate = await checkRateLimit(db, { key, ...LIMITS.passwordChange });
  if (!gate.ok) return tooManyRequests(res, gate.retryAfter);

  const { data: row } = await db.from(cfg.table)
    .select(`id, ${cfg.pwCol}, password_algo`).eq('id', session.id).maybeSingle();
  if (!row) return res.status(404).json({ error: 'Account not found.' });

  const stored = row[cfg.pwCol];
  if (!verifyPassword(currentPassword, stored, row.password_algo || 'plain')) {
    await recordAttempt(db, key);
    return res.status(403).json({ error: 'Current password is incorrect.' });
  }

  const { error } = await db.from(cfg.table)
    .update({ [cfg.pwCol]: hashPassword(newPassword), password_algo: 'scrypt' })
    .eq('id', session.id);
  if (error) return res.status(500).json({ error: 'Could not change the password. Please try again.' });

  return res.status(200).json({ ok: true });
}
