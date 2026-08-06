# Cardex security — current state and what blocks the client-facing features

Status as of this commit. Read before building the client Care Reports tab,
the notification emails, or the doctor-sharing flow.

## Summary

The field-classification foundation (`lib/cardexAccess.js`) is in place and
tested. The **enforcement** foundation is not, and cannot be built without
first replacing the authentication model. Until that happens, no Cardex data
should be exposed to a client-facing surface.

## Why authorisation cannot currently be enforced

Three facts about this codebase, each verified:

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

### What this means

The brief's §0 rule 3 is *"Never derive identity from the request."* With the
model above, an API route has **nothing else to derive identity from**. The
browser would have to send either the client id or the forgeable session blob.
Adding `/api/cardex?clientId=…` would be precisely the vulnerability the brief
warns against, wearing the costume of a fix.

RLS alone does not rescue this either: with no authenticated role, a policy can
only be "allow anon" (no protection) or "deny anon" (breaks the whole app,
since every existing feature reads through the anon key from the browser).

## What has to happen first

Roughly in order:

1. **Server-verifiable sessions.** On login, an API route verifies credentials
   server-side and sets an **HttpOnly, Secure, SameSite** signed cookie
   (signed with a server-only secret). API routes read identity from that
   cookie. This is the smallest change that makes §2.4 possible and does not
   require adopting Supabase Auth wholesale.
2. **A service-role key**, added as a Vercel environment variable and used
   **only** in API routes — never imported into anything that reaches the
   browser bundle.
3. **RLS on `cardex_entries`** (and `shifts`, `placements`, `clients`,
   `hca_profiles`) that denies the anon role outright for Cardex, forcing all
   access through server routes that carry the verified identity.
4. **Column-level restriction** via a view or security-definer function, since
   RLS is row-level only.
5. Re-point existing browser-side reads (`getCardexByHca`, etc.) at the new
   server routes before the anon role is locked out, or they will break.

Steps 1–2 need decisions and credentials from the product owner, and step 3
cannot be validated from a sandbox without database access.

## Passwords

Related, and worth fixing in the same pass: client and HCA passwords are
compared as plain values against a `password` column, and the admin password is
compared against a SHA-256 hash **in browser-side code**. SHA-256 is not a
password hash. Any real auth work should move to bcrypt/argon2 server-side.

## Honest scope of what is protected today

`lib/cardexAccess.js` + `components/CardexView.jsx` guarantee that **the code
paths that exist** request and render only the fields an audience should see,
and fail closed on unknown fields or unknown audiences. That is real and
tested (`lib/cardexAccess.test.mjs`, 16 cases).

They do **not** — and cannot, alone — prevent a determined user from querying
`cardex_entries` directly with the public anon key. That gap closes only with
the work listed above.
