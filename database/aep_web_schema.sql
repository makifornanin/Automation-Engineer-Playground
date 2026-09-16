-- AEP website learner state.
--
-- Run this in the Supabase SQL Editor. It is idempotent: re-running it is safe.
--
-- Prefixed `aep_web_` so website data stays logically isolated from the Labs
-- and Capstone tables that share this Supabase project (processed_events,
-- dlq_events, approval_requests, execution_logs, ...). Those are n8n-owned
-- teaching tables with RLS enabled and no policies; do NOT copy their style
-- here. These four are browser-reachable through the learner's own session,
-- so every one of them follows the six-step rule in docs/environment-setup.md:
--
--   1. create the table
--   2. enable row level security immediately - never "temporarily" off
--   3. revoke inherited privileges from anon and authenticated
--   4. grant back only the operations actually required
--   5. create explicit owner-scoped policies on auth.uid()
--   6. verify anonymous and authenticated behaviour against the real table
--
-- Step 3 is not redundant with step 2: public-schema default ACLs grant
-- broadly to anon/authenticated for FUTURE tables, so a new table inherits
-- privileges the moment it is created. Those defaults are deliberately left
-- alone because the Labs and Capstone share this project.
--
-- There is deliberately NO admin or owner read policy anywhere in this file.
-- Vision section 8: "The owner does not need student progress monitoring."
-- AEP stores progress to personalise the learner's own experience and Kaz,
-- not to supervise anyone.
--
-- `(select auth.uid())` rather than bare `auth.uid()` is the initplan-cached
-- form; it is evaluated once per statement instead of once per row.

create or replace function public.aep_web_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- progress
-- One row per learner per lab. Written on nearly every chunk advance, so it
-- is kept deliberately narrow.
create table if not exists public.aep_web_lab_progress (
  user_id          uuid not null references auth.users (id) on delete cascade,
  lab_slug         text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  current_chunk_id text check (current_chunk_id ~ '^[a-z0-9-]+$'),
  completed_at     timestamptz,
  started_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, lab_slug)
);

alter table public.aep_web_lab_progress enable row level security;
alter table public.aep_web_lab_progress force row level security;
revoke all on public.aep_web_lab_progress from anon, authenticated;
grant select, insert, update on public.aep_web_lab_progress to authenticated;

drop policy if exists aep_web_lab_progress_select_own on public.aep_web_lab_progress;
create policy aep_web_lab_progress_select_own on public.aep_web_lab_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_progress_insert_own on public.aep_web_lab_progress;
create policy aep_web_lab_progress_insert_own on public.aep_web_lab_progress
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_progress_update_own on public.aep_web_lab_progress;
create policy aep_web_lab_progress_update_own on public.aep_web_lab_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop trigger if exists aep_web_lab_progress_touch on public.aep_web_lab_progress;
create trigger aep_web_lab_progress_touch before update
  on public.aep_web_lab_progress
  for each row execute function public.aep_web_touch_updated_at();

-- ------------------------------------------------------------ chunk state
-- Per-chunk evidence and hint usage. A row with a non-null `evidence` IS a
-- Vision section 3 milestone - "progress earned through meaningful learning
-- evidence", not a Mark Complete button.
--
-- Merged with hint counts rather than split into a fifth table: both are keyed
-- identically by (user, lab, chunk), and a separate table would buy nothing.
create table if not exists public.aep_web_lab_chunk_state (
  user_id     uuid not null references auth.users (id) on delete cascade,
  lab_slug    text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  chunk_id    text not null check (chunk_id ~ '^[a-z0-9-]+$'),
  evidence    text check (evidence in ('acknowledged', 'predicted', 'verified')),
  hints_used  smallint not null default 0 check (hints_used between 0 and 10),
  recorded_at timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, lab_slug, chunk_id)
);

alter table public.aep_web_lab_chunk_state enable row level security;
alter table public.aep_web_lab_chunk_state force row level security;
revoke all on public.aep_web_lab_chunk_state from anon, authenticated;
grant select, insert, update on public.aep_web_lab_chunk_state to authenticated;

drop policy if exists aep_web_lab_chunk_state_select_own on public.aep_web_lab_chunk_state;
create policy aep_web_lab_chunk_state_select_own on public.aep_web_lab_chunk_state
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_chunk_state_insert_own on public.aep_web_lab_chunk_state;
create policy aep_web_lab_chunk_state_insert_own on public.aep_web_lab_chunk_state
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_chunk_state_update_own on public.aep_web_lab_chunk_state;
create policy aep_web_lab_chunk_state_update_own on public.aep_web_lab_chunk_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop trigger if exists aep_web_lab_chunk_state_touch on public.aep_web_lab_chunk_state;
create trigger aep_web_lab_chunk_state_touch before update
  on public.aep_web_lab_chunk_state
  for each row execute function public.aep_web_touch_updated_at();

