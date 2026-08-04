-- Performance pass: every one of these columns is filtered or sorted on
-- directly (see lib/store.js — getShiftsByHca, getCardexByHca,
-- getAllHcaProfiles, deleteHcaProfile's cascade cleanup, login lookups,
-- etc.) but had no supporting index, so Postgres falls back to a full
-- table scan for each call. As shift/cardex/placement history grows this
-- is exactly the kind of thing that turns into another statement-timeout
-- incident (already hit twice on hca_applications this project). None of
-- these change any data — safe to run any time.
--
-- Run this once in the Supabase SQL Editor for this project.

-- HCA dashboard's own load: getShiftsByHca / getCardexByHca / getCalendarEventsByHca
create index if not exists shifts_hca_id_idx           on public.shifts(hca_id);
create index if not exists shifts_client_id_idx         on public.shifts(client_id);
create index if not exists cardex_entries_hca_id_idx    on public.cardex_entries(hca_id);
create index if not exists placements_hca_id_idx        on public.placements(hca_id);
create index if not exists placements_client_id_idx     on public.placements(client_id);
create index if not exists calendar_events_hca_id_idx   on public.calendar_events(hca_id);
create index if not exists calendar_events_client_id_idx on public.calendar_events(client_id);
create index if not exists payroll_payments_hca_id_idx  on public.payroll_payments(hca_id);
create index if not exists notifications_client_id_idx  on public.notifications(client_id);
create index if not exists notifications_hca_id_idx     on public.notifications(hca_id);
create index if not exists invoices_client_id_idx       on public.invoices(client_id);

-- Login lookups (authenticateHca / getClientByEmail) and deleteHcaProfile's
-- cascade cleanup of a client's assigned/requested HCA reference.
create index if not exists hca_profiles_email_idx       on public.hca_profiles(email);
create index if not exists clients_email_idx             on public.clients(email);
create index if not exists clients_assigned_hca_id_idx   on public.clients(assigned_hca_id);
create index if not exists clients_requested_hca_id_idx  on public.clients(requested_hca_id);

-- getAllHcaProfiles / getAllHcaApplications sort by these on every load.
create index if not exists hca_profiles_approved_at_idx     on public.hca_profiles(approved_at desc);
create index if not exists hca_applications_applied_at_idx  on public.hca_applications(applied_at desc);
