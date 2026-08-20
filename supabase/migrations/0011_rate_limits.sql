-- ============================================================================
-- Server-side rate limiting (P1-4).
--
-- Serverless functions share no memory, so attempts are counted in a table as
-- a sliding window. One row per attempt; lib/rateLimit.js counts what is in a
-- bucket for the last N seconds and refuses if that already meets the limit.
--
-- Run after 0010.
-- ============================================================================

create table if not exists public.rate_limits (
  id         uuid primary key default gen_random_uuid(),
  bucket     text not null,
  created_at timestamptz not null default now()
);

-- The only query shape used: count rows in one bucket since a timestamp.
create index if not exists rate_limits_bucket_time_idx
  on public.rate_limits (bucket, created_at desc);

-- Same posture as every other table: the browser cannot reach this. Only the
-- service role, from inside an API route.
alter table public.rate_limits enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'rate_limits'
  loop
    execute format('drop policy if exists %I on public.rate_limits', pol.policyname);
  end loop;
end $$;


-- Housekeeping. Attempt rows are worthless once they fall outside the longest
-- window in use (an hour), but keeping a day of them makes it possible to see
-- an attack after the fact.
create or replace function public.purge_expired_rate_limits()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int := 0;
begin
  with d as (
    delete from public.rate_limits
    where created_at < now() - interval '1 day'
    returning 1
  ) select count(*) into n from d;
  return n;
end $$;

revoke all on function public.purge_expired_rate_limits() from public, anon, authenticated;
