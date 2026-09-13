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

## PRECONDITION — lab-table hardening — DONE 2026-09-11

> **Status: applied.** Kept below for the record; the checkboxes are the procedure that
> was followed, not outstanding work.

**Audit result.** Seven tables exist in `public`, and RLS was **already enabled on all
seven** with **no policies** — which is default-deny, so `anon` and `authenticated` could
already read nothing from them:

`aep_connection_test`, `approval_requests`, `dlq_events`, `execution_logs`,
`lab07_business_actions`, `processed_events`, `service_actions`

**Correction to the earlier analysis, recorded rather than quietly dropped.** This document
previously asserted those tables were exposed, inferring RLS-off from the repo containing no
`enable row level security` statement. The audit disproved that inference. The broad
`anon`/`authenticated` grants the audit found were **latent, not live** — RLS was already
holding the line. Evidence beat inference, and the inference was wrong.

**Applied anyway, as defence in depth:** all table privileges revoked from `anon` and
`authenticated` on those seven tables. `service_role` untouched. No rename, no drop, no
restructure, no data change. Verified by re-running the grant audit — zero rows.

**Default ACLs deliberately NOT modified.** The public-schema defaults for `postgres` and
`supabase_admin` do grant broadly to `anon`/`authenticated` for future objects, and there
are no `defaclnamespace = 0` rows. Changing them would alter behaviour for a project shared
by the website, the Labs and the Capstone. Security for website tables is handled per-table
instead — see "Website table security rule" in `docs/environment-setup.md`.

### Remaining gates before `web/.env.local` gets real values

**Capstone regression — RUN 2026-09-13, all four paths PASS.** Driven through the n8n MCP
against the live instance; the execution ids below are the evidence.

- [x] **Capstone Supabase nodes hold a genuine service-role credential.** Proven by
      behaviour, not by credential type — the n8n credential *type* is `supabaseApi`
      whichever key it wraps, so the type does not discriminate and is not evidence. The
      four runs below wrote to and read from `processed_events`, `execution_logs`,
      `service_actions`, `approval_requests` and `dlq_events`, every one of which has RLS
      enabled, zero policies, and zero `anon`/`authenticated` grants. Only a `BYPASSRLS`
      key can do that. Credential in use: **AEP Supabase**. No value was inspected or
      printed.
- [x] **Capstone live regression after the revoke** — unchanged, as expected:
      - safe automatic path — execution `4853` → Gemini `create_support_ticket`
        (confidence 1.0) → `can_auto_execute` → sub-execution `4854` → `action_executed`,
        `processed_events` marked `processed`
      - restricted → pending approval — execution `4855` → `issue_refund` →
        `guardrail_reason: restricted_action` → `approval_requests` row id `12`, `pending`
      - failure → DLQ — execution `4856` (`scenario: permanent_failure`,
        `max_attempts: 2`) → two 503 attempts → `dlq_events` row id `13`,
        `queued_for_recovery`
      - DLQ recovery — execution `4858` → replayed record `13` through the executor
        (sub-execution `4859`) → `status: recovered`, `recovery_attempts: 1`
