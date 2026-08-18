/**
 * Step 2 of password reset: redeem the token and set a new scrypt password.
 *
 * The token is looked up by hash, must be unused and unexpired, and is
 * consumed in the same request that changes the password. Failures return one
 * neutral message so a token cannot be probed for validity.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { hashShareToken, hashPassword, sessionSecretConfigured } from '../../../lib/serverAuth';

const MIN_PASSWORD = 6;
const NEUTRAL = 'This reset link is not valid. It may have expired or already been used.';

const PW_COLUMN = { client: 'password_hash', hca: 'password' };
const TABLE = { client: 'clients', hca: 'hca_profiles' };

export default async function handler(req, res) {
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);
  const db = getSupabaseAdmin();

  // GET: does this link still work? Used to show the form or the failure page.
  if (req.method === 'GET') {
    const row = await liveToken(db, req.query.token);
    return res.status(row ? 200 : 400).json(row ? { ok: true, email: mask(row.email) } : { error: NEUTRAL });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, password } = req.body || {};
  if (String(password || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  }

  const row = await liveToken(db, token);
  if (!row) return res.status(400).json({ error: NEUTRAL });

  const table = TABLE[row.role];
  const column = PW_COLUMN[row.role];
  if (!table || !column) return res.status(400).json({ error: NEUTRAL });

  const { error } = await db.from(table)
    .update({ [column]: hashPassword(password), password_algo: 'scrypt' })
    .eq('id', row.subject_id);
  if (error) return res.status(500).json({ error: 'Could not update the password. Please try again.' });

  // Consume the token only after the password actually changed.
  await db.from('password_resets').update({ used_at: new Date().toISOString() }).eq('id', row.id);

  return res.status(200).json({ ok: true });
}

async function liveToken(db, token) {
  if (!token || typeof token !== 'string') return null;
  const { data } = await db.from('password_resets')
    .select('*').eq('token_hash', hashShareToken(token)).maybeSingle();
  if (!data || data.used_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data;
}

/** j***@example.com — enough to recognise the account, not enough to learn it. */
function mask(email) {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return '';
  return `${user.slice(0, 1)}${'*'.repeat(Math.max(user.length - 1, 1))}@${domain}`;
}
