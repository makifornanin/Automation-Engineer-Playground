# AEP Phase 11 — Aim Point 1 Live Supabase Verification

> Purpose: hold the criteria that a real Supabase project is required to prove.
> Everything here is currently **not tested**. Nothing in this file may be ticked
> without actually exercising a live Auth server.

## Owner decision — RESOLVED 2026-09-11

`web/.env.local` cannot be created until this is answered:

- [x] **Does the website use the labs' existing Supabase project, or a separate one?**

Code is identical either way — only the values in `web/.env.local` differ.

**Decision, recorded verbatim:** "The AEP website reuses the existing AEP Supabase
project while keeping website-specific application data logically isolated from Labs
and Capstone."

The recommendation below is **SUPERSEDED** by this decision but **RETAINED for the
record.** The risk it named — a leak of the labs' service-role key also compromising
learner authentication — is real. It is accepted by this decision and mitigated, not
eliminated: this Aim Point introduces no service-role client for the website (none
exists yet in either Aim Point 1 or Aim Point 2), website application data will be kept
in logically isolated tables/naming rather than mixed with `processed_events`,
`dlq_events` and `approval_requests`, and the anon/publishable key the website actually
uses is public by design either way — Row Level Security, not project separation, is
what has to hold the line on every table the website reads or writes. No project is
configured yet, so `web/.env.local` still does not exist and this remains untested
against a live Auth server; only the open *question* is resolved.

Recommendation on record, superseded but retained for the record: **a separate
project.** The labs' project already holds
`processed_events`, `dlq_events` and `approval_requests`, and its service-role key is
in the root `.env` and configured inside n8n. If the website shares that project, a leak
of the labs' service-role key also compromises learner authentication. A separate
project makes that coupling impossible, and the free tier allows two.

## BLOCKING PRECONDITION — enable RLS on the lab tables first

> **Do not create `web/.env.local` with real values, and do not generate the website's
> anon key, until this section is done.** This is a gate, not a follow-up.

The reuse decision creates a real exposure. Five lab tables were created by raw
`create table` SQL, and there is **no `enable row level security` or `create policy`
anywhere in the repo**. Supabase auto-enables RLS only for tables made in the Table
Editor UI; SQL-created tables have it **off**, and `anon`/`authenticated` get default
grants on `public`. The moment `NEXT_PUBLIC_SUPABASE_ANON_KEY` ships, it is inlined into
the browser bundle — public and permanent — so anyone with devtools could query
`processed_events`, `lab07_business_actions`, `dlq_events`, `execution_logs` and
`approval_requests` directly through PostgREST, bypassing the website entirely.

This is safe to fix because **n8n connects with the Service Role Secret**
(`docs/environment-setup.md` §B.3), which bypasses RLS by design. Enabling RLS with no
policies blocks anonymous access while leaving every Supabase node in Labs 07, 08 and 10
working.

> **Do not work from a fixed table list.** The repo knows of five lab tables, but
> `capstone/` and `database/` contain only `.gitkeep` — the Capstone was verified against
> real Supabase tables whose SQL was never exported here. Any table this repo cannot see
> is still exposed. **Audit what the project actually has, not what the repo remembers.**

- [ ] **1. List every table and its RLS state — unfiltered.**
      ```sql
      select tablename, rowsecurity from pg_tables
      where schemaname = 'public' order by 1;
      ```
      Expect `rowsecurity = false` widely. Record the **actual** list — it is the working
      inventory for steps 2 and 3, and it will likely include Capstone tables absent from
      this repo. Known from the labs: `processed_events`, `lab07_business_actions`,
      `dlq_events`, `execution_logs`, `approval_requests`. (Note `docs/environment-setup.md`
      §B.4 lists only four and omits `execution_logs` — another reason not to trust a list.)
- [ ] **2. Check what `anon` can actually do** — this decides whether the exposure is
      read-only or also write.
      ```sql
      select grantee, table_name, privilege_type from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon','authenticated') order by 2, 1;
      ```
- [ ] **3. Enable RLS with zero policies on every table from step 1** (requires explicit
      owner approval — it is a database change). Run them **one at a time**, not as a
      batch: a single `alter table` naming a table that does not exist aborts the whole
      batch and leaves the rest untouched.
      ```sql
      alter table <each_table_from_step_1> enable row level security;
      ```
- [ ] **4. Confirm in the running n8n instance** that every Supabase node in Labs 07/08/10
      uses the Service Role credential. The repo documents this, but only a live check
      proves the deployed wiring matches.
- [ ] **5. Re-run Labs 07, 08 and 10** and confirm they still pass after RLS is on.
- [ ] **6. Supabase Security Advisor** (Advisors → Security): no remaining
      `rls_disabled_in_public` findings.
- [ ] **7. Authentication → Providers → Email:** confirm public sign-up is **disabled**.
      AEP is invite-only; if self-signup is on, anyone can enrol regardless of app code.
- [ ] **8. Authentication → URL Configuration:** Site URL and Redirect Allow List set for
      the website origin (needed before magic links work in a later Aim Point).

Every future `aep_*` table ships with RLS enabled and explicit owner-scoped policies from
its first migration. No table ships with RLS off "temporarily".

## Then confirm before filling in values

