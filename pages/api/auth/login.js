/**
 * Server-side login. Verifies credentials against the database using the
 * service-role key, then issues an HMAC-signed HttpOnly session cookie.
 *
 * This replaces "identity is whatever localStorage says", under which any
 * user could edit their own client id and become another client.
 *
 * Legacy passwords (stored as literal values) are accepted once and then
 * transparently upgraded to scrypt, so no flag-day reset is needed.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import {
  createSessionToken, sessionCookie, hashPassword, verifyPassword,
  isLegacyPassword, sessionSecretConfigured,
} from '../../../lib/serverAuth';

const TABLE = {
  client: { table: 'clients',      pwCol: 'password_hash', idCols: ['email', 'mobile'] },
  hca:    { table: 'hca_profiles', pwCol: 'password',      idCols: ['email', 'mobile', 'employee_id'] },
  admin:  { table: 'admin_users',  pwCol: 'password_hash', idCols: ['email'] },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const { role, identifier, password } = req.body || {};
  const cfg = TABLE[role];
  if (!cfg || !identifier || !password) {
    return res.status(400).json({ error: 'role, identifier and password are required.' });
  }

  const db = getSupabaseAdmin();
  const ident = String(identifier).trim();

  // Look the account up across the identifiers that role may sign in with.
  let row = null;
  for (const col of cfg.idCols) {
    const value = col === 'email' ? ident.toLowerCase() : ident;
    const { data } = await db.from(cfg.table).select('*').ilike(col, value).maybeSingle();
    if (data) { row = data; break; }
  }

  // Same response and broadly the same cost whether the account exists or the
  // password is wrong — don't confirm which accounts exist.
  const stored = row?.[cfg.pwCol];
  const algo   = row?.password_algo || 'plain';
  const ok     = row && stored && verifyPassword(password, stored, algo);
  if (!ok) {
    if (!row) verifyPassword(password, hashPassword('decoy-comparison'), 'scrypt');
    return res.status(401).json({ error: 'Incorrect sign-in details.' });
  }
  if (row.active === false || row.status === 'suspended') {
    return res.status(403).json({ error: 'This account is not active. Contact E-Vive.' });
  }

  // Upgrade legacy plaintext on the way through.
  if (isLegacyPassword(stored, algo)) {
    await db.from(cfg.table)
      .update({ [cfg.pwCol]: hashPassword(password), password_algo: 'scrypt' })
      .eq('id', row.id);
  }
  if (role === 'admin') {
    await db.from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', row.id);
  }

  const session = {
    role, id: row.id,
    name: row.name || row.full_name || '',
    email: row.email || '',
    ...(role === 'admin' ? {
      canReadWelfareNotes: !!row.can_read_welfare_notes,
      adminRole: row.role || 'super_admin',
    } : {}),
    ...(role === 'hca'   ? { employeeId: row.employee_id } : {}),
  };
  res.setHeader('Set-Cookie', sessionCookie(createSessionToken(session)));
  return res.status(200).json({ ok: true, session });
}
