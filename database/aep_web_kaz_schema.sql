-- AEP Kaz conversations (Kaz V2).
--
-- Run this in the Supabase SQL Editor, after `aep_web_schema.sql`. It is
-- idempotent: re-running it is safe.
--
-- Same six-step rule as the other `aep_web_` tables (see that file and
-- docs/environment-setup.md):
--
--   1. create the table
--   2. enable row level security immediately - never "temporarily" off
--   3. revoke inherited privileges from anon and authenticated
--   4. grant back only the operations actually required
--   5. create explicit owner-scoped policies on auth.uid()
--   6. verify anonymous and authenticated behaviour against the real table
--
-- These two tables hold a learner's private conversations with Kaz. There is
-- deliberately NO admin or owner policy anywhere in this file, and no product
-- requirement asks for one: Vision section 8 already rules out student
-- monitoring, and a chat log is the most personal thing AEP stores. Nobody but
-- the learner reads these rows.
--
-- Nothing here is an analytics table. There is no event log, no per-message
-- rating, no usage counter: only what is needed to show a learner their own
-- thread and to give Kaz a few turns of context.
--
-- `(select auth.uid())` rather than bare `auth.uid()` is the initplan-cached
-- form; it is evaluated once per statement instead of once per row.

-- ---------------------------------------------------------------- threads
-- One row per learner per lab. `11-capstone` is a lab_slug here exactly as it
-- is in progress, so the Capstone gets its own thread with no special case.
--
-- `help_level` is the Kaz help ladder (1 nudge, 2 hint, 3 explain, 4 show me).
-- It lives on the server side of the boundary on purpose: the level decides
-- how much canonical material is allowed into the model's context, so a
-- learner must not be able to set it by asking the model nicely.
create table if not exists public.aep_web_kaz_threads (
  user_id       uuid not null references auth.users (id) on delete cascade,
  lab_slug      text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  help_level    smallint not null default 1 check (help_level between 1 and 4),
  -- The chunk the current level was earned on. A learner who climbed to "show
  -- me" while stuck on Debug It starts again at a nudge on the next step, so
  -- one hard question does not unlock the rest of the lab.
  help_chunk_id text check (help_chunk_id ~ '^[a-z0-9-]+$'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (user_id, lab_slug)
);

alter table public.aep_web_kaz_threads enable row level security;
alter table public.aep_web_kaz_threads force row level security;
revoke all on public.aep_web_kaz_threads from anon, authenticated;
grant select, insert, update on public.aep_web_kaz_threads to authenticated;

drop policy if exists aep_web_kaz_threads_select_own on public.aep_web_kaz_threads;
create policy aep_web_kaz_threads_select_own on public.aep_web_kaz_threads
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists aep_web_kaz_threads_insert_own on public.aep_web_kaz_threads;
create policy aep_web_kaz_threads_insert_own on public.aep_web_kaz_threads
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists aep_web_kaz_threads_update_own on public.aep_web_kaz_threads;
create policy aep_web_kaz_threads_update_own on public.aep_web_kaz_threads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop trigger if exists aep_web_kaz_threads_touch on public.aep_web_kaz_threads;
create trigger aep_web_kaz_threads_touch before update
  on public.aep_web_kaz_threads
  for each row execute function public.aep_web_touch_updated_at();

-- --------------------------------------------------------------- messages
-- The turns of one thread, oldest first.
--
-- `user_id` and `lab_slug` are carried on the message itself rather than a
-- thread id, so every policy below is the same one-line ownership check the
-- rest of the schema uses, with no join to authorise a read. The foreign key
-- to the thread keeps the two consistent.
--
-- No update and no delete grant: a conversation is an append-only record of
-- what was actually said. A learner deleting their account removes it all
-- through the cascade.
--
-- There is deliberately no `metadata` column. An untyped bag next to a
-- conversation is where sanitized workflow and execution data would quietly
-- accumulate, and none of it needs to be stored to answer the next question.
create table if not exists public.aep_web_kaz_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  lab_slug   text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  role       text not null check (role in ('learner', 'kaz')),
  content    text not null check (length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  foreign key (user_id, lab_slug)
    references public.aep_web_kaz_threads (user_id, lab_slug) on delete cascade
);

create index if not exists aep_web_kaz_messages_thread_idx
  on public.aep_web_kaz_messages (user_id, lab_slug, created_at, id);

alter table public.aep_web_kaz_messages enable row level security;
alter table public.aep_web_kaz_messages force row level security;
revoke all on public.aep_web_kaz_messages from anon, authenticated;
grant select, insert on public.aep_web_kaz_messages to authenticated;

drop policy if exists aep_web_kaz_messages_select_own on public.aep_web_kaz_messages;
create policy aep_web_kaz_messages_select_own on public.aep_web_kaz_messages
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists aep_web_kaz_messages_insert_own on public.aep_web_kaz_messages;
create policy aep_web_kaz_messages_insert_own on public.aep_web_kaz_messages
  for insert to authenticated with check (user_id = (select auth.uid()));