- [ ] Key style. The variable is currently named `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the
      dashboard issues `sb_publishable_…` / `sb_secret_…` instead of the legacy
      `anon` / `service_role` JWTs, rename it to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      in `web/src/lib/supabase/env.ts` and `web/.env.example` **together** — the name is
      baked into an inlined literal.
- [ ] `web/.env.local` is written as **UTF-8**. The root `.env` is UTF-16LE; Node's
      parser will mangle a UTF-16 file.
- [ ] `web/.env.local` is git-ignored and not staged.

## Setup

```bash
cd web
# create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Create one test user by hand in the Supabase dashboard (Auth → Users). Aim Point 1 has
no invite or magic-link UI — that is Step 2.

## L1 — Unauthenticated redirect

- [ ] Signed out, visiting `/` redirects to `/sign-in`.
- [ ] Same for `/labs`, `/notes`, `/kaz`, `/settings`, `/admin`.
- [ ] No flash of the app shell before the redirect.
- [ ] No redirect loop.
- [ ] `/sign-in` itself renders and stays put.

## L2 — Authenticated resolution

- [ ] With a real session, `/` renders the app.
- [ ] Home greets by the derived display name (`full_name` → email local part → `Learner`).
- [ ] The dock renders with the session's role.

## L3 — Role from `app_metadata` (replaces Phase 10 checklist §10)

In the Supabase dashboard, on the test user, set Raw App Meta Data `role` to `admin`:

- [ ] The Admin dock item appears.

Remove it again:

- [ ] The Admin dock item disappears.

Then, as a control, set **`user_metadata.role = "admin"`** (Raw User Meta Data) with no
`app_metadata.role`:

- [ ] The Admin item does **NOT** appear, and the session resolves as `student`.
      This is the escalation the design exists to prevent. Unit-tested already; confirm
      it live.

## L4 — `/admin` is still reachable by a signed-in student — CONFIRM IN WRITING

- [ ] While signed in as a **student**, `/admin` opens by direct URL.

This is expected and correct for Aim Point 1. Role enforcement is Phase 11 Step 3.
Record the result in writing below — do not silently tick it.

```text
Result:
```

## L5 — Cookie attributes

In devtools → Application → Cookies:

- [ ] The Supabase auth cookie is `HttpOnly`.
- [ ] Over HTTPS it is `Secure`.
- [ ] `SameSite` is set (not blank).
- [ ] Session survives a full browser restart.

## L6 — Token refresh

Wait past the access-token TTL (Supabase default 3600s), or lower it in the dashboard:

- [ ] The next request refreshes transparently.
- [ ] No sign-out.
- [ ] No redirect loop.
- [ ] The rotated cookie reaches the browser (value changes in devtools).

This is the half of the middleware cookie path that unit tests cannot reach.

## L7 — Supabase unreachable

Block the Supabase host (hosts file, or devtools request blocking):

- [ ] Requests resolve as anonymous and redirect to `/sign-in`.
- [ ] No 500.
- [ ] **Cookies are NOT cleared** — a brief outage must not force-sign-out every learner.
- [ ] Once unblocked, the existing session works again without re-authenticating.

## L8 — No Supabase env at all

Remove `web/.env.local`, restart:

- [ ] The app renders the signed-out state.
- [ ] The server log shows the sanitized warning once, naming only the two variable
      names — no URL, no key, no prefix, no length.
- [ ] No crash, no 500.

## Also unblocked at this point

- [ ] Run `AEP-PHASE-10-AIM-POINT-1-BROWSER-QA.md` in full. It is blocked until a real
      session exists, because every `(app)` route now requires one.

## Carried debt this checklist does not cover

- Real token-expiry refresh is L6 above. The pure-logic half of the middleware cookie
  path (dual-write to request and response, `options` forwarding, `headers` forwarding,
  redirect cookie copy) is unit-tested and does not need a live project.
- `middleware.ts` → `proxy.ts` (Next 16 deprecation) is done, in Aim Point 2. The rename
  is **not** runtime-neutral: `node_modules/next/dist/build/entries.js` shows
  `isProxyFile` routing to `onServer()` (Node.js) unconditionally, while
  `isMiddlewareFile` only reaches `onServer()` when `pageRuntime === "nodejs"` and
  otherwise takes `onEdgeServer()`. This file exported no `runtime`, so it ran on the
  Edge runtime as `middleware.ts` and now runs on the Node.js runtime as `proxy.ts`. The
  build's `ƒ Proxy (Middleware)` label is unchanged either way and is purely cosmetic —
  it proves nothing about which runtime executed. The actual evidence is
  `web/.next/server/functions-config-manifest.json`
  (`functions["/_middleware"].runtime === "nodejs"`) and the emptied
  `middleware-manifest.json` (no Edge bundle). Re-proven empirically, not just by
  reading types: `GET /sign-in-help` — a path with no App Router segment, so no layout
  runs and `requireSession()` cannot fire — returned `307` to `/sign-in` both before and
  after the rename, which is only possible if the file actually executes; a
  non-executing file would 404 there instead. See
  `docs/superpowers/plans/2026-09-11-aep-phase-11-aim-point-2-proxy-migration.md`.

# Final Verdict

- [ ] PASS
- [ ] PASS WITH NOTES
- [ ] FAIL

```text
Supabase project: shared with Labs (decided 2026-09-11)
Browser / OS:
Blocking issues:
Non-blocking notes:
```
