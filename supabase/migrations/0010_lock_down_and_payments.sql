-- ============================================================================
-- Close the remaining launch blockers.
--
--   1. password_resets  — single-use, hashed, expiring reset tokens (P0-4)
--   2. payments         — M-Pesa STK Push initiations and their outcomes (P0-5)
--   3. Row Level Security on EVERY remaining table (P0-3)
--
-- Run this ONCE in the Supabase SQL Editor, AFTER 0009 and AFTER deploying the
-- matching code.
--
-- ⚠️ SECTION 3 IS A BREAKING CHANGE FOR ANY OLD DEPLOY. It revokes the public
--    anon key's access to every application table. From this migration on, the
--    browser reaches data only through /api/db, which verifies the signed
--    session cookie and applies lib/dbPolicy.js before querying with the
--    service role. Deploy the code first, then run this.
--
--    Required environment variables (same two as 0009):
--      SUPABASE_SERVICE_ROLE_KEY
--      SESSION_SECRET
-- ============================================================================


-- 1. ── Password resets --------------------------------------------------------
-- Only the SHA-256 of the token is stored, so a database dump yields no working
-- reset links. One live token per account: issuing a new one marks the old used.

create table if not exists public.password_resets (
  id          uuid primary key default gen_random_uuid(),
  role        text not null check (role in ('client', 'hca')),
  subject_id  uuid not null,
  email       text not null,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists password_resets_subject_idx on public.password_resets(role, subject_id);
create index if not exists password_resets_token_idx   on public.password_resets(token_hash);
create index if not exists password_resets_created_idx on public.password_resets(created_at desc);


-- 2. ── Payments ---------------------------------------------------------------
-- One row per STK Push. Written when the push is initiated, completed when
-- Safaricom's callback lands. Previously the callback logged the confirmation
-- and discarded it, so a family could pay and the invoice would stay open.

create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  invoice_id            uuid references public.invoices(id) on delete set null,
  client_id             uuid references public.clients(id) on delete set null,
  account_reference     text not null,
  amount                numeric(12,2) not null,
  phone                 text not null,
  method                text not null default 'mpesa',
  status                text not null default 'pending'
                          check (status in ('pending', 'success', 'failed', 'cancelled')),
  merchant_request_id   text,
  checkout_request_id   text unique,
  mpesa_receipt_number  text,
  result_code           int,
  result_desc           text,
  transaction_date      text,
  raw_callback          jsonb,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index if not exists payments_invoice_idx  on public.payments(invoice_id);
create index if not exists payments_client_idx   on public.payments(client_id);
create index if not exists payments_checkout_idx on public.payments(checkout_request_id);
create index if not exists payments_status_idx   on public.payments(status);

-- Invoices gain the reconciliation columns the callback writes.
alter table public.invoices add column if not exists paid_at         timestamptz;
alter table public.invoices add column if not exists payment_method  text;
alter table public.invoices add column if not exists payment_ref     text;


-- 3. ── Row Level Security on everything ----------------------------------------
-- 0009 locked the seven Cardex tables. These are the rest.
--
-- As in 0009: this application has no Supabase Auth session, so auth.uid() is
-- NULL on every browser request and a policy of the form `client_id =
-- auth.uid()` cannot work. The enforcement point is /api/db, which resolves the
-- caller from the signed cookie, applies lib/dbPolicy.js, and queries with the
-- service role (which bypasses RLS). Enabling RLS with no policies makes the
-- public anon key useless — which is the whole point.

do $$
declare
  t   text;
  pol record;
  tables text[] := array[
    'clients', 'hca_applications', 'hca_profiles', 'placements', 'shifts',
    'invoices', 'expenses', 'calendar_events', 'activity_log', 'notifications',
    'rbac_rules', 'announcements', 'newsletters', 'pricing_config',
    'discount_codes', 'map_markers', 'payroll_payments', 'lms_courses',
    'lms_enrollments', 'lms_submissions', 'hub_referrals', 'hub_access_requests',
    'emails', 'password_resets', 'payments'
  ];
begin
  foreach t in array tables loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I enable row level security', t);
      -- Drop every existing policy: 0001 granted `anon` full access to
      -- `emails`, and other permissive policies may have accumulated.
      for pol in
        select policyname from pg_policies where schemaname = 'public' and tablename = t
      loop
        execute format('drop policy if exists %I on public.%I', pol.policyname, t);
      end loop;
    end if;
  end loop;
end $$;

-- No policies are created. Default deny for anon and authenticated; the
-- service role bypasses RLS and is only ever used server-side.


-- 4. ── emails.origin: allow the values the application actually writes ----------
-- 0001 constrained origin to four values, but HCA off-day, training and welfare
-- requests have always been written with their own origin — every one of those
-- inserts violates the constraint. Widen it to the set the code uses, so the
-- data gateway (which permits `origin` on inbound mail) is bounded by a
-- constraint that matches reality rather than one that rejects valid rows.

alter table public.emails drop constraint if exists emails_origin_check;
alter table public.emails add constraint emails_origin_check check (origin in (
  'resend', 'contact_page', 'admin_composed', 'system',
  'hca_off_day_request', 'hca_training_request',
  'hca_welfare_counselling', 'hca_welfare_safety', 'hca_welfare_note'
));


-- 5. ── Retention for reset tokens ------------------------------------------------
-- Spent and expired tokens are noise with a small blast radius attached; drop
-- them on the same schedule as the rest of the housekeeping.

create or replace function public.purge_expired_password_resets()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int := 0;
begin
  with d as (
    delete from public.password_resets
    where expires_at < now() - interval '7 days'
    returning 1
  ) select count(*) into n from d;
  return n;
end $$;

revoke all on function public.purge_expired_password_resets() from public, anon, authenticated;
