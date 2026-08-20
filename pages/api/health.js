/**
 * Deployment health, for an uptime check and for whoever is asked "is it
 * actually configured?" at 9pm.
 *
 * The most common failure this platform has is not a crash: it is a deploy
 * missing SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY, where every page renders
 * and every Cardex screen quietly answers 503. That is invisible until a family
 * reports it. This makes it a red light.
 *
 * It reports *whether* each piece is configured and reachable, never what it is
 * configured to. No key material, no connection strings — an unauthenticated
 * endpoint that names your infrastructure is a gift to whoever is scanning.
 */
import { getSupabaseAdmin, serviceRoleConfigured } from '../../lib/supabaseAdmin';
import { sessionSecretConfigured } from '../../lib/serverAuth';

export default async function handler(req, res) {
  const checks = {
    sessionSecret: sessionSecretConfigured(),
    serviceRole: serviceRoleConfigured(),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    email: Boolean(process.env.RESEND_API_KEY),
    emailWebhook: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    mpesa: Boolean(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_PASSKEY),
    mpesaCallbackSecret: Boolean(process.env.MPESA_CALLBACK_SECRET),
    cron: Boolean(process.env.CRON_SECRET),
    database: false,
  };

  // A cheap round trip that proves the credentials work, not just that they
  // exist. `head: true` returns no rows.
  if (checks.serviceRole) {
    try {
      const { error } = await getSupabaseAdmin()
        .from('platform_settings').select('id', { count: 'exact', head: true });
      checks.database = !error;
    } catch {
      checks.database = false;
    }
  }

  // Without these the platform is up but its core feature is dark, so they
  // decide the status code an uptime monitor sees.
  const critical = ['sessionSecret', 'serviceRole', 'database'];
  const healthy = critical.every(k => checks[k]);

  // Configured-but-not-critical gaps are worth surfacing without paging anyone.
  const warnings = Object.entries(checks)
    .filter(([k, ok]) => !ok && !critical.includes(k))
    .map(([k]) => k);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
    warnings,
    at: new Date().toISOString(),
  });
}
