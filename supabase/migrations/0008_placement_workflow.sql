-- Completes the HCA Placement workflow. The `placements` table and its
-- CRUD functions already existed in lib/store.js but were never actually
-- wired to any UI — Admin's only way to "match" an HCA to a client was
-- setting clients.assigned_hca_id directly, with no date range, no
-- per-patient tie, no generated shifts, and no conflict checking at all.
--
-- Adds the two columns createPlacement now needs to record what pattern
-- of shift it generated (so the placement can later be extended or
-- reassigned using the same pattern) and any admin notes.
--
-- Run this once in the Supabase SQL Editor for this project.

alter table public.placements add column if not exists shift_type text not null default 'day';
alter table public.placements add column if not exists notes text not null default '';

create index if not exists placements_hca_id_idx    on public.placements(hca_id);
create index if not exists placements_client_id_idx on public.placements(client_id);
create index if not exists placements_status_idx    on public.placements(status);