-- --------------------------------------------------------------- webhooks
-- The learner's own n8n webhook URL, per lab (Vision section 25: configure
-- once, reuse for every test in that lab).
--
-- A separate table from progress despite being 1:1 with it, and that is a
-- deliberate blast-radius split rather than normalisation dogma. This column
-- is the single highest-risk learner-controlled value in the product: it feeds
-- a server-side fetch. Isolating it means the Send Test path reads one table
-- under one policy, and "clear every stored webhook" is one DELETE that cannot
-- touch a learner's evidence.
--
-- The https-only CHECK is defence in depth. The authoritative validation is
-- validateLearnerWebhookUrl() in the server action; this stops a row written
-- before a validation fix from being trusted afterwards.
create table if not exists public.aep_web_lab_webhooks (
  user_id        uuid not null references auth.users (id) on delete cascade,
  lab_slug       text not null check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),
  webhook_url    text not null
                 check (webhook_url like 'https://%' and length(webhook_url) <= 2048),
  last_tested_at timestamptz,
  updated_at     timestamptz not null default now(),
  primary key (user_id, lab_slug)
);

alter table public.aep_web_lab_webhooks enable row level security;
alter table public.aep_web_lab_webhooks force row level security;
revoke all on public.aep_web_lab_webhooks from anon, authenticated;
grant select, insert, update, delete on public.aep_web_lab_webhooks to authenticated;

drop policy if exists aep_web_lab_webhooks_select_own on public.aep_web_lab_webhooks;
create policy aep_web_lab_webhooks_select_own on public.aep_web_lab_webhooks
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_webhooks_insert_own on public.aep_web_lab_webhooks;
create policy aep_web_lab_webhooks_insert_own on public.aep_web_lab_webhooks
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_webhooks_update_own on public.aep_web_lab_webhooks;
create policy aep_web_lab_webhooks_update_own on public.aep_web_lab_webhooks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists aep_web_lab_webhooks_delete_own on public.aep_web_lab_webhooks;
create policy aep_web_lab_webhooks_delete_own on public.aep_web_lab_webhooks
  for delete to authenticated using (user_id = (select auth.uid()));

drop trigger if exists aep_web_lab_webhooks_touch on public.aep_web_lab_webhooks;
create trigger aep_web_lab_webhooks_touch before update
  on public.aep_web_lab_webhooks
  for each row execute function public.aep_web_touch_updated_at();

-- ------------------------------------------------------------------ notes
-- One table with a nullable lab_slug: null means a general note. Two tables
-- for one entity differing by one nullable column would be duplication.
create table if not exists public.aep_web_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  lab_slug   text check (lab_slug ~ '^[0-9]{2}-[a-z0-9-]+$'),  -- null = general
  body       text not null default '' check (length(body) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aep_web_notes_user_updated_idx
  on public.aep_web_notes (user_id, updated_at desc);

alter table public.aep_web_notes enable row level security;
alter table public.aep_web_notes force row level security;
revoke all on public.aep_web_notes from anon, authenticated;
grant select, insert, update, delete on public.aep_web_notes to authenticated;

drop policy if exists aep_web_notes_select_own on public.aep_web_notes;
create policy aep_web_notes_select_own on public.aep_web_notes
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists aep_web_notes_insert_own on public.aep_web_notes;
create policy aep_web_notes_insert_own on public.aep_web_notes
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists aep_web_notes_update_own on public.aep_web_notes;
create policy aep_web_notes_update_own on public.aep_web_notes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists aep_web_notes_delete_own on public.aep_web_notes;
create policy aep_web_notes_delete_own on public.aep_web_notes
  for delete to authenticated using (user_id = (select auth.uid()));

drop trigger if exists aep_web_notes_touch on public.aep_web_notes;
create trigger aep_web_notes_touch before update
  on public.aep_web_notes
  for each row execute function public.aep_web_touch_updated_at();

-- ----------------------------------------------------------- verification
-- After running the above, confirm isolation with a SECOND signed-in learner:
-- they must see zero rows belonging to the first. That check cannot be
-- inferred from the policy text and is the only thing that proves RLS works.
