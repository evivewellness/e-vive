# E-Vive Platform — Technical Documentation

> **Version:** Current as of August 2026  
> **Live URL:** https://e-vive.vercel.app  
> **Repository:** https://github.com/mafichoni/e-vive  
> **Branch:** `main`  
> **Launch status:** All six P0 blockers and every P1 are closed, along with
> four of six P2s. Start at
> [Implementation Status](#implementation-status--august-2026).

---

## Table of Contents

- **[Implementation Status & Outstanding Work — August 2026](#implementation-status--august-2026)** ← read this first

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Route Map](#3-route-map)
4. [Public Pages](#4-public-pages)
   - 4.1 [Home `/`](#41-home-)
   - 4.2 [About `/about`](#42-about-about)
   - 4.3 [Contact `/contact`](#43-contact-contact)
   - 4.4 [Family Caregiver Hub `/caregivers`](#44-family-caregiver-hub-caregivers)
   - 4.5 [For Assistants `/assistants`](#45-for-assistants-assistants)
   - 4.6 [Products `/products`](#46-products-products)
   - 4.7 [Find a Carer `/match`](#47-find-a-carer-match)
   - 4.8 [Partners `/partners`](#48-partners-partners)
   - 4.9 [Privacy Policy `/privacy`](#49-privacy-policy-privacy)
   - 4.10 [Terms of Use `/terms`](#410-terms-of-use-terms)
5. [Client Portal](#5-client-portal)
   - 5.1 [Registration & Sign-In `/client/register`](#51-registration--sign-in-clientregister)
   - 5.2 [Client Dashboard `/client/dashboard`](#52-client-dashboard-clientdashboard)
6. [HCA Portal](#6-hca-portal)
   - 6.1 [HCA Application `/hca/apply`](#61-hca-application-hcaapply)
   - 6.2 [HCA Login `/hca/login`](#62-hca-login-hcalogin)
   - 6.3 [HCA Dashboard `/hca/dashboard`](#63-hca-dashboard-hcadashboard)
7. [Admin Portal](#7-admin-portal)
   - 7.1 [Admin Login `/admin/login`](#71-admin-login-adminlogin)
   - 7.2 [Admin Dashboard `/admin/dashboard`](#72-admin-dashboard-admindashboard)
   - 7.3 [Finance Dashboard `/admin/finance`](#73-finance-dashboard-adminfinance)
   - 7.4 [Map View `/admin/map`](#74-map-view-adminmap)
8. [Shared Components](#8-shared-components)
9. [Data Layer — Supabase Reference](#9-data-layer--supabase-reference)
   - 9.1 [Supabase Tables](#91-supabase-tables)
   - 9.2 [Data Schemas](#92-data-schemas)
   - 9.3 [Store Functions Reference](#93-store-functions-reference)
   - 9.4 [Messages / Email Setup](#94-messages--email-setup)
   - 9.5 [Database Migrations](#95-database-migrations)
   - 9.6 [The Data Gateway](#96-the-data-gateway)
10. [Authentication Systems](#10-authentication-systems)
11. [Client Journey Stages](#11-client-journey-stages)
12. [RBAC System](#12-rbac-system)
13. [Pricing & Rates](#13-pricing--rates)
14. [Security Configuration](#14-security-configuration)
15. [Demo & Seed Data](#15-demo--seed-data)
16. [Static Assets](#16-static-assets)
17. [Development Guide](#17-development-guide)

---

## Implementation Status — August 2026

The August review found six P0 launch blockers. **All six are now closed**; this
section records what changed, what was verified, and what is still outstanding.
Everything below §1 is reference documentation for the platform as it now
stands.

### Verified

| Area | State |
|---|---|
| Build | `next build` succeeds — 50 routes, no errors |
| Lint | `next lint` clean, 2 pre-existing `no-img-element` warnings |
| Tests | `npm test` — 179/179 pass, up from 71 |
| Sessions | Identity is the HMAC-signed HttpOnly cookie everywhere — sign-in, page guards and every API route. No page decides access from localStorage |
| Data access | The browser no longer holds a database key. Every read and write goes through `/api/db`, which applies `lib/dbPolicy.js` and queries with the service role |
| RLS | Enabled with no anon policies on **all 32 tables** (migration `0009` for the Cardex tables, `0010` for the rest) |
| Passwords | scrypt everywhere: registration, reset and password change all hash server-side. No browser code compares a password |
| Payments | M-Pesa callbacks are authenticated, persisted to `payments`, reconciled against the invoice, and confirmed to the family |
| Public pages | Every page carries a title, description, canonical URL, OG tags and — critically — a viewport meta |

### What was closed, and how

**P0-1 · Admin identity is server-verified.** `admin/dashboard`, `admin/finance`
and `admin/map` now call `/api/auth/session` and render only for a confirmed
`admin` role (`lib/session.js`). The browser-side SHA-256 comparison is deleted,
along with `NEXT_PUBLIC_ADMIN_EMAIL` and `NEXT_PUBLIC_ADMIN_HASH`. Admins are
rows in `admin_users`; §17 covers creating one. Signing out clears the cookie,
not just localStorage.

**P0-2 · Sign-in is server-only.** `pages/hca/login.jsx` and
`pages/client/register.jsx` no longer fetch a row and compare a password —
`/api/auth/login` decides, and its answer drives the redirect. This also fixes
the lockout it caused: once the login route upgraded a legacy password to
scrypt, the browser's `profile.password !== typed` check could never match
again, so every user failed their *second* sign-in. Registration moved to
`/api/auth/register`, which hashes with scrypt before the row is written, and
the plaintext `evive_client_registry` in localStorage is gone.

**P0-3 · The browser no longer talks to Postgres.** `lib/supabase.js` used to be
a real Supabase client holding the public anon key. It is now a shim with the
same query-builder shape that posts a *description* of the query to `/api/db`.
That route resolves the caller from the signed cookie, looks the request up in
`lib/dbPolicy.js`, narrows the columns, ANDs on a mandatory row scope, and only
then queries with the service-role key. Migration `0010` enables default-deny
RLS on the remaining 23 tables. See §9.6 for how the policy reads.

Three acts authenticate *themselves* rather than a role, so they are their own
routes rather than table policy: applying (`/api/applications/create`),
correcting an application by emailed link (`/api/applications/[token]`), and an
HCA reading their own private fields (`/api/hca/me`).

**P0-4 · Password reset is real.** `/api/auth/request-reset` issues a single-use
token, stores only its SHA-256, emails the link, and answers identically whether
or not the account exists. `/auth/reset/[token]` redeems it; the token expires in
45 minutes, is consumed on use, and issuing a new one invalidates the last.
HCAs have a reset path for the first time.

**P0-5 · M-Pesa payments reconcile.** The callback authenticates via
`MPESA_CALLBACK_SECRET` carried in the callback URL (Safaricom sends no
credentials of its own), writes to the new `payments` table, marks the invoice
paid, and emails the family a receipt. The STK push now requires a signed-in
client and reads the amount from the invoice rather than the request body, so an
edited payload cannot underpay a KES 35,000 invoice with KES 1.

**P0-6 · Every public page has a `<Head>`.** Viewport, favicon and OG defaults
live in `pages/_app.jsx`; `components/PageMeta.jsx` adds each page's title,
description, canonical URL and social card. The eight pages that previously
rendered no `<Head>` at all — and so laid out at desktop width on phones — now
render correctly.

### Closed since that review

Every P1 is done, and four of the six P2s. What changed:

| # | Was | Now |
|---|---|---|
| **P1-1** | RBAC declared, displayed, never checked | Permissions live in `lib/permissions.js`, resolve at sign-in into the signed cookie, and gate admin writes per table, `/api/settings`, Cardex, the sidebar, and the finance and map pages. An unknown role grants nothing |
| **P1-2** | `cardex_notify_prefs` written and read by nothing | Incident alerts, optional per-report notices and daily/weekly/monthly digests, all carrying counts and a link rather than clinical detail |
| **P1-3** | Retention purges ran only by hand | `/api/cron/purge` nightly and digests on their own schedules, via `vercel.json` crons, authorised by `CRON_SECRET` |
| **P1-4** | No server-side throttle anywhere | `lib/rateLimit.js` — sign-in limited per account *and* per IP, plus registration, application intake, password change, reset and anonymous writes |
| **P1-5** | Initial passwords generated with `Math.random` and stored in plain form | `/api/hca/approve` generates with `crypto.randomInt`, hashes with scrypt, and returns the password exactly once |
| **P1-6** | Location checked in the browser at 10 m | Checked in `/api/hca/clock-in` at a configurable radius (default 150 m), after confirming the HCA is actually placed with that family. The outcome is recorded, so payroll can tell verified from merely recorded |
| **P1-7** | Uploads base64 inside `hca_applications.form_data` | Private Storage bucket, signed-URL reads gated by permission, and a fallback to inline if the bucket does not exist yet |
| **P1-8** | Demo seed with published credentials | Deleted |
| **P2-1** | 3 high advisories | nanoid patched. Next.js remains — see below |
| **P2-3** | Nothing observable | `/api/health`, structured JSON logging with secret redaction, and an error boundary |
| **P2-4** | No robots.txt or sitemap.xml | Both generated at prebuild from `NEXT_PUBLIC_SITE_URL` |
| **P2-5** | Dead footer links, stale cookie notice | `/accessibility` written, cookie notice corrected, footer links live |

Three corrections to that review, since it was wrong on the detail:

- **The clock-in geofence did exist**, in `pages/hca/dashboard.jsx`. The problem
  was that a check in the browser is advice, and that 10 m is inside the error
  bar of consumer GPS indoors — so it also rejected honest carers.
- **The footer's social buttons were not dead.** They pointed at real Facebook
  and Instagram accounts; what they lacked was accessible names.
- **The privacy policy was more complete than stated.** It already named the
  controller, a DPO postal route and the right to complain to the ODPC. What was
  wrong was its cookie section, which still described localStorage sessions.

### Still outstanding

| # | Task | Detail |
|---|---|---|
| **P2-1** | Next.js advisories | `14.2.35` is the newest release in the 14.2 line and the advisory range runs to `16.3.0-preview.10`, so only a major-major upgrade clears it. Every listed CVE targets App Router, Server Components, self-hosted image optimisation, middleware i18n or custom servers — none of which this Pages-Router-on-Vercel app uses. Left open deliberately: a blind 14 → 16 jump with no runtime testing available would trade a theoretical exposure for a real one |
| **P2-2** | Test coverage of `lib/store.js` and the API routes | 179 tests now cover scheduling, Cardex access and summaries, the data policy, the query shim, permissions, rate limiting, geo, notifications, logging and cron auth. `lib/store.js` itself resists unit testing — it uses extensionless imports that plain Node ESM cannot resolve — and the API routes need a live database. An end-to-end pass per persona is still the highest-value addition |
| **P2-6** | `pages/admin/dashboard.jsx` is 4,053 lines | **Not attempted, deliberately.** The bulk is fourteen tabs of JSX and around twenty modals; extracting them is mechanical but touches the most important admin surface with no page-level tests to catch a slip, and no way to exercise the result against a real database from here. Shipping an unverifiable refactor of that screen immediately before launch is a worse trade than the file being long. Do it behind an end-to-end test, after launch |
| **P2-6** | CSP still needs `'unsafe-inline'` | Every page ships its styles as an inline string. Nonces need an App Router migration |
| — | ODPC registration number and named DPO | `/privacy` gives a postal route to a Data Protection Officer but no registration number and no named individual. Those are real-world values that have to be supplied, not invented |
| — | Accessibility audit | `/accessibility` states what has been done and, at more length, what has not been verified. A real audit against assistive technology is still outstanding |

### Deliberately deferred

Not oversights.

- **Homecare products marketplace** (`/products`) — waitlist only, by design
- **Community & support groups** (`/caregivers`) — held until moderation exists
- **PDF generation** — shared reports print via the browser; a PDF dependency was deliberately not added
- **Automated invoicing from completed shifts** — invoices are raised by Admin today
- **TypeScript migration**

---

## 1. Platform Overview

E-Vive is Kenya's location-based homecare assistant matching platform, operated by **E-Vive Wellness Initiative** and headquartered in Nairobi. It connects certified HomeCare Assistants (HCAs) with families who need professional in-home care for elderly, post-surgical, or chronically ill patients.

### Three User Personas

| Persona | Entry Point | Purpose |
|---|---|---|
| **Family / Client** | `/client/register` | Register, browse HCAs, manage placements, track billing |
| **HomeCare Assistant (HCA)** | `/hca/apply` → `/hca/login` | Apply, manage shifts, submit digital Cardex reports |
| **E-Vive Admin** | `/admin/login` | Oversee all operations, approve HCAs, manage payments |

### Key Capabilities
- **Location-based HCA matching** with advanced filtering (care type, language, shift, radius)
- **Digital Cardex** — structured daily shift reports with vitals, medications, incidents
- **GPS clock-in/out** for shift attendance — coordinates are recorded at clock-in but not yet checked against the placement address (**P1-6**)
- **Journey tracking** — 10-stage client onboarding pipeline
- **Family Caregiver Hub** — LMS training courses, counselling referrals, professional resource library (community/support groups coming soon)
- **Super Admin controls** — announcements, newsletters, pricing, discount codes, RBAC, map management
- **M-Pesa payments** — STK Push against an invoice, reconciled from Safaricom's callback

---

## 2. Tech Stack & Architecture

### Framework & Runtime
| Component | Detail |
|---|---|
| Framework | Next.js 14.2.35 (Pages Router) |
| UI Library | React 18.2.0 |
| Language | JavaScript (JSX) — no TypeScript |
| Node target | Node ≥ 18 |

### Styling
- **No external CSS library** — all styles are inline CSS-in-JS via `<style>{CSS}</style>` tags within each page component
- **Design tokens** centralized in `components/SharedStyles.js` (exported as `BASE_CSS` and `DASH_BASE`)
- **Custom fonts** loaded via Google Fonts: Playfair Display (headings), DM Sans (body), DM Mono (monospace/labels)

### State & Data
- **Supabase backend** — all persistent application data is stored in a Supabase PostgreSQL database (project `vwwdmzdknmdsiowmjkzf`, region `eu-west-1`)
- All async data functions live in `lib/store.js`, which imports from `lib/supabase.js`
- **`lib/supabase.js` is not a database client.** It is a shim with the Supabase query-builder shape that posts a description of each query to `/api/db`. The browser holds no database key at all — see §9.6
- **Identity is the signed HttpOnly `evive_session` cookie.** localStorage holds display copies (name, employee ID) and Cardex drafts; nothing reads it to decide access
- React hooks (`useState`, `useEffect`, `useCallback`, `useRef`) for all component state
- Email delivery via `/api/send-email.js` using the Resend SDK

### Build & Deployment
| Setting | Value |
|---|---|
| Build command | `next build` |
| Hosting | Vercel |
| `trailingSlash` | `true` (URLs end with `/`) |
| `poweredByHeader` | `false` |
| `reactStrictMode` | `true` |
| Image domains | `[]` (no external image optimization) |

### Dependencies
```json
{
  "next": "14.2.35",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/supabase-js": "^2.106.2",
  "resend": "^6.12.4",
  "svix": "^1.99.1"
}
```
**devDependencies:** `eslint ^8.0.0`, `eslint-config-next ^14.2.35`

`svix` verifies the Resend webhook signature. Password hashing, session signing
and share tokens all use `node:crypto` — no cryptography dependency was added.
`npm audit --omit=dev` currently reports 3 high advisories; see **P2-1**.

### Environment Variables

`.env.local.example` documents all of these, with the generation commands.

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | **Yes** |
| `MPESA_CALLBACK_SECRET` | Authorises Safaricom's callback, carried in the callback URL. Safaricom sends no credentials of its own, so without this the endpoint is unauthenticated | **Yes when M-Pesa is live** |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key, used only in API routes. Bypasses RLS — must **never** carry a `NEXT_PUBLIC_` prefix | **Yes** — without it every `/api/cardex/*`, `/api/settings` and `/api/auth/login` call returns 503 |
| `SESSION_SECRET` | HMAC key for session cookies; ≥ 32 chars. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` | **Yes** — same 503 without it |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin. Used to build M-Pesa callback URLs and shared-report links | **Yes in production** — otherwise both fall back to the request's `Host` header |
| `RESEND_API_KEY` | Resend email API key | Optional (email silently skipped if absent) |
| `EMAIL_FROM` | Override sender address | Optional (defaults to `E-Vive Kenya <hello@e-vive.co.ke>`) |
| `RESEND_WEBHOOK_SECRET` | Signing secret for the Resend webhook (`whsec_...`) | Optional but strongly recommended — without it, `/api/webhooks/resend` accepts events without verifying they came from Resend |
| `MPESA_CONSUMER_KEY` | Daraja app consumer key | Required for M-Pesa (route returns 503 without it) |
| `MPESA_CONSUMER_SECRET` | Daraja app consumer secret | Required for M-Pesa |
| `MPESA_PASSKEY` | Daraja Lipa Na M-Pesa passkey | Required for M-Pesa |
| `MPESA_SHORTCODE` | Paybill / till number | Optional (defaults to `4165689`) |
| `MPESA_ENV` | `sandbox` or `production` | Optional (defaults to `sandbox` — **set explicitly before launch**) |
| `CRON_SECRET` | Authorises `/api/cron/*`. Vercel Cron sends it as a bearer token; other schedulers can pass `?k=`. Without it the cron endpoints refuse every caller — they delete records, so they fail closed | **Yes** — otherwise digests and retention purges never run |
| `NODE_ENV` | Set by Next.js; gates the `Secure` flag on session cookies | Automatic |

**No longer used.** `NEXT_PUBLIC_SUPABASE_ANON_KEY` is obsolete — the browser no
longer talks to Postgres, so there is no public database key to leak.
`NEXT_PUBLIC_ADMIN_EMAIL` and `NEXT_PUBLIC_ADMIN_HASH` are obsolete — admins are
rows in `admin_users`. Delete all three from your deployment.

### External Resources (CDN, loaded at runtime)
- **Leaflet.js 1.9.4** — loaded dynamically via `document.createElement('script')` in `pages/admin/map.jsx` only (SSR-safe)
  - CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
  - JS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- **Google Fonts** — loaded in `SharedStyles.js` via `@import` in the CSS string

### API Routes

All routes live under `pages/api/`. Every route that touches personal data
derives the caller's identity from the signed HttpOnly session cookie via
`getSession(req)` / `requireRole(req, role)` in `lib/serverAuth.js` — never from
a query parameter, body field or header the caller controls.

| Route | File | Auth | Purpose |
|---|---|---|---|
| `POST /api/auth/login` | `api/auth/login.js` | None | Verifies `{ role, identifier, password }` against `clients` / `hca_profiles` / `admin_users` with the service-role key, upgrades legacy plaintext passwords to scrypt, and sets the signed HttpOnly `evive_session` cookie (12 h) |
| `POST /api/auth/logout` | `api/auth/logout.js` | None | Clears the session cookie |
| `POST /api/auth/register` | `api/auth/register.js` | None | Client self-registration. Hashes with scrypt before the row is written, ignores any field registration is not allowed to set, and signs the caller in |
| `POST /api/auth/change-password` | `api/auth/change-password.js` | Cookie | Change your own password. Verifies the current one against the stored hash server-side; can only ever change the account in the cookie |
| `POST /api/auth/request-reset` | `api/auth/request-reset.js` | None | Issues a single-use reset token, stores only its SHA-256, emails the link. Answers identically whether or not the account exists, and limits itself to 5 per account per hour |
| `GET/POST /api/auth/reset` | `api/auth/reset.js` | Reset token | `GET` reports whether a link is still live; `POST` redeems it and writes a scrypt hash. Failures return one neutral message |
| `POST /api/db` | `api/db.js` | Cookie (or anonymous) | **The data gateway.** Every database read and write the browser makes. Resolves the caller from the cookie, applies `lib/dbPolicy.js`, queries with the service role. See §9.6 |
| `GET /api/hca/me` | `api/hca/me.js` | HCA | An HCA's own full record, including the private fields the public directory view omits. Always the row named by the cookie |
| `POST /api/hca/approve` | `api/hca/approve.js` | Admin (`hcas`) | Approves an application into a profile. Generates the initial password with `crypto.randomInt`, stores only its scrypt hash, and returns it once so it can be shown and emailed |
| `POST /api/hca/clock-in` | `api/hca/clock-in.js` | HCA | Starts a shift. Confirms the HCA is placed with that family, then checks their position against the client's address at the configured radius. Records whether the check actually passed |
| `POST /api/hca/clock-out` | `api/hca/clock-out.js` | HCA | Ends a shift. Location is recorded and checked but never refused — a carer who cannot clock out cannot file their Cardex |
| `POST /api/uploads` | `api/uploads.js` | Open (throttled) | Stores a certificate or photo in the private bucket and returns a path. Answers 503 if the bucket does not exist, and the caller keeps the file inline |
| `GET /api/uploads/[...path]` | `api/uploads/[...path].js` | Admin (`hcas`) or the owning HCA | Mints a five-minute signed URL for a stored document |
| `GET /api/cron/digests` | `api/cron/digests.js` | `CRON_SECRET` | Sends the digests due for one frequency |
| `GET /api/cron/purge` | `api/cron/purge.js` | `CRON_SECRET` | Runs the retention purges — Cardex, reset tokens, rate-limit rows |
| `GET /api/health` | `api/health.js` | None | Whether each piece is configured and reachable, never what it is configured to. 503 when the session secret, service role or database is missing, so an uptime check catches a misconfigured deploy |
| `POST /api/applications/create` | `api/applications/create.js` | None | HCA application intake. Hashes the chosen password, runs the duplicate check server-side, and sets `status` itself so nobody can apply as approved |
| `GET/POST /api/applications/[token]` | `api/applications/[token].js` | Edit token | Applicant self-service correction. Returns and accepts only the fields an admin opened; the token is spent on submission |
| `GET /api/auth/session` | `api/auth/session.js` | Cookie | Lets the browser discover who the server thinks it is. Never itself an authorisation decision |
| `GET/POST /api/cardex/reports` | `api/cardex/reports.js` | Client | The only client-facing Cardex read path. `client_id` comes from the cookie; `welfare_note`, `shift_rating`, `qa_comments` and `flagged` are never selected, then redacted again before serialising |
| `GET/POST /api/cardex/hca` | `api/cardex/hca.js` | HCA | An HCA's own entries — read history, submit a new one. Scoped to their own `hca_id` |
| `GET/POST /api/cardex/admin` | `api/cardex/admin.js` | Admin | Full QA review list and QA comments. Welfare notes only when the admin row has `can_read_welfare_notes` |
| `GET/POST /api/cardex/notify-prefs` | `api/cardex/notify-prefs.js` | Client | Per-patient notification preferences. **Stored but not yet acted on — P1-3** |
| `GET/POST/DELETE /api/cardex/share` | `api/cardex/share.js` | Client | Create, list and revoke outward shares. Enforces per-hour, per-recipient, justification-length and expiry limits from `platform_settings`; stores only the token hash; emails each recipient a link and nothing else |
| `GET /api/report/[token]` | `api/report/[token].js` | Share token | Token-gated care summary, assembled server-side. Every outcome — success and each distinct failure — is audited; failures return one neutral message so a token cannot be probed |
| `GET/POST/PUT /api/settings` | `api/settings.js` | Admin | Retention, consent ownership and sharing defaults. `PUT` runs `purge_expired_cardex_data()` on demand |
| `POST /api/mpesa/stkpush` | `api/mpesa/stkpush.js` | Client | Daraja OAuth + STK Push against one of the caller's own unpaid invoices. The amount is read from the invoice, never from the request; the initiation is recorded in `payments` so the callback has something to reconcile |
| `POST /api/mpesa/callback` | `api/mpesa/callback.js` | `MPESA_CALLBACK_SECRET` in the URL | STK Push result receiver. Persists to `payments`, reconciles the invoice, notifies the family. Always answers 200 with Safaricom's acknowledgement — including when it rejects the caller — because any other status triggers a retry |
| `POST /api/send-email` | `pages/api/send-email.js` | None | Sends transactional emails via Resend SDK. Accepts `{ to, cc, subject, text, replyTo, origin, relatedClientId, relatedHcaId, adminId }`. Converts plain text to HTML. Logs every attempt (sent/failed/skipped) to the `emails` table. Returns `{ ok: true }` on success; silently returns `{ ok: true, skipped: true }` if `RESEND_API_KEY` is not set. |
| `POST /api/webhooks/resend` | `pages/api/webhooks/resend.js` | Svix signature | Resend webhook receiver — reconciles outbound delivery lifecycle events (`email.sent`/`delivered`/`bounced`/`complained`/`opened`/`clicked`) against the matching `emails` row by `resend_message_id`, and inserts new rows for inbound mail (Resend Inbound). Verifies the Svix signature via `RESEND_WEBHOOK_SECRET` when set. See §9.4 for setup. |

---

## 3. Route Map

| Route | File | Auth Required | Purpose |
|---|---|---|---|
| `/` | `pages/index.jsx` | None | Landing page |
| `/about` | `pages/about.jsx` | None | Company story, team, mission |
| `/contact` | `pages/contact.jsx` | None | Contact form & department listing |
| `/caregivers` | `pages/caregivers.jsx` | Content-gated (client/HCA/admin session or approved partner) | Family caregiver hub |
| `/assistants` | `pages/assistants.jsx` | None | HCA recruitment information |
| `/products` | `pages/products.jsx` | None | Homecare product marketplace (coming soon) |
| `/match` | `pages/match.jsx` | None | HCA search & filtering |
| `/partners` | `pages/partners.jsx` | None | Healthcare provider partnerships |
| `/privacy` | `pages/privacy.jsx` | None | Privacy policy |
| `/terms` | `pages/terms.jsx` | None | Terms of use |
| `/accessibility` | `pages/accessibility.jsx` | None | Accessibility statement — what has been done, and what has not been verified |
| `/press` | `pages/press.jsx` | None | Redirects → `/about` |
| `/client/register` | `pages/client/register.jsx` | None (redirects if logged in) | Client sign-up / sign-in |
| `/client/dashboard` | `pages/client/dashboard.jsx` | Client session | Client portal |
| `/hca/apply` | `pages/hca/apply.jsx` | None | HCA application form |
| `/hca/apply/edit/[token]` | `pages/hca/apply/edit/[token].jsx` | Edit token | Applicant self-service correction, opened from an admin-issued link |
| `/hca/login` | `pages/hca/login.jsx` | None (redirects if logged in) | HCA authentication |
| `/hca/dashboard` | `pages/hca/dashboard.jsx` | HCA session | HCA shift portal |
| `/admin/login` | `pages/admin/login.jsx` | None | Admin authentication |
| `/admin/dashboard` | `pages/admin/dashboard.jsx` | Admin session | Operations management |
| `/admin/finance` | `pages/admin/finance.jsx` | Admin session | Financial management |
| `/admin/map` | `pages/admin/map.jsx` | Admin session | Geographic location management |
| `/report/[token]` | `pages/report/[token].jsx` | Share token (+ access code) | Recipient view of a shared care summary; print / save as PDF |
| `/auth/reset/[token]` | `pages/auth/reset/[token].jsx` | Reset token | Set a new password from an emailed reset link. Shared by clients and HCAs |
| `/404` | Next.js default | None | 404 error page |

> **Note:** All routes have a trailing slash due to `trailingSlash: true`. The canonical URL for the home page is `https://e-vive.vercel.app/`.
>
> Every page renders a `<Head>`: site-wide defaults (viewport, favicon, OG) come
> from `pages/_app.jsx`, and each page's own title, description, canonical URL
> and social card from `components/PageMeta.jsx`.

---

## 4. Public Pages

### 4.1 Home `/`

**File:** `pages/index.jsx`  
**Target audience:** New visitors — families and potential HCA recruits

#### Sections (in order)

1. **Hero** — dual hero photo background (`hero-photo-1.jpg`, `hero-photo-2.jpg`) with radial gradient overlay, headline, sub-headline, two CTA buttons ("Find a Carer Near Me →", "Join as an Assistant →")
2. **Stats strip** — 4 statistics: Registered HCAs, Families Served, Sub-Counties Covered, Average Care Rating
3. **User type cards** — three cards for Families, HomeCare Assistants, Healthcare Organizations with action links
4. **Partner logos strip** — featured hospital/partner badges
5. **Platform portals grid** — 3 cards: Find & Match, Check-In & Cardex, Training & Support Hub
6. **How It Works** (tabbed) — two tabs: Families pathway (4 steps) / HCA pathway (4 steps), each with illustrated step cards
7. **Featured HCAs** — 3 sample HCA profiles with name, speciality, rating, care types, shift availability
8. **Trust & Safety** — 4 pillars: Identity Verification, Credentials, Background Screening, Quality Monitoring
9. **Bottom CTA** — "Ready to find the right care?" with dual buttons

#### Key State
```jsx
const [activeTab, setActiveTab] = useState("families"); // "families" | "hcas"
```

#### Navigation
- All links use `next/link`
- Hero CTAs → `/match` and `/hca/apply`

---

### 4.2 About `/about`

**File:** `pages/about.jsx`  
**Target audience:** Prospective clients, HCAs, investors, press

#### Sections (in order)

1. **Hero** — layered background photos (`hero-photo-2.jpg` + `hero-hca-elder.png`), company tagline, two CTAs ("Find a Carer →", "Get in Touch")
2. **Founder Story** — Salome Mburu narrative with `founder-story.png` portrait (HCA at bedside), pull-quote
3. **Mission & Vision** — two-column card: mission statement / vision statement
4. **Team Grid** — 2 team members:
   - Salome Mburu (Founder & CEO) — photo: `team-salome-mburu.jpg` (LinkedIn portrait)
   - Pablo Wyne (Director of Technology) — photo: `team-kamau-maina.svg`
5. **Values Grid** — 6 values: Dignity First, Community-Rooted, Evidence-Based, Transparency, Career Sustainability, Accountability
6. **Testimonials** — auto-scrolling carousel of 5-star quotes from families and healthcare professionals
7. **Bottom CTA**

#### Notable Implementation
- Hero right panel shows `nursing-assistants.png` (outdoor team group photo, Salome front-left) in a visual card
- Founded badge: "Founded in **2025** · Nairobi, Kenya ·"
- Testimonials use CSS animation (`@keyframes scroll-testi`) for auto-scroll
- `MILESTONES` array is empty (no milestone timeline shown)

---

### 4.3 Contact `/contact`

**File:** `pages/contact.jsx`  
**Target audience:** Existing and prospective clients, HCAs, partners

#### Sections

1. **Hero** — minimal header with contact CTA text
2. **Two-column layout:**
   - **Left — Contact Form** (Name, Email, Phone, Subject dropdown, Message textarea) with success state
   - **Right — Contact Details** (phone, email, address, office hours, social links)
3. **Department Cards** — 4 cards:
   - Client & Placement Team: `hello@e-vive.co.ke`, Mon–Sat 7am–8pm
   - HCA Support & Welfare: same email
   - Partnerships (Hospitals): same email
   - Finance & Billing: same email
4. **FAQ** — 6 expandable questions covering placements, pricing, verification, emergency care, billing

#### Contact Form Fields
| Field | Type | Required |
|---|---|---|
| First Name | text | Yes |
| Last Name | text | Yes |
| Email | email | Yes |
| Phone | tel | No |
| Subject | select (8 options) | Yes |
| Message | textarea | Yes |

**Subject options:** General Enquiry, Find a HomeCare Assistant, Join as an HCA, Partnership / Hospital, Billing & Payments, Training & Welfare, Technical Support, HCA Application / Subscription

#### Key State
```jsx
const [form, setForm] = useState({ fname, lname, email, phone, subject, message });
const [sent, setSent] = useState(false);    // shows success banner
const [openFaq, setOpenFaq] = useState(null); // FAQ accordion index
```

#### Address
**Mugoya Phase 4, Nairobi, Kenya**  
P.O. Box 12345 – 00100, Nairobi  
Phone: +254 141 888 340  
Email: hello@e-vive.co.ke

---

### 4.4 Family Caregiver Hub `/caregivers`

**File:** `pages/caregivers.jsx`  
**Target audience:** Family clients, HomeCare Assistants, approved partner organisations

#### Access Gate

The page content is gated. Non-authenticated visitors see a hero section with a lock overlay and three gate cards:

| Card | CTA | Action |
|---|---|---|
| I'm a Family Client | "Create Account" / "Already a member? Sign In" | Links to `/client/register` |
| I'm an HCA | "HCA Sign In" | Links to `/hca/login` |
| Apply for Partner Access | Partner access form (inline) | `createHubAccessRequest({ name, email, organisation, message })` |

Auth check order: `getAdminSession()` → `getHcaSession()` → `getClientSession()`. If any session is found, full hub content is rendered.

A **user badge** bar appears at the top when logged in, showing the user's name, type (Family Client / HomeCare Assistant / E-Vive Staff), and a link to their dashboard.

#### Hero Section

Background: `/images/hero-group-care.png` (5-person care scene). Three live stats:
- `{clientCount}+` Families supported (live count from Supabase `clients` table)
- `{courses.length}` Training courses (live count from Supabase `lms_courses` table)
- `Free` Core resources free

#### Tab Navigation (3 active tabs, 1 coming soon)

| Tab ID | Label | Content |
|---|---|---|
| `training` | Training | Full LMS — courses from Supabase, enrollment, lesson viewer |
| `resources` | Resource Library | 12 real free resources from global health organisations |
| `counselling` | Counselling | E-Vive contact details + counselling referral form |
| *(commented out)* | Community & Support Groups | Pending moderation system — not yet active |

---

**Tab: Training**

Courses are loaded from Supabase `lms_courses` table (status = 'active'). Enrollments loaded per user from `lms_enrollments`.

**LMS filter chips:** All Users · Family Caregivers · All HCAs

**Course card shows:** emoji, title, target audience badge, difficulty, lesson count, duration, description, progress bar (if enrolled), enrollment CTA.

**Lesson viewer modal** (full-screen overlay):
- Left sidebar: lesson list (tick = complete, current = highlighted)
- Right content area: lesson title, objectives list, summary, key points, external resource link button
- "Mark as Complete" button → `updateCourseProgress(userId, courseId, lessonIdx, totalLessons)`
- Certificate message shown when `progress_pct === 100`

**Partner content submission panel** (collapsible, shown to all authenticated users):
| Field | Type |
|---|---|
| Organisation Name | text (required) |
| Contact Email | email (required) |
| Course Title | text (required) |
| Description | textarea (required) |
| Content URL | url |
| Target Audience | select (All Users / Family Caregivers / HCAs) |

On submit: `submitPartnerCourse(data)` → inserts into `lms_submissions` table with status `'pending'`.

---

**Tab: Resource Library**

12 real free resources from global health organisations. All links open in a new tab to the original source. No fake or placeholder content.

**Filter chips:** All · Guides · Mental Health · End-of-Life · Online Hubs

| # | Source | Title | Type |
|---|---|---|---|
| 1 | WHO | Home Care for Patients — WHO Primary Health Care Manual | WHO Manual |
| 2 | FCA | Family Caregiver Alliance — Online Factsheet Library | Online Hub |
| 3 | Alzheimer's Association | Caregiver Resource Centre | Online Hub |
| 4 | FCA | Caregiver's Guide to Understanding Dementia Behaviours | Guide |
| 5 | WHO | Healthy Ageing: A Life Course Perspective | WHO Guide |
| 6 | AARP | Family Caregiving Resource Centre | Online Hub |
| 7 | HPCA Africa | Palliative Care for Families Guide | Guide |
| 8 | FCA | Caregiver's Guide to Medications and Ageing | Guide |
| 9 | NIA | Caring for a Person with Alzheimer's | NIA Guide |
| 10 | MHFA International | Mental Health First Aid — Carer Resources | Mental Health |
| 11 | WHO | mhGAP Intervention Guide v2.0 | WHO mhGAP |
| 12 | WHO | Palliative Care — WHO Factsheet | End-of-Life |

---

**Tab: Counselling**

No therapist profiles are shown. Content is:

**E-Vive Contact Card:**
- Email: `hello@e-vive.co.ke`
- Phone: `+254 141 888 340`
- WhatsApp: same number
- Address: Mararo Avenue off Riara Road, Nairobi
- Hours: Mon–Sat, 7am–8pm

**Counselling Referral Form** (wired to Supabase `hub_referrals` table):
| Field | Type | Required |
|---|---|---|
| Your Name | text | Yes |
| Phone Number | tel | No |
| Email | email | No |
| Message | textarea | No |

On submit: `createHubReferral({ name, phone, email, message })` → inserts into `hub_referrals` with `status: 'new'`. Success state shown on submit.

---

#### Key State
```jsx
const [user, setUser] = useState(null);             // { id, name, type: 'client'|'hca'|'admin' }
const [authed, setAuthed] = useState(false);
const [loading, setLoading] = useState(true);
const [courses, setCourses] = useState([]);          // LMS courses from Supabase
const [enrollments, setEnrollments] = useState([]);  // user's enrollments
const [clientCount, setClientCount] = useState(0);   // for hero stat
const [activeTab, setActiveTab] = useState('training');
const [lmsFilter, setLmsFilter] = useState('all');   // 'all'|'clients'|'hcas'
const [selectedCourse, setSelectedCourse] = useState(null);  // lesson viewer
const [selectedLesson, setSelectedLesson] = useState(-1);
const [partnerFormOpen, setPartnerFormOpen] = useState(false);
const [partnerForm, setPartnerForm] = useState({ orgName, contactEmail, courseTitle, description, contentUrl, target });
const [partnerSubmitted, setPartnerSubmitted] = useState(false);
const [partnerSubmitting, setPartnerSubmitting] = useState(false);
const [markingComplete, setMarkingComplete] = useState(false);
const [resourceFilter, setResourceFilter] = useState('All');
const [counselForm, setCounselForm] = useState({ name, phone, email, message });
const [counselSent, setCounselSent] = useState(false);
const [enrolling, setEnrolling] = useState(null);    // courseId being enrolled
```

---

### 4.5 For Assistants `/assistants`

**File:** `pages/assistants.jsx`  
**Target audience:** Prospective HomeCare Assistants

#### Sections

1. **Hero** — with a sample HCA profile card inset (Florence Njeri: 4.9★, 148 shifts, 97% timeliness, 12 placements, listed specialties)
2. **Benefits Grid** — 6 cards: Location-Based Matching, Competitive Pay, Verification & Trust, Digital Cardex, Free Training Access, HCA Community
3. **How to Join** — 5-step process (Apply Online → Interview → Verification → Contract → Go Live)
4. **Subscription Plans** — 3 tiers (see [§13 Pricing](#13-pricing--rates))
5. **FAQ** — 6 expandable questions
6. **CTA** — "Apply to join E-Vive today"

#### Key State
```jsx
const [openFaq, setOpenFaq] = useState(null);
```

---

### 4.6 Products `/products`

**File:** `pages/products.jsx`  
**Target audience:** Families, HCAs (coming Q2 2026)

#### Status
**Not yet launched.** Page displays a "Coming Soon" experience with email waitlist capture.

#### Sections

1. **Hero** — "Coming Soon" badge, waitlist email form
2. **Product Category Teasers** — 6 categories: Mobility & Positioning Aids, Monitoring & Diagnostics, Personal Care & Hygiene, Medication Management, Nutrition & Feeding Aids, Caregiver Supplies & PPE
3. **Sample Products** — 8 product cards with name, category, price (KES), "Notify Me" button
4. **Platform Features** — 4 differentiators: HCA-Linked Ordering, Same-Day Nairobi Delivery, Subscription Bundles, Clinically Vetted
5. **Roadmap** — timeline: Q2 2026 (Beta), Q3 2026 (Full Launch), Q4 2026 (Subscriptions), Q1 2027 (Insurance Integration)
6. **Bottom CTA** — second waitlist email form

#### Key State
```jsx
const [email, setEmail] = useState("");
const [joined, setJoined] = useState(false);       // top waitlist
const [ctaEmail, setCtaEmail] = useState("");
const [ctaJoined, setCtaJoined] = useState(false); // bottom waitlist
const [notified, setNotified] = useState({});       // per-product notify state
```

---

### 4.7 Find a Carer `/match`

**File:** `pages/match.jsx`  
**Target audience:** Families actively searching for an HCA

This is the most complex public page. It implements a two-phase filter state machine with a sidebar filter panel and HCA results grid.

#### Data Loading

HCA profiles are loaded from Supabase on mount:
```jsx
useEffect(() => {
  getAllHcaProfiles()
    .then(profiles => {
      const active = profiles.filter(p => p.status === 'active');
      setHcas(active.map(profileToHca));
    })
    .finally(() => setLoading(false));
}, []);
```

`profileToHca(p)` is an in-page mapper that converts a Supabase `hca_profiles` row to the display format expected by the card and modal components.

#### Filter State Machine

The page maintains two parallel filter states:
- **`filterDraft`** — updated instantly as the user clicks chips (real-time preview count)
- **`filterApplied`** — only updates when "Apply" is clicked; drives the actual results grid

A "pending changes" banner appears when draft ≠ applied, offering "Show X results" and "Undo changes" actions.

#### Filter Categories

| # | Category | Type | Options |
|---|---|---|---|
| 1 | Available Now Only | Toggle | on / off |
| 2 | Gender | Single select | Any, Female, Male |
| 3 | Age Range | Multi-select | 21–25, 26–30, 31–35, 36–40, 41–45, 46–50, 51+ |
| 4 | Type of Care | Multi-select | Palliative, Dementia, Companionship, Critical Care, Diabetic Care, Cerebral Palsy, Visual Impairment, Mobility Assistance, Driver/Transport, Child Care, Post-Surgery, Mental Health, Other |
| 5 | Language Preference | Multi-select | English, Kiswahili, Kikuyu, Dholuo, Luhya, Kalenjin, Maasai, Kamba, French, German, Arabic, Sign Language |
| 6 | Shift Type | Multi-select | Day Shift, Night Shift, 24-Hour Care |
| 7 | Care Period | Single select | Short Term (1–2 wks), Long Term (2+ wks) |
| 8 | Urgency / Start Date | Single select + date input | Immediate, Planned |
| 9 | Travel Availability | Multi-select | Local Travel, International |

#### Results Grid

Each HCA card shows:
- Avatar (SVG portrait or emoji fallback)
- Name, role/title
- Rating (★ stars + numeric + review count)
- Distance badge (km)
- Availability badge (pulsing dot — "Available" green / "On Placement" amber)
- 7-day weekly rota (Mon–Sun: D = day shift, N = night shift, 24 = full day, — = off)
- Care specialisations (top 3 chips + "+N more")
- Languages spoken (chips)
- Experience, placement count, international flag
- Shift types footer
- Actions: Shortlist toggle (☆/★) + "View Profile" button

#### HCA Profile Modal

Clicking "View Profile" opens an overlay with:
- Full avatar, name, badges (Certified/Non-certified, distance, availability)
- Profile bio
- Key Details grid (Gender, Age Range, Experience, Placements, Care Period)
- Weekly Rota 7-day grid with legend
- Care specialisations, Languages, Shift availability, Travel
- Cultural & Language Context notes
- CTA buttons: Add/Remove Shortlist, Book This HCA

#### Sort Options
- Nearest first (default)
- Highest rated
- Most experienced

#### Results Topbar
- Result count ("Showing X HCAs")
- Sort dropdown
- Active filter pills (individually removable)
- "Clear all" button
- Mobile filter button (with applied count badge)
- Pending changes banner

#### Key State
```jsx
const [hcas,         setHcas]         = useState([]);          // loaded from Supabase
const [loading,      setLoading]      = useState(true);        // loading state
const [filterDraft,  setFilterDraft]  = useState(EMPTY_FILTER);
const [filterApplied,setFilterApplied]= useState(EMPTY_FILTER);
const [filterOpen,   setFilterOpen]   = useState(false);
const [selectedHca,  setSelectedHca]  = useState(null);        // profile modal
const [shortlisted,  setShortlisted]  = useState(new Set());
const [sort,         setSort]         = useState("nearest");
```

---

### 4.8 Partners `/partners`

**File:** `pages/partners.jsx`  
**Target audience:** Hospitals, clinics, healthcare providers

#### Sections

1. **Hero** — layered background photos (`hero-photo-2.jpg` + `hero-photo-1.jpg`), "Partner With E-Vive" messaging
2. **Value Proposition Grid** — 6 benefit cards for hospital partners
3. **How It Works** — 5-step referral → placement → reporting flow
4. **Portal Preview** — two-panel preview of partner statistics and referral flow
5. **Partner Onboarding Form** — organisation name, type, contact details, message; on submit: success confirmation
6. **Testimonials** — 3 testimonial cards from healthcare professionals:
   - Dr. Amina Hassan — "Head of Oncology"
   - Dr. Patrick Mutua — "Clinical Lead"
   - Sr. Consolata Waweru — "Nursing Director"
7. **Contact CTA** — "Become a Partner" scrolls to onboarding form

> **Note:** The "Partner Logos" hospital badge strip that previously appeared after the hero has been removed. Testimonial role labels no longer include hospital names.

---

### 4.9 Privacy Policy `/privacy`

**File:** `pages/privacy.jsx`  
**Target audience:** All users (legal compliance)

- Last updated: 1 January 2025
- Covers: Data collection, health data handling, third-party processors (Supabase, Vercel, M-Pesa), user rights under Kenya Data Protection Act 2019
- Data Protection Officer contact: hello@e-vive.co.ke
- Registered office: Mugoya Phase 4, Nairobi, Kenya

---

### 4.10 Terms of Use `/terms`

**File:** `pages/terms.jsx`  
**Target audience:** All users (legal compliance)

- Last updated: 1 January 2025
- Covers: Platform usage, HCA subscription terms, client obligations, payment terms, IP rights, limitation of liability
- Governing law: Republic of Kenya
- Company: **Star Delight Enterprises**, Mugoya Phase 4, Nairobi, Kenya

---

## 5. Client Portal

### 5.1 Registration & Sign-In `/client/register`

**File:** `pages/client/register.jsx`  
**Auth guard:** Redirects to `/client/dashboard` if already logged in (checks `evive_client_session`)

This page handles three flows: new registration, sign-in, and password reset.

#### Flow 1 — Sign In

Displayed by default (`flow === "signin"`).

| Field | Type | Notes |
|---|---|---|
| Email or Mobile | text | Case-insensitive email lookup or exact mobile match |
| Password | password | Plaintext comparison against stored password |

On success: calls `setClientSession(client)` → redirects to `/client/dashboard`.  
Errors: "No account found", "Incorrect password", "Something went wrong".

#### Flow 2 — Registration (4 steps)

**Step 0 — Your Details**

| Field | Type | Validation |
|---|---|---|
| Full Name | text | Required |
| Email | email | Required, unique |
| Mobile | tel | Required |
| Location | select (16 options) | Required |
| Address | text | Required |
| Password | password | Min 6 chars |
| Confirm Password | password | Must match |

Location options: Nairobi CBD, Westlands, Karen, Kilimani, Kileleshwa, Lavington, Langata, Eastlands, Kasarani, Thika Road, Mombasa, Kisumu, Nakuru, Eldoret, Nyeri, Other

**Step 1 — Patient Details**

Repeatable per patient (Add Patient button):

| Field | Type | Validation |
|---|---|---|
| Patient Name | text | Required |
| Relationship | select | Required |
| Gender | select | Required |
| Age | number | Required |
| Medical Conditions | textarea | Required |
| Special Notes | textarea | Optional |

Relationship options: Mother, Father, Spouse, Grandparent, Child, Sibling, Other  
Gender options: Female, Male, Other

**Step 2 — Terms & Conditions**

- Scrollable T&C text box
- Acceptance checkbox ("I have read and agree to the Terms of Use and Privacy Policy")
- Cannot proceed without checking

**Step 3 — Account Created**

- Success message with user name
- Journey stage preview (8-dot tracker)
- Next steps guidance
- "Go to My Dashboard →" button

#### Flow 3 — Password Reset

Two sub-steps:

**Reset Request:**
- Email or mobile input
- Looks up account in Supabase `clients` table
- Generates 6-digit code (`Math.floor(100000 + Math.random() * 900000)`)
- Transitions to verify step (code sent to user's email via `sendPasswordResetNotification`)

**Reset Verify:**
- 6-digit code input
- New password + confirm new password
- On success: updates password in Supabase `clients` table

> **Security note:** The reset code is NOT displayed on screen (removed for security). Users are prompted to check their email/SMS.

#### Key State
```jsx
const [flow, setFlow] = useState("signin");           // "signin"|"register"|"reset-request"|"reset-verify"
const [step, setStep] = useState(0);                  // Registration step 0–3
const [form, setForm] = useState({ name, email, mobile, location, address, password, confirmPassword });
const [patients, setPatients] = useState([{ name, gender, careType, notes }]);
const [tcAccepted, setTcAccepted] = useState(false);
const [loginEmail, setLoginEmail] = useState("");
const [password, setPassword] = useState("");
const [resetId, setResetId] = useState("");           // email or mobile for reset
const [resetCode, setResetCode] = useState("");       // generated (not shown to user)
const [resetInput, setResetInput] = useState("");     // user-entered code
const [newPwd, setNewPwd] = useState("");
const [confirmNewPwd, setConfirmNewPwd] = useState("");
```

---

### 5.2 Client Dashboard `/client/dashboard`

**File:** `pages/client/dashboard.jsx`  
**Auth guard:** Checks `getClientSession()` → redirects to `/client/register` if no session

The main hub for families after registration.

#### Top Bar
- E-Vive logo (links to `/`)
- Notification bell with unread badge count
- Notification slide-out panel (list of recent notifications)
- Hamburger menu (mobile)
- Sign Out pill (mobile topbar)

#### Sidebar Navigation (6 tabs)
| Tab | Icon | Content |
|---|---|---|
| Dashboard | 🏠 | Overview with journey tracker and stats |
| My HCAs | 👩‍⚕️ | Shortlisted and assigned HCAs |
| Billings | 💳 | Invoice list and payment history |
| Cardex | 📋 | Patient shift reports submitted by HCA |
| Messages | 💬 | Notifications feed |
| Account | ⚙️ | Profile settings, patient management, danger zone |

#### Journey Tracker
A horizontal 10-dot progress bar displayed at the top of the Dashboard tab. Each dot represents a stage (see [§11 Journey Stages](#11-client-journey-stages)). Current stage pulses, completed stages have a checkmark, future stages are grey.

#### T&C Acceptance Banner
If `client.journeyStage === "account_created"`, a banner prompts the client to read and accept the Terms & Conditions. Clicking "Accept Terms & Conditions" opens a modal with:
- Scrollable T&C text
- Confirm button (calls `advanceClientJourney(client.id, "tc_accepted")`)
- Try/catch wrapper to prevent button hanging if an error occurs

#### Patient Tabs
If the client has multiple patients, a tab row appears under the journey tracker to switch between them.

#### Dashboard Tab — Content
- 4 stat boxes: Journey Stage, Active Invoices, Total Paid (KES), Assigned HCA
- "Your Care Journey" section with current stage description
- Recent activity feed (last 5 activity entries)

#### My HCAs Tab
- HCA discovery grid (same card format as `/match`)
- Shortlist button per card (persisted to `client.shortlistedHcas` in Supabase)
- "Request This HCA" button (calls `requestHcaMatch()`)
- Assigned HCA highlighted if `client.assignedHcaId` is set

#### Billings Tab
Invoice table columns:
- Invoice #, Description, Issued date, Due date, Amount (KES), Status badge, Payment method

Invoice status badges: Paid (green), Pending (amber), Overdue (red), Disputed (grey)

#### Account Tab — Danger Zone
Two-step deletion flow:
1. Click "⚠️ Request Account Deletion"
2. Confirmation input ("type DELETE to confirm")
3. On confirm: calls `requestAccountDeletion(client.id)` → sets `deletionRequested` flag and sends notification

#### Key State
```jsx
const [client, setClient] = useState(null);
const [tab, setTab] = useState("dashboard");
const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);      // mobile sidebar
const [tcModal, setTcModal] = useState(false);
const [saving, setSaving] = useState(false);          // T&C accept loading
const [currentPatient, setCurrentPatient] = useState(0);
```

---

## 6. HCA Portal

### 6.1 HCA Application `/hca/apply`

**File:** `pages/hca/apply.jsx`  
**Style:** Light/white professional theme (distinct from the dark platform theme)

A 5-step multi-page application form for prospective HomeCare Assistants.

#### Step 0 — Personal Information

| Field | Type | Options / Validation |
|---|---|---|
| First Name | text | Required |
| Last Name | text | Required |
| Date of Birth | date | Required |
| Gender | select | Female, Male, Prefer not to say |
| National ID Number | text | Required |
| Mobile Number | tel | Required |
| Email Address | email | Required |
| Home Location | select | 16 options (see below) |
| Estate / Street Address | text | Required |

**Location options:** Nairobi CBD, Westlands, Karen, Kilimani, Kileleshwa, Lavington, Langata, Eastlands, Kasarani, Thika Road, Mombasa, Kisumu, Nakuru, Eldoret, Nyeri, Other

#### Step 1 — Professional Qualifications

| Field | Type | Options / Validation |
|---|---|---|
| Highest Education | select | Certificate, Diploma, Bachelor's Degree, Higher National Diploma, Other |
| Years of Experience | number | Required |
| Professional Bio | textarea | Optional |
| Certifications (repeatable) | — | Min 1 required |

**Per Certification:**
| Field | Type |
|---|---|
| Certificate Name | text |
| Issuing Body | text |
| Year Obtained | number |
| Certificate File | file upload (PDF, JPG, PNG, max 10 MB) |

The `CertUploadZone` component:
- Validates file type against allowlist: `["image/jpeg", "image/png", "image/webp", "application/pdf"]`
- Rejects files > 10,485,760 bytes (10 MB)
- Converts valid files to base64 DataURL via `FileReader.readAsDataURL()`
- Shows image thumbnail preview for JPEG/PNG uploads

#### Step 2 — Skills & Service Area

**Care Specialisations** (multi-select chips, min 1 required):  
Elderly Care, Palliative, Dementia, Companionship, Critical Care, Diabetic Care, Cerebral Palsy, Visual Impairment, Mobility Assistance, Driver/Transport, Child Care, Post-Surgery, Mental Health

**Languages Spoken** (multi-select chips, min 1 required):  
English, Kiswahili, Kikuyu, Dholuo, Luhya, Kalenjin, Maasai, Kamba, French, German, Arabic, Sign Language

**Cultural Exposure** (textarea, optional)

**Shift Availability** (multi-select, min 1 required):  
Day Shift, Night Shift, 24-Hour Care

**Preferred Care Period** (single-select, required):  
Short Term (1–2 weeks), Long Term (2 weeks+)

**Travel Availability** (multi-select):  
Local Travel Only, International (with travel docs)

**Service Radius** (single-select, required):  
5 km, 10 km, 15 km, 20 km, 25 km, 30 km, 40 km+

#### Step 3 — Subscription Plan

Three plans available for selection:

| Plan | Badge | Price | Key Features |
|---|---|---|---|
| Basic | Starter | KSh 75/month | Search listing, 1 active placement, Basic profile, Email support |
| Professional | ★ Popular | KSh 100/month | Priority listing, 3 placements, Certificate badges, WhatsApp support, Training access |
| Premium | Top Tier | KSh 150/month | Top-of-search, Unlimited placements, Verified badge, Dedicated HCA manager, International eligible |

Payment methods shown (visual only): M-Pesa STK Push, Visa/Mastercard

#### Step 4 — Success

Post-submission 5-step next-actions guide:
1. Application acknowledged
2. Interview scheduled (video or in-person)
3. Certificate & ID verification
4. Contract issued for digital signing
5. Profile goes live

On submission: calls `createHcaApplication(formData)` → stores application in Supabase `hca_applications` table with `status: 'pending'`.

#### Key State
```jsx
const [step, setStep] = useState(0);
const [plan, setPlan] = useState(1);          // 0=Basic, 1=Professional, 2=Premium
const [care, setCare] = useState([]);
const [langs, setLangs] = useState([]);
const [shifts, setShifts] = useState([]);
const [period, setPeriod] = useState([]);
const [travel, setTravel] = useState([]);
const [radius, setRadius] = useState("");
const [personalForm, setPersonalForm] = useState({ fname, lname, dob, gender, idNo, mobile, email, location, address });
const [education, setEducation] = useState("");
const [yearsExp, setYearsExp] = useState("");
const [bio, setBio] = useState("");
const [culturalExp, setCulturalExp] = useState("");
const [certs, setCerts] = useState([{ name:"", body:"", year:"", fileName:null, fileType:null, fileSize:null, fileDataUrl:null }]);
const [submitted, setSubmitted] = useState(false);
```

---

### 6.2 HCA Login `/hca/login`

**File:** `pages/hca/login.jsx`  
**Redirects:** To `/hca/dashboard` if `getHcaSession()` is already set

#### Layout — Split Panel

The page uses a two-column split layout:

- **Left panel (`.login-hero`)** — full-height hero image (`/images/hero-group-care.png`, the 5-person care scene), teal gradient overlay, feature chips at bottom: "GPS Clock-in", "Live Cardex", "Shift Reports", "Welfare Support"
- **Right panel (`.login-form-panel`)** — centered login card on a light gradient background

On mobile (≤ 760px): image stacks above form — image panel has `min-height: 280px`, then the form panel below.

#### Authentication Flow

1. User enters Employee ID, email address, or mobile number in the "Employee ID" field
2. Enters password
3. System calls `getAllHcaProfiles()` (async — fetches from Supabase `hca_profiles` table)
4. Matches by: `profile.employeeId === input` OR `profile.email.toLowerCase() === input.toLowerCase()` OR `profile.mobile === input`
5. If match found: compares `profile.password === form.password`
6. On success: calls `setHcaSession(profile)` → redirects to `/hca/dashboard`

#### Error Messages
| Condition | Message |
|---|---|
| Empty fields | "Please enter your Employee ID / email and password." |
| Profile not found | "No HCA account found with these credentials. Contact hello@e-vive.co.ke." |
| Wrong password | "Incorrect password. Please try again." |
| Exception | "Something went wrong. Please try again." |

#### Key State
```jsx
const [form, setForm] = useState({ empId: "", password: "" });
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
```

---

### 6.3 HCA Dashboard `/hca/dashboard`

**File:** `pages/hca/dashboard.jsx`  
**Auth guard:** Checks `getHcaSession()` → shows loading state while verifying, redirects if no session

#### Sidebar Navigation (7 tabs)
| Tab | Icon | Content |
|---|---|---|
| Today | ⏰ | Clock-in panel + today's schedule |
| Cardex | 📋 | Digital shift report form |
| Calendar | 📅 | Monthly shift calendar |
| Messages | 💬 | Notifications |
| Welfare | 🩺 | Welfare access options |
| My Profile | 👤 | Profile details + account deletion |
| (Shifts) | — | Shift history table |

#### Today Tab — Clock-In Panel

- Large live clock display (updates every second)
- GPS-verified location badge
- Patient name + care type display (from `client.assignedHcaId` linkage)
- **Clock In** button: calls `clockInHca(hcaId, { clientId, patientId, lat, lng })`
  - Records ISO timestamp + GPS coordinates in Supabase `shifts` table
  - Sets shift status to `'in-progress'`
- **Clock Out** button (shown when clocked in): calls `clockOutHca(hcaId, shiftId)`
  - Records clock-out timestamp
  - Sets shift status to `'completed'`
- Current shift duration display (live counter when clocked in)

#### Cardex Tab — Digital Shift Report

The Cardex is the core clinical documentation tool. Form fields:

**Vital Signs Grid:**
| Field | Unit | Type |
|---|---|---|
| Blood Pressure | e.g. "120/80" | text |
| Pulse | bpm | number |
| Temperature | °C | number |
| SpO₂ | % | number |
| Respiratory Rate | breaths/min | number |
| Weight | kg | number |
| Pain Score | 0–10 | number |

**Medications Table** (add rows):
| Field | Type |
|---|---|
| Medication Name | text |
| Dose | text |
| Time Administered | time |
| Given? | checkbox |

**Observation Checkboxes:**
- Mood (options: Good, Stable, Anxious, Low, Confused)
- Mobility (options: Independent, Assisted, Bed-bound)
- Appetite (options: Good, Fair, Poor)
- Hydration (Well-hydrated, Adequate, Poor)
- Bowels (Normal, Constipated, Diarrhoea)
- Sleep (Good, Disturbed, Poor)

**Free-text Fields:**
- General Observations (textarea)
- Incidents / Adverse Events (textarea)

**Submit button:** Calls `createCardexEntry(data)` → stores in Supabase `cardex_entries` table

#### Calendar Tab
Monthly calendar grid showing scheduled shifts. Navigation between months.

#### Welfare Tab
4 welfare access cards:
- Request Off-Day
- Book Counselling Session
- Join Support Group
- Financial Assistance

#### My Profile Tab
- Displays profile details (name, employee ID, email, phone, certifications, location)
- **Danger Zone** — "Request Profile Deletion" (two-step confirm → calls `requestHcaDeletion(hcaId)`)

#### Key State
```jsx
const [hcaProfile, setHcaProfile] = useState(null);
const [authed, setAuthed] = useState(false);
const [tab, setTab] = useState("today");
const [clockState, setClockState] = useState("out");   // "out" | "in"
const [clockStart, setClockStart] = useState(null);    // Date.now() at clock-in
const [currentShiftId, setCurrentShiftId] = useState(null); // shift UUID from Supabase
const [liveShifts, setLiveShifts] = useState([]);
const [cardexLog, setCardexLog] = useState([]);
const [cardexOpen, setCardexOpen] = useState(false);
const [assignedClient, setAssignedClient] = useState(null);
const [menuOpen, setMenuOpen] = useState(false);
const [gpsLat, setGpsLat] = useState(null);
const [gpsLng, setGpsLng] = useState(null);
const [gpsLabel, setGpsLabel] = useState("Location unavailable");
const [gpsLoading, setGpsLoading] = useState(false);
const [vitals, setVitals] = useState({ bp:"", pulse:"", temp:"", spo2:"", rr:"", weight:"", pain:"" });
const [meds, setMeds] = useState([{ name:"", dose:"", time:"", given:false }]);
const [mentalSt, setMentalSt] = useState("");          // mentalState field on cardex
const [observations, setObservations] = useState({ mood:"", mobility:"", appetite:"", hydration:"", bowels:"", sleep:"" });
const [incidents, setIncidents] = useState("");
const [generalObs, setGeneralObs] = useState("");
```

**Clock-in flow (GPS + Supabase):**
```javascript
// 1. Request GPS via navigator.geolocation.getCurrentPosition()
// 2. clockInHca(hcaId, { clientId, patientId, lat, lng }) → returns shift with id
// 3. setCurrentShiftId(shift.id)
// 4. Auto-navigate to Cardex tab
// On submitCardex():
// 5. createCardexEntry({ ..., shiftId: currentShiftId, mentalState: mentalSt })
// 6. clockOutHca(hcaId, currentShiftId)
// 7. setCurrentShiftId(null); setClockState("out")
```

---

## 7. Admin Portal

### 7.1 Admin Login `/admin/login`

**File:** `pages/admin/login.jsx`  
**Meta:** `<meta name="robots" content="noindex,nofollow">` — excluded from search engines  
**Redirects:** To `/admin/dashboard` if `getAdminSession()` is already set

#### Authentication Mechanism

1. User enters email + password
2. Email is normalized: `.trim().toLowerCase()`
3. Password is hashed using Web Crypto API:
   ```javascript
   const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
   const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
   ```
4. Email compared against `CORRECT_EMAIL`
5. Hash compared against `CORRECT_HASH`
6. Both must match for login to succeed

#### Default Credentials

| Field | Value |
|---|---|
| Email | `admin@e-vive.co.ke` |
| Password | `Evive@Admin2026!` |

#### Brute-Force Lockout
- **`MAX_ATTEMPTS`** = 3
- **`LOCKOUT_SECS`** = 60
- After 3 failed attempts: form and button disabled, 60-second countdown displayed
- Auto-unlocks after countdown; `attempts` counter resets

#### Environment Variable Overrides

Set in Vercel project settings:

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_EMAIL` | Override admin email | `admin@e-vive.co.ke` |
| `NEXT_PUBLIC_ADMIN_HASH` | SHA-256 hex of new password | `a62272989...` |

To generate a new hash:
```bash
echo -n "YourNewPassword" | openssl dgst -sha256 -hex | awk '{print $2}'
```

#### On Success
```javascript
setAdminSession({ id: "admin", name: "Salome Ruguru", role: "super_admin" });
// → stores in evive_admin_session with loginAt timestamp
router.replace("/admin/dashboard");
```

---

### 7.2 Admin Dashboard `/admin/dashboard`

**File:** `pages/admin/dashboard.jsx`  
**Auth guard:** `getAdminSession()` checked in `useEffect` → redirect to `/admin/login` if no session  
**Meta:** `noindex, nofollow`  
**Sign-out:** Calls `clearAdminSession()` → redirects to `/admin/login`

The main operational hub for E-Vive staff.

#### Mobile Sidebar
The admin dashboard has a fully functional mobile hamburger sidebar:
- **State:** `sideOpen` / `setSideOpen`
- **Button:** `<button className="dash-hamburger" onClick={() => setSideOpen(o => !o)}>☰</button>` (shown in topbar on mobile)
- **Overlay:** `<div className="dash-side-overlay{sideOpen ? ' open' : ''}">` — semi-transparent backdrop, closes sidebar on tap
- **Aside:** `<aside className="dash-side{sideOpen ? ' open' : ''}">` — slides in from left when open

#### Sidebar Navigation

| Icon | Label | Key | Notes |
|---|---|---|---|
| 📊 | Overview | `overview` | Platform stats |
| 📨 | Messages | `messages` | Unified email inbox/sent/outbox/trash, including Contact page submissions — see §9.4 |
| 🩺 | HCA Management | `hcas` | HCA management + approval queue |
| 👥 | Client Management | `clients` | Family management |
| 📋 | Care Quality | `quality` | Cardex QA review |
| 🎓 | Training | `training` | HCA training management |
| 📅 | Calendar / HR | `calendar` | Shared ops calendar |
| 💰 | Finance | `finance` | Link → `/admin/finance` |
| 📣 | Announcements | `announcements` | Broadcast messages |
| 📧 | Newsletter | `newsletter` | Email campaigns |
| 🏷️ | Pricing & Offers | `pricing` | Rate config + discount codes |
| 🏠 | Family Hub | `hub` | LMS courses, partner submissions, counselling referrals, partner access requests |
| ⚙️ | Settings / RBAC | `settings` | Access control |
| 🗺️ | Map View | `map` | Link → `/admin/map` |

#### Overview Tab
- 4 stat boxes: Total Families, Total HCAs, Active Placements, Outstanding Revenue (KES)
- Priority alerts panel (low ratings, pending verifications, overdue invoices)
- Recent activity feed (last 20 activity log entries)

#### Messages Tab
Unified email view backed by the `emails` table (see §9.2/§9.4 for setup — requires a one-time SQL migration and Resend webhook configuration).
- 4 folders as stat-box shortcuts + filter chips: Inbox, Sent, Outbox, Trash
- Search bar filters by subject, from/to address, body text, and origin tag across the active folder
- Each row tagged by origin badge (`EMAIL_ORIGIN_LABELS`): Resend, Admin, System, Contact Page
- Status badge reflects Resend delivery lifecycle for outbound mail: sent → delivered → opened/clicked, or bounced/complained/failed; inbound mail shows `received`
- **Compose** (`ComposeEmailModal`) — To field autocompletes against loaded clients/HCAs by email, supports comma-separated multiple recipients, sends via `sendAdminEmail()` (tagged `origin: 'admin_composed'`)
- **View** (`EmailDetailModal`) — marks inbound messages read, shows full headers/body (with a collapsible raw-event view when Resend didn't include body text), **Reply** (inbound only, pre-fills Compose with quoted body) and **Move to Trash**
- Trash supports **Restore** (back to Inbox/Sent based on direction) and **Delete Forever** (hard delete, confirmed)
- All outbound mail sent anywhere in the app (HCA onboarding, invoices, visit confirmations, etc.) is automatically logged here too, tagged `origin: 'system'`, since `/api/send-email` records every attempt regardless of caller
- Contact page submissions (`pages/contact.jsx`) are inserted directly into `emails` (tagged `origin: 'contact_page'`) by `createContactMessage()` — there is no separate `contact_messages` table; the standalone "Inbox" tab that used to read from it has been retired in favour of this unified view

#### Clients Tab
Data table columns: Name, Email, Mobile, Location, Journey Stage, Assigned HCA, Actions  
Per-client actions:
- 📞 Log a call (advances journey to `call_made`)
- 📅 Schedule visit (advances to `visit_scheduled`)
- 🤝 Match HCA (opens HCA selector modal, advances to `hca_matched`)
- 🧾 Create Invoice (opens invoice creation modal)
- 📍 Edit Location (opens map coordinates modal, calls `updateClientCoords()`)

Filter bar: All, Active, Pending, Completed

**Client Modal** (manage action):
- Client details view
- Journey stage selector
- Patient list
- Invoice history

#### HCAs Tab
Sub-views: Applications queue, Approved profiles

**Applications Table:** Applicant Name, Location, Cert Level, Applied Date, Status, Actions (Approve / Reject)

**HCA Approve Modal:**
- Displays application details and uploaded certificates
- Rate setter (KES per shift input)
- On Approve: calls `createHcaProfile(data)` with `password: app.password || ""`

**Profiles Table:** Employee ID, Name, Email, Rate (KES), Status, Placements, Actions (Edit, Suspend)

#### Placements Tab
Table: Client, Patient, HCA, Start Date, Rate/Shift, Status, Actions

#### Invoices Tab
Invoice creation modal fields:
- Client selector
- Description
- Line items (label + amount, add multiple)
- Due date

Table: Invoice #, Client, Description, Amount, Status, Actions (Approve Payment)

#### Calendar Tab
Full monthly calendar grid with:
- Navigation (← month →)
- Type filter chips: All, Shifts, Events, Off-days, Training
- Per-HCA filter dropdown
- Day cells show event/shift cards (colour-coded by type)
- "Add Event" / "Add Shift" buttons open modals
- Legend (event type → colour mapping)

**Schedule Shift Modal** fields: HCA selector, Client/Patient selectors, Date, Time, Shift type (Day/Night/Live-in), Notes

#### Quality Tab — Cardex QA Review
Lists all submitted cardex entries. Per-entry expansion shows:
- Patient info, date, HCA
- Vitals grid (bp, pulse, temp, spo2, rr, weight, pain)
- Medications given
- Observations
- Existing QA comments (with flag 🚩 indicator)
- Add QA Comment form: comment textarea + "Flag this entry" checkbox
  - Calls `addCardexQaComment(entryId, { comment, flagged, adminId: "admin" })`

#### Announcements Tab
**Create Announcement form:**
| Field | Options |
|---|---|
| Title | text |
| Body | textarea |
| Target Audience | All Users, Clients Only, HCAs Only, Admin Only |
| Type | Info, Warning, Alert |
| Priority | Normal, High, Urgent |

Calls `createAnnouncement(data)`. Lists all announcements with edit/delete actions.

#### Newsletter Tab
**Create Newsletter form:**
| Field | Options |
|---|---|
| Campaign Name | text |
| Email Subject | text |
| Body | textarea |
| Target Audience | All Users, Clients Only, HCAs Only |

Draft newsletters list with: Send button (`markNewsletterSent(id)` — calculates real recipient count from Supabase data), edit, delete actions.

#### Pricing & Offers Tab

**Service Rate Configuration:**  
Editable rate table for 6 rate types (see [§13 Pricing](#13-pricing--rates)). On save: calls `savePricingConfig(config)`.

**Discount Codes:**  
Create form fields:
| Field | Type | Notes |
|---|---|---|
| Code | text | Auto-uppercased, no spaces |
| Type | select | Percent or Fixed KES |
| Value | number | % or KES amount |
| Min. Spend (KES) | number | Optional |
| Description | text | Optional |
| Expiry Date | date | Optional |

Calls `createDiscountCode(data)`. Existing codes list with active/inactive toggle and delete.

#### Settings / RBAC Tab
Displays current RBAC assignments and a form to grant new roles:

**Grant Access Form:**
| Field | Options |
|---|---|
| User ID / Email | text |
| Role | super_admin, finance_admin, client_coordinator, hca_manager, hr_admin |
| Custom Permissions | Multi-select checkboxes (8 permission keys) |

Calls `setRbacRule(userId, role, permissions)`. Existing assignments shown with revoke button.

**Role Reference Table:** Shows all 5 roles with their default permissions.

#### Family Hub Tab

4 sub-tabs for managing the `/caregivers` page content and access:

**Sub-tab: Courses (📚)**  
Table: Title, Target Audience, Difficulty, Lessons, Enrollments, Status, Actions (Edit / Archive|Activate)

"+ New Course" button opens the **Course Editor Modal**:
| Field | Type |
|---|---|
| Course Title | text |
| Description | textarea |
| Category | text |
| Difficulty | select (Beginner / Intermediate / Advanced) |
| Estimated Duration | text (e.g. "4 hrs") |
| Emoji | text (single emoji) |
| Target Audience | select (All Users / Family Caregivers / HCAs only) |
| Lessons (repeatable) | inline lesson builder |

**Per lesson:**
- Title, Summary (textarea), Objectives (newline-separated), Key Points (newline-separated), Resource URL, Duration (minutes)

On save: `createLmsCourse(data)` (new) or `updateLmsCourse(id, patch)` (edit). Lessons are stored as JSONB `lessons[]` on the course row.

**Sub-tab: Partner Submissions (📬)**  
Shows all rows from `lms_submissions` with status badges. Pending count shown in badge.  
Per submission: org name, contact email, course title, description, content URL, target, submitted date.  
Actions: **Approve** → `updateLmsSubmission(id, { status: 'approved' })`, **Reject** → `updateLmsSubmission(id, { status: 'rejected' })`.

**Sub-tab: Referrals (💬)**  
Shows all rows from `hub_referrals`. New count shown in badge.  
Per referral: name, phone, email, message, status (new/contacted), created date.  
Action: **Mark Contacted** → `updateHubReferral(id, { status: 'contacted', contacted_at: ISO })`.

**Sub-tab: Access Requests (🔑)**  
Shows all rows from `hub_access_requests`. Pending count shown in badge.  
Per request: name, email, organisation, message, submitted date.  
Actions: **Approve** (with designation select) → `updateHubAccessRequest(id, { status: 'approved', designation, reviewed_by: 'admin', reviewed_at: ISO })`, **Reject** → `updateHubAccessRequest(id, { status: 'rejected', ... })`.

Designation options: Partner Organisation, Healthcare Provider, Training Provider, Researcher.

---

### 7.3 Finance Dashboard `/admin/finance`

**File:** `pages/admin/finance.jsx`  
**Auth guard:** Same pattern as dashboard  
**Meta:** `noindex, nofollow`

All financial data loads from Supabase. The page includes a `NewInvoiceModal` component and a `downloadCSV(filename, rows, headers)` utility for exporting data. The mobile sidebar uses the same hamburger pattern as the admin dashboard.

#### Tab Navigation (6 tabs)

**Overview** — links back to `/admin/dashboard`

**Revenue Tab:**
- Monthly revenue aggregated from real Supabase invoice data
- Revenue breakdown by category table:
  - Placement Fees (55%)
  - Monthly Care Plans (25%)
  - Assessment Fees (10%)
  - HCA Subscriptions (10%)
- CSV export button

**Client Invoices Tab:**
Live invoice table from Supabase (`getAllInvoices()`):
- Columns: Invoice #, Client, Patient, Description, Issued, Due, Amount (KES), Status, Approved By, Actions
- "Mark Paid" button calls `approveInvoicePayment(invoiceId, "Finance Admin")`
- Also advances client journey to `payment_confirmed` if currently at `payment_pending`
- "New Invoice" button opens `NewInvoiceModal` component

Filter tabs: All, Paid, Pending, Overdue

**HCA Payroll Tab:**
Live payroll data from Supabase `payroll_payments` table:
- Month/year selector to filter by period
- Columns: HCA, Employee ID, Shifts, Rate/Hour, Hours, Gross, Deductions, Net, Status
- "Record Payment" button calls `createPayrollPayment(data)` to write a new payroll record
- CSV export button

**Expenses Tab:**
Live expenses from Supabase `expenses` table:
- Columns: Category, Description, Date, Amount (KES), Actions (delete)
- "Add Expense" form: icon, category, description, date, amount
- Calls `createExpense(data)` and `deleteExpense(id)`
- CSV export button

**Reports Tab:**
Placeholder section for future analytics exports.

---

### 7.4 Map View `/admin/map`

**File:** `pages/admin/map.jsx`  
**Auth guard:** Same pattern as dashboard  
**Meta:** `noindex, nofollow`  
**External dependency:** Leaflet.js 1.9.4 (loaded from unpkg CDN at runtime)

#### Map Implementation

Leaflet.js is loaded client-side only via `useEffect`:
```javascript
const script = document.createElement("script");
script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
script.onload = () => setMapReady(true);
document.body.appendChild(script);
```

Map initialises on `mapReady` state change (guarded by `// eslint-disable-next-line react-hooks/exhaustive-deps`).

Default view: Nairobi, Kenya (lat: -1.286, lng: 36.817, zoom: 12)  
Tile layer: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)

#### Entity Types & Marker Colours

| Type | Colour | Source |
|---|---|---|
| Client | `#004A99` (navy blue) | Supabase `clients` table with lat/lng set |
| HCA | `#059669` (emerald green) | Supabase `hca_profiles` table with lat/lng set |
| Patient | `#d97706` (amber) | Derived from client's patients JSONB array; slightly offset |

Markers use `L.divIcon` — circular coloured dots.

#### Sidebar (Left Panel)
- **Colour legend** — explains each entity type + colour
- **Type filter chips** — All, Clients, HCAs, Patients (redraws markers on change)
- **Entity list** — all entities (pinned = has coordinates, unpinned = no coordinates yet)
  - Click entity → map flies to marker, selects for editing

#### Edit Panel (Bottom-right drawer)
When an entity is selected:
- Entity name + type
- Address input (free text)
- Latitude input (decimal)
- Longitude input (decimal)
- **Place Mode toggle** — when active, next map click sets the lat/lng automatically
- "Save Location" button → calls `updateClientCoords(id, lat, lng)` or `updateHcaCoords(id, lat, lng)` → refreshes markers

#### Key State
```jsx
const [authed, setAuthed] = useState(false);
const [mapReady, setMapReady] = useState(false);
const [entities, setEntities] = useState([]);
const [markers, setMarkers] = useState([]);
const [filterType, setFilterType] = useState("all");
const [selectedEntity, setSelectedEntity] = useState(null);
const [placeMode, setPlaceMode] = useState(false);
const [editPanel, setEditPanel] = useState(null);
const [editLat, setEditLat] = useState("");
const [editLng, setEditLng] = useState("");
const [editAddr, setEditAddr] = useState("");
const [saveMsg, setSaveMsg] = useState("");
```

---

## 8. Shared Components

### `components/Nav.jsx`

Global navigation bar, included in all public pages.

**Structure:**
- Logo (text: `e-vive` with coloured `-` separator) — links to `/`
- Navigation links (desktop, hidden on mobile):
  - Home `/`
  - Find a Carer `/match`
  - For Assistants `/assistants`
  - Family Hub `/caregivers`
  - About `/about`
  - Contact `/contact`
- CTA button: "Get Care Now →" → `/client/register`
- Hamburger button (`≡`) — mobile only (< 960px)
- Mobile dropdown menu (slides in from top)

**Scroll behaviour:** When `scrollY > 20`, `.scrolled` class applied — reduces padding, increases backdrop blur.

**Active route:** `useRouter().pathname` used to apply `.active` class to current route link.

**Key State:**
```jsx
const [scrolled, setScrolled] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);
```

---

### `components/Footer.jsx`

Global footer, included in all public pages (not in portal dashboards).

**Structure:**
```
[Brand Column (2fr)]     [Platform Column (1fr)]   [Company Column (1fr)]
Logo                     Find a Carer              About Us
Description text         For Assistants            Contact Us
Social buttons (4)       Family Hub                Privacy Policy
Certified HCAs badge     Client Login              Terms of Use
                         HCA Login
```

**Brand column:**
- `e-vive` logo text
- Tagline: "Kenya's premier location-based homecare assistant matching platform"
- Social buttons: 📘 📦 📸 💼 (links to `#`, visual only)
- `🏥 Certified Homecare Assistants` badge

**Footer bottom bar:**
- Copyright: `© 2025–2026 E-Vive Homecare · by E-Vive Wellness Initiative · Nairobi, Kenya`
- Legal links: Privacy, Terms, Accessibility, Cookies (last two link to `#`)

**Responsive breakpoints:**
- ≤ 900px: two-column grid, brand spans full width
- ≤ 580px: single column, bottom bar stacks vertically

---

### `components/SharedStyles.js`

Central style definitions. Exports three named constants:

#### `FONTS`
```javascript
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
```

#### `BASE_CSS`
Public page base styles. Includes:

**CSS Custom Properties (`:root`):**
| Variable | Value | Use |
|---|---|---|
| `--jade` | `#004A99` | Primary brand blue |
| `--emerald` | `#002E6E` | Darker brand blue |
| `--mint` | `#84BD60` | Accent green |
| `--gold` | `#E8845A` | Accent warm orange |
| `--amber` | `#F0A98B` | Light warm orange |
| `--sky` | `#38bdf8` | Accent light blue |
| `--teal` | `#0ea5e9` | Secondary accent |
| `--coral` | `#f43f5e` | Error/alert red |
| `--text` | `#0F2035` | Primary text (dark navy) |
| `--muted` | `#5A7080` | Secondary text |
| `--bg` | `#f8f9fb` | Page background |
| `--serif` | `'Playfair Display', Georgia, serif` | Heading font |
| `--sans` | `'DM Sans', system-ui, sans-serif` | Body font |
| `--mono` | `'DM Mono', monospace` | Labels/badges font |

**Typography classes:** `.section-label`, `.section-title`, `.section-sub`

**Button classes:**
| Class | Style |
|---|---|
| `.btn-p` | Primary (jade background, white text) |
| `.btn-o` | Outline (jade border, jade text) |
| `.btn-a` | Alternative (amber/coral gradient) |
| `.btn-sky` | Sky blue |
| `.btn-sm` | Small size modifier |
| `.btn-full` | Full width modifier |
| `.btn-danger` | Red/destructive |

**Card classes:** `.card`, `.glass-card`  
**Form classes:** `.form-label`, `.form-input`, `.form-textarea`, `.form-select`, `.form-group`, `.form-error`  
**Badge classes:** `.badge`, `.badge-mint`, `.badge-gold`, `.badge-sky`, `.badge-coral`, `.badge-dim`, `.badge-amber`  
**Tag class:** `.tag`  

**Animations (keyframes):**
- `float` — gentle up-down float (used on hero elements)
- `pulse-dot` — opacity pulse (used on availability indicators)
- `spin-slow` — full rotation (used on logo orb)
- `slide-in` — slide from top + fade in

#### `DASH_BASE`
Dashboard/portal layout system. Includes:

**Layout:**
- `.dash-wrap` — `display: grid; grid-template-columns: 260px 1fr;`
- `.dash-side` — fixed-height sidebar with scrolling nav
- `.dash-main` — main content area

**Sidebar:**
- `.dash-logo`, `.dash-logo-text`, `.dash-logo-sub`
- `.dash-user`, `.dash-avatar`, `.dash-user-name`, `.dash-user-role`
- `.dash-nav`, `.dash-nav-section`, `.dash-nav-item`, `.dash-nav-icon`, `.dash-nav-badge`
- `.dash-footer`

**Content:**
- `.dash-topbar`, `.dash-title`
- `.stat-grid` — responsive 4-column stat card grid
- `.stat-box`, `.stat-box-val`, `.stat-box-label`, `.stat-box-trend`
- `.panel`, `.panel-head`, `.panel-body`
- `.dash-table-wrap`, `.dash-table`

**Forms:**
- `.dash-input`, `.dash-select`, `.dash-textarea`, `.dash-label`

**Mobile (≤ 900px):**
- `.dash-wrap` switches to single column
- `.dash-side` becomes a fixed overlay drawer (off-screen by default)
- `.dash-side.open` slides in from left
- `.dash-side-overlay` — semi-transparent backdrop, closes sidebar on tap
- `.dash-hamburger` — hamburger button shown in topbar
- `.topbar-logout` — sign-out pill visible in mobile topbar

---

### `components/PageMeta.jsx`

Per-page metadata: title, description, canonical URL, Open Graph and Twitter
card. Site-wide defaults — viewport, favicon, theme colour, `og:site_name` —
live in `pages/_app.jsx` and apply to every route, so a page only declares what
is specific to it. Next.js de-duplicates head tags by `key`, so a page that
renders `PageMeta` overrides the defaults rather than appending a second copy.

```jsx
<PageMeta
  title="About Us"
  description="E-Vive Wellness Initiative connects Kenyan families with certified HomeCare Assistants."
  path="/about/"
/>
```

`noindex` is available for pages that should not be indexed (`/press`, the
account and reset pages).

---

### Cardex & settings components

Added with the secure-Cardex work; all four talk to the `/api/cardex/*` routes
rather than to Supabase directly.

| Component | Used by | Purpose |
|---|---|---|
| `components/CardexView.jsx` | HCA + Admin dashboards | Renders one Cardex entry — vitals, medications, intake, hygiene, mobility, elimination, mental state, incidents, handover — from an already-redacted payload |
| `components/CareReports.jsx` | Client dashboard | The family's Care Reports tab: date range, per-patient filter, trend summary, and the entry point to sharing. Never receives welfare notes, QA comments, shift ratings or flags — the API does not select them |
| `components/ShareReportModal.jsx` | Client dashboard | Builds a share: date range, data types, recipients with relationship and written justification, consent statement, expiry. Shows each recipient's access code exactly once, to be passed on out-of-band |
| `components/TrendChart.jsx` | Client dashboard | Inline SVG sparkline for a single vital over the selected range. No charting dependency |
| `components/PlatformSettingsPanel.jsx` | Admin dashboard | Retention periods, consent ownership, sharing defaults, and the "run retention purge now" action, via `/api/settings` |

---

## 9. Data Layer — Supabase Reference

All application data is persisted to a Supabase PostgreSQL database. The `lib/store.js` module provides the complete async data access layer. Session tokens (client, HCA, admin) are the only data kept in browser localStorage.

**Supabase project:** `vwwdmzdknmdsiowmjkzf` | **Region:** `eu-west-1`

### 9.1 Supabase Tables

| Table | Purpose |
|---|---|
| `clients` | All registered client (family) records |
| `hca_applications` | All HCA application submissions |
| `hca_profiles` | All approved HCA profiles |
| `placements` | Active and historical care placements |
| `shifts` | Shift records (scheduled/in-progress/completed) |
| `cardex_entries` | Patient health records (digital Cardex) |
| `invoices` | Billing invoices |
| `expenses` | Operational expenses |
| `calendar_events` | Shared calendar events |
| `activity_log` | Activity audit log (capped at 500 entries in queries) |
| `notifications` | In-app and email notifications (capped at 200 in queries) |
| `rbac_rules` | RBAC role assignments |
| `announcements` | Admin-created platform announcements |
| `newsletters` | Newsletter campaign records |
| `pricing_config` | Service pricing configuration (single row, id=1) |
| `discount_codes` | Discount/promo codes |
| `map_markers` | Standalone map markers (supplementary to client/HCA coords) |
| `payroll_payments` | HCA payroll payment records |
| `lms_courses` | Family Hub LMS course catalogue (lessons stored as JSONB) |
| `lms_enrollments` | Per-user course enrollment and progress tracking |
| `lms_submissions` | Partner-submitted course content awaiting admin review |
| `hub_referrals` | Counselling referral requests from caregivers page |
| `hub_access_requests` | Partner organisation access requests for the Family Hub |
| `emails` | Unified inbox/sent/outbox/trash for admin Messages — Resend inbound + outbound, admin-composed sends, system notification sends, and Contact page submissions. See §9.4. |

**Added by migration `0009` (RLS-protected, service-role only):**

| Table | Purpose |
|---|---|
| `admin_users` | Real admin accounts — scrypt password, `role`, `active`, `last_login_at`, and the separately-granted `can_read_welfare_notes` flag. Replaces the single browser-side SHA-256 admin |
| `platform_settings` | Single row (id = 1). Retention periods, consent ownership, consent statement, and every sharing limit — business policy, not source constants |
| `cardex_notify_prefs` | Per client, per patient: new-report alerts, digest frequency, incident alerts (default on) |
| `cardex_shares` | One row per outward disclosure: patient, range, data types, consent statement and owner, who shared, revocation |
| `cardex_share_recipients` | One row per recipient — relationship, written justification, SHA-256 of the token, optional access code, expiry, access count |
| `cardex_share_audit` | Immutable audit of every share event, successful and failed alike (`viewed`, `revoked`, `denied_expired`, `denied_code`, …) |

**Added by migration `0010`:**

| Table | Purpose |
|---|---|
| `password_resets` | Single-use reset tokens: role, subject, SHA-256 of the token, expiry, and when it was spent |
| `payments` | One row per M-Pesa STK Push — written when the push is initiated, completed when Safaricom's callback lands, and linked to the invoice it settles |

> **All 32 tables now have Row Level Security enabled with no anon or
> authenticated policies** — `0009` for the seven Cardex tables, `0010` for the
> rest. The public anon key opens nothing. Every browser read and write goes
> through `/api/db` (§9.6), which uses the service role after checking the
> caller's session against `lib/dbPolicy.js`.

**localStorage keys (display copies and drafts only):**

| Key | Purpose |
|---|---|
| `evive_client_session` | The signed-in family's name and email, so the dashboard can greet them before the first fetch returns |
| `evive_hca_session` | Same, plus employee ID, for the HCA dashboard |
| `evive_admin_session` | Same for the admin sidebar |
| `evive_cardex_draft_*` | Per-shift Cardex draft autosave, cleared on sign-out |

> **None of these decide access.** Identity is the HMAC-signed HttpOnly
> `evive_session` cookie (§10): page guards ask `/api/auth/session`, and every
> API route re-derives the caller from the cookie itself. Editing any key above
> changes what name is displayed until the next fetch, and nothing else. The
> plaintext `evive_client_registry` is gone.

### 9.2 Data Schemas

#### Client Record (`clients` table)
```typescript
{
  id: string;                          // UUID (Supabase-generated)
  name: string;
  email: string;                       // unique, lowercase
  mobile: string;
  password_hash: string;               // plaintext (stored as password_hash column)
  location: string;
  address: string;
  patients: Patient[];                 // JSONB array
  journey_stage: JourneyStage;         // current stage string
  journey_dates: Record<string, string>; // { [stage]: ISO_timestamp }
  visit_date?: string;                 // ISO timestamp
  assigned_hca_id?: string;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;                  // ISO timestamp
  lat?: number;                        // decimal degrees
  lng?: number;                        // decimal degrees
  shortlisted_hcas?: string[];         // array of HCA profile IDs
  requested_hca_id?: string;
  requested_hca_notes?: string;
  requested_hca_at?: string;           // ISO timestamp
  deletion_requested?: boolean;
  deletion_requested_at?: string;      // ISO timestamp
}
```

**JS camelCase shape** (after `clientFromDb` mapper):
```typescript
{
  id, name, email, mobile, password, location, address,
  patients, journeyStage, journeyDates, visitDate, assignedHcaId,
  shortlistedHcas, requestedHcaId, requestedHcaNotes, requestedHcaAt,
  status, lat, lng, deletionRequested, deletionRequestedAt, createdAt
}
```

#### Patient (nested JSONB in `clients.patients`)
```typescript
{
  id: string;           // uid()
  name: string;
  age: number;
  relationship: string;
  gender: string;
  conditions: string;   // medical conditions
  notes: string;        // special care instructions
}
```

#### HCA Application (`hca_applications` table)
```typescript
{
  id: string;           // UUID
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;   // ISO timestamp
  full_name: string;
  email: string;
  password: string;
  mobile: string;
  national_id: string;
  county: string;
  cert_level: string;
  years_exp: number;
  specialisations: string[];
  plan: string;
  bio: string;
  form_data: object;    // remaining form fields
}
```

#### HCA Profile (`hca_profiles` table)
```typescript
{
  id: string;              // UUID
  application_id: string;
  employee_id: string;     // auto-generated: HCA-1001, HCA-1002, ...
  name: string;
  email: string;
  password: string;
  mobile: string;
  cert_level: string;
  years_exp: number;
  specialisations: string[];
  rate: number;            // KES per shift (default 2000)
  rate_set_at: string;     // ISO timestamp
  status: 'active' | 'inactive' | 'suspended';
  approved_at: string;     // ISO timestamp
  gender: string;
  languages: string[];
  shift_preferences: string[];
  period_preference: string;
  travel_options: string[];
  bio: string;
  age_range: string;
  available: boolean;
  rating: number;
  review_count: number;
  placement_count: number;
  lat?: number;
  lng?: number;
  deletion_requested?: boolean;
  deletion_requested_at?: string;
}
```

#### Placement (`placements` table)
```typescript
{
  id: string;          // UUID
  client_id: string;
  patient_id: string;
  hca_id: string;
  start_date: string;  // ISO timestamp
  end_date?: string;   // ISO timestamp | null
  rate_per_shift: number; // KES (default 2000)
  status: 'active' | 'paused' | 'ended';
  created_at: string;  // ISO timestamp
}
```

#### Shift (`shifts` table)
```typescript
{
  id: string;               // UUID
  placement_id?: string;
  hca_id: string;
  client_id: string;
  patient_id?: string;
  date: string;             // YYYY-MM-DD
  type: 'day' | 'night' | 'live-in';
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed';
  clock_in?: string;        // ISO timestamp | null
  clock_out?: string;       // ISO timestamp | null
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  start_time?: string;      // HH:MM
  notes?: string;
  linked_event_id?: string;
}
```

#### Cardex Entry (`cardex_entries` table)
```typescript
{
  id: string;           // UUID
  shift_id?: string;
  hca_id: string;
  patient_id: string;
  client_id: string;
  submitted_at: string; // ISO timestamp
  vitals: {
    bp: string;         // e.g. "120/80"
    pulse: number;
    temp: number;       // °C
    spo2: number;       // %
    rr: number;         // breaths/min
    weight: number;     // kg
    pain: number;       // 0–10 scale
  };
  medications: Array<{ name: string; dose: string; time: string; given: boolean }>;
  intakes: any[];
  nutrition: object;
  hygiene: object;
  mobility: object;
  elimination: object;
  mental_state: object;
  incidents: string;
  handover: string;
  shift_rating: number;
  special_needs_checks: any[];
  qa_comments?: Array<{     // added by admin QA review
    id: string;
    comment: string;
    flagged: boolean;
    adminId: string;
    createdAt: string;      // ISO timestamp
  }>;
  flagged?: boolean;        // true if any QA comment is flagged
  welfare_note?: string;
}
```

#### Invoice (`invoices` table)
```typescript
{
  id: string;            // UUID
  invoice_num: string;   // INV-1001, INV-1002, ...
  client_id: string;
  patient_id?: string;
  placement_id?: string;
  description: string;
  line_items: Array<{ label: string; amount: number }>;
  subtotal: number;      // KES
  total: number;         // KES
  currency: 'KES';
  due_date: string;      // YYYY-MM-DD
  issued_at: string;     // ISO timestamp
  created_at: string;    // ISO timestamp
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed';
  paid_at?: string;      // ISO timestamp | null
  approved_by?: string;  // null until paid
}
```

#### Calendar Event (`calendar_events` table)
```typescript
{
  id: string;            // UUID
  title: string;
  date: string;          // YYYY-MM-DD
  time?: string;         // HH:MM | null
  type: 'visit' | 'shift' | 'offday' | 'training' | 'meeting' | 'other';
  client_id?: string;
  hca_id?: string;
  patient_id?: string;
  shift_id?: string;     // if linked to a shift
  notes?: string;
  created_at: string;    // ISO timestamp
  created_by: string;    // "admin" | userId
  source?: 'event' | 'shift'; // added at retrieval time
}
```

#### Notification (`notifications` table)
```typescript
{
  id: string;
  client_id?: string;    // null for broadcast
  hca_id?: string;
  type: 'welcome' | 'tc_accepted' | 'visit_scheduled' | 'invoice' |
        'password_reset' | 'hca_matched' | 'payment_confirmed' |
        'deletion_request' | string;
  subject: string;
  body: string;
  email_to?: string;
  read: boolean;
  created_at: string;    // ISO timestamp
}
```

#### Activity Log Entry (`activity_log` table)
```typescript
{
  id: string;            // UUID
  created_at: string;    // ISO timestamp
  type: string;          // e.g. 'client_registered', 'hca_approved', etc.
  data: object;          // { clientId?, clientName?, hcaId?, hcaName?, ... }
}
```

#### RBAC Rule (`rbac_rules` table)
```typescript
{
  user_id: string;       // primary key
  role: 'super_admin' | 'finance_admin' | 'client_coordinator' | 'hca_manager' | 'hr_admin';
  permissions: string[];
  updated_at: string;    // ISO timestamp
}
```

#### Payroll Payment (`payroll_payments` table)
```typescript
{
  id: string;            // UUID
  hca_id: string;
  hca_name: string;
  employee_id: string;
  period_month: number;  // 1–12
  period_year: number;
  shifts: number;
  hours: number;
  rate: number;          // KES per hour
  gross: number;         // KES
  deductions: number;    // KES
  net: number;           // KES
  paid_by: string;       // default "Finance Admin"
  notes: string;
  created_at: string;    // ISO timestamp
}
```

#### Expense (`expenses` table)
```typescript
{
  id: string;            // UUID
  icon: string;          // emoji
  category: string;
  description: string;
  date: string;          // YYYY-MM-DD
  amount: number;        // KES
  created_at: string;    // ISO timestamp
}
```

#### Announcement (`announcements` table)
```typescript
{
  id: string;
  title: string;
  body: string;
  target: 'all' | 'clients' | 'hcas' | 'admins';
  type: 'info' | 'warning' | 'alert';
  priority: 'normal' | 'high' | 'urgent';
  published: boolean;
  created_at: string;    // ISO timestamp
}
```

#### Newsletter (`newsletters` table)
```typescript
{
  id: string;
  name: string;          // campaign name
  subject: string;
  body: string;
  target_audience: 'all' | 'clients' | 'hcas';
  status: 'draft' | 'sent';
  sent_at?: string;      // ISO timestamp | null
  recipient_count: number;
  created_at: string;    // ISO timestamp
}
```

#### Discount Code (`discount_codes` table)
```typescript
{
  id: string;
  code: string;          // uppercase, no spaces, unique
  type: 'percent' | 'fixed';
  value: number;         // percent (0–100) or KES amount
  min_spend: number;     // KES minimum order value
  description: string;
  expires_at?: string;   // ISO timestamp | null
  active: boolean;
  usage_count: number;
  created_at: string;    // ISO timestamp
}
```

#### Map Marker (computed from `clients` + `hca_profiles` + `map_markers`)
```typescript
{
  id: string;
  type: 'client' | 'hca' | 'patient';
  lat: number;
  lng: number;
  label: string;
  sub: string;           // secondary info (location/employeeId)
  color: string;         // '#004A99' | '#059669' | '#d97706'
  parentClientId?: string; // for patient markers
}
```

#### LMS Course (`lms_courses` table)
```typescript
{
  id: string;               // UUID
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;         // e.g. "4 hrs"
  emoji: string;            // single emoji for visual identity
  target: 'all' | 'clients' | 'hcas';
  lessons: LmsLesson[];     // JSONB array — embedded lesson content
  tags: string[];           // JSONB array
  status: 'active' | 'archived';
  created_at: string;       // ISO timestamp
}
```

**Per lesson (`LmsLesson`):**
```typescript
{
  idx: number;              // 0-based position
  title: string;
  objectives: string[];     // learning objectives
  summary: string;          // lesson body text
  key_points: string[];     // bullet-point takeaways
  resource_url?: string;    // external link to source material
  duration_mins: number;
}
```

#### LMS Enrollment (`lms_enrollments` table)
```typescript
{
  id: string;               // UUID
  user_id: string;          // client id, hca id, or "admin"
  user_type: 'client' | 'hca' | 'admin';
  course_id: string;
  progress_pct: number;     // 0–100
  completed_lessons: number[]; // array of completed lesson idx values
  enrolled_at: string;      // ISO timestamp
  completed_at?: string;    // ISO timestamp | null
}
```

#### LMS Submission (`lms_submissions` table)
```typescript
{
  id: string;               // UUID
  org_name: string;
  contact_email: string;
  course_title: string;
  description: string;
  content_url?: string;
  target: 'all' | 'clients' | 'hcas';
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;     // ISO timestamp
  reviewed_at?: string;     // ISO timestamp | null
}
```

#### Hub Referral (`hub_referrals` table)
```typescript
{
  id: string;               // UUID
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  status: 'new' | 'contacted';
  admin_notes?: string;
  contacted_at?: string;    // ISO timestamp | null
  created_at: string;       // ISO timestamp
}
```

#### Hub Access Request (`hub_access_requests` table)
```typescript
{
  id: string;               // UUID
  name: string;
  email: string;
  organisation?: string;
  message?: string;
  designation?: string;     // assigned on approval
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;     // "admin"
  reviewed_at?: string;     // ISO timestamp | null
  created_at: string;       // ISO timestamp
}
```

#### Email Record (`emails` table)
```typescript
{
  id: string;                  // UUID
  direction: 'inbound' | 'outbound';
  origin: 'resend' | 'contact_page' | 'admin_composed' | 'system';
  folder: 'inbox' | 'sent' | 'outbox' | 'trash';
  status: 'received' | 'queued' | 'sent' | 'delivered' | 'delayed' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed' | 'skipped';
  subject: string;
  fromAddress?: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses: string[];
  replyTo?: string;
  bodyText: string;
  bodyHtml?: string;
  resendMessageId?: string;    // links outbound sends to their webhook lifecycle events
  threadId?: string;
  relatedClientId?: string;
  relatedHcaId?: string;
  adminId?: string;            // who composed it, for admin-initiated sends
  read: boolean;
  starred: boolean;
  metadata: object;            // raw webhook payload(s), keyed by event type for outbound
  createdAt: string;
  sentAt?: string;
  deletedAt?: string;
}
```

---

### 9.3 Store Functions Reference

All functions are exported from `lib/store.js`. All data functions are **async** (return Promises). Session helpers are synchronous (localStorage only).

#### Activity Log

| Function | Signature | Notes |
|---|---|---|
| `logActivity` | `async (entry: object) → void` | Inserts into `activity_log`; non-critical (errors swallowed) |
| `getActivityLog` | `async () → ActivityEntry[]` | Returns last 500 entries (newest first) |

#### Client Management

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllClients` | `async () → Client[]` | Array | Ordered newest first |
| `getClientByEmail` | `async (email) → Client \| null` | Client | |
| `getClientById` | `async (id) → Client \| null` | Client | |
| `createClient` | `async (data) → Client` | New client | Throws on duplicate email; also writes legacy registry entry; logs activity |
| `updateClient` | `async (id, patch) → Client` | Updated client | Throws on DB error |
| `advanceClientJourney` | `async (clientId, stage, meta?) → Client` | Updated client | Records timestamp in `journeyDates`; logs activity |
| `setClientSession` | `(client) → void` | — | Stores `{id, name, email, mobile}` in localStorage |
| `getClientSession` | `() → Session \| null` | Session | Synchronous localStorage read |
| `clearClientSession` | `() → void` | — | |
| `authenticateClient` | `async (email, password) → Client \| null` | Client or null | Plaintext comparison |

#### Patient Management

| Function | Signature | Returns |
|---|---|---|
| `addPatientToClient` | `async (clientId, patientData) → Client` | Updated client |
| `updatePatient` | `async (clientId, patientId, patch) → Client` | Updated client |
| `removePatient` | `async (clientId, patientId) → Client` | Updated client |

#### HCA Shortlisting

| Function | Signature | Returns |
|---|---|---|
| `toggleHcaShortlist` | `async (clientId, hcaId) → Client` | Updated client |
| `requestHcaMatch` | `async (clientId, hcaId, notes?) → Client` | Updated client |
| `requestAccountDeletion` | `async (clientId) → Client` | Updated client with `deletionRequested: true` |

#### HCA Applications

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllHcaApplications` | `async () → HcaApplication[]` | Array | |
| `createHcaApplication` | `async (formData) → HcaApplication` | New application | Sets status='pending'; logs activity |
| `updateHcaApplication` | `async (id, patch) → HcaApplication` | Updated | |

#### HCA Profiles

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllHcaProfiles` | `async () → HcaProfile[]` | Array | Ordered by `approved_at` desc |
| `getHcaProfileById` | `async (id) → HcaProfile \| null` | Profile | |
| `getHcaProfileByEmail` | `async (email) → HcaProfile \| null` | Profile | |
| `createHcaProfile` | `async (data) → HcaProfile` | New profile | Auto-generates employeeId (HCA-1001+); sets `available: true`, `rating: 0`; logs activity |
| `updateHcaProfile` | `async (id, patch) → HcaProfile` | Updated | |
| `requestHcaDeletion` | `async (hcaId) → HcaProfile` | Updated profile with `deletionRequested: true` | |
| `setHcaSession` | `(profile) → void` | — | Stores `{id, name, email, employeeId}` in localStorage |
| `getHcaSession` | `() → Session \| null` | Session | Synchronous localStorage read |
| `clearHcaSession` | `() → void` | — | |
| `authenticateHca` | `async (identifier, password) → HcaProfile \| null` | Profile or null | Matches by employeeId, email, or mobile; plaintext password comparison |

#### Placements

| Function | Signature | Returns |
|---|---|---|
| `getAllPlacements` | `async () → Placement[]` | Array |
| `getPlacementsByClient` | `async (clientId) → Placement[]` | Filtered array |
| `getPlacementsByHca` | `async (hcaId) → Placement[]` | Filtered array |
| `createPlacement` | `async (data) → Placement` | New placement |
| `updatePlacement` | `async (id, patch) → Placement` | Updated placement |

#### Shifts

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllShifts` | `async () → Shift[]` | Array | |
| `getShiftsByHca` | `async (hcaId) → Shift[]` | Filtered | |
| `getShiftsByClient` | `async (clientId) → Shift[]` | Filtered | |
| `createShift` | `async (data) → Shift` | New shift | Sets status='scheduled' |
| `updateShift` | `async (id, patch) → Shift` | Updated | |
| `clockInHca` | `async (hcaId, {clientId, patientId, lat, lng}) → Shift` | Shift | Finds today's scheduled shift or creates ad-hoc; records GPS + ISO timestamp; sets status='in-progress'; logs activity |
| `clockOutHca` | `async (hcaId, shiftId) → Shift` | Shift | Sets status='completed'; records clockOut; logs activity |
| `createShiftWithEvent` | `async (shiftData) → {shift, event}` | Both | Atomically creates shift + linked calendar event |

#### Cardex

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllCardex` | `async () → CardexEntry[]` | Array | Also aliased as `getAllCardexEntries()` |
| `getCardexByPatient` | `async (patientId) → CardexEntry[]` | Filtered | |
| `getCardexByHca` | `async (hcaId) → CardexEntry[]` | Filtered | |
| `createCardexEntry` | `async (data) → CardexEntry` | New entry | Sets submittedAt; logs activity |
| `addCardexQaComment` | `async (entryId, {comment, flagged?, adminId}) → CardexEntry` | Updated entry | Appends to `qaComments[]`; sets `flagged: true` if flagged |

#### Invoices

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllInvoices` | `async () → Invoice[]` | Array | |
| `getInvoicesByClient` | `async (clientId) → Invoice[]` | Filtered | |
| `createInvoice` | `async (data) → Invoice` | New invoice | Auto-generates invoiceNum (INV-1001+); sets currency='KES', status='sent'; logs activity |
| `updateInvoice` | `async (id, patch) → Invoice` | Updated | |
| `approveInvoicePayment` | `async (id, approvedBy) → Invoice` | Updated | Sets status='paid', paidAt, approvedBy; logs activity |

#### Calendar Events

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllCalendarEvents` | `async () → CalendarEvent[]` | Array | |
| `getCalendarEventsByDate` | `async (date: YYYY-MM-DD) → CalendarEvent[]` | Filtered | |
| `getCalendarEventsByHca` | `async (hcaId) → CalendarEvent[]` | Filtered | |
| `getCalendarEventsByClient` | `async (clientId) → CalendarEvent[]` | Filtered | |
| `createCalendarEvent` | `async (data) → CalendarEvent` | New event | |
| `updateCalendarEvent` | `async (id, patch) → CalendarEvent` | Updated | |
| `deleteCalendarEvent` | `async (id) → void` | — | |
| `getCalendarItemsForMonth` | `async (year, month) → CalendarItem[]` | Merged array | Combines events + shifts; deduplicates shift-linked events; sorted by time |

#### Notifications

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllNotifications` | `async () → Notification[]` | Array | Last 200 entries |
| `getNotificationsForClient` | `async (clientId) → Notification[]` | Filtered | Includes broadcasts (`client_id IS NULL`) |
| `createNotification` | `async (data) → Notification` | New notification | |
| `markNotificationRead` | `async (id) → void` | — | |
| `markAllNotificationsRead` | `async (clientId) → void` | — | |
| `getUnreadCount` | `async (clientId) → number` | Count | |

#### Notification Helper Functions (email templates)

Each function creates a Supabase notification record AND calls `dispatchEmail()` which POSTs to `/api/send-email`:

| Function | Trigger |
|---|---|
| `sendWelcomeNotification(client)` | On client registration |
| `sendTcAcceptedNotification(client)` | On T&C acceptance |
| `sendVisitScheduledNotification(client, visitDate)` | On visit scheduled |
| `sendInvoiceNotification(client, invoice)` | On invoice creation |
| `sendPasswordResetNotification(client, resetCode)` | On password reset request |
| `sendHcaMatchedNotification(client, hcaName)` | On HCA matching |
| `sendPaymentConfirmedNotification(client)` | On payment confirmation |

#### RBAC

| Function | Signature | Returns |
|---|---|---|
| `getRbacRules` | `async () → RbacMap` | Object `{[userId]: {role, permissions, updatedAt}}` |
| `setRbacRule` | `async (userId, role, permissions[]) → void` | — (upsert) |
| `removeRbacRule` | `async (userId) → void` | — |
| `hasPermission` | `(roleOrPerms, perm) → boolean` | Synchronous; true if perms includes 'all' or specific perm |

#### Admin Session

| Function | Signature | Returns |
|---|---|---|
| `getAdminSession` | `() → AdminSession \| null` | Synchronous localStorage read |
| `setAdminSession` | `(user) → void` | Stores with `loginAt` timestamp |
| `clearAdminSession` | `() → void` | — |

#### Announcements

| Function | Signature | Returns |
|---|---|---|
| `getAllAnnouncements` | `async () → Announcement[]` | Array |
| `createAnnouncement` | `async ({title, body, target?, type?, priority?}) → Announcement` | New announcement |
| `updateAnnouncement` | `async (id, patch) → Announcement` | Updated |
| `deleteAnnouncement` | `async (id) → void` | — |

#### Newsletter

| Function | Signature | Returns |
|---|---|---|
| `getAllNewsletters` | `async () → Newsletter[]` | Array |
| `createNewsletter` | `async ({name, subject, body, targetAudience?}) → Newsletter` | New newsletter |
| `updateNewsletter` | `async (id, patch) → Newsletter` | Updated |
| `deleteNewsletter` | `async (id) → void` | — |
| `markNewsletterSent` | `async (id) → Newsletter` | Updated; counts recipients from Supabase data |

#### Pricing

| Function | Signature | Returns |
|---|---|---|
| `getPricingConfig` | `async () → PricingConfig` | Config from Supabase or DEFAULT_PRICING |
| `savePricingConfig` | `async (config) → void` | Upserts into `pricing_config` (id=1) |

#### Discounts

| Function | Signature | Returns |
|---|---|---|
| `getAllDiscountCodes` | `async () → DiscountCode[]` | Array |
| `createDiscountCode` | `async ({code, type?, value, minSpend?, description?, expiresAt?}) → DiscountCode` | New code |
| `updateDiscountCode` | `async (id, patch) → void` | — |
| `deleteDiscountCode` | `async (id) → void` | — |

#### Expenses

| Function | Signature | Returns |
|---|---|---|
| `getAllExpenses` | `async () → Expense[]` | Array |
| `createExpense` | `async ({icon?, category, description, date, amount}) → Expense` | New expense |
| `deleteExpense` | `async (id) → void` | — |

#### Payroll

| Function | Signature | Returns |
|---|---|---|
| `getPayrollPayments` | `async (month, year) → PayrollPayment[]` | Filtered by period |
| `createPayrollPayment` | `async (data) → PayrollPayment` | New payroll record; logs activity |

#### Map / Location

| Function | Signature | Returns |
|---|---|---|
| `updateClientCoords` | `async (clientId, lat, lng) → Client` | Updated client |
| `updateHcaCoords` | `async (hcaId, lat, lng) → HcaProfile` | Updated profile |
| `getAllMapMarkers` | `async () → MapMarker[]` | Entities with lat/lng set |
| `getAllMapEntities` | `async () → Entity[]` | All entities (pinned and unpinned) |
| `createMapMarker` | `async ({label, type?, lat, lng, refId?, notes?}) → MapMarker` | New marker |
| `updateMapMarker` | `async (id, patch) → void` | — |
| `deleteMapMarker` | `async (id) → void` | — |

#### LMS

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getLmsCourses` | `async (target?) → LmsCourse[]` | Array | Filters by target audience if provided ('clients'\|'hcas'); returns all active courses if null |
| `getLmsCourse` | `async (id) → LmsCourse \| null` | Course | Single course by ID |
| `getEnrollmentsForUser` | `async (userId, userType) → LmsEnrollment[]` | Array | All enrollments for a user |
| `enrollInCourse` | `async (userId, userType, courseId) → LmsEnrollment` | New enrollment | No-op if already enrolled (returns existing) |
| `updateCourseProgress` | `async (userId, courseId, lessonIdx, totalLessons) → LmsEnrollment` | Updated enrollment | Adds lessonIdx to completed_lessons; recalculates progress_pct; sets completed_at if 100% |
| `submitPartnerCourse` | `async ({orgName, contactEmail, courseTitle, description, contentUrl, target}) → LmsSubmission` | New submission | Status defaults to 'pending' |
| `getLmsSubmissions` | `async () → LmsSubmission[]` | Array | All submissions (newest first) |
| `updateLmsSubmission` | `async (id, patch) → LmsSubmission` | Updated | Used for approve/reject |
| `createLmsCourse` | `async (data) → LmsCourse` | New course | Admin-only; sets status='active' |
| `updateLmsCourse` | `async (id, patch) → LmsCourse` | Updated | |
| `deleteLmsCourse` | `async (id) → void` | — | Hard delete |
| `getAllLmsEnrollments` | `async () → LmsEnrollment[]` | Array | All enrollments (admin overview) |

#### Family Hub

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getHubReferrals` | `async () → HubReferral[]` | Array | All counselling referrals (newest first) |
| `createHubReferral` | `async ({name, phone?, email?, message?}) → HubReferral` | New referral | Status defaults to 'new' |
| `updateHubReferral` | `async (id, patch) → HubReferral` | Updated | Used to mark as contacted |
| `getHubAccessRequests` | `async () → HubAccessRequest[]` | Array | All partner access requests (newest first) |
| `createHubAccessRequest` | `async ({name, email, organisation?, message?}) → HubAccessRequest` | New request | Status defaults to 'pending' |
| `updateHubAccessRequest` | `async (id, patch) → HubAccessRequest` | Updated | Used for approve/reject with designation |

#### Demo Seed Data

| Function | Notes |
|---|---|

#### Messages (`emails` table)

| Function | Signature | Returns | Notes |
|---|---|---|---|
| `getAllEmails` | `async () → Email[]` | Array | All messages, newest first, capped at 1000 |
| `getEmailById` | `async (id) → Email` | Row | Single message |
| `markEmailRead` | `async (id, read=true) → void` | — | |
| `toggleEmailStar` | `async (id, starred) → void` | — | |
| `moveEmailToTrash` | `async (id) → void` | — | Sets `folder='trash'`, `deleted_at=now()` |
| `restoreEmailFromTrash` | `async (id, folder) → void` | — | Restores to `'inbox'` or `'sent'` |
| `deleteEmailPermanently` | `async (id) → void` | — | Hard delete — only meaningful from Trash |
| `sendAdminEmail` | `async ({to, cc?, subject, text, replyTo?, relatedClientId?, relatedHcaId?, adminId?}) → {ok,id?}` | Send result | Posts to `/api/send-email` with `origin: 'admin_composed'`; throws on failure |

### 9.4 Messages / Email Setup

The admin "Messages" tab (`tab==="messages"` in `pages/admin/dashboard.jsx`) is a unified inbox/sent/outbox/trash for email, tagged by origin (`Resend`, `Admin`, `System`, `Contact Page`). It needs two pieces of one-time setup outside the codebase:

**1. Database migration** — the `emails` table doesn't exist until you create it. Run `supabase/migrations/0001_create_emails_table.sql` once in the Supabase SQL Editor for this project. It creates the table, indexes, and an RLS policy granting the `anon` role full access. Migration `0010` drops that policy — `emails` is now reachable only through the data gateway, which lets a non-admin file an inbound message and read nothing back but its id.

**2. Resend webhook** — in the Resend dashboard, add a webhook endpoint pointing at `https://<your-domain>/api/webhooks/resend`, subscribed to: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`, and the Inbound event (for two-way email — requires Resend's Inbound Routes feature and its own DNS/MX setup on your domain, done separately in Resend). Copy the webhook's signing secret into the `RESEND_WEBHOOK_SECRET` environment variable in Vercel. Without it, the endpoint still works but accepts events without verifying they actually came from Resend.

**Note on inbound field mapping:** the inbound branch in `pages/api/webhooks/resend.js` (`handleInbound`) extracts `from`/`to`/`subject`/`text`/`html` using best-effort field names, since the exact inbound payload shape wasn't verified against a live event while this was built. The full raw event is always stored in `metadata` regardless, so nothing is lost — if the parsed fields look wrong on a real inbound message, check `metadata` in that message's raw record and adjust the extraction in `handleInbound` accordingly.

### 9.5 Database Migrations

Applied in order in the Supabase SQL editor; each is idempotent.

| File | What it does |
|---|---|
| `0001_create_emails_table.sql` | Unified `emails` table for the admin Messages inbox |
| `0002_add_hca_application_edit_token.sql` | Applicant self-service edit links |
| `0003_add_hca_journey_tracking.sql` | HCA journey stage + timestamps |
| `0004_add_hca_profile_submitted_info.sql` | Carries applicant-submitted detail onto the approved profile |
| `0005_hca_application_email_unique.sql` | Prevents duplicate applications at the database level |
| `0006_add_hca_profile_location.sql` | Captures and surfaces HCA location |
| `0007_perf_indexes.sql` | Indexes behind the HCA profile queries |
| `0008_placement_workflow.sql` | Placements, request review, conflict-safe scheduling, off-days |
| `0009_secure_cardex.sql` | `admin_users`, `platform_settings`, sharing + audit tables, scrypt password columns, Cardex indexes, RLS on the clinical tables, and `purge_expired_cardex_data()` |
| `0010_lock_down_and_payments.sql` | `password_resets`, `payments`, invoice reconciliation columns, RLS on all remaining tables (dropping `0001`'s permissive `anon` policy on `emails`), a widened `emails.origin` constraint, and `purge_expired_password_resets()` |

| `0011_rate_limits.sql` | The sliding-window table behind `lib/rateLimit.js`, and its purge function |
| `0012_attendance_verification.sql` | `clock_in_verified`, `clock_in_distance_m`, clock-out position, and the configurable `clock_in_radius_m` |
| `0013_document_storage.sql` | No SQL — records the one ops step that cannot be a migration: creating the private `hca-documents` Storage bucket |

> `0009` and `0010` **must** be paired with `SUPABASE_SERVICE_ROLE_KEY` and
> `SESSION_SECRET` in the environment, and **the code must be deployed first**.
> `0010` revokes the public anon key's access to every table: run it against an
> older deploy and the whole application goes dark. Deploy, then migrate.

### 9.6 The Data Gateway

Every database read and write the browser makes goes through `POST /api/db`.

```
browser                       /api/db                        Postgres
───────                       ───────                        ────────
lib/store.js
  supabase.from('invoices')
    .select('*')
    .eq('client_id', id)
        │
        ▼
lib/supabase.js — records the
call and posts a description
        │  { table, action, columns, filters, order, limit }
        ▼
                  getSession(req)  ← the signed cookie, nothing else
                        │
                  policyFor(table, role)
                        │  absent ⇒ 403
                        ▼
                  resolveSelect  — '*' expands to the role's columns;
                                   an explicit list is intersected, so a
                                   column outside the policy cannot come
                                   back even if it is asked for
                  resolveScope   — a mandatory row filter, ANDed onto the
                                   caller's own filters (never instead of)
                  resolveWrite   — writable columns; strict, and `force`
                                   pins owner and status columns
                        │
                        ▼
                  service-role query ──────────────────────────►
```

Four rules govern `lib/dbPolicy.js`, and reading that file should tell you the
whole authorisation story:

1. **Absent means denied.** A table with no entry for a role, or an action not
   listed, is refused. New tables are locked until someone opts them in.
2. **`select` is a column allowlist.** `password` is in none of them, for any
   non-admin role, however it is requested.
3. **`scope` is mandatory and derived from the session** — never from the
   request. A family is scoped to `client_id = <their own>`; an HCA to their own
   shifts, and to the families they actually hold a placement or shift with.
   Writes may be scoped more tightly than reads: an HCA browses the whole active
   directory but may only ever change their own row.
4. **Writes are strict.** A payload naming a column the role may not set is
   rejected rather than trimmed — a write that half-happens is worse than one
   that fails.

Three operations authenticate *themselves* rather than a role, so they are their
own routes rather than table policy: applying
(`/api/applications/create`), correcting an application by emailed link
(`/api/applications/[token]`), and an HCA reading their own private fields
(`/api/hca/me`).

`lib/dbPolicy.test.mjs` covers the policy directly — that no non-admin role can
delete anything, that `password` cannot be read by any route, that an HCA cannot
raise their own rate or approve themselves, that an HCA with no placements
matches no clients rather than all of them, and that every table access the
application actually makes is permitted.

---

## 10. Authentication Systems

There is one answer to "who is this": the HMAC-signed HttpOnly `evive_session`
cookie. Pages, API routes and the data gateway all derive identity from it and
from nothing else.

### Signing in

```
POST /api/auth/login  { role, identifier, password }
        ↓
service-role lookup in clients | hca_profiles | admin_users
  (email, mobile, or employee_id — whichever that role may sign in with)
        ↓
verifyPassword(password, stored, algo)     scrypt, constant-time
  · an unknown account still pays a decoy comparison — no enumeration
  · legacy plaintext verifies once, then upgrades to scrypt in place
        ↓
active === false or status === 'suspended' → 403
        ↓
createSessionToken({ role, id, name, email, … })   HMAC-SHA256, 12 h expiry
        ↓
Set-Cookie: evive_session=…; HttpOnly; SameSite=Lax; Path=/; Secure (prod)
```

The browser never fetches a password column and never decides whether one
matched. `lib/session.js` is how a page asks who it is talking to:

```javascript
const session = await fetchServerSession();       // GET /api/auth/session
if (session?.role !== "admin") router.replace("/admin/login");
```

**Session payload:** `{ role, id, name, email, iat, exp }`, plus
`canReadWelfareNotes` and `adminRole` for admins, `employeeId` for HCAs.

### Page guards

| Page | Guard |
|---|---|
| `client/dashboard.jsx` | `fetchServerSession()` → requires `role === 'client'` |
| `hca/dashboard.jsx` | `fetchServerSession()` → requires `role === 'hca'` |
| `admin/dashboard.jsx`, `admin/finance.jsx`, `admin/map.jsx` | `fetchServerSession()` → requires `role === 'admin'` |

Pages render `null` until the server confirms, so protected content never
flashes. Signing out clears the cookie through `/api/auth/logout` as well as the
localStorage display copy.

### Registration, reset and password change

| Flow | Route | Notes |
|---|---|---|
| Register | `POST /api/auth/register` | scrypt-hashed before the row exists; ignores any field registration may not set; signs the caller in |
| Forgot password | `POST /api/auth/request-reset` | Single-use token, only its SHA-256 stored, emailed, 45-minute expiry, 5 per account per hour. The response is identical whether or not the account exists |
| Redeem reset | `GET/POST /api/auth/reset` + `/auth/reset/[token]` | Consumed on use; issuing a new token invalidates the previous one |
| Change password | `POST /api/auth/change-password` | The current password is verified against the stored hash server-side; only ever changes the account in the cookie |

### Admin accounts

Admins are rows in `admin_users` with a scrypt hash. There is no browser-side
fallback: the `NEXT_PUBLIC_ADMIN_HASH` path — a SHA-256 comparison against a
value shipped in the client bundle — has been removed. §17 covers creating an
admin.

The login screen's 3-attempt / 60-second lockout is React state and resets on
refresh; server-side rate limiting is still outstanding (**P1-4**).

### Share-link authentication

`/report/[token]` authenticates a recipient by bearer token alone (plus an
access code when `share_require_access_code` is on). The token is looked up by
SHA-256 hash, so a database dump yields no working links, and expiry, revocation
and per-recipient scoping bound the blast radius. Anyone holding a live URL can
read that report — inherent to emailed links, and the reason every access is
audited.

`/auth/reset/[token]` and `/api/applications/[token]` work the same way: the
token is the credential, it is stored hashed or single-use, and failures return
one neutral message so a token cannot be probed for validity.

---

## 11. Client Journey Stages

The client journey is a 10-stage pipeline tracked in `client.journeyStage`. Each stage advance records a timestamp in `client.journeyDates[stage]`.

| # | Stage Key | Label | How Triggered |
|---|---|---|---|
| 1 | `account_created` | Account Created | `createClient()` — on registration |
| 2 | `tc_accepted` | T&Cs Accepted | `advanceClientJourney(id, 'tc_accepted')` — client accepts T&C |
| 3 | `acknowledged` | Acknowledged | `advanceClientJourney(id, 'acknowledged')` — admin acknowledges client |
| 4 | `call_made` | Call Made | Admin action in dashboard — "📞 Log Call" |
| 5 | `visit_scheduled` | Visit Scheduled | Admin action — "📅 Schedule Visit" (sets `visitDate`) |
| 6 | `visit_done` | Visit Completed | Admin action after visit occurs |
| 7 | `hca_matched` | HCA Matched | Admin action — "🤝 Match HCA" (sets `assignedHcaId`) |
| 8 | `payment_pending` | Payment Pending | On invoice creation or advance |
| 9 | `payment_confirmed` | Payment Confirmed | `approveInvoicePayment()` in finance |
| 10 | `placement_active` | Placement Active | Final placement confirmation |

---

## 12. RBAC System

> **Status:** designed and configurable, **not enforced**. `hasPermission()` is
> exported from `lib/store.js` and called from nowhere; rules created under
> Admin → RBAC are stored, listed, and ignored, so every admin who can reach the
> dashboard sees every tab. What *is* enforced is coarser and server-side: the
> role in the session cookie (an HCA cannot reach an admin route at all), and
> `admin_users.can_read_welfare_notes`, checked in `/api/cardex/admin`. Making
> these keys real is **P1-1**.

### Roles

| Role Key | Label | Default Permissions |
|---|---|---|
| `super_admin` | Super Admin | `['all']` — full access |
| `finance_admin` | Finance Admin | `['finance', 'overview']` |
| `client_coordinator` | Client Coordinator | `['clients', 'calendar', 'overview']` |
| `hca_manager` | HCA Account Manager | `['hcas', 'calendar', 'overview']` |
| `hr_admin` | HR / Training Admin | `['training', 'calendar', 'hcas', 'overview']` |

### Permission Keys

| Key | Scope |
|---|---|
| `overview` | Overview / Dashboard tab |
| `hcas` | HCA management tab |
| `clients` | Client management tab |
| `quality` | Care Quality / Cardex QA tab |
| `training` | Training management tab |
| `calendar` | Calendar / HR tab |
| `finance` | Finance tab |
| `settings` | Settings / RBAC tab |

### Permission Check

```javascript
hasPermission(roleOrPerms, perm)
// roleOrPerms: a role key string OR permissions[] array
// Returns true if:
//   - permissions includes 'all' (super_admin)
//   - OR permissions includes the specific perm key
```

### RBAC Storage

Rules are stored in the Supabase `rbac_rules` table with `user_id` as primary key:
```json
{
  "user_id": "coordinator@evive.co.ke",
  "role": "client_coordinator",
  "permissions": ["clients", "calendar", "overview"],
  "updated_at": "2026-05-27T..."
}
```

---

## 13. Pricing & Rates

### Service Rates (DEFAULT_PRICING)

Configurable via Admin Dashboard → Pricing & Offers tab. Stored in Supabase `pricing_config` table (id=1). Falls back to `DEFAULT_PRICING` if no row exists.

| Rate Key | Service | Default (KES) |
|---|---|---|
| `day_shift` | Day Shift (8 hours) | 2,000 |
| `night_shift` | Night Shift (12 hours) | 2,000 |
| `live_in` | Live-In Care (monthly) | 35,000 |
| `per_hour` | Per Hour Rate | 300 |
| `assessment` | Assessment Fee (one-time) | 3,500 |
| `emergency` | Emergency Call-Out | 6,000 |

### HCA Subscription Plans

| Plan | Price | Key Features |
|---|---|---|
| Basic | KSh 75/month | 1 active placement, search listing, email support |
| Professional ★ | KSh 100/month | 3 placements, priority listing, certificate badges, WhatsApp support, training |
| Premium | KSh 150/month | Unlimited placements, top-of-search, verified badge, dedicated manager, international |

### Discount Codes

Managed via Admin Dashboard → Pricing & Offers. Stored in Supabase `discount_codes` table. Two code types:
- **Percent** — e.g. `WELCOME20` for 20% off
- **Fixed** — e.g. `KES500OFF` for KES 500 off

Optional: minimum spend threshold, expiry date.  
Codes are stored uppercase, no spaces. Duplicate codes rejected (PostgreSQL unique constraint).

---

## 14. Security Configuration

### HTTP Security Headers (`vercel.json`)

Applied to all routes `/(.*)`

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking via iframes |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter (browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer header leakage |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=()` | Restrict browser features |
| `Content-Security-Policy` | See below | Restrict resource origins |

### Content-Security-Policy Breakdown

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://unpkg.com;
style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://*.tile.openstreetmap.org;
connect-src 'self';
worker-src blob:;
frame-ancestors 'none';
```

| Directive | Allows |
|---|---|
| `script-src` | Self + inline (Next.js requires `unsafe-inline`) + unpkg (Leaflet) |
| `style-src` | Self + inline styles + unpkg (Leaflet CSS) + Google Fonts |
| `font-src` | Self + Google Fonts CDN |
| `img-src` | Self + data URLs (base64 cert previews) + blobs + OpenStreetMap tiles |
| `frame-ancestors 'none'` | Prevents embedding in any iframe (equivalent to X-Frame-Options: DENY) |

> **Note:** The CSP `connect-src 'self'` directive does not yet include Supabase endpoints. If Supabase API calls are blocked by a strict CSP enforcement environment, add the Supabase project URL to `connect-src`.

### Admin Page Search Engine Exclusion

All three admin pages include:
```html
<meta name="robots" content="noindex,nofollow" />
```

### Admin Authentication Security

- Admins are `admin_users` rows with scrypt hashes, verified server-side, issuing a signed HttpOnly cookie
- Every admin page verifies that cookie with `/api/auth/session` before rendering, and returns `null` until it does — no flash of protected content, and a forged localStorage entry opens nothing
- Sign-out clears the cookie (`/api/auth/logout`) as well as the display copy
- The browser-side SHA-256 fallback is removed
- **Remaining weak point:** the 3-attempt lockout is browser state that resets on refresh; there is no server-side rate limit (**P1-4**)

### Known Limitations

The August review's six P0 blockers are closed. What remains, ordered by
severity, with the task each maps to in
[Still outstanding](#still-outstanding).

| Issue | Impact | Resolution |
|---|---|---|
| Admin reads are not permission-gated | A finance admin can read client and HCA rows through the gateway, though not change them, and not read Cardex or welfare notes. A deliberate trade: nearly every screen composes across tables | Revisit if the admin team grows past the point where everyone is trusted with the operational picture |
| Next.js advisories unresolved | No patched release exists in the 14.2 line; clearing them needs a major-major upgrade | **P2-1** — see [Still outstanding](#still-outstanding) |
| The rate limiter fails open | If its own table is missing or errors, requests proceed and a warning is logged. A limiter that takes the site down when its storage hiccups is worse than the attack it prevents — but absent protection is worse still, hence the log line | By design; watch for the warning |
| `unsafe-inline` in CSP | Weakens XSS protection | Pages Router + inline CSS-in-JS; nonce support needs an App Router migration (**P2-6**) |
| Share links are bearer tokens | Anyone holding a live URL (and code, when required) can read that report until expiry or revocation | Inherent to emailed links; bounded by expiry, revocation, per-recipient tokens and the audit log |
| The gateway has not been exercised against a live database | The policy is unit-tested and the build is clean, but no query in this release has run against real Postgres | Run the smoke checks in §17 against staging before promoting |

## 15. Demo & Seed Data

**There is none, deliberately.**

`seedDemoDataIfEmpty()` used to live in `lib/store.js`. It created a client and
an HCA whose credentials were published in this repository, and it was called
from no page. It has been deleted rather than left dormant: a function that
writes known-password accounts into whatever database it is pointed at is not
worth keeping for convenience, and it had already stopped working when approval
moved server-side.

To demonstrate the platform, use the real flows — register a client at
`/client/register`, apply at `/hca/apply`, approve from Admin → HCA Management.
That also exercises the paths a real user takes, which a seed script never does.

If a previous deployment was seeded, check for and remove the old demo rows
(`demo@client.com`, `grace@hca.com`) before going live.

---

## 16. Static Assets

All assets are served from the `/public` directory.

### Icons

| File | Use |
|---|---|
| `favicon.ico` | 32×32 tab icon for browsers that want an `.ico` |
| `favicon.svg` | Scalable tab icon; preferred by modern browsers, and also the apple-touch-icon |

Both are referenced from `pages/_app.jsx`, so every route carries them.

### Generated files

`robots.txt` and `sitemap.xml` are written by `scripts/generate-seo-files.js`,
which runs as `prebuild`, so they always carry the `NEXT_PUBLIC_SITE_URL` of the
deployment being built rather than a hardcoded origin. Everything behind a
sign-in or a token is disallowed — a reset link or a shared care summary in a
search index would be a disclosure — with `/hca/apply` carved back out, since
the application form is a public recruitment page. Edit the script, not the
output.

### Images

#### Hero Photos (`/images/`)
| File | Usage |
|---|---|
| `hero-photo-1.jpg` | Hero background (assistants, caregivers, partners pages); team photo with Salome prominent |
| `hero-photo-2.jpg` | Hero background second layer (same team photo, CSS mask fade) |
| `hero-hca-elder.png` | About page hero — HCA with elderly man (foreground image) |
| `hero-group-care.png` | 5-person care scene — HCA login page hero panel, caregivers page |

#### Scene Photos (`/images/scenes/`)
| File | Usage |
|---|---|
| `hero-home.png` | Home page hero — HCA with patient in living room |
| `nursing-assistants.png` | About page hero panel group photo — outdoor team shot, Salome front-left |
| `founder-story.png` | About page founder story section — HCA at bedside portrait |
| `how-it-works-families.svg` | Home page "How It Works" tab |

#### HCA Portrait SVGs (`/images/portraits/`)
18 HCA portraits used in the `/match` page and HCA dashboard:

| File | Character |
|---|---|
| `hca-amina-njeri.svg` | Amina Njeri |
| `hca-agnes-ndungu.svg` | Agnes Ndungu |
| `hca-david-barasa.svg` | David Barasa |
| `hca-esther-kariuki.svg` | Esther Kariuki |
| `hca-faith-wanjiku.svg` | Faith Wanjiku |
| `hca-grace-otieno.svg` | Grace Otieno |
| `hca-hassan-abdalla.svg` | Hassan Abdalla |
| `hca-jane-njambi.svg` | Jane Njambi |
| `hca-john-omondi.svg` | John Omondi |
| `hca-kelvin-rop.svg` | Kelvin Rop |
| `hca-lillian-waweru.svg` | Lillian Waweru |
| `hca-mary-chebet.svg` | Mary Chebet |
| `hca-michael-oduya.svg` | Michael Oduya |
| `hca-peter-mutua.svg` | Peter Mutua |
| `hca-priya-mehta.svg` | Priya Mehta |
| `hca-rose-adhiambo.svg` | Rose Adhiambo |
| `hca-samuel-kamau.svg` | Samuel Kamau |
| `hca-sylvia-achieng.svg` | Sylvia Achieng |

#### Counsellor Portraits (`/images/portraits/`)
4 counsellors used on the `/caregivers` page:

| File | Character |
|---|---|
| `counsellor-james-otieno.svg` | James Otieno — Grief & Loss Counsellor |
| `counsellor-peter-mwangi.svg` | Peter Mwangi — Palliative Care Specialist |
| `counsellor-rose-mutua.svg` | Rose Mutua — Caregiver Wellness Coach |
| `counsellor-sarah-kamau.svg` | Sarah Kamau — Family Therapist |

#### Team Portraits (`/images/portraits/`)
2 active team members used in `/about` page:

| File | Character |
|---|---|
| `team-salome-mburu.jpg` | Salome Mburu — Founder & CEO (LinkedIn photo) |
| `team-kamau-maina.svg` | Pablo Wyne — Director of Technology |

### Scripts

`/scripts/generate-portraits.js` — Node.js script that generates all SVG portrait files  
`/scripts/generate-scenes.js` — Node.js script that generates all SVG scene illustrations

---

## 17. Development Guide

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A Supabase project with the required tables created

### Environment Setup

Create a `.env.local` file in the project root. The first four are required —
without `SESSION_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` every Cardex screen
returns 503:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vwwdmzdknmdsiowmjkzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key    # server-only, never NEXT_PUBLIC_
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

NEXT_PUBLIC_SITE_URL=https://e-vive.vercel.app     # required in production
RESEND_API_KEY=re_your_key_here                    # optional
EMAIL_FROM=E-Vive Kenya <hello@e-vive.co.ke>       # optional
RESEND_WEBHOOK_SECRET=whsec_...                    # optional, strongly recommended

MPESA_CONSUMER_KEY=...                             # required for payments
MPESA_CONSUMER_SECRET=...
MPESA_PASSKEY=...
MPESA_SHORTCODE=4165689
MPESA_ENV=sandbox                                  # set to production before launch
```

See §2 for the full table. `.env.local.example` is currently incomplete
(**P1-1**).

### Getting Started

```bash
git clone https://github.com/mafichoni/e-vive.git
cd e-vive
npm install
npm test          # 71 unit tests, all should pass
npm run dev
```

Open http://localhost:3000

Apply `supabase/migrations/*.sql` in filename order in the Supabase SQL editor
before first run. `0009` and `0010` additionally require
`SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET`, and must be applied *after*
the matching code is deployed — `0010` revokes the public anon key's access to
every table. See §9.5.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 (hot reload) |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint across all pages, components, and lib |
| `npm test` | Run the unit suite — `node --test lib/*.test.mjs` (71 tests) |
| `npm run test:tz` | Same suite under `TZ=Africa/Nairobi`, which is how the scheduling date bugs were caught |

### Adding a Table, or Widening What a Role May See

Data access is declared in `lib/dbPolicy.js` and enforced by `/api/db` (§9.6).
A table with no entry there is unreachable from the browser, which is the
intended default.

1. Add the table to the `POLICY` object with an entry per role that needs it.
   Name the columns explicitly — `select: ALL` is for Admin only.
2. Give it a `scope` if rows belong to someone. `selfId`, `byClient` and `byHca`
   cover most cases; a scope may also be async and resolve ids with a query of
   its own, as `clientsLinkedToHca` does.
3. For writes, list the columns the role may set. Use `force` to pin values the
   caller must not choose (status, ownership) and `forceFromSession` to stamp
   the owner from the cookie.
4. If the role cannot read the table but the write needs to confirm, add
   `returning: ['id']` rather than opening `select`.
5. Add the new access to `CALL_SITES` in `lib/dbPolicy.test.mjs`. That test
   fails if a page uses a table the policy denies, which is much easier to
   diagnose than an empty screen in production.
6. Enable RLS on the table in a new migration. Never add an `anon` policy.

If the operation authenticates itself rather than a role — an emailed link, a
share token, a webhook — write a route for it instead, as
`/api/applications/[token]` and `/api/report/[token]` do.

### Creating and Changing Admin Accounts

**The supported way — an `admin_users` row.** Generate a scrypt hash with the
project's own primitive, then insert the row:

```bash
node -e "import('./lib/serverAuth.js').then(m => console.log(m.hashPassword('YourNewSecurePassword')))"
```

```sql
insert into public.admin_users (email, name, password_hash, role, can_read_welfare_notes)
values ('you@e-vive.co.ke', 'Your Name', 'scrypt$16384$8$1$…', 'super_admin', false);
```

`can_read_welfare_notes` is deliberately separate and off by default: a welfare
note is a worker's confidential account of their own working conditions, not
care-quality data. Grant it explicitly, to named people.

**There is no other path.** The `NEXT_PUBLIC_ADMIN_EMAIL` /
`NEXT_PUBLIC_ADMIN_HASH` fallback has been removed: it compared a SHA-256 hash
shipped in the client bundle, which is neither a password hash nor a server-side
check. Delete both variables from your deployment. Without an `admin_users` row,
nobody can sign in to the admin portal.

### Adding a New Public Page

1. Create `pages/your-page.jsx`
2. Import shared components:
   ```jsx
   import Nav from "../components/Nav";
   import Footer from "../components/Footer";
   import { FONTS, BASE_CSS } from "../components/SharedStyles";
   ```
3. Use the standard page shell:
   ```jsx
   export default function YourPage() {
     const CSS = `/* page-specific styles */`;
     return (
       <>
         <Head>
           <title>Page Title — E-Vive</title>
           <style>{FONTS + BASE_CSS + CSS}</style>
         </Head>
         <Nav />
         {/* page content */}
         <Footer />
       </>
     );
   }
   ```

### Adding a New Admin Tab

1. Add a nav entry to the `NAV` array in `pages/admin/dashboard.jsx`:
   ```javascript
   { icon: "🔧", label: "My New Tab", key: "my_tab" }
   ```
2. Add CSS to the `CSS` string
3. Add state variables in `AdminDashboard()`
4. Add data loading in the `refresh()` callback
5. Add the JSX section in the main render, gated with:
   ```jsx
   {tab === "my_tab" && (
     <section className="panel">
       {/* content */}
     </section>
   )}
   ```

### Adding a New Supabase Domain

In `lib/store.js`:

1. Add a row mapper function:
   ```javascript
   function myDomainFromDb(r) {
     if (!r) return null;
     return { id: r.id, /* ... camelCase fields */ createdAt: r.created_at };
   }
   ```
2. Define the CRUD functions:
   ```javascript
   export async function getAll() {
     const { data } = await supabase.from('my_table').select('*').order('created_at', { ascending: false });
     return (data || []).map(myDomainFromDb);
   }
   export async function create(data) {
     const { data: row, error } = await supabase.from('my_table').insert({ /* ... */ }).select().single();
     if (error) throw new Error(error.message);
     return myDomainFromDb(row);
   }
   ```

### Linting

The project uses `eslint-config-next`. Known suppressions used throughout:

```jsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src="..." alt="..." />
```

Used for: decorative hero photos, dynamic avatar images, and base64 certificate previews — all cases where `next/image` is not appropriate (data URLs, dynamic sources).

```javascript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

Used in:
- `pages/admin/map.jsx` — Leaflet map init `useEffect` intentionally runs once only
- Auth guard `useEffect` hooks — empty dependency array is intentional

### Deployment

Push to `main` branch → Vercel auto-deploys within ~2 minutes.

Branch deployments (preview URLs) are created automatically for all branches by Vercel.

Production URL: **https://e-vive.vercel.app**

**Pre-launch deployment checklist**

Order matters for steps 1–2: `0010` revokes the anon key's access to every
table, so the code that no longer needs it must be live first.

1. `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` set in Vercel (Production **and** Preview)
2. Deploy the code, **then** apply all ten migrations in filename order
3. At least one `admin_users` row created; `NEXT_PUBLIC_ADMIN_*` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` removed
4. `MPESA_ENV=production` with live Daraja credentials, `MPESA_CALLBACK_SECRET` set, and the callback URL — including its `?k=` secret — registered against the production shortcode
5. `CRON_SECRET` set, or digests and retention purges never run (the endpoints fail closed)
6. The private `hca-documents` Storage bucket created, or uploads keep falling back to inline base64
7. `GET /api/health` returns 200 — it returns 503 while the session secret, service role or database is missing
8. `RESEND_API_KEY` set, sender domain verified, `RESEND_WEBHOOK_SECRET` configured
9. No demo rows (`demo@client.com`, `grace@hca.com`) in the production database
10. `npm run build`, `npm run lint` and `npm test` green on the release commit

**Post-deploy smoke checks.** The gateway has not been exercised against a live
database; run these against staging before promoting:

| Check | Expected |
|---|---|
| `/match` while signed out | HCA cards load. In the network tab, the `/api/db` response carries no `email`, `mobile`, `dob` or `password` |
| Sign in as a client, then **sign in again** | Both succeed — this is the scrypt-upgrade lockout that used to break the second attempt |
| Client dashboard | Invoices, shifts, placements and notifications load; care team photos appear |
| Devtools: `localStorage.setItem('evive_admin_session', '{"id":"x"}')`, then open `/admin/dashboard` | Redirected to `/admin/login` |
| HCA dashboard | Own profile, shifts and Cardex load; the client list shows only placed families |
| Forgot password, as client and as HCA | A link arrives; it works once and is dead on reuse |
| Submit the contact form and an HCA application signed out | Both save; both appear in Admin → Messages / Applications |
| M-Pesa sandbox payment | `payments` row completes, invoice flips to paid, receipt email sent |
| `GET /api/health` | 200 with every check true |
| Sign in as a non-super admin | Only their permitted tabs appear; `/admin/finance` redirects without the `finance` permission |
| Eight wrong passwords in a row | The ninth is refused with 429 and a `Retry-After`, and stays refused from a different browser on the same connection |
| Submit a Cardex with an incident | The family gets an in-app notification and an email that names no clinical detail |
| Clock in from the client's address, then from elsewhere | The first is accepted and `clock_in_verified` is true; the second is refused with the distance |
| Upload a certificate on `/hca/apply` | A `filePath` is stored, not base64 — and it still renders in Admin |
| `GET /api/cron/purge` with the wrong secret | 401 |

---

*Documentation updated August 2026, after the review, after closing the six P0 blockers it found, and after clearing every P1 and four of six P2s — E-Vive Homecare · by E-Vive Wellness Initiative · Nairobi, Kenya*