- [/] **Lab 07 / 08 / 10 live regression — RUN 2026-09-13 after MCP access was enabled.**
      Recorded separately from the Capstone evidence above. **5 of 7 checks PASS; 2 could
      not be reached — neither failed.**

      **Lab 07 — 2/2 PASS**
      - new event — execution `4862` → `processed_events` `reserved` → `processed`,
        `lab07_business_actions` row id `15`
      - duplicate suppressed — execution `4863`, same `event_id` → `Already Seen?` took
        the duplicate branch and **`Execute Business Action` never ran at all** (absent
        from `runData`, which is the actual proof, not the 200 response)

      **Lab 08 — 2/3 PASS, 1 unreachable**
      - DLQ write — execution `4864` (`scenario: permanent_failure`, `max_attempts: 2`)
        → `dlq_events` row id `14`, `retry_count: 2`
      - execution log write — same execution → `execution_logs` row id `45`,
        `stage: dlq_queued`
      - recovery/reprocess — **NOT RUN.** This branch hangs off a *separate*
        `Start DLQ Recovery` manual trigger. `execute_workflow` always fires a workflow's
        **first webhook trigger** and exposes no way to select a different trigger node,
        so execution `4865` hit `Receive Service Event` instead and returned success on
        the default path. Not evidence either way.

      **Lab 10 — 1/2 PASS, 1 unreachable**
      - pending approval creation — execution `4868` → Gemini `cancel_account`
        (confidence 1.0) → `restricted_action` → `approval_requests` row id `13`,
        `pending`
      - approval/rejection persistence — **NOT RUN**, same trigger-selection limitation:
        `Receive Human Decision` is the workflow's *second* webhook, so execution `4869`
        hit `Receive Service Request` again with no `message` and failed in the output
        parser. That is a wrong-trigger artefact, **not** a regression failure.

      **The two gaps are not reachable without changing lab state.** The ngrok tunnel is
      up (root returns 200) but every lab webhook path returns 404, because all three
      workflows are `active: false` and n8n only registers production webhooks for active
      workflows. Driving them needs either activating the workflow or clicking the trigger
      in the n8n editor — both changes to Lab state, which `CLAUDE.md` Scope Protection
      forbids from a website Aim Point, so neither was done.

      **What the gaps actually leave unproven.** `dlq_events` *update* is already proven by
      the Capstone recovery (execution `4858`). `approval_requests` *update* is **not** —
      the Capstone only ever inserted into that table, and Lab 10's `Mark Approved` /
      `Mark Rejected` are the only post-revoke updates to it. That single operation is the
      one genuine hole in the post-revoke evidence.
- [ ] **Row counts intact** — **could not be measured, for an unrelated reason worth
      recording.** An independent PostgREST read was attempted using
      `SUPABASE_SECRET_KEY` from the root `.env`; it returns `401` with an empty body, and
      a deliberately bogus key returns the byte-identical response. That key is therefore
      stale, truncated or rotated — it is **not** a valid credential for this project.
      Nothing is broken by this: `docs/environment-setup.md` already records that the labs
      do not read `.env` at runtime and that n8n holds the real connection details in its
      own credential store, which is why all seven regression runs above succeeded. But it
      does mean the root `.env` is misleading as the "local reference" it claims to be, and
      that row counts remain an assertion rather than a measurement.
- [ ] Record the above as **LIVE VERIFIED only if those paths were actually exercised.**

> **Execution-history finding, 2026-09-13.** The n8n execution log was searched across
> 2026-09-11T00:00Z → 2026-09-13T10:10Z — 261 executions, every one belonging to an
> unrelated `goha-*` workflow. The most recent Capstone run before today was
> 2026-09-10T03:59Z, *before* the 2026-09-11 revoke. So no AEP path had been exercised
> post-revoke at all, and the regression block reported as complete was an unfilled
> `PASS/FAIL` template. The four Capstone rows above are the first real post-revoke
> evidence, and Labs 07/08/10 remain genuinely unrun.

> A free empirical proof is available: because RLS was already enabled with no policies
> *before* the revoke, any lab that works today is proof its credential holds `BYPASSRLS` —
> i.e. it is genuinely service-role. An anon key would already have been failing.

## DEFERRED SECURITY TASK — `SUPABASE_SECRET_KEY` rotation

```text
TASK:     Rotate SUPABASE_SECRET_KEY (Supabase dashboard) and update the n8n
          "AEP Supabase" credential to the new value.
STATUS:   DEFERRED  (owner decision, 2026-09-13)
DEADLINE: BEFORE production deployment / public release. Not optional.
```

**Do not remove this item until it is done.** It stays on the open security list through
every subsequent Aim Point.

**Why it was deferred, and why that is defensible for local development.** Two reasons were
checked rather than assumed:

1. **The exposed value is not a working credential.** `GET /rest/v1/...` with it returns
   `401` with a body byte-identical to a deliberately bogus key. It is stale, rotated or
   truncated.
