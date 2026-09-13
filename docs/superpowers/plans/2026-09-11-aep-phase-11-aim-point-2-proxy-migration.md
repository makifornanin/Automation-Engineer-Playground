# Phase 11 — Aim Point 2, Part 1: Proxy Migration + Supabase Project Decision

Date: 2026-09-11
Status: implemented 2026-09-11
Preceding work: Phase 11 Aim Point 1 (Supabase Web Foundation + Real Session
Architecture), plan `docs/superpowers/plans/2026-09-11-aep-phase-11-aim-point-1-supabase-session-foundation.md`

## Goal

Close the two carried-debt items Aim Point 1 left open that do not require a live
Supabase project:

1. Rename `web/src/middleware.ts` → `web/src/proxy.ts` for the Next 16 `proxy` file
   convention, and empirically re-prove the file still executes rather than assuming the
   rename is semantically free.
2. Record the owner's resolution of the Supabase project-reuse question in the docs that
   carried it as open.

No live Supabase work. No project is configured yet; `web/.env.local` does not exist
before or after this Aim Point.

## Non-goals

Creating any `aep_*` table, migration, or RLS policy. Touching any lab table. Creating a
service-role/admin client. Building sign-in, magic-link, invite, or onboarding UI.
Changing anything visual. Renaming `web/src/lib/supabase/middleware-client.ts` or
`updateSession()` — that module is a Supabase-SSR convention helper, not a Next file
convention, and renaming it would enlarge the diff for no benefit.

## Two source-verified facts

Confirmed directly against the installed `next@16.3.4` before writing any code — not
re-derived from documentation:

1. **The rename changes runtime, not just the file name.**
   `node_modules/next/dist/build/entries.js` (`runDependingOnPageType`):
   `isProxyFile(page)` routes unconditionally to `params.onServer()` (Node.js).
   `isMiddlewareFile(page)` routes to `params.onServer()` only when
   `params.pageRuntime === "nodejs"`; otherwise it takes `params.onEdgeServer()`. The
   pre-rename `middleware.ts` exported no `runtime`, so it ran on the **Edge** runtime.
   After the rename to `proxy.ts` it runs on the **Node.js** runtime. The build output's
   `ƒ Proxy (Middleware)` label is identical either way and is cosmetic — it does not
   indicate which runtime actually executed.
2. **A `proxy` file cannot opt out.** `get-page-static-info.js` throws (error code
   `E1031`) if a `proxy` file exports `runtime` — there is no way to keep it on Edge.
   Separately, the file must export a single function, default or named `proxy`
   (`E903` otherwise) — a build-time failure, loud and safe. The wrong **file location**
   fails silently instead, which is why Task 3 below re-proves execution empirically
   rather than trusting that the build succeeded.

`config.matcher` shape and semantics are unchanged by the rename.

## Decision recorded (docs only, no code)

Supabase project for the website, resolving the open question Aim Point 1 left in
`docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`:

> The AEP website reuses the existing AEP Supabase project while keeping
> website-specific application data logically isolated from Labs and Capstone.

The earlier separate-project recommendation is superseded by this decision but retained
in `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md` for the record, along with an explicit
statement of the risk it named, and how that risk is accepted and mitigated under the
shared-project decision (isolated tables/naming, no service-role client yet, RLS as the
actual protection). Nothing here creates a table, a migration, or an RLS policy — this
is a documentation-only decision record.

## Tasks

### Task 1 — Baseline
`npm run verify` from `web/` must exit 0 before any change. Record the exact deprecation
warning line the build currently prints, so its disappearance after the rename is a
verifiable delta rather than an impression.

### Task 2 — Pre-rename probe (unconfigured-path only)
Create `web/.env.local` with syntactically valid but fake values
(`NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key-for-probe-only`), start `next dev`, and
request `/`. This exercises `createServerClient()` under the pre-rename Edge runtime to
check for an open risk: `@supabase/realtime-js`'s `WebSocketFactory` classifies Edge as
`unsupported` and can throw if no global `WebSocket` exists, and `supabase-js` is
constructed eagerly by `createServerClient()` — outside the `try/catch` that only wraps
`auth.getUser()`. This risk is invisible in the codebase today only because no project is
configured and `updateSession()` returns early on `null` config. Delete
`web/.env.local` immediately after recording the result; never leave it in the tree.

