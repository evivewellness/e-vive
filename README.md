# E-Vive Platform — Technical Documentation

> **Version:** Current as of August 2026  
> **Live URL:** https://e-vive.vercel.app  
> **Repository:** https://github.com/mafichoni/e-vive  
> **Branch:** `main`  
> **Launch status:** Pre-launch. The build is green and the Cardex data path is
> secured end-to-end; six **P0 blockers** remain open. Start at
> [Implementation Status](#implementation-status--august-2026-review).

---

## Table of Contents

- **[Implementation Status & Pending Work — August 2026 review](#implementation-status--august-2026-review)** ← read this first

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
10. [Authentication Systems](#10-authentication-systems)
11. [Client Journey Stages](#11-client-journey-stages)
12. [RBAC System](#12-rbac-system)
13. [Pricing & Rates](#13-pricing--rates)
14. [Security Configuration](#14-security-configuration)
15. [Demo & Seed Data](#15-demo--seed-data)
16. [Static Assets](#16-static-assets)
17. [Development Guide](#17-development-guide)

---

## Implementation Status — August 2026 Review

This section is the outcome of a full read of the current implementation (all
36 pages and API routes, `lib/`, `components/`, the nine SQL migrations) plus a
clean `npm install && npm run build && npm run lint && npm test` against this
commit. Everything below §1 is reference documentation; this section is the
honest state of the build.

### Verified working

| Area | State |
|---|---|
| Build | `next build` succeeds — 36 routes, 80 kB shared JS, no errors |
| Lint | `next lint` clean, 2 `no-img-element` warnings (`client/register.jsx:335`, `contact.jsx:250`) |
| Tests | `npm test` — 71/71 pass (`lib/scheduling`, `lib/cardexAccess`, `lib/cardexSummary`) |
| Cardex data path | Fully server-side. Identity comes from an HMAC-signed HttpOnly cookie, queries use the service-role key with an explicit column list, RLS denies the anon key outright (migration `0009`). See `docs/cardex-security.md` |
| Cardex sharing | Per-recipient revocable tokens (hash stored, not the token), optional access code, expiry, per-hour and per-recipient limits, recorded consent + written justification, and an audit row for every success *and* every distinct failure |
| Placement scheduling | Conflict-safe, timezone-correct, covered by 71 unit tests including 24/7 day+night coverage and non-overlapping reassignment |
| Email | Live via Resend, with a Svix-verified webhook reconciling sent/delivered/bounced/complained/opened/clicked back onto the `emails` row |
| Passwords | scrypt (`node:crypto`), salted per user, with transparent upgrade of legacy plaintext rows on next login |
| Security headers | HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy set in `vercel.json` |

### Pending Work — Prioritised for Launch

Priorities are ordered by launch risk, not by effort. **P0 items must be closed
before the platform is opened to real families and real HCAs**; each one either
exposes personal health or payment data, or breaks a flow a real user will hit
on day one.

#### P0 — Launch blockers

**P0-1 · Make the signed session the only proof of admin identity**

`pages/admin/dashboard.jsx:2048` (and the same guard in `admin/finance.jsx` and
`admin/map.jsx`) admits anyone whose browser has
`localStorage.evive_admin_session` set — a single devtools line. Because most
tables are still anon-readable (P0-3), that grants read/write access to every
client, HCA, invoice and payroll record. `pages/admin/login.jsx:119` also keeps
a fallback that compares a SHA-256 hash shipped in the client bundle
(`NEXT_PUBLIC_ADMIN_HASH`); SHA-256 is not a password hash and a browser-side
comparison gates nothing.

*Close it by:* creating the `admin_users` row that migration `0009` provides,
deleting the SHA-256 fallback along with `NEXT_PUBLIC_ADMIN_EMAIL` /
`NEXT_PUBLIC_ADMIN_HASH`, and having every admin page verify against
`/api/auth/session` before it renders.

**P0-2 · Move client and HCA sign-in fully server-side — second logins currently fail**

`pages/hca/login.jsx:213` and `pages/client/register.jsx:197` still compare the
password *in the browser* against a row fetched with the public anon key, then
call `/api/auth/login` fire-and-forget (`.catch(() => {})`). Two consequences:

- `/api/auth/login` upgrades a legacy plaintext row to scrypt on first success
  (`pages/api/auth/login.js:58`). From then on the stored value is `scrypt$…`,
  so the browser's `profile.password !== form.password` check can never match
  again — **every user is locked out on their second login**.
- `if (profile.password && …)` at `pages/hca/login.jsx:225` lets an HCA row with
  an empty password sign in with *any* password.

*Close it by:* deleting both browser-side comparisons and making
`/api/auth/login` the only sign-in path, with its result — not localStorage —
driving the redirect.

**P0-3 · Extend Row Level Security past the Cardex tables**

Migration `0009` §6 locks seven tables. The other twenty-three that
`lib/store.js` touches — `clients`, `hca_profiles`, `invoices`,
`payroll_payments`, `placements`, `shifts`, `emails`, `hca_applications` and the
rest — are still read *and written* straight from the browser with the public
anon key. `getAllHcaProfiles()` (`lib/store.js:703`, selecting `HCA_PROFILE_LIST_COLUMNS` at `:701`) pulls the `password` column
into the browser on every `/hca/login` and `/match` load.

*Close it by:* routing those reads and writes through API routes that derive
identity from the session cookie (the `/api/cardex/*` routes are the pattern),
then enabling default-deny RLS on each table in a `0010` migration.

**P0-4 · Build a real password reset**

`pages/client/register.jsx:247` generates the six-digit code in the browser,
holds it in React state, and never sends it anywhere — the screen says "a reset
code has been sent" and none was. The account lookup searches only
`localStorage.evive_client_registry`, so a user resetting from a new device is
told "No account found", while anyone with devtools open can complete the flow
for any account present in that device's local registry. HCAs have no reset path
at all; their initial password is emailed once at approval
(`lib/store.js:1681`).

*Close it by:* a server-side flow — single-use hashed token, short expiry,
delivered by Resend, redeemed through an API route that writes a scrypt hash.
`lib/serverAuth.js` already has `generateShareToken` / `hashShareToken` to
build on.

**P0-5 · Persist and reconcile M-Pesa payments**

`pages/api/mpesa/callback.js:42` logs a confirmed payment and drops it —
`// TODO: persist record to Supabase`. `pages/client/dashboard.jsx:532` already
offers families the STK push, so money can move while the invoice stays unpaid
forever and the only trace is a serverless function log. The callback also
accepts any POST: nothing checks the request came from Safaricom.

*Close it by:* a `payments` table, correlation on `CheckoutRequestID` and
`AccountReference` → invoice, an invoice status transition plus the existing
`sendPaymentConfirmedNotification`, and callback authenticity (Safaricom source
IP allowlist or an unguessable callback path).

**P0-6 · Give the public pages a `<Head>`**

Eight of the ten public pages — `/about`, `/contact`, `/caregivers`,
`/assistants`, `/products`, `/partners`, `/privacy`, `/terms` — render no
`<Head>` at all: no `<title>`, no meta description, and no
`<meta name="viewport">`. Without the viewport tag a mobile browser lays the
page out at desktop width and zooms out, so a majority-mobile Kenyan audience
meets a broken page everywhere except `/` and `/match`. `/favicon.ico` is
referenced at `pages/index.jsx:289` but no such file exists in `public/`.

*Close it by:* a shared `<Head>` in `pages/_app.jsx` for viewport and defaults,
per-page title and description, and a real favicon.

#### P1 — Close before launch day

| # | Task | Why it matters |
|---|---|---|
| **P1-1** | Complete `.env.local.example` and set every variable in Vercel | The file documents 4 of the 16 variables the code reads. Without `SESSION_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` every Cardex route answers 503 (`lib/supabaseAdmin.js:42`) and the flagship feature is silently dark. Without `NEXT_PUBLIC_SITE_URL`, share links are built from the `Host` header (`pages/api/cardex/share.js:160`). See §2 for the full table |
| **P1-2** | Enforce RBAC, or remove the screen | `hasPermission()` (`lib/store.js:1706`) is never called anywhere in the app. Rules created under Admin → RBAC are stored and displayed but gate nothing. The only permission actually enforced is `can_read_welfare_notes`, server-side |
| **P1-3** | Deliver the Cardex notifications families opted into | `/api/cardex/notify-prefs` writes `cardex_notify_prefs` and nothing reads it: no incident alert and no daily/weekly/monthly digest is ever sent. Incident alerts default **on**, so this is a promise currently unkept |
| **P1-4** | Schedule the retention purge | `purge_expired_cardex_data()` exists and Admin → Settings can run it by hand (`pages/api/settings.js`, `PUT`), but nothing runs it on a schedule. The retention periods in `platform_settings` are a data-protection commitment; wire pg_cron or a Vercel cron job |
| **P1-5** | Rate-limit login, HCA application, contact and partner forms | There is no server-side throttling anywhere. The admin login's 3-attempt lockout is browser state and resets on refresh. Application uploads accept 10 MB, unauthenticated |
| **P1-6** | Verify clock-in location, or stop calling it verified | `clockInHca()` (`lib/store.js:1218`) records `lat`/`lng` but never compares them to the placement address. §1 advertises "GPS-verified clock-in/out" — add the geofence or soften the claim |
| **P1-7** | Move certificate and photo uploads to Supabase Storage | Files are base64 inside `hca_applications.form_data`. This already caused a live statement timeout; the fix was to skip the column in list queries (`lib/store.js:452`), which is mitigation, not a cure |
| **P1-8** | Remove leftover demo copy | `pages/client/dashboard.jsx:513` still tells families "In a live deployment, this email would be delivered…" although Resend delivery is live |
| **P1-9** | Settle the demo-data story | `seedDemoDataIfEmpty()` (`lib/store.js:2095`) is exported but no page calls it, so §15's automatic seeding no longer happens. Confirm the published demo credentials (`demo@client.com` / `demo1234`) exist in no production database |

#### P2 — First weeks after launch

| # | Task | Detail |
|---|---|---|
| **P2-1** | Dependency advisories | `npm audit --omit=dev` reports 3 high: `next@14.2.35` and `nanoid ≤3.3.17`. Most of the listed Next.js CVEs target App Router, Server Components or self-hosted image optimisation — none of which this Pages-Router-on-Vercel app uses — but pin a patched release and re-audit |
| **P2-2** | Test coverage | 71 tests, all green, covering three `lib` modules. Nothing covers `lib/store.js`, the API routes, auth, or any page. Highest value next: `/api/auth/login`, `/api/cardex/*`, and one end-to-end pass per persona |
| **P2-3** | Observability | No error tracking, no structured request logging, no uptime check, no analytics. A failed payment or a 503 from a Cardex route is invisible until a user reports it |
| **P2-4** | Search and social | No `robots.txt`, no `sitemap.xml`, no Open Graph or Twitter card tags, no favicon (see P0-6) |
| **P2-5** | Accessibility and legal polish | No accessibility audit has been run. The footer's social buttons and its Accessibility and Cookies links all point to `#` (`components/Footer.jsx`). `/privacy` should carry the Kenya Data Protection Act 2019 specifics — registration, DPO contact, cookie notice |
| **P2-6** | Documentation hygiene | `DOCUMENTATION.md` is a stale May 2026 copy of this file. Delete it or reduce it to a pointer |
| **P2-7** | Maintainability | `pages/admin/dashboard.jsx` is 4,037 lines; splitting each tab into a component makes it reviewable. CSP still needs `'unsafe-inline'` because every page ships its styles as an inline string |

#### P3 — Deliberately deferred

Not blockers; listed so they are not mistaken for oversights.

- **Homecare products marketplace** (`/products`) — waitlist only, by design
- **Community & support groups** (`/caregivers`) — held until moderation exists (`pages/caregivers.jsx:765`)
- **PDF generation** — shared reports print via the browser; a PDF dependency was deliberately not added (`pages/report/[token].jsx:15`)
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
- **Session tokens only** are stored in browser localStorage (`evive_client_session`, `evive_hca_session`, `evive_admin_session`)
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

The code reads sixteen variables. `.env.local.example` currently documents four
of them — completing it is **P1-1**.

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | **Yes** |
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
| `NEXT_PUBLIC_ADMIN_EMAIL` | Legacy browser-side admin login email | Deprecated — remove once an `admin_users` row exists (**P0-1**) |
| `NEXT_PUBLIC_ADMIN_HASH` | Legacy SHA-256 hex of admin password, shipped in the client bundle | Deprecated — remove (**P0-1**) |
| `NODE_ENV` | Set by Next.js; gates the `Secure` flag on session cookies | Automatic |

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
| `GET /api/auth/session` | `api/auth/session.js` | Cookie | Lets the browser discover who the server thinks it is. Never itself an authorisation decision |
| `GET/POST /api/cardex/reports` | `api/cardex/reports.js` | Client | The only client-facing Cardex read path. `client_id` comes from the cookie; `welfare_note`, `shift_rating`, `qa_comments` and `flagged` are never selected, then redacted again before serialising |
| `GET/POST /api/cardex/hca` | `api/cardex/hca.js` | HCA | An HCA's own entries — read history, submit a new one. Scoped to their own `hca_id` |
| `GET/POST /api/cardex/admin` | `api/cardex/admin.js` | Admin | Full QA review list and QA comments. Welfare notes only when the admin row has `can_read_welfare_notes` |
| `GET/POST /api/cardex/notify-prefs` | `api/cardex/notify-prefs.js` | Client | Per-patient notification preferences. **Stored but not yet acted on — P1-3** |
| `GET/POST/DELETE /api/cardex/share` | `api/cardex/share.js` | Client | Create, list and revoke outward shares. Enforces per-hour, per-recipient, justification-length and expiry limits from `platform_settings`; stores only the token hash; emails each recipient a link and nothing else |
| `GET /api/report/[token]` | `api/report/[token].js` | Share token | Token-gated care summary, assembled server-side. Every outcome — success and each distinct failure — is audited; failures return one neutral message so a token cannot be probed |
| `GET/POST/PUT /api/settings` | `api/settings.js` | Admin | Retention, consent ownership and sharing defaults. `PUT` runs `purge_expired_cardex_data()` on demand |
| `POST /api/mpesa/stkpush` | `api/mpesa/stkpush.js` | None | Daraja OAuth + STK Push. Normalises the phone number to `2547…`/`2541…`; returns 503 when credentials are absent |
| `POST /api/mpesa/callback` | `api/mpesa/callback.js` | None (public, by Safaricom's requirement) | STK Push result receiver. **Currently logs and discards the payment — P0-5** |
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
| `/404` | Next.js default | None | 404 error page |

> **Note:** All routes have a trailing slash due to `trailingSlash: true`. The canonical URL for the home page is `https://e-vive.vercel.app/`.
>
> **Gap:** only `/` and `/match` render a `<Head>`. The other eight public pages
> have no `<title>`, no meta description and — critically — no
> `<meta name="viewport">`, so they lay out at desktop width on phones. See **P0-6**.

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

> Of the 30 tables in use, only the seven listed under migration `0009`
> (`cardex_entries` plus the six above) have RLS enabled. The rest are still
> reachable with the public anon key from the browser — see **P0-3**.

**localStorage keys (session tokens only):**

| Key | Purpose |
|---|---|
| `evive_client_session` | Current active client session token |
| `evive_hca_session` | Current active HCA session token |
| `evive_admin_session` | Current active admin session token |
| `evive_client_registry` | Legacy auth lookup (maintained for backwards compat during transition) |
| `hca_auth`, `hca_id` | Flags the HCA dashboard guard reads |
| `evive_cardex_draft_*` | Per-shift Cardex draft autosave |

> The authoritative session is the HMAC-signed HttpOnly `evive_session` cookie
> (§10). These localStorage entries are still what the dashboards' own route
> guards check, which is why **P0-1** and **P0-2** are blockers: the API routes
> ignore them, but the pages do not.

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
| `seedDemoDataIfEmpty` | `async () → void` — checks if `clients` table is empty; only runs once; creates demo client, HCA profile, invoice, and calendar event in Supabase |

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

**1. Database migration** — the `emails` table doesn't exist until you create it. Run `supabase/migrations/0001_create_emails_table.sql` once in the Supabase SQL Editor for this project. It creates the table, indexes, and an RLS policy granting the `anon` role full access. That was written before migration `0009` introduced the service-role key; `emails` is one of the 23 tables still reachable with the public anon key, and tightening it is part of **P0-3**.

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

> `0009` **must** be paired with `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET`
> in the environment. Run it without deploying the matching code and the Cardex
> screens return empty; deploy without the variables and they return 503.

---

## 10. Authentication Systems

Authentication is **mid-migration**, and both halves are described here because
both are live in the current build.

### The server-side layer (authoritative)

`lib/serverAuth.js` and `pages/api/auth/*` are the real thing:

```
POST /api/auth/login  { role, identifier, password }
        ↓
service-role lookup in clients | hca_profiles | admin_users
  (email, mobile, or employee_id — whichever that role may sign in with)
        ↓
verifyPassword(password, stored, algo)     scrypt, constant-time
  · unknown account still pays a decoy comparison — no account enumeration
  · legacy plaintext verifies once, then upgrades to scrypt in place
        ↓
active === false or status === 'suspended' → 403
        ↓
createSessionToken({ role, id, name, email, … })   HMAC-SHA256, 12 h expiry
        ↓
Set-Cookie: evive_session=…; HttpOnly; SameSite=Lax; Path=/; Secure (prod)
```

Every protected API route re-derives identity from that cookie with
`getSession(req)` or `requireRole(req, role)`. Nothing accepts an id from the
query string, the body, or a header.

**Session payload:** `{ role, id, name, email, iat, exp }`, plus
`canReadWelfareNotes` for admins and `employeeId` for HCAs.

### The browser-side layer (legacy, still gating the pages)

The three dashboards still decide whether to render by reading localStorage:

| Page | Guard |
|---|---|
| `client/dashboard.jsx` | `getClientSession()` → `evive_client_session` |
| `hca/dashboard.jsx` | `localStorage.hca_auth` / `hca_id` |
| `admin/dashboard.jsx`, `admin/finance.jsx`, `admin/map.jsx` | `getAdminSession()` → `evive_admin_session` |

Those values are plain JSON that any visitor can write. They no longer grant
access to Cardex data — the API routes ignore them entirely — but they do decide
what the admin *page* renders, and the anon key still reaches most tables
directly. That is **P0-1** and **P0-3**.

Sign-in pages likewise still compare passwords in the browser *before* calling
`/api/auth/login`, which is **P0-2** — and, once the scrypt upgrade has run,
breaks the second login for every user.

### Admin authentication

Preferred path: an `admin_users` row, verified by `/api/auth/login` as above.

Fallback still present in `pages/admin/login.jsx:119`: `SHA-256(password)`
compared in browser code against `NEXT_PUBLIC_ADMIN_HASH`. SHA-256 is not a
password hash, the value ships in the client bundle, and this path issues no
cookie — so it cannot reach `/api/cardex/admin` or `/api/settings` at all.
Create the `admin_users` row and delete it (**P0-1**).

The login screen's 3-attempt / 60-second lockout is React state and resets on
refresh; there is no server-side rate limiting (**P1-5**).

### Share-link authentication

`/report/[token]` authenticates a recipient by bearer token alone (plus an
access code when `share_require_access_code` is on). The token is looked up by
SHA-256 hash, so a database dump yields no working links, and expiry, revocation
and per-recipient scoping bound the blast radius. Anyone holding a live URL can
read that report — inherent to emailed links, and the reason every access is
audited.

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
> exported from `lib/store.js:1706` and called from nowhere in the application;
> rules created under Admin → RBAC are stored, listed, and ignored. Every admin
> who can reach the dashboard sees every tab. The single permission genuinely
> enforced is `admin_users.can_read_welfare_notes`, checked server-side in
> `/api/cardex/admin`. Closing this is **P1-2**.

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

- Preferred path: an `admin_users` row verified server-side, scrypt-hashed, issuing a signed HttpOnly cookie
- Admin pages return `null` (blank screen) while the auth check runs — no flash of protected content
- Session cleared on sign-out (`clearAdminSession()` + `/api/auth/logout`)
- **Weak points:** the page guard is still localStorage (**P0-1**); the legacy
  SHA-256 fallback compares a bundled hash in the browser (**P0-1**); the
  3-attempt lockout is browser state that resets on refresh (**P1-5**)

### Known Limitations

Ordered by severity. Every entry maps to a task in
[Pending Work](#pending-work--prioritised-for-launch).

| Issue | Impact | Resolution |
|---|---|---|
| Admin pages gate on localStorage | One devtools line renders the admin portal; combined with the row below, that is read/write access to every client, HCA, invoice and payroll record | **P0-1** — verify `/api/auth/session` server-side before rendering |
| RLS covers 7 tables of 30 | `clients`, `hca_profiles` (including its `password` column), `invoices`, `payroll_payments`, `shifts`, `placements` and `emails` are readable and writable with the public anon key | **P0-3** — route reads through API routes, then default-deny RLS |
| Sign-in compares passwords in the browser | Password material reaches the client bundle; and after the scrypt upgrade the comparison can never match, locking users out on their second login | **P0-2** — `/api/auth/login` as the only sign-in path |
| Password reset is simulated | The code is generated in the browser, never sent, and the lookup only reads that device's localStorage registry | **P0-4** — server-issued single-use hashed token |
| M-Pesa callback discards the result | A family can pay and the invoice stays open; the callback also accepts any POST | **P0-5** — persist, reconcile, and verify the caller |
| RBAC stored but never enforced | `hasPermission()` is never called; rules configured in the UI gate nothing | **P1-2** |
| No server-side rate limiting | Login, HCA application, contact and partner forms can be hammered or spammed | **P1-5** |
| Retention purge is manual | `purge_expired_cardex_data()` runs only when an admin presses the button | **P1-4** — pg_cron or a Vercel cron job |
| Clock-in GPS is recorded, not verified | No comparison against the placement address, though §1 says "GPS-verified" | **P1-6** |
| Uploads stored as base64 in Postgres | Certificates and photos bloat `hca_applications.form_data`; already caused a live statement timeout | **P1-7** — Supabase Storage |
| `unsafe-inline` in CSP | Weakens XSS protection | Pages Router + inline CSS-in-JS; nonce support needs an App Router migration (**P2-7**) |
| Share links are bearer tokens | Anyone holding a live URL (and code, when required) can read that report until expiry or revocation | Inherent to emailed links; bounded by expiry, revocation, per-recipient tokens and the audit log |

---

## 15. Demo & Seed Data

`seedDemoDataIfEmpty()` in `lib/store.js` populates Supabase with demo data when the `clients` table is empty. Safe to call multiple times (no-op if data exists).

> **Current state:** the function is exported but **no page calls it any more**,
> so nothing is seeded automatically. The credentials below are published in
> this repository — confirm they exist in no production database before launch
> (**P1-9**).

### Demo Client

| Field | Value |
|---|---|
| Name | Demo Client |
| Email | `demo@client.com` |
| Password | `demo1234` |
| Mobile | +254700000001 |
| Location | Nairobi |
| Address | Karen, Nairobi |
| Coordinates | lat: -1.3173, lng: 36.7069 (Karen, Nairobi) |

**Patient:** Margaret Wanjiku, age 74, Mother, conditions: Diabetes & Hypertension  
**Journey stage:** Progressed through `account_created` → `tc_accepted` → `acknowledged`

### Demo HCA

| Field | Value |
|---|---|
| Name | Grace Akinyi |
| Email | `grace@hca.com` |
| Password | `demo1234` |
| Mobile | +254711000001 |
| National ID | 12345678 |
| County | Nairobi |
| Cert Level | Certificate III |
| Experience | 4 years |
| Specialisations | Elderly Care, Dementia Care |
| Rate | KES 2,000/shift |
| Employee ID | HCA-1002 (auto-generated) |
| Coordinates | lat: -1.2708, lng: 36.8117 (Westlands) |

### Seeded Records

| Record Type | Details |
|---|---|
| Invoice | Onboarding & Assessment Fee — KES 3,500; due 7 days after seeding |
| Calendar Event | "Initial Assessment Visit – Demo Client"; date: 3 days after seeding; time: 10:00 |

### Resetting Demo Data

To clear all Supabase data and re-seed:
1. Truncate all tables via Supabase dashboard or SQL editor
2. Reload the application
3. Call `seedDemoDataIfEmpty()` — it will detect the empty `clients` table and re-seed

---

## 16. Static Assets

All assets are served from the `/public` directory.

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
before first run; `0009` additionally requires the two server-side variables
above. See §9.5.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 (hot reload) |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint across all pages, components, and lib |
| `npm test` | Run the unit suite — `node --test lib/*.test.mjs` (71 tests) |
| `npm run test:tz` | Same suite under `TZ=Africa/Nairobi`, which is how the scheduling date bugs were caught |

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

**The legacy path, being removed.** `NEXT_PUBLIC_ADMIN_EMAIL` /
`NEXT_PUBLIC_ADMIN_HASH` compare a SHA-256 hash in browser code. That hash ships
in the client bundle, SHA-256 is not a password hash, and the path issues no
session cookie — so it cannot reach `/api/cardex/admin` or `/api/settings`.
Delete both variables once a real row exists (**P0-1**).

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

1. All nine migrations applied, in order
2. `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` set in Vercel (Production **and** Preview)
3. At least one `admin_users` row created; `NEXT_PUBLIC_ADMIN_*` removed
4. `MPESA_ENV=production` with live Daraja credentials, and the callback URL registered against the production shortcode
5. `RESEND_API_KEY` set, sender domain verified, `RESEND_WEBHOOK_SECRET` configured
6. No demo rows (`demo@client.com`, `grace@hca.com`) in the production database
7. `npm run build`, `npm run lint` and `npm test` green on the release commit
8. All **P0** items closed

---

*Documentation updated August 2026 after a full implementation review — E-Vive Homecare · by E-Vive Wellness Initiative · Nairobi, Kenya*