2. **The website cannot use it even if it were valid.** Every `process.env` read under
   `web/src` is exactly two variables — `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. There is no `SUPABASE_SECRET_KEY`,
   `SERVICE_ROLE` or `service_role` reference anywhere in the web source except the
   invariant test that *forbids* one, and Next never loads the repo-root `.env` at all.

So this is not a live exposure of a working credential in the website's trust boundary, and
it is **not** a blocker for local Phase 11 work. It remains a real rotation obligation
because the 41-character value may be a truncated prefix of a live key, and because it was
printed into a subagent transcript on 2026-09-13.

**This deferral is conditional.** If evidence ever appears that the website — or any
deployed surface — reads this key, it stops being deferred and becomes blocking again.

## OPEN SECURITY GATES — lifted out of the PRECONDITION block, 2026-09-13

The PRECONDITION block below is headed "DONE" and says its checkboxes are "the procedure
that was followed, not outstanding work". That is true of its steps 1–5. It is **not** true
of steps 6, 7 and 8, which were never performed and were sitting inside a block labelled as
completed history. They are restated here as live, open items.

- [ ] **6. Supabase Security Advisor** (Advisors → Security): no remaining
      `rls_disabled_in_public` findings. No evidence this was ever checked.
- [x] **7. Public sign-up — CHECKED 2026-09-13, and it is a REAL FINDING, not a tick.**
      `GET /auth/v1/settings` on the live project returns:

      ```text
      external.email     : true
      disable_signup     : false     <-- public sign-up is ENABLED
      mailer_autoconfirm : false
      ```

      **AEP is invite-only for V1 (`CLAUDE.md`, Authentication & Authorization Rules), and
      this project currently allows anyone to enrol.** The publishable key is public by
      design and will be inlined into the browser bundle, so once the site ships, anyone
      who reads the bundle can `POST /auth/v1/signup` and create an account. No application
      code can prevent this — it is a project-level Auth setting, and app-side checks are
      not the boundary. `mailer_autoconfirm: false` means the address must be confirmed
      before the session is usable, which limits but does not remove the exposure: the row
      is still created.

      **Owner action, in the dashboard, before any sign-in UI ships:**
      Authentication → Providers → Email → disable public sign-ups. This is a hard
      prerequisite for Phase 11 Step 2 — a `signInWithOtp` call written against a project
      with open signup silently becomes a self-serve registration form. When that call is
      written it must also pass `shouldCreateUser: false`.
- [ ] **8. Authentication → URL Configuration:** Site URL and Redirect Allow List set for
      the website origin. Not yet done; prerequisite for magic links in Step 2.

### The procedure that was followed (retained for the record)

The reuse decision creates a real exposure. Five lab tables were created by raw
`create table` SQL, and there is **no `enable row level security` or `create policy`
anywhere in the repo**. Supabase auto-enables RLS only for tables made in the Table
Editor UI; SQL-created tables have it **off**, and `anon`/`authenticated` get default
grants on `public`. The moment `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ships, it is inlined into
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

- [x] **Key style — RESOLVED 2026-09-13, rename done.** The dashboard shows *both* key
      families on this project, so the original "new format **instead of** legacy" wording
      did not decide it. The owner chose the new-format `sb_publishable_…` key. Rationale
      recorded rather than assumed: the project's own secret key is already `sb_secret_…`
      (not a JWT), so a legacy public key would straddle two key generations; a
      `NEXT_PUBLIC_*` value is inlined into the bundle and therefore public and permanent,
      so shipping the deprecated generation buys a forced migration and a rebuild-to-rotate
      later; and `@supabase/supabase-js@2.116.0` handles the new format more safely —
      verified in the installed bundle, `isNewApiKey()` sends `sb_publishable_`/`sb_secret_`
      in the `apikey` header **only** and never as a Bearer token, while legacy JWTs keep
      the Bearer fallback.

      Renamed `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      across `env.ts`, `env.test.ts`, `browser-client.ts`, `web/.env.example`,
      `docs/environment-setup.md` and this file, together, in one change. The internal
      `SupabaseConfig.anonKey` field was renamed `publishableKey` in the same pass
      (`server-client.ts`, `middleware-client.ts` and their tests) — leaving it called
      `anonKey` would have preserved exactly the naming inaccuracy the rename exists to
      remove. Confirmed live: the L8 sanitized warning now prints the new name.
- [x] `web/.env.local` is written as **UTF-8**, no BOM — first bytes are `23 20 41`
      (`# A`), not `EF BB BF`. Written programmatically rather than copied, because the
      root `.env` is UTF-16LE and Node's parser mangles a UTF-16 file.
