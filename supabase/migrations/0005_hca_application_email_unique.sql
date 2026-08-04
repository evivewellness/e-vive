-- The app-level duplicate check (findDuplicateHcaApplicant) reads then
-- inserts as two separate steps, so it isn't atomic — two near-simultaneous
-- submissions (double-click, duplicate browser tabs, slow network causing a
-- retry) can both pass the "no duplicate found" check before either row
-- lands, producing exactly the kind of duplicate "Salome Mburu" pending
-- applications seen in production. A DB-level constraint is the only thing
-- that can guarantee this can't happen.
--
-- Run this once in the Supabase SQL Editor for this project.

-- Step 1: resolve pre-existing duplicates first, or the unique index below
-- will fail to create. For each email with more than one still-active
-- (non-rejected) application, keep the most recently submitted one and mark
-- the rest as rejected — they remain fully visible and reopenable by Admin
-- under the Rejected filter, nothing is deleted.
update public.hca_applications a
set status = 'rejected'
where a.status <> 'rejected'
  and coalesce(btrim(a.email), '') <> ''
  and a.id <> (
    select b.id
    from public.hca_applications b
    where b.status <> 'rejected'
      and lower(btrim(b.email)) = lower(btrim(a.email))
    order by b.applied_at desc nulls last, b.id desc
    limit 1
  );

-- Step 2: prevent it from ever happening again. Only one non-rejected
-- application per email is allowed; a rejected applicant can still reapply
-- (their old row no longer counts toward the constraint).
create unique index if not exists hca_applications_email_active_idx
  on public.hca_applications (lower(btrim(email)))
  where status <> 'rejected' and coalesce(btrim(email), '') <> '';
