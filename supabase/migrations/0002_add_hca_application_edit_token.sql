-- Applicant self-service edit links (admin "Enable Applicant Edit") need a
-- fast, indexed way to look up an application by its one-time token.
--
-- The token was originally stored inside form_data (a JSONB column that
-- also holds base64-encoded certificate/photo uploads) and looked up via
-- form_data->'editAccess'->>'token'. That path has no index, so Postgres
-- had to sequentially scan every row's form_data — including all the large
-- base64 blobs — just to evaluate the filter, causing the same
-- "canceling statement due to statement timeout" error already seen once
-- on this table for the same underlying reason.
--
-- Run this once in the Supabase SQL Editor for this project.

alter table public.hca_applications add column if not exists edit_token text;

create unique index if not exists hca_applications_edit_token_idx
  on public.hca_applications(edit_token)
  where edit_token is not null;
