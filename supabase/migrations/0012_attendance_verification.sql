-- ============================================================================
-- Attendance verification (P1-6).
--
-- Clock-in already recorded coordinates, and the browser compared them to the
-- client's address at a 10 m tolerance. Both halves were wrong: a check the
-- browser performs is advice rather than a rule, and 10 m is inside the error
-- bar of consumer GPS indoors, which is exactly where home care happens — so it
-- rejected honest carers standing in the right living room.
--
-- The comparison now runs in /api/hca/clock-in at a configurable radius, and
-- its outcome is recorded. These columns are that record.
--
-- Run after 0011.
-- ============================================================================

-- Was the position actually compared against the client's, and did it pass?
-- Distinct from "coordinates were captured": a clock-in with no client
-- coordinates on file is allowed, and lands here as verified = false, so
-- payroll can see the difference between checked and merely recorded.
alter table public.shifts add column if not exists clock_in_verified    boolean;
alter table public.shifts add column if not exists clock_in_distance_m  int;

-- Clock-out records where the carer was, but never refuses: someone who cannot
-- end their shift cannot file their Cardex either.
alter table public.shifts add column if not exists clock_out_lat        double precision;
alter table public.shifts add column if not exists clock_out_lng        double precision;
alter table public.shifts add column if not exists clock_out_verified   boolean;


-- The tolerance is a business decision, not a source constant. 150 m is close
-- enough that the wrong house fails and loose enough that a real arrival at the
-- right one does not. 0 disables the check — clock-ins are then all recorded
-- as unverified rather than silently counted as checked.
alter table public.platform_settings
  add column if not exists clock_in_radius_m int not null default 150;
