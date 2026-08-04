-- The HCA application form collects date of birth, a profile photo,
-- certificate uploads, education level, cultural experience and phone
-- model — but approval (createHcaProfile) only ever copied a handful of
-- fields across, so all of this vanished from the record the moment an
-- application was approved (or later deleted as test/duplicate cleanup).
-- Add the missing columns to hca_profiles so this data survives onto the
-- permanent HCA record and can be shown on the HCA's own dashboard.
--
-- Run this once in the Supabase SQL Editor for this project.

alter table public.hca_profiles add column if not exists dob date;
alter table public.hca_profiles add column if not exists photo text;
alter table public.hca_profiles add column if not exists certifications jsonb not null default '[]'::jsonb;
alter table public.hca_profiles add column if not exists education text;
alter table public.hca_profiles add column if not exists cultural_exp text;
alter table public.hca_profiles add column if not exists smartphone text;
