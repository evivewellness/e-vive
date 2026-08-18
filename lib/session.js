/**
 * Browser-side access to the *server's* view of who is signed in.
 *
 * The only proof of identity is the HMAC-signed HttpOnly `evive_session`
 * cookie, which the browser can present but cannot read or forge. These helpers
 * ask the server to decode it. Nothing here reads localStorage, and nothing
 * here is authorisation on its own — every API route re-derives identity from
 * the cookie for itself. This decides what a *page* renders, so that a forged
 * localStorage entry no longer opens a portal.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

/** Returns the session payload, or null. Never throws. */
export async function fetchServerSession() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const { session } = await res.json();
    return session || null;
  } catch {
    return null;
  }
}

export async function serverSignOut() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch { /* the cookie expires on its own; never block sign-out on the network */ }
}

/**
 * Page guard. Renders nothing until the server has confirmed the role, and
 * redirects to `redirectTo` when it does not.
 *
 * `status` is 'checking' | 'authed' | 'denied' — pages render their body only
 * on 'authed', so protected content never flashes before the check completes.
 */
export function useRequireRole(role, redirectTo) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchServerSession();
      if (cancelled) return;
      const roles = Array.isArray(role) ? role : [role];
      if (s && roles.includes(s.role)) {
        setSession(s);
        setStatus('authed');
      } else {
        setStatus('denied');
        router.replace(redirectTo);
      }
    })();
    return () => { cancelled = true; };
  }, [role, redirectTo, router]);

  return { session, status, authed: status === 'authed' };
}