### Task 3 — Rename
- `web/src/middleware.ts` → `web/src/proxy.ts` (move, not copy — both files existing
  simultaneously is a hard Next build error). Exported function renamed
  `middleware` → `proxy`; signature, body and return type unchanged. `config.matcher`
  unchanged byte for byte. JSDoc updated to say "the proxy runs at all" instead of
  "middleware runs at all", plus one added sentence recording that a proxy file always
  runs on Node.js and cannot export `runtime`.
- `web/src/middleware.test.ts` → `web/src/proxy.test.ts`. Import and all three call
  sites updated from `middleware` to `proxy`. Local helper `middlewareRunsOn` renamed
  `proxyRunsOn`; `describe`/`it.each` titles updated so failure output stays honest about
  what ran.
- Comment corrections for statements that become false after the rename:
  `web/src/lib/auth/protected-routes.ts` (imported by both files, both now Node.js, not
  "edge" + "Node"); `web/src/lib/supabase/server-client.ts` (`middleware.ts` →
  `proxy.ts`); `web/src/lib/auth/guards.ts` and
  `web/src/app/(auth)/sign-in/page.tsx` (optional consistency, applied because both
  comments name the top-level proxy file specifically, not `middleware-client.ts`).
  `web/src/lib/supabase/env.ts` line naming "server/middleware/browser" paths is left
  unchanged — it names the three client modules (`server-client.ts`,
  `middleware-client.ts`, `browser-client.ts`), and `middleware-client.ts` is
  deliberately not renamed.

### Task 4 — Prove the proxy actually runs
A `307` from `/` or `/admin` alone proves nothing: `requireSession()` in
`(app)/layout.tsx` produces the identical redirect for an entirely different reason (no
session), so a silently non-executing proxy and a working one look the same at those
paths. The discriminator is `GET /sign-in-help` — not a route under `web/src/app/`, so
no layout runs and `requireSession()` cannot fire. The matcher's `sign-in(?:/|$)`
deliberately does not exclude it, and `isProtectedPath("/sign-in-help")` is `true`:
- Proxy running → `307` to `/sign-in`.
- Proxy not running → `404` (the silent-failure signature).

Negative control: `GET /favicon.ico` must not redirect (matcher bypass intact). Also
confirm `/`, `/labs`, `/notes`, `/kaz`, `/settings`, `/admin` → `307` to `/sign-in`;
`/sign-in` → `200`; no redirect loop. Proof method: temporarily add
`response.headers.set("x-aep-proxy", "1")` in `proxy.ts`, confirm with `curl -I` on both
the redirect and pass-through paths, then remove it before committing — a header is
observable without log noise and cannot accidentally print request data.

### Task 5 — Post-rename probe
Repeat Task 2 under the renamed file (now running on Node.js). Record both probe results
side by side. Delete `web/.env.local` again afterwards.

### Task 6 — Structural verification
`npm run verify` exits 0; the build's deprecation warning line is gone; `middleware.ts`
/ `middleware.test.ts` no longer exist and `proxy.ts` / `proxy.test.ts` do;
`web/.next/server/functions-config-manifest.json` shows
`functions["/_middleware"].runtime === "nodejs"`;
`web/.next/server/middleware-manifest.json` no longer carries a populated Edge bundle;
`grep -rn "middleware\.ts" web/src` returns nothing; `npm run build` exits 0 with no
Supabase env set; `git diff --stat HEAD -- labs capstone database sample-data scripts`
is empty; no diff under `web/src/app/`, `web/src/components/`, `web/src/lib/theme/`
beyond a comment-only line; all 119 tests across 15 files still pass with the same
assertions (a changed assertion, as opposed to a renamed identifier, is a defect signal).

