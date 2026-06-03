# E-Vive Platform — Technical Documentation

> **Version:** Current as of May 2026  
> **Live URL:** https://e-vive.vercel.app  
> **Repository:** https://github.com/mafichoni/e-vive  
> **Branch:** `main`

---

## Table of Contents

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
10. [Authentication Systems](#10-authentication-systems)
11. [Client Journey Stages](#11-client-journey-stages)
12. [RBAC System](#12-rbac-system)
13. [Pricing & Rates](#13-pricing--rates)
14. [Security Configuration](#14-security-configuration)
15. [Demo & Seed Data](#15-demo--seed-data)
16. [Static Assets](#16-static-assets)
17. [Development Guide](#17-development-guide)

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
- **GPS-verified clock-in/out** for shift attendance
- **Journey tracking** — 10-stage client onboarding pipeline
- **Family Caregiver Hub** — training modules, counselling, peer community, resource library
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
  "resend": "^6.12.4"
}
```
**devDependencies:** `eslint ^8.0.0`, `eslint-config-next ^14.2.35`

### Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `RESEND_API_KEY` | Resend email API key | Optional (email silently skipped if absent) |
| `EMAIL_FROM` | Override sender address | Optional (defaults to `E-Vive Kenya <hello@e-vive.co.ke>`) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Override admin login email | Optional |
| `NEXT_PUBLIC_ADMIN_HASH` | SHA-256 hex of admin password | Optional |

### External Resources (CDN, loaded at runtime)
- **Leaflet.js 1.9.4** — loaded dynamically via `document.createElement('script')` in `pages/admin/map.jsx` only (SSR-safe)
  - CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
  - JS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- **Google Fonts** — loaded in `SharedStyles.js` via `@import` in the CSS string

### API Routes

| Route | File | Purpose |
|---|---|---|
| `POST /api/send-email` | `pages/api/send-email.js` | Sends transactional emails via Resend SDK. Accepts `{ to, subject, text }`. Converts plain text to HTML. Returns `{ ok: true }` on success; silently returns `{ ok: true, skipped: true }` if `RESEND_API_KEY` is not set. |

---

## 3. Route Map

| Route | File | Auth Required | Purpose |
|---|---|---|---|
| `/` | `pages/index.jsx` | None | Landing page |
| `/about` | `pages/about.jsx` | None | Company story, team, mission |
| `/contact` | `pages/contact.jsx` | None | Contact form & department listing |
| `/caregivers` | `pages/caregivers.jsx` | None | Family caregiver hub |
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
| `/hca/login` | `pages/hca/login.jsx` | None (redirects if logged in) | HCA authentication |
| `/hca/dashboard` | `pages/hca/dashboard.jsx` | HCA session | HCA shift portal |
| `/admin/login` | `pages/admin/login.jsx` | None | Admin authentication |
| `/admin/dashboard` | `pages/admin/dashboard.jsx` | Admin session | Operations management |
| `/admin/finance` | `pages/admin/finance.jsx` | Admin session | Financial management |
| `/admin/map` | `pages/admin/map.jsx` | Admin session | Geographic location management |
| `/404` | Next.js default | None | 404 error page |

> **Note:** All routes have a trailing slash due to `trailingSlash: true`. The canonical URL for the home page is `https://e-vive.vercel.app/`.

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
**Mararo Avenue, off Riara Road, Nairobi, Kenya**  
P.O. Box 12345 – 00100, Nairobi  
Phone: +254 720 053 455  
Email: hello@e-vive.co.ke

---

### 4.4 Family Caregiver Hub `/caregivers`

**File:** `pages/caregivers.jsx`  
**Target audience:** Family members providing informal care to patients at home

#### Tab Navigation (5 tabs, sticky on scroll)

**Tab 1 — Training Modules**  
6 training cards with progress bars:
- Basic Nursing Skills (Beginner, 12 lessons)
- Dementia Care Essentials (Intermediate, 8 lessons)
- Palliative Care & Comfort (Advanced, 10 lessons)
- Medication Management (Intermediate, 6 lessons)
- Caregiver Self-Care & Burnout (Beginner, 5 lessons)
- Mobility & Positioning (Intermediate, 7 lessons)

**Tab 2 — Community Forum**  
4 sample discussion threads with topic, author, reply count, last activity. Popular topics sidebar. "Start a Discussion" button (visual only, not functional yet).

**Tab 3 — Counselling**  
4 counsellors with portrait SVGs:
- James Otieno — Grief & Loss Counsellor
- Sarah Kamau — Family Therapist
- Peter Mwangi — Palliative Care Specialist
- Rose Mutua — Caregiver Wellness Coach

Each counsellor card shows: name, role, bio, available time slots, "Book Session" button.

**Booking Modal** — triggered by any counsellor's Book button:
- Fields: Name, Phone, Preferred Slot (dropdown), Notes
- On submit: shows confirmation message

**Tab 4 — Resource Library**  
8 downloadable resources (visual cards with emoji icon, title, format badge):
- Caregiver Daily Planner (PDF)
- Dementia Communication Guide (PDF)
- Medication Tracker Template (PDF)
- Understanding Palliative Care (Video, 18 min)
- Caregiver Rights in Kenya (PDF)
- Emergency Response Checklist (PDF)
- Patient Nutrition Guide (PDF)
- Signs of Caregiver Burnout (Article)

**Tab 5 — Support Groups**  
4 active support groups:
- Dementia Caregivers Circle — Tuesdays 6pm, 34 members
- Palliative Care Support — Thursdays 5pm, 21 members
- Mobility & Disability Carers — Wednesdays 7pm, 18 members
- Childhood Illness Families — Fridays 5:30pm, 12 members

#### Key State
```jsx
const [activeTab, setActiveTab] = useState("training");
const [bookingModal, setBookingModal] = useState(null); // counsellor object | null
const [bookForm, setBookForm] = useState({ name, phone, slot, notes });
const [bookingDone, setBookingDone] = useState(false);
const [openFaq, setOpenFaq] = useState(null);
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
- Registered office: Mararo Avenue, off Riara Road, Nairobi, Kenya

---

### 4.10 Terms of Use `/terms`

**File:** `pages/terms.jsx`  
**Target audience:** All users (legal compliance)

- Last updated: 1 January 2025
- Covers: Platform usage, HCA subscription terms, client obligations, payment terms, IP rights, limitation of liability
- Governing law: Republic of Kenya
- Company: **Star Delight Enterprises**, Mararo Avenue, off Riara Road, Nairobi, Kenya

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
const [clockedIn, setClockedIn] = useState(false);
const [currentShiftId, setCurrentShiftId] = useState(null);
const [liveShifts, setLiveShifts] = useState([]);
const [cardexLog, setCardexLog] = useState([]);
const [assignedClient, setAssignedClient] = useState(null);
const [menuOpen, setMenuOpen] = useState(false);
const [vitals, setVitals] = useState({ bp:"", pulse:"", temp:"", spo2:"", rr:"", weight:"", pain:"" });
const [meds, setMeds] = useState([{ name:"", dose:"", time:"", given:false }]);
const [observations, setObservations] = useState({ mood:"", mobility:"", appetite:"", hydration:"", bowels:"", sleep:"" });
const [incidents, setIncidents] = useState("");
const [generalObs, setGeneralObs] = useState("");
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

#### Sidebar Navigation (15 tabs/links)

| Icon | Label | Key | Notes |
|---|---|---|---|
| 📊 | Overview | `overview` | Platform stats |
| 👨‍👩‍👧 | Clients | `clients` | Family management |
| 👩‍⚕️ | HCAs | `hcas` | HCA management + approval queue |
| 🤝 | Placements | `placements` | Active/pending placements |
| 💳 | Invoices | `invoices` | Billing management |
| 📅 | Calendar | `calendar` | Shared ops calendar |
| 🩺 | Quality | `quality` | Cardex QA review |
| 🎓 | Training | `training` | HCA training management |
| 📣 | Announcements | `announcements` | Broadcast messages |
| 📧 | Newsletter | `newsletter` | Email campaigns |
| 🏷️ | Pricing & Offers | `pricing` | Rate config + discount codes |
| 🗺️ | Map View | `map` | Link → `/admin/map` |
| 💰 | Finance | `finance` | Link → `/admin/finance` |
| 🔧 | Settings / RBAC | `settings` | Access control |

#### Overview Tab
- 4 stat boxes: Total Families, Total HCAs, Active Placements, Outstanding Revenue (KES)
- Priority alerts panel (low ratings, pending verifications, overdue invoices)
- Recent activity feed (last 20 activity log entries)

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

**localStorage keys (session tokens only):**

| Key | Purpose |
|---|---|
| `evive_client_session` | Current active client session token |
| `evive_hca_session` | Current active HCA session token |
| `evive_admin_session` | Current active admin session token |
| `evive_client_registry` | Legacy auth lookup (maintained for backwards compat during transition) |

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

#### Demo Seed Data

| Function | Notes |
|---|---|
| `seedDemoDataIfEmpty` | `async () → void` — checks if `clients` table is empty; only runs once; creates demo client, HCA profile, invoice, and calendar event in Supabase |

---

## 10. Authentication Systems

### Client Authentication

```
User enters email + password
        ↓
authenticateClient(email, password)
        ↓
getClientByEmail(email) → Supabase clients table
        ↓
  Not found → error
        ↓
client.password === password
        ↓
  Mismatch → error
        ↓
setClientSession({ id, name, email, mobile })
        → stored in evive_client_session (localStorage)
        ↓
router.replace('/client/dashboard')
```

**Fallback:** Also checks mobile number match via `getAllClients()`.

**Session shape:**
```json
{ "id": "...", "name": "Jane Wanjiku", "email": "jane@example.com", "mobile": "+254700..." }
```

**Auth guard:** Every protected page checks `getClientSession()` in `useEffect([], [])` and calls `router.replace('/client/register')` if null.

---

### HCA Authentication

```
User enters Employee ID / email / mobile + password
        ↓
getAllHcaProfiles() → Supabase hca_profiles table
        ↓
find by employeeId OR email OR mobile
        ↓
  Not found → error
        ↓
profile.password === form.password
        ↓
  Mismatch → error
        ↓
setHcaSession({ id, name, email, employeeId })
        → stored in evive_hca_session (localStorage)
        ↓
router.push('/hca/dashboard')
```

**Session shape:**
```json
{ "id": "...", "name": "Grace Akinyi", "email": "grace@hca.com", "employeeId": "HCA-1002" }
```

---

### Admin Authentication

```
User enters email + password
        ↓
email.trim().toLowerCase() === CORRECT_EMAIL?
        ↓
SHA-256(password) via crypto.subtle.digest === CORRECT_HASH?
        ↓
  Either fails → increment attempt counter
  3rd fail → 60-second lockout
        ↓
Both match:
setAdminSession({ id:"admin", name:"Salome Ruguru", role:"super_admin" })
        → stored in evive_admin_session with loginAt timestamp
        ↓
router.replace('/admin/dashboard')
```

**Session shape:**
```json
{ "id": "admin", "name": "Salome Ruguru", "role": "super_admin", "loginAt": "2026-05-27T..." }
```

**Auth guard in all admin pages:**
```javascript
useEffect(() => {
  try {
    const session = getAdminSession();
    if (!session?.id) { router.replace("/admin/login"); return; }
    setAuthed(true);
  } catch { router.replace("/admin/login"); }
}, []);
```

Pages render `null` (blank) until `authed === true`.

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

- Password comparison uses SHA-256 hash (Web Crypto API) — never plaintext
- 3-attempt lockout with 60-second timeout prevents brute force
- Session cleared on sign-out (`clearAdminSession()`)
- Admin pages return `null` (blank screen) while auth check runs — no flash of protected content

### Known Limitations

| Issue | Impact | Resolution |
|---|---|---|
| Client/HCA passwords stored in plaintext in Supabase | Passwords readable by anyone with Supabase table access | Requires server-side bcrypt/argon2 hashing |
| RBAC enforced client-side only | Admin dashboard tab access can be bypassed via URL manipulation | Requires server-side middleware or Supabase Row Level Security |
| `unsafe-inline` in CSP | Weakens XSS protection | Next.js Pages Router limitation; nonce support requires App Router |
| Supabase anon key is public (`NEXT_PUBLIC_`) | Row-level security (RLS) should be configured in Supabase to limit what the anon key can access | Configure RLS policies per table |

---

## 15. Demo & Seed Data

`seedDemoDataIfEmpty()` in `lib/store.js` populates Supabase with demo data when the `clients` table is empty. Safe to call multiple times (no-op if data exists).

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

#### Counsellor Portraits (`/images/portraits/`)
4 counsellors used in `/caregivers` page:

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

Create a `.env.local` file in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vwwdmzdknmdsiowmjkzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
RESEND_API_KEY=re_your_key_here          # optional
EMAIL_FROM=E-Vive Kenya <hello@e-vive.co.ke>  # optional
```

### Getting Started

```bash
git clone https://github.com/mafichoni/e-vive.git
cd e-vive
npm install
npm run dev
```

Open http://localhost:3000

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 (hot reload) |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint across all pages, components, and lib |

### Changing Admin Credentials

**Option 1 — Vercel environment variables (recommended for production):**

1. Go to Vercel project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_ADMIN_EMAIL` with your admin email
3. Add `NEXT_PUBLIC_ADMIN_HASH` with the SHA-256 of your new password:
   ```bash
   echo -n "YourNewSecurePassword" | openssl dgst -sha256 -hex | awk '{print $2}'
   ```
4. Redeploy

**Option 2 — Edit source (development only):**

In `pages/admin/login.jsx`, change `CORRECT_HASH`:
```javascript
const CORRECT_HASH = "your_sha256_hash_here";
const CORRECT_EMAIL = "your_email@domain.com";
```

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

---

*Documentation generated May 2026 — E-Vive Homecare · by E-Vive Wellness Initiative · Nairobi, Kenya*
