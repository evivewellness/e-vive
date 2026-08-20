/**
 * Scheduled Cardex digests.
 *
 * One endpoint, one frequency per call: `/api/cron/digests?frequency=daily`.
 * Vercel's scheduler hits each on its own cron line (see vercel.json), which
 * keeps the schedule readable in one place rather than encoded as branching
 * inside the job.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { cronAuthorised } from '../../../lib/cron';
import { sendDigests } from '../../../lib/cardexNotify';

const FREQUENCIES = ['daily', 'weekly', 'monthly'];

export default async function handler(req, res) {
  if (!cronAuthorised(req)) return res.status(401).json({ error: 'Unauthorised.' });
  if (!serviceRoleConfigured()) return configError(res);

  const frequency = String(req.query.frequency || 'daily');
  if (!FREQUENCIES.includes(frequency)) {
    return res.status(400).json({ error: `frequency must be one of ${FREQUENCIES.join(', ')}` });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
  const result = await sendDigests(getSupabaseAdmin(), frequency, { origin });

  console.info('[cron/digests]', JSON.stringify(result));
  return res.status(200).json({ ok: true, ...result });
}