### Task 7 — Docs
Update `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md` (owner decision resolved, original
recommendation retained and marked superseded, carried-debt bullet updated with the
runtime finding and the `/sign-in-help` proof, key-style/UTF-8/gitignore checkboxes left
unticked, final-verdict prompt updated), `docs/environment-setup.md` (decision recorded,
anon-key comment updated), `ROADMAP.md` Phase 11 Current Status (historical "blocked —"
bullet text preserved, a "Resolved 2026-09-11" note appended after it, "Forward item"
paragraph amended to record the runtime finding), and the Aim Point 1 plan's decisions
table (row 1 appended with a supersession note, original text preserved).

## Verification

From `C:\Users\Mark\Documents\AEP Project\web`:

```bash
npm run verify
npm run build
grep -rn "middleware\.ts" src
```

Structural checks:

- **S1** `npm run verify` exits 0.
- **S2** Build output no longer contains `'The "middleware" file convention is
  deprecated'`.
- **S3** `middleware.ts` / `middleware.test.ts` gone; `proxy.ts` / `proxy.test.ts` exist.
- **S4** `functions-config-manifest.json` → `functions["/_middleware"].runtime ===
  "nodejs"`.
- **S5** `middleware-manifest.json` → no populated Edge bundle.
- **S6** `grep -rn "middleware\.ts" web/src` returns nothing.
- **S7** `config.matcher` unchanged byte for byte from the pre-rename file.
- **S8** `npm run build` exits 0 with no Supabase env set.
- **S9** `git diff --stat HEAD -- labs capstone database sample-data scripts` is empty.
- **S10** No UI diff under `web/src/app/`, `web/src/components/`, `web/src/lib/theme/`
  beyond the one JSDoc comment line in `(auth)/sign-in/page.tsx`.

Live, unconfigured path only (no project configured — this is not L1–L8 from the Aim
Point 1 QA doc, which require a real Auth server):

- **E1** `/`, `/labs`, `/notes`, `/kaz`, `/settings`, `/admin` → `307` to `/sign-in`.
- **E2** `/sign-in` → `200`, no loop.
- **E3** `GET /sign-in-help` → `307` (the discriminator: proves the proxy itself made
  the decision, not a layout).
- **E4** `GET /favicon.ico` → `200`, no redirect (matcher bypass intact).
- **E5a** Pre-rename probe (Edge, fake config): `createServerClient()` construction did
  not throw; execution reached the `auth.getUser()` try block; request resolved `307`,
  no `500`.
- **E5b** Post-rename probe (Node.js, fake config): same fake config, same result —
  `createServerClient()` did not throw; `307`, no `500`. Recorded side by side with E5a
  because the open risk in Task 2 was runtime-specific and had to be checked on both
  sides of the rename, not assumed identical.

Not tested by this Aim Point (unchanged from Aim Point 1): L1–L8 in
`docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`, all of which require a real, configured
Supabase project.

## Commit boundaries

1. `refactor(web): rename middleware to proxy for Next 16` — `proxy.ts`, `proxy.test.ts`
   (renamed from `middleware.ts` / `middleware.test.ts`), and the comment corrections in
   `protected-routes.ts`, `server-client.ts`, `guards.ts`, `(auth)/sign-in/page.tsx`.
2. `docs: record the Supabase project reuse decision` —
   `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`, `docs/environment-setup.md`,
   `ROADMAP.md`, this plan, and the Aim Point 1 plan's decisions table.

No push. No force push. No history rewrite. No AI attribution. No secrets. `.env.local`
created twice for the two probes, deleted both times, never staged.

## Known limitations, recorded not hidden

- Two `auth.getUser()` calls per full page load (proxy plus RSC render) remain
  unchanged by this Aim Point — that was already recorded in Aim Point 1 and is
  unaffected by which runtime the proxy executes on.
- The Supabase project-reuse decision is a documentation record only. No table, schema,
  naming convention, or RLS policy implementing "logically isolated" application data
  has been created; that is real work for a later Aim Point once a project exists.
