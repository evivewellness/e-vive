-- HCAs give a free-text home address ("Estate / Street", e.g. "Kilimani,
-- Rose Ave") plus GPS on the application, but like dob/photo/certificates
-- (migration 0004) it was never carried onto the permanent hca_profiles
-- record — so there was nothing to search or display by location once
-- approved. Add the column so it survives approval.
--
-- Run this once in the Supabase SQL Editor for this project.

alter table public.hca_profiles add column if not exists location text;
