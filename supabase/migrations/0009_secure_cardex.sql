-- ============================================================================
-- Secure Cardex — auth hardening, platform settings, sharing, notifications,
-- audit, and Row Level Security on the clinical tables.
--
-- Run this ONCE in the Supabase SQL Editor.
--
-- ⚠️ BEFORE YOU RUN IT, set these environment variables in Vercel, or the
--    app will break on deploy:
--
--      SUPABASE_SERVICE_ROLE_KEY   Supabase → Settings → API → service_role
--                                  (server-only; never NEXT_PUBLIC_*)
--      SESSION_SECRET              any long random string, e.g.
--                                  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
--
--    Section 6 of this file locks cardex_entries so the public anon key can
--    no longer read it. Every Cardex read/write then goes through the new
--    /api/cardex/* routes using the service-role key. Without the two vars
--    above those routes cannot start.
-- ============================================================================


-- 1. ── Password hardening ---------------------------------------------------
-- Passwords are currently stored as plain values (clients.password_hash and
-- hca_profiles.password both hold the literal password). These columns let the
-- app migrate each user to scrypt transparently on their next successful
-- login, without a flag-day reset.
--
-- password_algo: 'plain' = legacy literal, 'scrypt' = properly hashed.

alter table public.clients      add column if not exists password_algo text not null default 'plain';
alter table public.hca_profiles add column if not exists password_hash text;
alter table public.hca_profiles add column if not exists password_algo text not null default 'plain';

-- Admin accounts had no table at all — the single admin was a SHA-256 hash
-- compared in browser-side code (NEXT_PUBLIC_ADMIN_HASH). Real rows instead.
create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null default 'Administrator',
  password_hash text,
  password_algo text not null default 'scrypt',
  role          text not null default 'super_admin',
  -- Staff welfare notes are gated separately from general admin access: they
  -- are a worker's confidential account of their own conditions, not care
  -- quality data. Off by default; grant deliberately.
  can_read_welfare_notes boolean not null default false,
  active        boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);


-- 2. ── Platform settings (Admin-configurable) --------------------------------
-- Single row, id = 1, same shape as the existing pricing_config table.
-- Retention periods, consent ownership and sharing defaults are policy
-- decisions and belong to the business, not hardcoded in the source.

create table if not exists public.platform_settings (
  id                          int primary key default 1,

  -- Retention (days). 0 = keep indefinitely.
  retain_cardex_days          int  not null default 2555,  -- ~7 years, clinical record
  retain_share_tokens_days    int  not null default 30,
  retain_share_audit_days     int  not null default 2555,
  retain_notifications_days   int  not null default 365,
  retain_generated_pdfs_days  int  not null default 0,     -- 0 = never stored, generated on demand

  -- Consent: who may authorise sharing a patient's health data outward.
  --   'client'  – the account holder alone
  --   'patient' – requires recorded patient consent
  --   'either'  – client may act, patient consent recorded when available
  consent_owner               text not null default 'client',
  consent_statement           text not null default
    'I confirm I have the authority to share this patient''s health information, and that each recipient has a legitimate reason to receive it.',

  -- Sharing defaults
  share_default_expiry_days   int  not null default 7,
  share_max_expiry_days       int  not null default 30,
  share_max_recipients        int  not null default 5,
  share_max_per_hour          int  not null default 5,
  share_require_access_code   boolean not null default true,
  share_include_handover      boolean not null default false,  -- data minimisation
  share_min_justification_len int  not null default 20,

  updated_at                  timestamptz not null default now(),
  updated_by                  text
);

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;


-- 3. ── Client notification preferences ---------------------------------------
-- Per client, per patient. Incident alerts default ON (the brief's §5).

create table if not exists public.cardex_notify_prefs (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  patient_id        uuid,
  on_new_report     boolean not null default false,
  digest_frequency  text    not null default 'none',   -- none | daily | weekly | monthly
  on_incident       boolean not null default true,
  updated_at        timestamptz not null default now(),
  unique (client_id, patient_id)
);
create index if not exists cardex_notify_prefs_client_idx on public.cardex_notify_prefs(client_id);


-- 4. ── Cardex shares ----------------------------------------------------------
-- One row per share (what was shared, by whom, under what consent), plus one
-- row per recipient (each with their own revocable token).

create table if not exists public.cardex_shares (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients(id) on delete cascade,
  patient_id         uuid,
  patient_name       text,
  range_start        date not null,
  range_end          date not null,
  data_types         jsonb not null default '[]'::jsonb,
  include_handover   boolean not null default false,
  consent_statement  text not null,
  consent_owner      text not null default 'client',
  consented_at       timestamptz not null default now(),
  created_by_name    text,
  created_at         timestamptz not null default now(),
  revoked_at         timestamptz,
  revoked_reason     text
);
create index if not exists cardex_shares_client_idx on public.cardex_shares(client_id);

create table if not exists public.cardex_share_recipients (
  id            uuid primary key default gen_random_uuid(),
  share_id      uuid not null references public.cardex_shares(id) on delete cascade,
  full_name     text not null,
  email         text not null,
  relationship  text not null,          -- treating_doctor | specialist | family | other
  relationship_other text,
  justification text not null,          -- the lawful-basis record; keep permanently
  -- Only a hash of the token is stored. A database dump therefore does not
  -- yield working access links.
  token_hash    text not null unique,
  access_code   text,                   -- optional second factor, passed on out-of-band
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  last_access_at timestamptz,
  access_count  int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists cardex_share_recipients_share_idx on public.cardex_share_recipients(share_id);
create index if not exists cardex_share_recipients_token_idx on public.cardex_share_recipients(token_hash);

-- Immutable audit. Successful AND failed attempts — repeated failures against
-- a token are how an attack becomes visible.
create table if not exists public.cardex_share_audit (
  id            uuid primary key default gen_random_uuid(),
  share_id      uuid references public.cardex_shares(id) on delete set null,
  recipient_id  uuid references public.cardex_share_recipients(id) on delete set null,
  event         text not null,          -- created | viewed | downloaded | revoked | denied_expired | denied_revoked | denied_invalid | denied_code
  ip            text,
  user_agent    text,
  detail        text,
  created_at    timestamptz not null default now()
);
create index if not exists cardex_share_audit_share_idx on public.cardex_share_audit(share_id);
create index if not exists cardex_share_audit_created_idx on public.cardex_share_audit(created_at desc);


-- 5. ── Cardex query support ---------------------------------------------------
create index if not exists cardex_entries_client_idx    on public.cardex_entries(client_id);
create index if not exists cardex_entries_patient_idx   on public.cardex_entries(patient_id);
create index if not exists cardex_entries_submitted_idx on public.cardex_entries(submitted_at desc);


-- 6. ── Row Level Security ------------------------------------------------------
-- The browser holds only the public anon key, and this application has no
-- Supabase Auth session — auth.uid() is NULL on every request. A policy of the
-- usual form (client_id = auth.uid()) therefore cannot work here.
--
-- So: deny the anon role outright on the clinical + sharing tables. The
-- service_role bypasses RLS, and the /api/cardex/* routes use it AFTER
-- verifying the caller's signed session cookie server-side. That makes the
-- API route the single enforcement point, which is auditable in one place.
--
-- Existing browser-side Cardex calls are re-pointed at those routes in the
-- same release. If you run this migration WITHOUT deploying that code, the
-- Cardex screens will return empty.

alter table public.cardex_entries          enable row level security;
alter table public.cardex_shares           enable row level security;
alter table public.cardex_share_recipients enable row level security;
alter table public.cardex_share_audit      enable row level security;
alter table public.cardex_notify_prefs     enable row level security;
alter table public.platform_settings       enable row level security;
alter table public.admin_users             enable row level security;

-- No policies are created for anon/authenticated => default deny.
-- Drop any permissive policy a previous setup may have left behind.
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('cardex_entries','cardex_shares','cardex_share_recipients',
                        'cardex_share_audit','cardex_notify_prefs','platform_settings','admin_users')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- Read-only settings the public site legitimately needs would go here as a
-- narrow policy. None are needed today: platform_settings is admin-only and
-- is read server-side.


-- 7. ── Retention housekeeping --------------------------------------------------
-- Call from a scheduled job (pg_cron) or from Admin → Settings → "Run now".
-- Honours whatever is configured in platform_settings; 0 means keep forever.

create or replace function public.purge_expired_cardex_data()
returns table (deleted_tokens int, deleted_audit int, deleted_notifications int)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.platform_settings%rowtype;
  t int := 0; a int := 0; n int := 0;
begin
  select * into s from public.platform_settings where id = 1;

  if s.retain_share_tokens_days > 0 then
    with d as (
      delete from public.cardex_share_recipients
      where expires_at < now() - (s.retain_share_tokens_days || ' days')::interval
      returning 1
    ) select count(*) into t from d;
  end if;

  if s.retain_share_audit_days > 0 then
    with d as (
      delete from public.cardex_share_audit
      where created_at < now() - (s.retain_share_audit_days || ' days')::interval
      returning 1
    ) select count(*) into a from d;
  end if;

  if s.retain_notifications_days > 0 then
    with d as (
      delete from public.notifications
      where created_at < now() - (s.retain_notifications_days || ' days')::interval
      returning 1
    ) select count(*) into n from d;
  end if;

  return query select t, a, n;
end $$;

revoke all on function public.purge_expired_cardex_data() from public, anon, authenticated;