- [x] `web/.env.local` is git-ignored (`web/.gitignore:34`) and not tracked
      (`git ls-files` does not match it). `git status` stays clean.

> **Where the key first landed — recorded because the failure mode is instructive.** The
> publishable key was initially pasted into the **root `.env`** as
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not into `web/.env.local`. Next.js only loads env
> files from inside `web/`, so the website would have stayed signed-out with the key
> apparently "configured". It was moved programmatically into `web/.env.local` without the
> value being printed or inspected. **The stray line is still in the root `.env` and should
> be deleted** — it is harmless in itself (the value is public by design) but it puts a
> `NEXT_PUBLIC_*` name directly beside `SUPABASE_SECRET_KEY`, which is precisely the
> adjacency the deliberate name divergence in `docs/environment-setup.md` exists to
> prevent.

## Setup

```bash
cd web
# create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Create one test user by hand in the Supabase dashboard (Auth → Users). Aim Point 1 has
no invite or magic-link UI — that is Step 2.

## L1 — Unauthenticated redirect — PASS 2026-09-13

Run against the **real, configured project** (not the unconfigured path): the server log
contains **zero** "Supabase is not configured" warnings, so `createServerClient()` was
genuinely constructed and `auth.getUser()` was genuinely invoked.

> **Correction — an earlier draft of this section over-claimed, and the over-claim is worth
> keeping visible.** It said L1 proved `getUser()` reached "the live Auth server". It does
> not. `web/node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:2709-2710` returns
> `{ user: null }` with an `AuthSessionMissingError` **before** issuing any request when
> there is no `access_token` and no custom authorization header. L1 runs signed out, so the
> `GET ${url}/user` call was never made. What L1 actually proves is that the **configured
> branch** executed and failed safe to anonymous — which is real, but weaker. Crucially, a
> typo'd project ref or a revoked key would produce a **byte-identical L1 PASS**, because
> `resolveSession()` and `updateSession()` both swallow errors into `anonymous`. This
> project has already been bitten by exactly that failure mode once, with the stale
> `SUPABASE_SECRET_KEY` in the root `.env`.

**Credential pair validated separately — PASS 2026-09-13.** Because L1 cannot prove the
URL/key pair is correct, one read-only unauthenticated request was made to
`GET /auth/v1/settings` with the `apikey` header (no value printed, nothing written):

| request | status |
|---|---|
| with the configured publishable key | **200** |
| with no key at all (control) | 401 |
| with a deliberately bogus `sb_publishable_…` key (control) | 401 |

The two controls are what make the 200 meaningful. `web/.env.local` therefore holds a
genuinely valid URL + publishable key pair for this project, confirmed against the live
GoTrue server. This is the live-verified fact; L1 by itself is not.

- [x] Signed out, visiting `/` redirects to `/sign-in` — `307`.
- [x] Same for `/labs`, `/notes`, `/kaz`, `/settings`, `/admin` — all `307` to `/sign-in`.
- [x] No flash of the app shell before the redirect. Structurally impossible here rather
      than merely unobserved: the response is a `307` with an 8-byte body, so no shell
      HTML is ever sent to flash.
- [x] No redirect loop — following `/` terminates in exactly **1** hop at `200`
      `/sign-in`.
- [x] `/sign-in` itself renders `200` and stays put.
- [x] Proxy-executed control: `GET /sign-in-help` → `307` (no App Router segment, so no
      layout can fire `requireSession()` — only the proxy can produce this).
- [x] Matcher-bypass control: `GET /favicon.ico` → `200`, no redirect.
- [x] No `500`, no unhandled error in the server log.

## L2–L7 — BLOCKED 2026-09-13 on one missing prerequisite: a real Auth user

Everything from L2 to L7 requires an actual signed-in session. Aim Point 1 ships **no**
sign-in UI — `/sign-in` is a static placeholder and `browser-client.ts` is imported by
nothing — so a session cannot be created from inside the app. The project is otherwise
fully configured and reachable; this is the only thing standing in the way. Creating a
user is an owner action in the Supabase dashboard, not something to automate from here.

**Session projection (no tokens/credentials) — structurally verified, live check pending.**
`toSessionUser()` in `web/src/lib/session/map-user.ts` returns a **closed object literal**
of exactly `{ id, role, displayName }` — no spread, no `...user`, so no access token,
refresh token, `app_metadata` or `user_metadata` object can reach the browser-visible RSC
payload even by accident. `web/src/lib/session/map-user.test.ts:52` asserts
`Object.keys(sessionUser).sort()` equals `["displayName", "id", "role"]`, which fails the
moment a field is added. The `Session` type itself admits no other shape. Confirming the
same on a real authenticated RSC payload is part of L2 and stays open until a user exists.

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

## L8 — No Supabase env at all — PASS 2026-09-13

`web/.env.local` was moved aside entirely (not blanked) and the server restarted with
**`next dev`** on a clean port; the file was restored afterwards and re-verified as UTF-8,
non-empty and git-ignored.

> **The command matters, and using the wrong one gives a silent false pass.** This must be
> run with `next dev`, or with a `next build` performed *after* the env file is removed.
> Running `next start` against a bundle that was built while real credentials were present
> will log **zero** warnings and still serve correct redirects — looking exactly like a
> pass while testing nothing. The cause is the behaviour `env.ts` is deliberately written
> around: Next inlines literal `process.env.NEXT_PUBLIC_X` member expressions at build
> time, so the values are already baked into the compiled output and the missing-config
> branch is never reached. Both commands were tried here and do produce opposite results;
> the PASS below is the `next dev` run.

- [x] The app renders the signed-out state — `/` → `307` to `/sign-in`, `/sign-in` →
      `200`.
- [x] The server log shows the sanitized warning **exactly once** (`grep -c` = 1):
      `Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); all sessions resolve as anonymous.`
      Scanned for `https?://…` and `sb_[a-z]+_…` patterns — no URL, no key, no prefix, no
      length. This run also doubles as live proof that the rename reached the runtime
      warning string, not just the source.
