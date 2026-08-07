# Cardex security — architecture and residual risk

## Summary

Enforcement now exists. Cardex data is served only by API routes that derive
identity from an **HMAC-signed HttpOnly session cookie**, query with the
service-role key, and select an explicit column list from
`lib/cardexAccess.js`. RLS denies the public anon key on the Cardex tables
outright, so the browser cannot reach them directly.

**Two environment variables are required** or every Cardex route returns 503:

    SUPABASE_SERVICE_ROLE_KEY   Supabase → Settings → API → service_role
    SESSION_SECRET              node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

Neither may be prefixed `NEXT_PUBLIC_`.

## What the previous model looked like (and why it had to change)

Three facts, each verified before the change:

**1. Sessions are unsigned localStorage JSON.**

```js
export function getClientSession() { return lsGet('evive_client_session'); }
function lsGet(key) { return JSON.parse(localStorage.getItem(key)); }
```

`setClientSession` writes `{ id, name, email, mobile }` as plain JSON. There is
no token, no signature, no expiry, no server involvement. Any user can open
devtools and set:

```js
localStorage.setItem('evive_client_session', JSON.stringify({ id: '<any client uuid>' }))
```

and the application will treat them as that client.

**2. There is no Supabase Auth session.**

`lib/supabase.js` calls `createClient(url, anonKey)` with no sign-in flow.
Every request to Postgres therefore arrives as the `anon` role with
`auth.uid()` = NULL. RLS policies of the usual form

```sql
using (client_id = auth.uid())
```

cannot work, because there is no authenticated user to compare against.

**3. There is no service-role key.**

No `SUPABASE_SERVICE_ROLE_KEY` exists in the repo or in the environment
template. Every query — browser and API route alike — uses the same public
anon key, which is embedded in the client bundle.

## How it works now

1. **Login** (`/api/auth/login`) verifies credentials server-side with the
   service-role key and issues a signed HttpOnly cookie. The browser can
   present it but cannot read or forge it.
2. **Every Cardex route** calls `getSession(req)`, which reads *only* that
   cookie. No route accepts a client id from the query string, body or a
   header.
3. **Queries** use `cardexColumnsFor(audience)` — `welfare_note`,
   `shift_rating`, `qa_comments` and `flagged` are never requested on a
   client-facing path, so they cannot appear in a response.
4. **Responses** are redacted again with `redactCardexFor` (defence in depth).
5. **RLS** (migration 0009) enables row level security with no anon policies
   on `cardex_entries`, `cardex_shares`, `cardex_share_recipients`,
   `cardex_share_audit`, `cardex_notify_prefs`, `platform_settings` and
   `admin_users` — default deny. Only the service role reaches them.

## Passwords

Now scrypt (`node:crypto`, no new dependency), salted per user. Legacy
plaintext rows still verify once and are transparently upgraded to scrypt on
the next successful login, so no flag-day reset is needed. `password_algo`
tracks which rows have migrated.

The old admin path — a SHA-256 hash compared in **browser** code — remains as
a fallback only until an `admin_users` row exists. Create one and remove
`NEXT_PUBLIC_ADMIN_HASH`; SHA-256 is not a password hash and a client-side
comparison gates nothing.

## Residual risk — read this

- **Not verified at runtime.** None of this was exercised against a live
  database or a browser. The logic is unit-tested; the deployment is not.
- **The localStorage session still exists.** Existing UI reads it for display,
  and it is still forgeable — but it no longer grants access to Cardex data,
  because the API routes ignore it entirely. It should be removed once every
  read path is server-side.
- **Other tables remain anon-readable.** `clients`, `hca_profiles`, `shifts`
  and the rest are still queried directly from the browser with the anon key.
  Cardex is protected; the wider application is not yet. Locking those down
  means routing their reads through API routes too.
- **Share links are bearer tokens.** Anyone holding the URL (and the access
  code, when enabled) can read the report until it expires or is revoked.
  That is inherent to emailed links; expiry, revocation, per-recipient tokens
  and the audit log limit the blast radius rather than eliminate it.
- **No rate limiting on login.** Brute-forcing a weak password is not
  currently slowed server-side.

This defends against forged identity, field over-disclosure, direct table
access with the public key, and unaudited sharing. It does not make the system
uncompromisable, and it should not be described that way.