- The pre- and post-rename probes used a fake, unreachable Supabase URL. They show that
  `createServerClient()` construction itself does not throw under either runtime with
  this codebase's configuration; they do not exercise a real Auth server, real
  `@supabase/realtime-js` channel subscription, or a real WebSocket-dependent code path,
  none of which this Aim Point's code constructs.

## Forward items for later Aim Points

1. Once a real Supabase project is configured for the website, run
   `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md` L1–L8 in full — nothing in this Aim
   Point changes what those criteria require.
2. The "logically isolated" application-data decision needs an actual naming/schema
   convention (for example an `aep_` table prefix) decided and implemented when Phase 11
   Step 5 first needs a table — not before, and not implied by this documentation-only
   Aim Point.

---

# Phase 11 — Aim Point 2, Part 2: Configure the Supabase project + publishable-key rename

Date: 2026-09-13
Status: implemented 2026-09-13, **not complete** — two blocking items remain, below.

## Relationship to Part 1

Part 1's Goal says "No live Supabase work. No project is configured yet; `web/.env.local`
does not exist before or after this Aim Point." That was true of Part 1 and is **no longer
true of the Aim Point as a whole.** Part 1's text is left unedited as a dated record; this
section supersedes it on that point only.

## What was done

1. **`web/.env.local` created** — git-ignored (`web/.gitignore:34`), untracked, UTF-8 with
   no BOM, holding `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the shared AEP project. No value was printed
   at any point; the key was moved programmatically from where it had been mis-pasted.
2. **The approved rename**, in one pass: `NEXT_PUBLIC_SUPABASE_ANON_KEY` →
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SupabaseConfig.anonKey` →
   `publishableKey`. Files: `env.ts`, `env.test.ts`, `browser-client.ts`,
   `server-client.ts`, `middleware-client.ts`, `middleware-client.test.ts`,
   `web/.env.example`, `docs/environment-setup.md`, the QA doc, and the Aim Point 1 plan's
   decisions table. Renaming the internal field too was deliberate — leaving it `anonKey`
   would have preserved exactly the inaccuracy the rename removes.
3. **Post-revoke regressions** — Capstone 4/4, Lab 07 2/2, Lab 08 2/3, Lab 10 1/2. Two
   checks NOT RUN, not failed.
4. **L1 and L8** run against the real configured project; **L2–L7 not attempted.**

## Three findings that changed the shape of this work

1. **The key was first pasted into the root `.env`, not `web/.env.local`.** Next only
   reads env files under `web/`, so the site would have stayed signed-out with the key
   apparently configured.
2. **L1 cannot validate a credential pair.** Signed out, `getUser()` returns locally
   (`auth-js/dist/main/GoTrueClient.js:2709`) without contacting the Auth server, and
   `resolveSession()` swallows errors into `anonymous` — so a typo'd ref or revoked key
   gives a byte-identical PASS. The pair was validated separately via
   `GET /auth/v1/settings` (200 with the key; 401 with none and with a bogus one). Any
   future credential change must be validated this way, not inferred from redirects.
3. **L8 must be run with `next dev`.** `next start` on a bundle built while credentials
   were present gives a silent false pass, because `NEXT_PUBLIC_*` is inlined at build time.

## Blocking items — this Aim Point is NOT complete

1. **Public sign-up is enabled** (`disable_signup: false`) on an invite-only product.
   Owner action in the Supabase dashboard. Hard prerequisite for Step 2.
2. **No session can be created at all** — no sign-in form, no route handler, no auth
   callback exists, so L2–L7 are unreachable regardless of whether a test user exists.

## Non-blocking, carried forward

Security Advisor check and Auth URL/redirect config still undone; `approval_requests`
UPDATE unproven post-revoke; row counts unmeasured because the root `.env`
`SUPABASE_SECRET_KEY` is stale/invalid; stray publishable-key line still in root `.env`.

## Verification

`npm run verify` exits 0 — lint, typecheck, 119 tests across 15 files, production build of
8 routes plus Proxy. Scope guard clean: `git diff --stat HEAD -- labs capstone database
sample-data scripts` is empty. No key material in the diff. Nothing pushed, nothing
committed, no website tables, Aim Point 3 not started.
