-- HCA User Journey tracking, mirroring the existing client journey
-- (clients.journey_stage / journey_dates). Spans two tables because the
-- applicant only gets a hca_profiles row once approved:
--   hca_applications  — application_submitted, tc_accepted, under_review
--   hca_profiles      — approved, account_activated, placement_assigned
-- (approved carries the earlier two dates forward so the HCA dashboard can
-- render one continuous timeline).
--
-- Run this once in the Supabase SQL Editor for this project.

alter table public.hca_applications add column if not exists journey_stage text not null default 'application_submitted';
alter table public.hca_applications add column if not exists journey_dates jsonb not null default '{}'::jsonb;

alter table public.hca_profiles add column if not exists journey_stage text not null default 'approved';
alter table public.hca_profiles add column if not exists journey_dates jsonb not null default '{}'::jsonb;
