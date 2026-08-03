-- Admin Messages feature: unified inbox/sent/outbox/trash for all email
-- traffic (Resend two-way email now; Contact/Enquiry page origin to be
-- folded in later).
--
-- Run this once in the Supabase SQL Editor for this project.

create table if not exists public.emails (
  id                 uuid primary key default gen_random_uuid(),
  direction          text not null check (direction in ('inbound','outbound')),
  origin             text not null default 'system' check (origin in ('resend','contact_page','admin_composed','system')),
  folder             text not null default 'inbox' check (folder in ('inbox','sent','outbox','trash')),
  status             text not null default 'received',
  subject            text default '',
  from_address       text,
  from_name          text,
  to_addresses       text[] default '{}',
  cc_addresses       text[] default '{}',
  reply_to           text,
  body_text          text default '',
  body_html          text,
  resend_message_id  text,
  thread_id          text,
  related_client_id  uuid references public.clients(id) on delete set null,
  related_hca_id     uuid references public.hca_profiles(id) on delete set null,
  admin_id           text,
  read               boolean default false,
  starred            boolean default false,
  metadata           jsonb default '{}',
  created_at         timestamptz default now(),
  sent_at            timestamptz,
  deleted_at         timestamptz
);

create index if not exists emails_folder_idx             on public.emails(folder);
create index if not exists emails_created_at_idx         on public.emails(created_at desc);
create index if not exists emails_resend_message_id_idx  on public.emails(resend_message_id);
create index if not exists emails_direction_idx          on public.emails(direction);
create index if not exists emails_origin_idx              on public.emails(origin);

-- This app authenticates every request (including server-side API routes)
-- with the Supabase anon key — there is no service-role key in use anywhere
-- else in the project, so the anon role needs full CRUD here to match how
-- every other table (clients, hca_profiles, contact_messages, ...) already
-- works. If you later introduce a service-role key for API routes, tighten
-- this to service_role only and drop anon access.
alter table public.emails enable row level security;

drop policy if exists "emails_anon_all" on public.emails;
create policy "emails_anon_all" on public.emails
  for all
  to anon
  using (true)
  with check (true);