- [x] No crash, no 500.

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
- [x] PASS WITH NOTES — **partial: L1 and L8 only.** L2–L7 are not judged here; they were
      never run and remain blocked.
- [ ] FAIL

```text
Supabase project: shared with Labs (decided 2026-09-11); configured 2026-09-13
Credential pair:  VALID - GET /auth/v1/settings 200 with key, 401 with none and with bogus
Browser / OS:     no browser used. Windows 11, Node 24.x, next dev + curl/Invoke-WebRequest.
                  L2-L7 need a real browser session and have not been attempted.

Blocking issues (must close before Aim Point 2 is called complete):
  1. Public sign-up is ENABLED (disable_signup: false) on an invite-only product.
     Owner action in the Supabase dashboard. Hard prerequisite for Step 2.
  2. No way to create a session exists in the app (no sign-in form, no route handler,
     no auth callback), so L2-L7 cannot be run at all. Needs Phase 11 Step 2.

Non-blocking notes:
  - L1 does NOT prove the credential pair; that is proven separately above. Earlier
    wording over-claimed and has been corrected in place rather than quietly edited.
  - L8 must be run with `next dev` (or a build made after removing the env file).
    `next start` on a stale bundle gives a silent false pass.
  - Lab 08 recovery and Lab 10 approval persistence: NOT RUN, not failed. Behind trigger
    nodes the n8n MCP cannot select; reaching them would require changing Lab state.
  - `approval_requests` UPDATE is the one post-revoke operation still unproven.
  - Row counts unmeasured: the root .env SUPABASE_SECRET_KEY is stale/invalid (401,
    byte-identical to a bogus key), so an independent PostgREST read was not possible.
  - Root .env stray NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY line: REMOVED 2026-09-13.
    Real website values now live only in web/.env.local.
  - A QA subagent printed real key values into its transcript during this session.
    Disclosed, not hidden. SUPABASE_SECRET_KEY rotation is DEFERRED by owner decision
    to before production deployment - see the DEFERRED SECURITY TASK section above.
    Evidence supports the deferral: the value is already non-working, and the website
    reads only the two NEXT_PUBLIC_* variables.
  - Security Advisor check and Auth URL/redirect configuration: still not done.
```
