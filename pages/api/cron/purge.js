/**
 * Scheduled retention purge.
 *
 * The purge functions have existed since the secure-Cardex release and ran only
 * when an admin pressed a button, which made the retention periods in
 * platform_settings an intention rather than a commitment. This runs them.
 *
 * Each is called independently and failures are reported rather than thrown:
 * one purge failing (a missing function on an older database, say) must not
 * stop the others from running.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { cronAuthorised } from '../../../lib/cron';

const JOBS = [
  { name: 'cardex',        fn: 'purge_expired_cardex_data' },
  { name: 'passwordResets', fn: 'purge_expired_password_resets' },
  { name: 'rateLimits',    fn: 'purge_expired_rate_limits' },
];

export default async function handler(req, res) {
  if (!cronAuthorised(req)) return res.status(401).json({ error: 'Unauthorised.' });
  if (!serviceRoleConfigured()) return configError(res);

  const db = getSupabaseAdmin();
  const results = {};

  for (const job of JOBS) {
    const { data, error } = await db.rpc(job.fn);
    results[job.name] = error ? { error: error.message } : { deleted: data ?? 0 };
  }

  console.info('[cron/purge]', JSON.stringify(results));
  const anyFailed = Object.values(results).some(r => r.error);
  return res.status(anyFailed ? 207 : 200).json({ ok: !anyFailed, results });
}
