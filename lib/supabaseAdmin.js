/**
 * Service-role Supabase client. SERVER ONLY.
 *
 * This key bypasses Row Level Security entirely. It must never be imported
 * into anything that reaches the browser bundle — the guard below turns that
 * mistake into an immediate crash rather than a silent key leak.
 *
 * Set SUPABASE_SERVICE_ROLE_KEY in Vercel (Settings → Environment Variables).
 * It must NOT be prefixed NEXT_PUBLIC_, or Next.js will inline it client-side.
 */
import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('lib/supabaseAdmin.js was imported in the browser. It must only be used in API routes.');
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function serviceRoleConfigured() { return Boolean(url && serviceKey); }

let cached = null;

/** Throws (rather than silently falling back to the anon key) if unconfigured. */
export function getSupabaseAdmin() {
  if (!serviceRoleConfigured()) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Cardex routes cannot run without it — ' +
      'see supabase/migrations/0009_secure_cardex.sql.'
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/** Uniform 503 when the deployment is missing its server-side configuration. */
export function configError(res) {
  return res.status(503).json({
    error: 'Server is not configured for secure Cardex access.',
    detail: 'SUPABASE_SERVICE_ROLE_KEY and SESSION_SECRET must be set.',
  });
}
