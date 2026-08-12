-- ============================================================================
-- GPS accuracy for HCA clock-in / clock-out, measured against the PATIENT'S
-- care address.
--
-- Run this ONCE in the Supabase SQL Editor. Copy each numbered part separately
-- if the editor mangles a long paste.
--
-- What changes, and why:
--
--  * The geofence reference point was the CLIENT account's coordinates. One
--    client can have several patients at different addresses, so an HCA could
--    be judged "on site" at a house they had never visited. Patients now carry
--    their own care coordinates (in the existing clients.patients JSONB, which
--    needs no schema change), with the client premises as a recorded fallback.
--
--  * The fence was a hard 10 m. No consumer smartphone achieves that indoors —
--    5–20 m is a good outdoor fix and walls push it well past 50 m. The radius
--    is now Admin-configurable and defaults to 75 m.
--
--  * position.coords.accuracy was ignored entirely, so a ±500 m fix was
--    treated exactly like a ±4 m one. Accuracy is now recorded, gates whether
--    a fix is usable at all, and is allowed for (capped) before a position is
--    called a breach.
--
--  * The whole check ran in the browser, which for an attendance and payroll
--    control is no check at all. It now runs in /api/shifts/clock against the
--    HCA's signed session cookie.
-- ============================================================================


-- 1. ── Evidence on the shift ------------------------------------------------
-- clock_in_lat/lng and clock_out_lat/lng were already mapped in lib/store.js;
-- the clock-out pair was never actually written, so a shift had no record of
-- where it ended. These add the accuracy and the working behind the decision,
-- so a disputed shift can be judged on what was measured rather than on a
-- surviving boolean.

alter table public.shifts add column if not exists clock_in_lat double precision;
alter table public.shifts add column if not exists clock_in_lng double precision;
alter table public.shifts add column if not exists clock_out_lat double precision;
alter table public.shifts add column if not exists clock_out_lng double precision;
alter table public.shifts add column if not exists clock_in_accuracy_m integer;
alter table public.shifts add column if not exists clock_in_distance_m integer;
alter table public.shifts add column if not exists clock_in_verdict text;
alter table public.shifts add column if not exists clock_out_accuracy_m integer;
alter table public.shifts add column if not exists clock_out_distance_m integer;
alter table public.shifts add column if not exists clock_out_verdict text;


-- 2. ── Geofence policy, owned by Admin --------------------------------------
-- Same single-row platform_settings table added in 0009. These are operational
-- policy, not constants: a Nairobi apartment block and a rural compound do not
-- want the same radius.

alter table public.platform_settings add column if not exists geofence_radius_m integer not null default 75;
alter table public.platform_settings add column if not exists geofence_max_accuracy_m integer not null default 100;
alter table public.platform_settings add column if not exists geofence_grace_cap_m integer not null default 50;
alter table public.platform_settings add column if not exists geofence_enforcement text not null default 'block';
alter table public.platform_settings add column if not exists geofence_require_reference boolean not null default false;


-- 3. ── Attendance exceptions -------------------------------------------------
-- Every clock attempt that was not a clean fix inside the fence, whether it
-- was allowed or refused. A refusal that leaves no trace is indistinguishable
-- from an HCA who never turned up, and a run of borderline fixes on one worker
-- is a pattern Admin should be able to see.

create table if not exists public.attendance_exceptions (
  id               uuid primary key default gen_random_uuid(),
  hca_id           uuid,
  shift_id         uuid,
  client_id        uuid,
  patient_id       uuid,
  action           text not null,          -- in | out
  allowed          boolean not null,
  lat              double precision,
  lng              double precision,
  accuracy_m       integer,
  distance_m       integer,
  allowed_m        integer,
  verdict          text,                   -- inside | borderline | outside | low_confidence | no_fix | no_reference
  reference_source text,                   -- patient | client | null
  sample_count     integer,
  enforcement      text,
  detail           text,
  ip               text,
  user_agent       text,
  created_at       timestamptz not null default now()
);

create index if not exists attendance_exceptions_hca_idx on public.attendance_exceptions(hca_id);
create index if not exists attendance_exceptions_created_idx on public.attendance_exceptions(created_at desc);
create index if not exists attendance_exceptions_verdict_idx on public.attendance_exceptions(verdict);


-- 4. ── Lock the audit table down ----------------------------------------------
-- Same reasoning as 0009 section 6: this application has no Supabase Auth, so
-- auth.uid() is NULL and a per-row policy cannot work. Deny anon outright; the
-- API routes reach it with the service role after verifying the session cookie.
-- An attendance audit an HCA can read or edit is not an audit.

alter table public.attendance_exceptions enable row level security;

do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'attendance_exceptions'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;


-- 5. ── Seed patient care coordinates from the client premises ------------------
-- Every patient inherits their client's pin as a starting point, so nothing
-- regresses on deploy: an address that was checked before is still checked.
-- Admin can then move each patient's pin individually on the Map, which was
-- previously impossible — dragging a patient marker wrote to the client row
-- and moved every sibling patient with it.
--
-- Only fills patients that have no careLat yet; safe to re-run.

update public.clients c
set patients = (
  select jsonb_agg(
    case
      when p ? 'careLat' and p->>'careLat' is not null then p
      else p || jsonb_build_object(
        'careLat', c.lat,
        'careLng', c.lng,
        'careAddress', coalesce(c.address, c.location, '')
      )
    end
    order by ord
  )
  from jsonb_array_elements(c.patients) with ordinality as t(p, ord)
)
where c.lat is not null
  and c.lng is not null
  and jsonb_typeof(c.patients) = 'array'
  and jsonb_array_length(c.patients) > 0;
