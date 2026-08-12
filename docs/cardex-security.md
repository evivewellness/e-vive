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

## Attendance geofencing

Clock-in and clock-out were checked in the browser: the page computed the
distance from `assignedClient.lat/lng` and then wrote the result with the
public anon key. That is not a control. The position can be spoofed from
developer tools in seconds, and `clockInHca` could be called from the console
with any coordinates at all. Attendance drives pay and is the record of who
was with a patient and when, so it now goes through `/api/shifts/clock`,
which resolves the shift, the patient and the reference address itself from
the HCA's signed session cookie and decides the geofence server-side.

Three separate defects were folded into that change:

- **Wrong reference point.** The fence was centred on the *client account's*
  coordinates. A client can have several patients at different addresses — the
  placement workflow exists precisely to support one HCA serving more than one
  — so an HCA could be judged "on site" at a house they had never visited.
  Patients now carry their own `careLat`/`careLng`, with the client premises
  as an explicitly recorded fallback (`reference_source`).

- **Accuracy ignored.** `position.coords.accuracy` was discarded, so a ±500 m
  fix was treated exactly like a ±4 m one. A distance derived from a fix that
  vague is arithmetic, not evidence — in either direction. Fixes worse than
  the configured maximum are now refused with a "try again" rather than being
  silently accepted or silently rejected.

- **A 10 m fence.** No consumer smartphone achieves that indoors, which is
  where homecare happens. The practical effect was to refuse honest clock-ins,
  not to catch dishonest ones. The radius is Admin-configurable, defaults to
  75 m, and forgives up to 50 m of the fix's own uncertainty before calling a
  position a breach.

Every attempt that is not a clean fix inside the fence is written to
`attendance_exceptions` — allowed or refused, with the distance, the accuracy,
the reference source and the enforcement mode in force. A refusal that leaves
no trace is indistinguishable from an HCA who never turned up.

The response to the browser deliberately omits the reference coordinates and
returns only the verdict, the distance and the radius. Handing the phone the
exact centre of the fence is the one thing that makes it easy to defeat.

**What this does not do.** It does not prove the HCA's phone was really at
those coordinates. A rooted device or a mock-location app can feed the browser
whatever it likes, and no web API can distinguish that from a genuine fix. The
geofence raises the cost and creates a reviewable record; it is not proof of
attendance.

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
- **Mock-location apps defeat the geofence.** See above — the browser
  cannot tell a spoofed position from a real one.

This defends against forged identity, field over-disclosure, direct table
access with the public key, and unaudited sharing. It does not make the system
uncompromisable, and it should not be described that way.
