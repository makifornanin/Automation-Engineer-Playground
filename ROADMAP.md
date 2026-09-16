# Automation Engineer Playground — Build Roadmap

## Project Overview

Automation Engineer Playground (AEP) will be built in phases so the project stays easy to understand, test, and improve.

The build order follows this progression:

```text
Project + Learning Foundation
↓
Automation Fundamentals
↓
API & Data Engineering
↓
Reliability Engineering
↓
AI Automation
↓
Lab Quality Review
↓
Capstone
↓
AEP Website Foundation
↓
Access + Learner State
↓
Learning Experience Engine
↓
Test + Diagnostics Engine
↓
Kaz AI Teacher
↓
Completion + Student Polish
↓
Student / Academy Pilot
↓
Portfolio & Release
↓
External Adoption
```

The goal is to finish each phase properly before moving to the next.

---

# PHASE 0 — Project Foundation

## Goal

Create the project repository, rules, documentation, and basic structure before building any automation.

## Build Checklist

* [/] Create GitHub repository
* [/] Create local `AEP Project` folder
* [/] Connect local project to GitHub
* [/] Initialize Git
* [/] Add `.gitignore`
* [/] Create `CLAUDE.md`
* [/] Create `AGENTS.md`
* [/] Create `FEATURES.md`
* [/] Create `ROADMAP.md`
* [/] Create main `README.md`
* [/] Create initial project folder structure
* [/] Create documentation folder
* [/] Create labs folder
* [/] Create capstone folder
* [/] Create sample-data folder
* [/] Create database folder if needed
* [/] Create scripts/helpers folder if needed
* [/] Make initial Git commit

## Expected Structure

```text
AEP Project/
│
├── README.md
├── CLAUDE.md
├── AGENTS.md
├── FEATURES.md
├── ROADMAP.md
├── .gitignore
│
├── docs/
├── labs/
├── capstone/
├── sample-data/
├── database/
└── scripts/
```

## Phase Complete When

* [/] Repository works locally
* [ ] Repository is connected to GitHub
* [ ] Claude Code can read `CLAUDE.md`
* [ ] Codex can read `AGENTS.md`
* [ ] Project scope is documented
* [ ] No automation has been built prematurely

---

# PHASE 1 — AEP Learning System Foundation

## Goal

Create the standard learning format that every lab will follow.

This prevents us from designing each lab differently later.

## Build Checklist

* [/] Define standard lab folder structure
* [/] Create reusable lab README template
* [/] Add difficulty level
* [/] Add learning objectives section
* [/] Add simple explanation section
* [/] Add business problem section
* [/] Add business example section
* [/] Add architecture / workflow section
* [/] Add prerequisites section
* [/] Add guided build section
* [/] Add sample data section
* [/] Add successful test section
* [/] Add failure scenario section
* [/] Add debugging section
* [/] Add independent challenge section
* [/] Add optional hints section
* [/] Add expected result section
* [/] Add "What You Learned" section

## Standard Lab Flow

```text
Understand
↓
See the Business Problem
↓
View the Architecture
↓
Build
↓
Test
↓
Break It
↓
Debug It
↓
Complete Challenge
↓
Review What You Learned
```

## Phase Complete When

* [/] One reusable lab template exists
* [/] Template is simple enough for a beginner
* [/] Template works for both basic and advanced labs
* [/] Every future lab can follow the same structure

---

# PHASE 2 — Development Environment & Core Tools

## Goal

Prepare the tools and services needed throughout AEP.

## Core Tools

* n8n
* JavaScript
* Supabase
* Postman
* Git / GitHub
* VS Code

## Build Checklist

### n8n

* [/] Confirm local n8n is working
* [/] Create AEP workspace/project organization
* [/] Confirm webhooks work locally
* [/] Confirm workflows can receive test data

### Supabase

* [/] Create or choose AEP Supabase project
* [/] Configure connection safely
* [/] Set up environment variables
* [/] Confirm n8n can read from Supabase
* [/] Confirm n8n can write to Supabase

### Postman

* [/] Create AEP Postman collection
* [/] Add sample GET request
* [/] Add sample POST request
* [/] Test n8n webhook from Postman

### JavaScript

* [/] Decide where reusable helper code will live
* [/] Set basic code conventions
* [/] Confirm JavaScript can be tested independently when necessary

### Secrets

* [/] Create `.env.example` if needed
* [/] Keep real secrets outside Git
* [/] Confirm `.env` is ignored
* [/] Confirm no API keys are committed

## Phase Complete When

* [/] n8n works
* [/] Supabase connection works
* [/] Postman works
* [/] Local testing works
* [/] Secrets are protected
* [/] We can safely begin Lab 01

---

# PHASE 3 — Fundamentals

## Goal

Learn the core logic that almost every automation uses.

---

## Lab 01 — Data Mapping & Transformation

### Build

* [/] Create sample incoming JSON
* [/] Read fields from incoming data
* [/] Rename fields
* [/] Remove unnecessary fields
* [/] Combine fields
* [/] Transform values
* [/] Format final output
* [/] Add JavaScript transformation example
* [/] Add guided build
* [/] Add successful test
* [/] Add failure scenario
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how data is transformed as it moves between different systems.

---

## Lab 02 — Conditions & Routing

### Build

* [/] Create sample business scenario
* [/] Add IF / ELSE condition
* [/] Add multiple routing paths
* [/] Add AND condition
* [/] Add OR condition
* [/] Add fallback path
* [/] Test each route
* [/] Add invalid/unexpected input scenario
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how automation makes decisions.

---

## Phase Complete When

* [/] Lab 01 complete
* [/] Lab 02 complete
* [/] Tests pass
* [/] Failure scenarios verified
* [/] Challenges verified
* [/] Documentation complete
* [/] Learner understands data flow and automation logic

---

# PHASE 4 — API & Data Engineering

## Goal

Learn how automation systems communicate with external applications and process real data.

---

## Lab 03 — APIs & Webhooks

### Build

* [/] Create n8n webhook
* [/] Trigger webhook using Postman
* [/] Receive JSON payload
* [/] Send GET request
* [/] Send POST request
* [/] Add request headers
* [/] Add request body
* [/] Add query parameters
* [/] Inspect API response
* [/] Explore common HTTP status codes
* [/] Test successful request
* [/] Test failed request
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how applications communicate with each other.

---

## Lab 04 — Validation & Normalization

### Build

* [/] Define required fields
* [/] Validate incoming payload
* [/] Detect missing fields
* [/] Validate email
* [/] Normalize email
* [/] Normalize phone number
* [/] Normalize dates
* [/] Trim unwanted spaces
* [/] Route invalid data separately
* [/] Test valid data
* [/] Test invalid data
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand why incoming data should never be trusted automatically.

---

## Lab 05 — Pagination & Large Data Processing

### Build

* [/] Connect to paginated API or mock endpoint
* [/] Retrieve first page
* [/] Read pagination information
* [/] Retrieve next page
* [/] Create looping logic
* [/] Stop loop correctly
* [/] Combine results
* [/] Process records safely
* [/] Test small dataset
* [/] Test multiple pages
* [/] Test pagination failure
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how automation handles datasets larger than one API response.

---

## Phase Complete When

* [/] Labs 03–05 complete
* [/] Webhooks work
* [/] API requests work
* [/] Validation works
* [/] Pagination works
* [/] Failure scenarios tested
* [/] Documentation complete

---

# PHASE 5 — Reliability Engineering

## Goal

Move from automations that simply work to automations that can survive real-world failures.

This is one of the most important phases in AEP.

---

## Lab 06 — Retry Logic & Exponential Backoff

### Build

* [/] Create temporary API failure scenario
* [/] Detect failed request
* [/] Add retry logic
* [/] Add retry counter
* [/] Add maximum retry limit
* [/] Add delay
* [/] Implement exponential backoff
* [/] Handle HTTP 429
* [/] Handle temporary server errors
* [/] Stop retries when necessary
* [/] Log attempts
* [/] Test eventual success
* [/] Test permanent failure
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how systems recover from temporary failures automatically.

---

## Lab 07 — Idempotency & Duplicate Protection

### Build

* [/] Create duplicate webhook scenario
* [/] Generate/use unique event ID
* [/] Create processed-events storage
* [/] Store event IDs
* [/] Check event before processing
* [/] Stop duplicate event
* [/] Allow new event
* [/] Test first delivery
* [/] Test duplicate delivery
* [/] Test different event
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how to stop duplicate events from causing duplicate actions.

---

## Lab 08 — Dead Letter Queue & Failure Recovery

### Build

* [/] Define unrecoverable failure
* [/] Create DLQ storage
* [/] Save original payload
* [/] Save error message
* [/] Save retry count
* [/] Save timestamps
* [/] Save status
* [/] View failed item
* [/] Create manual reprocessing flow
* [/] Mark successful reprocessing
* [/] Test failed item
* [/] Test recovery
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how to prevent failed data from being permanently lost.

---

## Phase Complete When

* [/] Labs 06–08 complete
* [/] Temporary failures recover automatically
* [/] Duplicate events are protected
* [/] Failed jobs can be recovered
* [/] Reliability concepts are documented
* [/] Failure scenarios verified

---

# PHASE 6 — Logging & Observability Layer

## Goal

Make the system easier to understand and debug by recording important events.

## Build Checklist

* [/] Define standard execution log structure
* [/] Log workflow name
* [/] Log execution ID
* [/] Log event/request ID
* [/] Log timestamps
* [/] Log success/failure status
* [/] Log error messages
* [/] Log retry count when relevant
* [/] Avoid logging secrets
* [/] Add logs to relevant labs
* [/] Confirm failed executions can be traced
* [/] Document how to inspect logs

## Phase Complete When

Given an event ID or execution ID, we can understand:

* [/] What happened
* [/] When it happened
* [/] Where it failed
* [/] Why it failed
* [/] Whether it recovered

---

# PHASE 7 — AI Automation Engineering

## Goal

Learn how to use AI inside automation without relying on unpredictable free-form responses.

---

## Lab 09 — Structured AI Output

### Build

* [/] Create business classification scenario
* [/] Send input to AI
* [/] Define required JSON structure
* [/] Receive structured output
* [/] Validate required AI fields
* [/] Validate values
* [/] Add confidence score
* [/] Add recommended action
* [/] Route based on AI output
* [/] Test valid AI response
* [/] Test malformed AI response
* [/] Add fallback behavior
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how AI can produce predictable information that automation systems can safely use.

---

## Lab 10 — AI Guardrails & Human-in-the-Loop

### Build

* [/] Define allowed automatic actions
* [/] Define restricted actions
* [/] Create confidence threshold
* [/] Route high-confidence decisions
* [/] Route low-confidence decisions
* [/] Create pending approval record
* [/] Create approval flow
* [/] Create rejection flow
* [/] Resume workflow after approval
* [/] Log human decision
* [/] Test automatic path
* [/] Test approval path
* [/] Test rejection path
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand when AI should act automatically and when a human should take control.

---

## Phase Complete When

* [/] Lab 09 complete
* [/] Lab 10 complete
* [/] AI output is structured
* [/] AI responses are validated
* [/] Guardrails work
* [/] Human approval works
* [/] Failure scenarios tested

---

# PHASE 8 — Lab Quality Review

## Goal

Review all 10 labs as one complete learning experience before building the capstone.

## Build Checklist

### Consistency

* [/] All labs follow standard structure
* [/] All labs use clear naming
* [/] Difficulty progression makes sense
* [/] Explanations stay beginner-friendly
* [/] Business examples are realistic

### Testing

* [/] Every guided build works
* [/] Every successful test passes
* [/] Every failure scenario works
* [/] Every debugging guide is accurate
* [/] Every challenge can be completed

### Student Experience

* [/] Instructions are understandable without instructor help
* [/] Required accounts/tools are clearly explained
* [/] Sample data is provided
* [/] Expected results are clear
* [/] No private credentials are required

### Security

* [/] No secrets committed
* [/] No real customer information
* [/] No exposed API credentials

## Phase Complete When

Someone other than the creator could reasonably complete the labs using the documentation.

---

# PHASE 9 — Capstone: AI Service Request Agent

## Goal

Combine the important concepts from the labs into one realistic Automation Engineering system.

## Current Status

The four-workflow Capstone runtime has been built and live-verified end to end.

Verified paths include:

* [/] valid safe request
* [/] invalid request
* [/] duplicate protection
* [/] restricted action → pending approval
* [/] human approval
* [/] human rejection
* [/] double-decision protection
* [/] transient failure → retry/backoff → success
* [/] permanent failure → DLQ
* [/] DLQ recovery
* [/] `processed_events` reserved → processed lifecycle
* [/] reliable sub-workflow return behavior

Coverage notes that remain non-blocking:

* [ ] deterministic low-confidence branch live test
* [ ] malformed-AI-output fallback live test
* [ ] cleanup old Capstone test rows before a public demo

Capstone export/package/README closeout remains before Phase 9 is marked fully complete. Website work may proceed because the automation runtime itself is already live-verified.

## Step 1 — Capstone Design

* [ ] Define business problem
* [ ] Define actors/systems
* [ ] Define incoming request format
* [ ] Define architecture
* [ ] Define database requirements
* [ ] Define AI responsibilities
* [ ] Define human responsibilities
* [ ] Define failure paths
* [ ] Define test scenarios

---

## Step 2 — Request Intake

* [ ] Receive request
* [ ] Assign request/event ID
* [ ] Validate request
* [ ] Normalize request
* [ ] Reject invalid requests safely

---

## Step 3 — Duplicate Protection

* [ ] Check idempotency key
* [ ] Stop duplicate request
* [ ] Store new event

---

## Step 4 — AI Classification

* [ ] Send request to AI
* [ ] Produce structured response
* [ ] Validate AI output
* [ ] Determine category
* [ ] Determine priority
* [ ] Generate confidence score
* [ ] Recommend action

---

## Step 5 — Decision & Routing

* [ ] Route request based on classification
* [ ] Check confidence threshold
* [ ] Allow safe automatic action
* [ ] Route uncertain decision to human

---

## Step 6 — Human Approval

* [ ] Create approval request
* [ ] Approve decision
* [ ] Reject decision
* [ ] Record decision
* [ ] Continue workflow appropriately

---

## Step 7 — External Action

* [ ] Call external API/service
* [ ] Validate response
* [ ] Record result

---

## Step 8 — Reliability

* [ ] Retry temporary failures
* [ ] Use backoff
* [ ] Respect retry limit
* [ ] Send unrecoverable item to DLQ
* [ ] Allow reprocessing

---

## Step 9 — Logging

* [ ] Log request
* [ ] Log AI decision
* [ ] Log routing
* [ ] Log API action
* [ ] Log approval
* [ ] Log failures
* [ ] Log final status

---

## Step 10 — Capstone Testing

Test:

* [ ] Normal successful request
* [ ] Invalid request
* [ ] Duplicate request
* [ ] High-confidence AI decision
* [ ] Low-confidence AI decision
* [ ] Human approval
* [ ] Human rejection
* [ ] Temporary API failure
* [ ] Permanent API failure
* [ ] Retry recovery
* [ ] DLQ flow
* [ ] AI malformed response

---

## Phase Complete When

The capstone demonstrates multiple Automation Engineering concepts working together as one reliable system.

---

---

# PHASE 10 — AEP Website Foundation

## Goal

Create the web application foundation without pulling authentication, the full learning engine, diagnostics, or Kaz AI into the first Aim Point. Phase 10 ships no authentication and no authorization; those are Phase 11.

## Approved Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* Motion
* Supabase — *project stack; first used in Phase 11. Phase 10 installs no Supabase package, client, or environment variable.*
* Vercel-compatible deployment

## Step 1 — Web App Scaffold

* [/] Create `web/` application
* [/] Configure TypeScript
* [/] Configure Tailwind
* [/] Add Motion dependency
* [/] Add test/lint/typecheck/build scripts
* [/] Add safe environment-variable structure
* [ ] Confirm app runs locally
* [/] Confirm production build works

## Step 2 — Design System

* [/] Define neutral surface/text/border tokens
* [/] Define Light blue accent tokens
* [/] Define Dark coral/red-orange accent tokens
* [ ] Add theme switching
* [ ] Persist theme preference
* [ ] Add reduced-motion support
* [/] Create reusable glass/chrome surface primitives

## Step 3 — App Shell (no authentication — see Phase 11)

* [/] Create the app shell with one typed, server-only session seam ready for real authentication (the seam returns a placeholder; authentication itself is Phase 11)
* [ ] Build floating glass macOS-style navigation dock
* [ ] Icon-only default state
* [ ] Hover/focus label expansion
* [ ] Subtle magnification
* [ ] Spring click interaction
* [ ] Smooth page transition
* [ ] Keyboard-accessible dock behavior

## Step 4 — Foundation Pages

Create foundation shells for:

* [/] Home
* [/] Labs
* [/] Notes
* [/] Kaz
* [/] Settings
* [/] Admin — placeholder shell only. **NOT access-controlled.** The route is reachable by URL by anyone; hiding the dock item is presentation, not authorization. Role gating and server-side enforcement are Phase 11.

Do not build the full Learning Engine or Kaz AI workflow in this phase. Do not add authentication, session enforcement, route protection, or any admin guard — including a client-side redirect or a "not authorized" screen. A guard that only looks like authorization is worse than an honest gap, because later work will assume protection that does not exist.

## Phase Complete When

* [/] Phase 10's deliberate gap is recorded: /admin is reachable without authentication, and the page says so on screen. This is the documented Phase 10 state, not a defect. Phase 11 closes it.
* [ ] App runs locally
* [/] Production build passes
* [ ] Theme system works
* [ ] Dock works with mouse and keyboard
* [ ] Foundation routes render
* [ ] UI is calm and uncluttered
* [/] No secret values are exposed

## Current Status

**Aim Point 1 — Web App Scaffold + App Shell Foundation.** Base committed
`44cd6bd`. Dock visual revision (separated desktop glass chips) implemented.
Plan: `docs/superpowers/plans/2026-09-10-aep-website-foundation-aim-point-1.md`.
Browser checklist: `docs/qa/AEP-PHASE-10-AIM-POINT-1-BROWSER-QA.md`.

Verification classification per `CLAUDE.md`:

* unit tested — 49 tests across 6 suites, including two strict regressions
  proving exactly one keyboard tab stop per dock item
* structurally verified — `npm run verify` exits 0 against the existing
  `node_modules`: lint, typecheck, 49 tests, and a production build of 7 static
  routes
* **NOT clean-install verified** — the earlier `npm ci` evidence predates the
  lockfile package-name normalisation and no longer covers the current tree.
  Re-running it was blocked by a Windows EPERM file lock on the `next-swc`
  native binary. That is an environment issue, not a lockfile defect, but the
  plan's Definition of Done requires clean-install verification, so it is
  outstanding
* live verified — **nothing, and now blocked rather than merely deferred.** Phase 11
  Aim Point 1 put every `(app)` route behind `requireSession()`, so with no Supabase
  project configured `/` redirects to `/sign-in` and the dock, theme, motion, glass and
  responsive criteria are unreachable in a browser. `/sign-in` sits outside `(app)` and
  has no dock or ThemeProvider, so it cannot substitute. The browser checklist is
  retained in full and unblocks at the same moment Phase 11 Aim Point 1's L1-L8 do.
  Section 10 of that checklist (`AEP_PLACEHOLDER_ROLE=admin`) is superseded — that
  variable no longer exists; set `app_metadata.role` in the Supabase dashboard instead.
  It is annotated, not deleted. Criterion 27's written confirmation that `/admin` stays
  reachable by a non-admin is now Phase 11 L4
* not built — authentication, authorization, learner data (Phase 11)

Open questions for the browser pass: dock magnify 1.08 vs neighbour 1.06
distinctness; nested glass on mobile chips inside the shared capsule; the active
chip's icon/label colour on hover and keyboard focus.

---

# PHASE 11 — Invite-Only Access & Learner State

## Goal

Give invited learners secure passwordless access and create the minimum persistent state required by the AEP experience. Phase 11 owns every authentication and authorization concern the Phase 10 shell deliberately left open: real sessions, session enforcement, role gating, and server-side Admin authorization.

## Step 1 — Supabase Web Foundation

* [/] Configure browser/server Supabase clients correctly — the **server** client and the
  proxy client are now live verified end to end by a real session (2026-09-14). The
  **browser** client is still imported by nothing and has still never executed: sign-in is
  server-side by design, because JavaScript cannot set an HttpOnly cookie. Kept, documented,
  deliberately unexercised
* [x] Configure secure environment variables — `web/.env.local` exists, is git-ignored and
  untracked, and its URL + publishable key pair is validated live (`/auth/v1/settings` 200
  with the key, 401 without it and with a bogus one). A real session has now been issued
  against it
* [/] Confirm service-role/admin credentials never reach browser code
* [x] Add auth/session middleware or equivalent server-safe session handling — live verified
  2026-09-14: the proxy and `requireSession()` carried a real authenticated session through a
  hard refresh. Token *refresh* past the real TTL (L6) is still unrun and deferred
* [/] Replace the Phase 10 placeholder session seam (`web/src/lib/session/get-session.ts`) with a real Supabase session, and delete `AEP_PLACEHOLDER_ROLE` from the code and from `web/.env.example`
* [/] `getSession()` returns `status: "authenticated"` only for a verified session, and `status: "anonymous"` otherwise — both halves now have live evidence: the authenticated half for the first time on 2026-09-14, the anonymous half repeatedly. The exhaustive "only" invariant is unit-tested across 12 adversarial escalation vectors rather than observed
* [/] `Session` / `SessionUser` never carry an access token, refresh token, or any other credential — the whole object is serialised into the browser-visible RSC payload by `SessionProvider`

The four open bullets were originally open for one reason: **no Supabase project is
configured**, so no code path here had ever run against a real Auth server. They are not
open because work is missing.

**Updated 2026-09-13.** The project *is* now configured and the credential pair is
validated, so that original reason no longer holds. They stay open for a different one:
there is still no way to create a session. Aim Point 1 ships no sign-in form, route handler
or auth callback, so `browser-client.ts` has still never executed and no session has ever
resolved as `authenticated`. `Configure secure environment variables` may move to `[/]`;
the other three wait on Phase 11 Step 2.

## Step 2 — Invite-Only Authentication

* [ ] Owner/Admin can invite learner by email
* [ ] Invite creates student access safely
* [x] Learner verifies email — live verified 2026-09-14, owner-driven in a real browser
* [x] Passwordless session is created — live verified 2026-09-14
* [x] Active session restores on return — live verified 2026-09-14 (survived a hard refresh)
* [ ] Expired session can recover through magic link
* [/] Unauthorized users cannot enter protected AEP routes

**Status note, updated 2026-09-14.** Aim Point 3 built the sign-in flow and Aim Point 5
finished it Supabase-only. The owner then ran the core path live: OTP email received, code
verified, app loaded, session survived a hard refresh, sign-out returned to `/sign-in`.
Bullets 3–5 are ticked on that evidence.

Three bullets stay open, deliberately:

* **Bullets 1 and 2 (invite flow)** are not ticked and must not be. There is no invite UI —
  V1 creates learners by hand in the Supabase dashboard. "The owner manually adds users" is
  not "invite flow works." That is Phase 11 Step 4.
* **Bullet 6** was not part of the reported evidence: sign-out was observed, but a fresh
  code requested and verified *after* it was not. The mechanism is the same one bullets 3–5
  just proved, so this is unobserved rather than doubtful — it simply was not run.
* **Bullet 7 stays `[/]`.** The unauthenticated half is live verified repeatedly. The
  authorization half is not: `/admin` still admits any signed-in role. That is Step 3.


Note also that "recover through magic link" is now "request a fresh code" — see the §8
amendment in `docs/AEP-WEBSITE-VISION.md`. The capability is unchanged; the mechanism is not.

## Step 3 — Roles

Two roles only:

* [ ] `student`
* [ ] `admin`

Rules:

* [ ] invited users default to student
* [ ] admin role cannot be granted from client input
* [ ] server enforces admin actions
* [ ] `/admin` is protected server-side; direct URL navigation as a student is rejected before any admin content renders (the Phase 10 route is unprotected by design)
* [ ] owner sees the same learner experience plus Admin navigation

## Step 4 — Minimal Admin Section

* [ ] Invite student
* [ ] View invited/active/revoked users
* [ ] Resend invite
* [ ] Revoke access
* [ ] No student progress monitoring

## Step 5 — Learner Preferences & State

Persist:

* [ ] display/profile basics
* [ ] selected language
* [ ] selected theme
* [ ] current lab
* [ ] current lesson section
* [ ] lab progress
* [ ] notes
* [ ] lab-specific webhook configuration
* [ ] optional n8n connection metadata/secrets using a secure design

## Current Status

**Aim Point 1 — Supabase Web Foundation + Real Session Architecture.**
Plan: `docs/superpowers/plans/2026-09-11-aep-phase-11-aim-point-1-supabase-session-foundation.md`.
Deferred live criteria: `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`.

Verification classification per `CLAUDE.md`:

* unit tested — 119 tests across 15 files. Includes 12 adversarial role-escalation
  vectors (`user_metadata.role`, case and whitespace variants, array, object, getter,
  `__proto__`, null byte, number) all resolving to `student`; every `resolveSession()`
  failure path resolving to `anonymous`; an assertion that Supabase's own
  `auth.getSession()` is never called; a key-shape assertion proving no credential or
  metadata is copied into the browser-visible session; and the middleware cookie
  dual-write, `options` forwarding, `headers` forwarding and redirect cookie-copy, each
  proven to fail when the behaviour is removed
* structurally verified — `npm run verify` exits 0: lint, typecheck, 119 tests, and a
  production build of 8 routes plus middleware. The build ran with **no** Supabase env
  set, which also proves there is no import-time throw. A `node:fs` invariant scan proves
  `auth.getSession(`, `service_role` and `AEP_PLACEHOLDER_ROLE` appear nowhere. The
  `server-only` boundary was proven a real build failure by actually importing it from a
  client component. A fake service-role value was injected, built, and grepped out of
  `.next/static` — no leak
* live verified — **only the unconfigured path.** With no Supabase env, `/` and `/admin`
  return 307 to `/sign-in`, `/sign-in` returns 200, `/favicon.ico` bypasses the matcher,
  `/sign-in-help` is correctly protected, and there is no redirect loop. The middleware
  was separately proven to execute via a temporary non-secret marker log
* not tested — **the entire configured path.** No session has ever resolved as
  `authenticated` against a real Auth server; `browser-client.ts` is imported by nothing
  and has never executed; the middleware refresh has never run against a real token.
  L1–L8 are unperformed
* blocked — creating `web/.env.local` is blocked on an owner decision: does the website
  use the labs' existing Supabase project, or a separate one? Code is identical either
  way; only the values differ. Recommendation on record is a separate project, so a leak
  of the labs' service-role key cannot compromise learner authentication

**Resolved 2026-09-11** — the owner decided the website reuses the existing AEP Supabase
project while keeping website-specific application data logically isolated from Labs and
Capstone. The earlier separate-project recommendation above is superseded but retained
for the record in `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`. This resolves the open
question, not the "blocked" verification status: no Supabase project has been configured
for the website yet, `web/.env.local` still does not exist, and no code path here has run
against a real Auth server.

**Updated 2026-09-13 — the project is now configured; the paragraph above is superseded on
that point only and retained for the record.** `web/.env.local` now exists (git-ignored,
untracked, UTF-8 no BOM) pointing at the shared AEP Supabase project, so the "blocked"
bullet above is closed. The verification classification moves as follows:

* live verified — **L1 and L8, against the real configured project.** L1: every protected
  route (`/`, `/labs`, `/notes`, `/kaz`, `/settings`, `/admin`) returns 307 to `/sign-in`,
  `/sign-in` returns 200, `/sign-in-help` returns 307 (the proxy-execution discriminator),
  `/favicon.ico` bypasses the matcher, and following `/` terminates in one hop with no
  loop. This is no longer the unconfigured path: the server log contains zero "Supabase is
  not configured" warnings, so the client really was constructed and `auth.getUser()`
  really was invoked. L8: with the env file moved aside, the sanitized warning fires exactly
  once and names only the two variable names, with no URL, key, prefix or length, and no
  500. Independently reproduced by the QA stage
* live verified — **the URL + publishable key pair is genuinely valid**, proven separately
  from L1 because L1 cannot prove it: signed out, `getUser()` returns locally without ever
  contacting the Auth server, so a typo'd ref or revoked key yields a byte-identical PASS.
  `GET /auth/v1/settings` returns 200 with the configured key, and 401 both with no key and
  with a bogus one
* blocked — **L2–L7, on more than a missing user.** The owner must create a test user in
  the Supabase dashboard, but that alone does not unblock these: Aim Point 1 ships no
  sign-in form, no route handler and no auth callback, so there is no way to turn those
  credentials into a session cookie. `browser-client.ts` is still imported by nothing and
  has still never executed, and the proxy refresh has still never run against a real token.
  Closing this needs the minimal sign-in of Phase 11 Step 2
* blocked — **invite-only is not actually enforced at the project level.** `/auth/v1/settings`
  reports `disable_signup: false`, so public sign-up is currently ENABLED on a product
  `CLAUDE.md` defines as invite-only. Owner action in the dashboard; a hard prerequisite
  before any `signInWithOtp` call ships. See the QA doc's OPEN SECURITY GATES section
* key naming — `NEXT_PUBLIC_SUPABASE_ANON_KEY` was renamed to
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (and the internal `SupabaseConfig.anonKey` field
  to `publishableKey`) because this project issues new-format `sb_publishable_…` /
  `sb_secret_…` keys. This fires the rename gate that
  `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md` had recorded in advance
* post-revoke lab regression — Capstone 4/4 and Lab 07 2/2 pass; Lab 08 2/3 and Lab 10 1/2,
  with the two remaining checks **not run rather than failed** because they sit behind
  trigger nodes the n8n MCP cannot select. Details and execution ids in the QA doc

See `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md` for the evidence behind every line above.

**Aim Point 3 — Minimal Invite-Only Passwordless Sign-In. Implemented 2026-09-13; NOT
complete.** Plan: `docs/superpowers/plans/2026-09-13-aep-phase-11-aim-point-3-passwordless-sign-in.md`.

Owner decision: a **6-digit emailed code**, not a magic link. `docs/AEP-WEBSITE-VISION.md`
§8 is amended in place with the original wording retained and the reasoning recorded.

Verification classification per `CLAUDE.md`:

* unit tested — 190 tests across 22 files, up from 119 across 15. Includes the
  account-enumeration invariant (`otp_disabled` / `signup_disabled` / `user_not_found`
  resolve to the *same frozen object reference* as success, asserted with `toBe`, not
  `toEqual`); a regression test that `signInWithOtp` is always called with
  `shouldCreateUser: false`; a repo-wide scan that `shouldCreateUser: true` appears nowhere
  under `web/src`; proof that `verifyOtp`'s `data.session` never reaches the returned state;
  `signOut({ scope: "local" })` asserted against auth-js's `global` default; and sign-out
  fail-safe paths proving cookies are cleared and the redirect still fires when `signOut()`
  throws or the client is null
* structurally verified — `npm run verify` exits 0: lint, typecheck, 190 tests, production
  build of 8 routes plus Proxy. **No new public route**; `protected-routes.ts` and
  `proxy.ts` are byte-for-byte untouched, as are `map-user.ts`, `get-session.ts`,
  `types.ts` and `guards.ts`. The `Session` projection is still the closed
  `{id, role, displayName}` literal
* integration tested — the Automation stage verified the OTP contract against the
  **installed** `@supabase/auth-js` types rather than documentation, and traced the cookie
  fix end to end through `@supabase/ssr` internals
* live verified — **only two things, neither of them the sign-in flow.** (1) `disable_signup:
  true`, confirmed twice, closing the invite-only blocker. (2) L1 route protection still
  holds now that `/sign-in` renders a real form
* not tested — **the entire sign-in flow.** No test user exists, so request-code → email →
  verify → session has never executed once. L2–L8 remain unrun
* blocked — L2–L8, on two owner dashboard actions: add `{{ .Token }}` to the Magic Link
  email template, and create an auto-confirmed test user

**A defect fixed here that predates this Aim Point:** `@supabase/ssr@0.12.7` defaults auth
cookies to `httpOnly: false` with no `secure` key at all, and neither server factory passed
`cookieOptions`. AEP's auth cookies were therefore **not HttpOnly, and live criterion L5 was
silently failing.** Both factories now share one `SUPABASE_COOKIE_OPTIONS` constant, guarded
by a test that fails if either stops forwarding it — applying it to only one would set an
HttpOnly cookie at sign-in and silently downgrade it on the proxy's first token refresh.

**Open — QA MEDIUM, not yet dispositioned.** `over_email_send_rate_limit` can only fire for
an address that passed the existence check, so *repeated* submissions may distinguish
invited from uninvited addresses even though a single submission does not. Reasoned from
code and GoTrue semantics, **not observed.** Confirm or rule out during live verification,
then accept or fix — do not close it silently either way.

**Resolved 2026-09-14 in Aim Point 4** — closed by design rather than by investigation. The
uniform request-step response makes *every* Supabase-originated outcome return the same state
by reference, so `over_email_send_rate_limit` can no longer be distinguished from success
regardless of whether the theorised oracle was real. The uninvited half was separately
confirmed live first: 14/14 requests returned `otp_disabled` (HTTP 422) with no email
dispatched and no rate-limiting.

**Still resolved after n8n was withdrawn 2026-09-14, and this is the load-bearing sentence:**
it stays resolved *because `toRequestCodeState` is retained on its own merits*. The asymmetry
is a property of GoTrue plus `shouldCreateUser: false` — only an invited address dispatches
mail, so only an invited address can produce a mail-related failure — and it was logged as an
open MEDIUM in Aim Point 3, before the hook architecture existed. **Reverting that control
would reopen this.** Do not remove it as n8n leftovers.

**Aim Point 4 — n8n as the authentication email delivery layer. SUPERSEDED / WITHDRAWN
2026-09-14 by owner decision. Block retained for the record.** Plan:
`docs/superpowers/plans/2026-09-14-aep-phase-11-aim-point-4-n8n-auth-email-delivery.md`.

> **Never used.** The Send Email Hook was never configured, the n8n workflow was never
> activated, and no hook call ever ran. AEP V1 uses **Supabase Auth email delivery directly**;
> n8n is not part of authentication. The two BLOCKED environment actions below
> (`NODE_FUNCTION_ALLOW_BUILTIN=crypto`, `AEP_AUTH_HOOK_SECRET`) are **void** — do not set
> them for auth. The hook-payload and Standard-Webhooks claims below are void with them.
>
> **Still valid evidence, retained deliberately:** the two live-verified facts (an uninvited
> address returns `otp_disabled`, HTTP 422, 14/14, ~130ms, no mail dispatched; and
> `disable_signup: true`), the security-regression narrative that explains why the uniform
> request-step response exists, and the n8n Code-sandbox finding — now relocated to
> `docs/environment-setup.md` because it matters to future labs even though its auth use was
> abandoned.
>
> **The OPEN QA HIGH below is re-graded and closed as accepted.** See the Aim Point 5 block.

Architecture recorded: **Supabase = authentication authority; n8n = authentication-email
delivery; AEP = learner-facing sign-in UI and session consumer.** The chain is
`AEP → Supabase Auth → n8n delivery`, never `AEP → n8n → custom auth`. No custom OTP table,
no self-generated OTPs, no sessions in n8n, no roles from n8n.

* live verified — **two things only**, both measured against the real project: an uninvited
  address returns `otp_disabled` (HTTP 422, 14/14 requests, ~130ms, no email dispatched), and
  public sign-up is disabled (`disable_signup: true`)
* documentation-verified, **not** live verified — that the Send Email hook payload carries the
  6-digit `token`, supports HTTPS endpoints, is signed per Standard Webhooks, and is available
  on Free and Pro. No hook call has ever occurred, so nobody on this project has yet seen an
  `email_data.token` or a `webhook-signature` header from it
* inferred, not observed — that the `otp_disabled` rejection happens *before* the hook would be
  invoked. With no hook configured there is no hook to invoke, so the ordering cannot have been
  measured. The inference is sound, and the fix is a blanket policy that holds either way
* unit tested — 212 tests across 22 files, up from 190. The uniform request-step policy is
  asserted by reference identity across sixteen inputs including thrown values, `null`, a
  bare string and unknown hook error codes; the compensating warn is proven to carry
  `error.code` and neither the email nor the error message
* structurally verified — `npm run verify` exits 0; 8 routes plus Proxy, no new public route.
  `proxy.ts`, `protected-routes.ts`, `guards.ts`, `lib/session/*`, `lib/supabase/*`,
  `components/auth/*` and `web/.env.example` are byte-identical
* not tested — **the entire delivery path.** The n8n workflow has never executed a real hook
  call and no email has been sent. A1–A10 unrun
* blocked — on two owner environment actions, below

**A security regression was found and closed before it shipped.** Introducing the hook would
have *created* an enumeration oracle: only an invited address can reach a delivery failure, so
"Something went wrong" would have meant *invited* and "check your inbox" would have meant
*not invited* — inverting the invariant `sign-in-state.test.ts` exists to protect. Closed by
making the request step uniform for every Supabase-originated outcome, as a policy rather than
an allow-list, so an unknown future GoTrue error code cannot defeat it.

**Response-timing side channel — RE-GRADED HIGH → LOW and ACCEPTED 2026-09-14.** The uniform
response equalises what is returned, not how long it takes: an uninvited address is rejected
without dispatching mail (~130ms), while an invited address actually sends. The HIGH grade was
assigned because the n8n hook inflated that delta to seconds across ngrok, n8n and Gmail. With
n8n withdrawn the delta is back to its pre-existing size.

Accepted rather than mitigated, for a reason stronger than cost:
**`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is in the browser bundle by design**, so anyone can
call `POST /auth/v1/otp` against the project directly and time *that*, with no AEP Server
Action in the path. A latency floor inside `requestSignInCode` could therefore only close the
channel for an attacker who politely routes through AEP's own form. The oracle lives in
GoTrue, not in AEP, and it is reachable without AEP — so the floor was never a complete fix.
It would also put a multi-second stall on the learner's first interaction.

**Re-open if any of these change:** public or self-serve signup is enabled; the learner
population grows beyond a private invite list where membership is not sensitive; or a
delivery layer with materially higher latency is reintroduced. If it must ever be closed, the
fix belongs at the GoTrue/edge layer, not in a Server Action. No latency-floor work is to be
done in `web/`.

**BLOCKED on:** (1) `NODE_FUNCTION_ALLOW_BUILTIN=crypto` in n8n's environment — its Code
sandbox blocks `require('crypto')`, exposes no `globalThis.crypto`, and the built-in Crypto
node takes a string key where Standard Webhooks needs base64-decoded bytes. Verified by
probing the running instance. Hand-rolling SHA-256/HMAC was deliberately refused. (2)
`AEP_AUTH_HOOK_SECRET` set in n8n's environment after generating the hook secret in Supabase.
The workflow `AEP Auth - Send Sign-In Email` is built and deliberately **inactive** until both
are done.

**Aim Point 5 — Supabase-only authentication. Implemented 2026-09-14; live verification
PENDING owner action.** Plan:
`docs/superpowers/plans/2026-09-14-aep-phase-11-aim-point-5-supabase-only-auth.md`.

Final architecture: **Supabase Auth = authentication authority and email delivery; AEP =
sign-in UI and session consumer; n8n = not involved in authentication.**

* implemented — **no executable change.** `web/` never referenced n8n, so removing it required
  no code edit. The diff is four comment blocks rewritten so the enumeration control is
  justified by Supabase-only facts, plus documentation supersession. A changed test count
  would itself have been a defect signal
* unit tested — 212 tests across 22 files, unchanged and unweakened
* structurally verified — `npm run verify` exits 0; 8 routes plus Proxy, no new public route
* live verified — `disable_signup: true` and `external.email: true`, re-confirmed against the
  real project after the reversal
* **live verified 2026-09-14 — the core authentication path, reported by the owner after
  driving it in a real browser.** An approved user received the OTP email; a valid code
  verified successfully; the authenticated AEP app loaded; the session survived a hard
  refresh; sign-out returned to `/sign-in`; public sign-up remains disabled; and **n8n was
  not involved in authentication**. This is the first time in the project's history that a
  real session has existed
* not tested — sub-checks that were not part of the owner's reported evidence and were not
  separately exercised: the browser-visible RSC payload inspected for token-shaped data on a
  *real* authenticated session (A9 — the projection remains closed by construction and
  asserted at `map-user.test.ts:52`, so this is unobserved rather than doubtful); a protected
  route requested again *after* sign-out (A11); an unknown address confirmed to create no
  user; an invalid code; an expired code; and cookie attributes read in devtools. Recorded
  honestly rather than inferred from the passes above
* not tested — L6 long-duration token refresh past the real access-token TTL. Deferred

**`toRequestCodeState` was retained, not reverted** — see the Resolved note above. **No latency
floor was added**, per the accepted-risk decision above.

**The n8n workflow** `ABANDONED - AEP Auth - Send Sign-In Email` (`ZF9iA9BT24c7oxOO`) is
inactive, renamed and described as withdrawn. It was never activated and never executed a real
call. Not deleted — that would need explicit approval and costs nothing to keep. No other n8n
workflow was touched.

Known limitations, recorded not hidden: two `getUser()` calls per full page load
(middleware plus RSC render — `cache()` dedupes within a render pass only); layout-level
gating does not re-run on client-side navigation between sibling routes, which the
middleware redirect covers; middleware is defence in depth and UX, **not** the
authorization boundary — `requireSession()` in the layout is authoritative.

Forward item, closed in Aim Point 2: Next 16.3.4 deprecated `middleware` in favour of
`proxy`, and the rename is not runtime-neutral. `node_modules/next/dist/build/entries.js`
routes a `proxy` file to `onServer()` (Node.js) unconditionally, while a `middleware`
file only reaches `onServer()` when `pageRuntime === "nodejs"` is set and otherwise takes
`onEdgeServer()`. This file exported no `runtime`, so it ran on the Edge runtime as
`middleware.ts` and now runs on the Node.js runtime as `proxy.ts`. The build's
`ƒ Proxy (Middleware)` label is unchanged either way and is purely cosmetic — the actual
evidence is `functions-config-manifest.json`
(`functions["/_middleware"].runtime === "nodejs"`). Re-proven empirically with
`GET /sign-in-help` (a path with no App Router segment, so no layout can fire
`requireSession()`), which returned `307` both before and after the rename. See
`docs/superpowers/plans/2026-09-11-aep-phase-11-aim-point-2-proxy-migration.md`.

**Recorded in Aim Point 2 and unchanged since — this is not an Aim Point 5 edit.** `/admin`
remains honestly ungated by role. It now requires a signed-in session, but any role may open
it. Role enforcement is Step 3. The on-screen notice was updated to say so at that time — the
Phase 10 wording had become false. No Aim Point since has touched `admin/page.tsx`.

## Phase Complete When

* [ ] Invite flow works
* [ ] Passwordless login/session flow works
* [ ] Admin authorization is server-enforced
* [ ] Direct navigation to `/admin` as a student is rejected server-side, verified by an actual unauthenticated and an actual student request
* [ ] Learner preferences persist
* [ ] No admin/service secret is present in client bundles or logs

---

# PHASE 12 — Learning Experience Engine

## Goal

Turn the existing 10 labs into a calm, interactive, hands-on learning experience instead of a raw documentation site.

## Step 1 — Home

Build the intentionally minimal Home screen:

* [x] Greeting — owner-confirmed 2026-09-16 in an authenticated browser session
* [x] Continue Learning — **completed 2026-09-16 at Step 4.** The destination is finally real
  lesson content: the owner verified live that Home's Continue opens Lab 01 Focus Mode showing
  "The problem", not a placeholder. This bullet moved twice for a reason worth keeping — at
  Step 2 `labHref()` changed underneath Aim Point 1's evidence, and at Step 4 the destination's
  *content* changed underneath Step 2's, so each time it was re-verified live rather than
  inferred from the code change.
* [/] Current-lab progress — **position only ("Lab 01 of 10"), never a percentage.** Stays
  partial until learner state is persisted. Do not let this drift to `[x]`
* [x] Lightweight Your Journey indicator — owner-confirmed 2026-09-16: Labs 01–10 render, the
  Capstone renders separately, and a narrow viewport shows no blocking break. Matches Vision
  §10's `01 ✓ 02 ● 03 ○` notation. A real screen-reader pass is still unobserved; the AT
  contract is unit-tested through RTL role and accessible-name queries, not heard
* [/] Short Kaz note placeholder/event surface — the **placeholder** exists; the **event
  surface does not.** Static copy with no mechanism for a contextual note
* [ ] Ask Kaz entry — **deferred by the owner at Phase 12 Aim Point 1.** `/kaz` holds a
  permanent dock slot, so the learner is one tap away on every screen. Vision §10 and this
  bullet still require it; recorded as sequenced, not dropped
* [/] Notes shortcut — the link exists; its destination is still a shell. Notes itself is Step 6

Do not add goals, large analytics, or activity clutter.

## Current Status

**Aim Point 1 — Real Home Experience. COMPLETE 2026-09-16 — owner browser verification PASS.**
Plan: `docs/superpowers/plans/2026-09-16-aep-phase-12-aim-point-1-real-home.md`.

Home is no longer placeholder-only: a static course catalog (ten real lab titles, slugs pinned
to the on-disk `labs/NN-*` folders) plus a pure `deriveCourseState()` now drive a Continue
Learning card and a Labs 01–10 journey strip with the Capstone shown separately and locked.

* unit tested — 237 tests across 26 files, up from 212/22. The catalog test reads the real
  `labs/` directory and compares slugs, so it is a genuine drift guard rather than a tautology
* structurally verified — `npm run verify` exits 0: lint 0 problems, typecheck clean, 237
  tests, production build of 8 routes plus Proxy. **No new route**, no new dependency, no new
  design token, no website table
* **live verified 2026-09-16 — owner browser pass, authenticated.** Home renders; the greeting
  renders; Continue Learning shows Lab 01 for a first-time learner; Labs 01–10 render in the
  journey; the Capstone renders separately; the Kaz placeholder is visible; the Notes shortcut
  is visible and usable; the Continue action has a valid destination; light and dark both
  remain usable; a narrow viewport shows no blocking visual break. No agent produced this —
  there is no browser and no obtainable session here, and none was faked
* still unobserved, and not claimed — **a real screen-reader pass.** The AT contract is
  unit-tested through RTL role and accessible-name queries, which is stronger evidence than a
  snapshot but is not the same as hearing it announced

Open and recorded rather than built: the all-labs-completed `currentLab` falls back to the last
lab instead of pointing at the unlocked Capstone (unreachable without persistence); `locked`
shares the `not-started` glyph and the legend omits it (safe only while no lab emits `locked`);
`progress.ts` is not `server-only` (correct while it is a pure stub — add it in the same change
that swaps the body for an RLS-scoped read); and there is no page-level test, so the greeting,
Kaz note and Notes shortcut are uncovered.

## Step 2 — Labs Journey

* [x] Featured current-lab card — owner-confirmed 2026-09-16. Shows **position ("Lab 01 of
  10"), not the completion percentage Vision §16 asks for**, because no persistence exists to
  back a figure. That substitution is deliberate and carries to Step 3
* [x] Foundations group — Labs 01–04 — owner-confirmed 2026-09-16
* [x] Reliability group — Labs 05–08 — owner-confirmed 2026-09-16
* [x] AI Engineering group — Labs 09–10 — owner-confirmed 2026-09-16
* [x] Capstone — owner-confirmed 2026-09-16: renders as its own section at the bottom, locked.
  **Its copy is provisional by owner decision** — `CAPSTONE.description` and `CAPSTONE_FRAMING`
  have no Vision §16 source text, unlike the three group framing lines, and the owner has
  accepted them as-is rather than spending time polishing now. Recorded, not silently blessed
* [/] Completed/current/preview-locked states — three labels render, are unit-tested, and
  `current` / `preview` were confirmed live. But `completed` and `in-progress` remain
  **unreachable at runtime** with the empty-progress stub, and nothing is actually locked
  except the Capstone. Closes with Step 3
* [/] Future-lab preview — **deliberately partial, deferred by the owner 2026-09-16.** Vision
  §3/§16 list four preview elements; the overview delivers why it matters and the prerequisite
  (both confirmed live). "What will be built" and "concepts involved" wait until the real
  lesson experience exists, since that is where the material comes from
* [x] No difficulty badges — the lab READMEs carry a `Difficulty` line under each H1 and Vision
  §16 forbids surfacing it; a test scans rendered output to keep it out, and the catalog has no
  difficulty field. This asserts an absence, which a browser pass could not strengthen

**Step 2 — Labs Journey. COMPLETE 2026-09-16 — owner browser verification PASS.** Plan:
`docs/superpowers/plans/2026-09-16-aep-phase-12-step-2-labs-journey.md`.

* **live verified 2026-09-16, owner-driven in an authenticated browser** — `/labs` renders the
  journey; Lab 01 reads Current and offers Continue; that Continue opens the correct Lab 01
  overview; future labs render as Preview and their pages name the prerequisite; all three
  groups are present; the Capstone renders separately at the bottom, locked; an invalid lab URL
  404s without crashing; **Home's Continue Learning opens the correct Lab 01 destination**;
  light mode shows no blocking issue; ~375px shows no clipping or broken layout; keyboard tab
  navigation works through the journey links
* unit tested — 268 tests across 31 files, up from 237/26
* structurally verified — `npm run verify` exits 0: lint 0 problems, typecheck clean, 268
  tests, production build of 8 routes plus Proxy. Routes 7 → 8, `/labs/[slug]` the only
  addition. `components/home/**` untouched and its tests pass unedited; `progress.ts` has zero
  deletions, so `deriveCourseState()` is unchanged
* still unobserved, and not claimed — **dark mode** (the owner confirmed light only) and a real
  screen-reader pass. The AT contract is unit-tested through RTL role and accessible-name
  queries, which beats a snapshot but is not the same as hearing it announced

**A defect was found in review and fixed before commit.** With no persisted progress every lab
is `not-started`, including the current one, so Lab 01's row rendered "Preview" directly beneath
a featured card offering "Continue" for it — two clickable links, opposing verbs, conflicting
accessible names, one destination, and worse for screen-reader users who lack the layout cues
that might suggest the two surfaces differ. Vision §3 settled it independently: "Lab 01 —
available/completed", so "Preview" was wrong on its own terms. The row now takes the current
lab's slug and agrees with the card. A composition test driving the real
`getCourseProgress()` → `deriveCourseState()` → page path is the regression net; every component
had been tested only in isolation, which is exactly why nothing caught it.

## Step 3 — Sequential Unlocking

* [ ] Hands-on Lab 01 available initially
* [ ] Future labs previewable
* [ ] Build/Test/Challenge content locked until prerequisite completion
* [ ] Next lab unlocks only after required evidence/milestones
* [ ] Returning learner resumes at the correct place

## Step 4 — Focus Mode Lesson Renderer

Support learning chunks for:

* [/] Problem — owner-confirmed 2026-09-16, **Lab 01 only**. This is content existing, not a
  supported chunk *kind*: the renderer has no chunk type, so prose is all `LessonChunk` can
  currently express
* [/] Concept — owner-confirmed 2026-09-16, same annotation
* [/] Guided Build — all ten labs, 2–4 actions per build chunk enforced by test. Unit tested, not live
* [/] Predict — all ten labs; learner writes a prediction before the reveal, which records `predicted` evidence
* [ ] Test
* [/] Understand Result — **mapped, not a separate kind:** the result region of a `test` chunk (Vision §17: steps need not map one-to-one to screens)
* [/] Break It — all ten labs
* [/] Debug It — all ten labs
* [ ] Challenge
* [ ] Make It Your Own — **mapped, not a separate kind:** authored inside each lab's challenge. Not independently built
* [ ] Recap

Rules:

* [/] one meaningful chunk at a time — owner-confirmed 2026-09-16. `[x]` only once a chunk
  carrying 2–4 actions proves the rule against the content it was written to govern; two prose
  chunks are a weak test of it
* [/] roughly 2–4 related actions per Build chunk — enforced by test across all ten labs
* [/] avoid one click per sentence — holds for the only two chunks that exist
* [ ] autosave progress — deliberately not built; chunk position is component state, so leaving
  the lab and returning resets to Step 1. Trivial at two chunks; **persistence becomes required
  before Lab 01 exceeds roughly four**
* [ ] expandable compact section roadmap — not built
* [ ] revisit completed sections — **not satisfied by Back.** Back is within-session stepping;
  this means revisiting across the lab, which needs persistence

**Step 4 — Focus Mode. Lab 01's two prose chunks only. NOT a completed renderer.** Plan:
`docs/superpowers/plans/2026-09-16-aep-phase-12-step-4-lab-01-focus-mode.md`.

* **live verified 2026-09-16, owner-driven in an authenticated browser** — Home's Continue opens
  Lab 01 Focus Mode; Step 1 shows "The problem" with "Step 1 of 2" visible and Back disabled;
  Next opens "The concept" with "Step 2 of 2" visible and Next disabled; Back returns correctly;
  keyboard Enter navigation works and focus moves to the new heading; mouse-click behaviour reads
  as intentional under `focus-visible`; light and dark are both readable; ~375px shows no
  clipping on the navigation row
* unit tested — 284 tests across 33 files, up from 268/31
* structurally verified — `npm run verify` exits 0: lint 0 problems, typecheck clean, 284 tests,
  production build. **Route count unchanged at 8** — Focus Mode added no route, per the owner's
  decision to host it on the existing `/labs/[slug]`
* still unobserved, and not claimed — **a real screen-reader pass.** The step position is exposed
  as the focused heading's accessible description and asserted in jsdom, which proves it is
  *computed*, not that an assistive technology announces it

**Scale, so this block is not misread:** this is one lab's two prose chunks out of eleven chunk
types across ten labs. `isHandsOnAvailable` was also split onto its own seam so Step 3 can gate
Build / Test / Challenge on it alone — reading a lesson is now a separate question from having
hands-on access unlocked.

**The Architect stage did not run for this Aim Point** — its subagent died on a session rate
limit, and the design decisions were made directly and recorded as such. Judged acceptable once,
given a small and reversible blast radius, but `LessonChunk` is now an unreviewed contract that
cannot express ordered actions, code blocks, diagrams or Send Test. **The next Aim Point's
Architect stage is mandatory.**

## Step 5 — Node & Code Teaching

* [ ] Explain important nodes using What / Why here / analogy when useful
* [ ] Explain important code by logic/input/output/purpose
* [ ] Do not teach code as blind copy/paste
* [ ] End every lab with What Did We Just Use?
* [ ] Connect each lab to the next one

## Step 6 — Notes

* [ ] Open Notes from main dock
* [ ] Open/collapse Notes inside a lesson
* [ ] Autosave notes
* [ ] Lab-linked notes
* [ ] General notes
* [ ] Save to Notes from lesson content
* [ ] Prepare Save to Notes integration for Kaz responses

## Step 7 — Visual Learning

* [ ] Mini workflow diagrams for “how it works”
* [ ] Cropped screenshots only for “where to find/configure it”
* [ ] Interactive diagram component
* [ ] Hover quick explanation
* [ ] Click deeper explanation
* [ ] Accessible keyboard/focus equivalents

## Phase Complete When

A learner can move through the content with low cognitive load, understand why each step exists, preserve progress, take notes, and preview the full journey without being overwhelmed.

---

# PHASE 13 — Inline Test & Smart Diagnostics Engine

## Goal

Make AEP the normal learner-facing test console so the learner can focus on AEP + n8n + Supabase when needed.

## Step 1 — Per-Lab Test Configuration

* [ ] Identify labs that require webhook/API testing
* [ ] Save webhook URL per learner + lab
* [ ] Allow edit/reconnect
* [ ] Show test setup only in labs that need it

## Step 2 — AEP Backend Test Mediation

Preferred flow:

```text
Learner
↓
AEP Website
↓
AEP Backend
↓
Learner n8n Webhook
↓
AEP Evaluator
↓
Website
```

Build:

* [ ] server-side test endpoint/action
* [ ] safe URL/input validation
* [ ] timeout handling
* [ ] connection-error handling
* [ ] response-size/sanitization rules
* [ ] no learner secret leakage

## Step 3 — Test Cases

For applicable labs:

* [ ] predefined business test case
* [ ] payload preview
* [ ] Send Test
* [ ] Try Again
* [ ] expected result
* [ ] actual result
* [ ] meaningful checkpoint evaluation

## Step 4 — Diagnostics UI

Default learner view:

* [ ] simple checkpoint statuses
* [ ] first likely failure area
* [ ] expected vs actual
* [ ] Ask Kaz action

Technical details on demand:

* [ ] raw request
* [ ] raw response
* [ ] checkpoint data
* [ ] execution ID

## Step 5 — Optional n8n API Connection

AEP diagnostics must still work without it.

Optional advanced capability:

* [ ] connect learner n8n safely
* [ ] store secret securely
* [ ] inspect relevant execution details
* [ ] node-level status
* [ ] exact/near-exact failure location
* [ ] disconnect/revoke
* [ ] never expose API secret in browser/logs

## Step 6 — Supabase Lab Guidance

For persistence labs:

* [ ] explain why persistence is needed before setup
* [ ] in-lesson SQL/setup chunk
* [ ] Copy SQL
* [ ] explain important tables/columns simply
* [ ] screenshot only when UI location is confusing
* [ ] verify behavior through later AEP tests
* [ ] avoid requesting full learner Supabase admin credentials merely to verify setup

## Step 7 — Diagnostics Testing

Test:

* [ ] correct success result
* [ ] incorrect expected result
* [ ] webhook offline
* [ ] timeout
* [ ] malformed response
* [ ] lab URL changed
* [ ] optional n8n disconnected
* [ ] technical details disclosure
* [ ] Kaz receives sanitized test context

## Phase Complete When

A learner can test applicable lab workflows directly from the lesson, understand where a problem likely begins, and inspect deeper details only when needed.

---

# PHASE 14 — Kaz AI Teacher

## Goal

Build Kaz as a contextual n8n-powered teacher that helps learners understand and debug AEP without replacing independent thinking.

## Step 1 — Knowledge Pipeline

Prepare sources:

* [ ] Labs 01–10
* [ ] Capstone
* [ ] node explanations
* [ ] business explanations
* [ ] debugging guides
* [ ] challenge hints
* [ ] expected outcomes
* [ ] AEP teaching rules

Build:

* [ ] source chunking
* [ ] embeddings
* [ ] Supabase vector storage
* [ ] source metadata
* [ ] retrieval test set
* [ ] re-index/update process when repo content changes

## Step 2 — n8n Kaz Workflow

Conceptual flow:

```text
Receive Kaz Request
↓
Validate Context
↓
Determine Teaching Mode
↓
Retrieve Relevant Knowledge
↓
Build Teacher Context
↓
LLM
↓
Validate / Guard Response
↓
Return to AEP
```

Build:

* [ ] request contract
* [ ] learner-context validation
* [ ] retrieval
* [ ] LLM call
* [ ] structured response contract
* [ ] failure fallback
* [ ] safe observability

## Step 3 — Teaching Modes

* [ ] Intro
* [ ] Teach
* [ ] Build
* [ ] Test
* [ ] Debug
* [ ] Challenge
* [ ] Celebration
* [ ] Chat

## Step 4 — Hard Teaching Rules

Enforce outside free-form model behavior where possible:

* [ ] selected language
* [ ] challenge hint strength based on `hints_used`
* [ ] no immediate challenge solution dump
* [ ] no invented test/node evidence
* [ ] test evidence is authoritative
* [ ] current-lab context priority
* [ ] unknown/unsupported answers admitted honestly

## Step 5 — Learner Context & Memory

Persistent:

* [ ] language
* [ ] completed labs
* [ ] current lab/section
* [ ] concepts encountered
* [ ] important progress

Short-term:

* [ ] recent questions
* [ ] recent tests
* [ ] current debugging issue
* [ ] recent mistakes
* [ ] hints used

* [ ] summarize/trim old chat context instead of sending unlimited history

## Step 6 — Kaz Website Experience

* [ ] mysterious alien orb
* [ ] Light blue glow
* [ ] Dark coral/red glow
* [ ] Neutral state
* [ ] Thinking state
* [ ] Amused state
* [ ] Uh-oh state
* [ ] Celebrating state
* [ ] Focused state
* [ ] click opens Ask Kaz
* [ ] proactive small speech bubble
* [ ] rare side comments with cooldown
* [ ] no intrusive modal

## Step 7 — Personality Adaptation

* [ ] calm by default
* [ ] jolly/playful when learner is doing well
* [ ] occasional controlled fake scare
* [ ] lighter humor after first mistake
* [ ] reduce humor after repeated failures
* [ ] focused/supportive mode when learner is frustrated
* [ ] specific motivation tied to actual progress

## Step 8 — Language

Test Kaz in:

* [ ] English
* [ ] Tagalog
* [ ] Taglish

Tagalog/Taglish must remain conversational and keep technical English terms when clearer.

## Step 9 — Kaz Testing

Test:

* [ ] concept question
* [ ] business-use question
* [ ] build question
* [ ] test-result interpretation
* [ ] debugging question
* [ ] challenge hint #1
* [ ] challenge hint #2
* [ ] challenge hint #3
* [ ] direct full-solution request
* [ ] wrong-lab question
* [ ] unknown question
* [ ] contradictory user claim vs AEP evidence
* [ ] repeated-failure tone shift
* [ ] side-comment cooldown

## Phase Complete When

Kaz feels present because she responds at the right moment with the right context, while learners still do the thinking and building themselves.

---

# PHASE 15 — Completion, Onboarding & Student Polish

## Goal

Finish the end-to-end learner experience around the already-built learning engine.

## Step 1 — First-Time Onboarding

Keep onboarding short:

* [ ] Welcome to AEP
* [ ] Explain that AEP is hands-on, not video-first
* [ ] Explain AEP + n8n + Supabase tool model
* [ ] Explain Build → Test → Break → Debug → Challenge
* [ ] Choose language
* [ ] Choose theme or use system default
* [ ] Start Lab 01

Do not make optional n8n API setup a blocker to first learning.

## Step 2 — Completion Experience

Completion requires:

* [ ] Labs 01–10 complete
* [ ] Capstone complete

Experience:

* [ ] Kaz completion transition
* [ ] Kaz says: “I think someone else should take this one.”
* [ ] Show creator's personal completion message
* [ ] Preserve learner completion state

## Step 3 — Settings & Recovery

* [ ] language change
* [ ] theme change
* [ ] session/account basics
* [ ] n8n connection management
* [ ] reconnect lab webhook where relevant
* [ ] safe sign-out

## Step 4 — Accessibility & Responsive Web

* [ ] keyboard navigation
* [ ] visible focus states
* [ ] screen-reader labels
* [ ] hover interactions have focus/touch alternatives
* [ ] reduced-motion behavior
* [ ] Light/Dark contrast checks
* [ ] responsive web layout
* [ ] no native mobile app required

## Step 5 — Performance & Failure States

* [ ] loading states
* [ ] empty states
* [ ] offline/error states
* [ ] auth errors
* [ ] Kaz unavailable fallback
* [ ] n8n test timeout state
* [ ] safe retry patterns
* [ ] avoid unnecessary client JavaScript

## Phase Complete When

A new invited learner can enter AEP, understand how it works, learn through the labs, recover from common errors, complete the Capstone, and reach the final creator message without the creator personally guiding them.

---

# PHASE 16 — Student / Academy Pilot Experience

## Goal

Validate AEP with real learners before claiming the experience is finished.

## Student Setup

* [ ] Create clear prerequisites
* [ ] Explain required tools/accounts
* [ ] Explain invite flow
* [ ] Explain optional n8n connection
* [ ] Explain how to start Lab 01
* [ ] Explain sequential progression
* [ ] Explain challenge system
* [ ] Explain Ask Kaz
* [ ] Explain Notes

## Pilot Testing

If possible:

* [ ] Invite another learner
* [ ] Observe first-time onboarding confusion
* [ ] Have learner attempt one Foundations lab
* [ ] Have learner attempt one Reliability lab
* [ ] Have learner attempt one AI lab
* [ ] Have learner use Ask Kaz
* [ ] Have learner intentionally fail a test
* [ ] Collect confusion points
* [ ] Improve unclear instructions
* [ ] Collect qualitative feedback

## Instructor / Academy Use

Keep this supplementary and simple:

* [ ] Create instructor overview
* [ ] Explain learning objectives
* [ ] Explain learning progression
* [ ] Explain expected outputs
* [ ] Explain how AEP complements hands-on n8n learning
* [ ] Do not add instructor surveillance features just for this phase

## Phase Complete When

A learner can use AEP independently and the pilot does not reveal a blocking setup, learning, or usability problem.

---

# PHASE 17 — Portfolio, Release & Repository Polish

## Goal

Turn the complete AEP system into a strong Automation Engineering + product engineering portfolio project.

## Main README

* [ ] Strong project introduction
* [ ] Product problem
* [ ] Why AEP exists
* [ ] Technology stack
* [ ] Website architecture
* [ ] n8n architecture
* [ ] Supabase architecture
* [ ] Labs 01–10 overview
* [ ] Capstone overview
* [ ] Kaz overview
* [ ] Testing/diagnostics approach
* [ ] Reliability concepts
* [ ] Security model
* [ ] Screenshots
* [ ] Workflow diagrams
* [ ] Project limitations
* [ ] Future improvements

## Portfolio Assets

* [ ] Website screenshots — Light
* [ ] Website screenshots — Dark
* [ ] Floating dock interaction capture
* [ ] Lesson Focus Mode capture
* [ ] Inline test/diagnostics capture
* [ ] Kaz capture
* [ ] n8n workflow screenshots
* [ ] Supabase examples
* [ ] Architecture diagram
* [ ] Capstone flow diagram
* [ ] Short demo if useful
* [ ] Portfolio description
* [ ] Interview explanation

## Repository Cleanup

* [ ] Export/package final Capstone workflows
* [ ] Complete Capstone README
* [ ] Remove temporary files
* [ ] Remove unused experiments
* [ ] Verify `.gitignore`
* [ ] Scan secrets
* [ ] Verify documentation links
* [ ] Verify setup instructions
* [ ] Run website lint/typecheck/tests/build
* [ ] Check commit history
* [ ] Create release/tag if appropriate

## Phase Complete When

A recruiter, client, automation engineer, instructor, or learner can understand what AEP is, how it works, why it is different, and what engineering skills it demonstrates.

---

# PHASE 18 — External Pilot / Academy Adoption

## Goal

Offer the stable AEP experience to an academy or other learners and measure whether it provides real educational value.

This phase happens only after the system is stable.

## Build Checklist

* [ ] Prepare short AEP introduction
* [ ] Prepare demo
* [ ] Explain how it complements existing n8n training
* [ ] Demonstrate one Foundations lab
* [ ] Demonstrate one Reliability lab
* [ ] Demonstrate Kaz
* [ ] Demonstrate inline diagnostics
* [ ] Share pilot instructions
* [ ] Collect instructor feedback
* [ ] Collect student feedback
* [ ] Record improvement requests
* [ ] Fix important usability issues

## Adoption Evidence

If an academy chooses to use AEP:

* [ ] Confirm how it is being used
* [ ] Record actual scope of usage
* [ ] Collect approved testimonial if available
* [ ] Document real usage accurately
* [ ] Update portfolio wording based on actual adoption

## Important Rule

Do not claim that AEP is used by an academy until it is actually adopted or actively used.

---

# AEP V1 Fast-Track Completion — Status

**Built 2026-09-16 → 2026-09-17 as one continuous program, by owner direction.** Log and evidence:
`docs/superpowers/plans/2026-09-17-aep-v1-fast-track-completion.md`.

The full learner journey now exists in code: Home → Labs → a lesson walking problem, concept, guided
build, predict, test, break it, debug it, challenge and recap in **all ten labs** → progress and
sequential unlocking → Notes → Kaz V1 → Capstone.

* structurally verified and unit tested — lint 0, typecheck clean, 484 tests across 41 files,
  production build 9 routes plus Proxy
* QA — one consolidated pass returned FAIL (no lab could ever complete; self-check case binding
  trusted the client). Both fixed with mutation-proven regression tests; targeted retest PASS
* **not live verified** — the `aep_web_*` tables do not exist yet, so nothing persists and no lab
  has actually completed. No browser pass has been run on this program
* blocked on the owner — apply `database/aep_web_schema.sql`, then confirm RLS isolation with a
  second learner

In the checklist below, `[/]` means implemented and structurally verified, **not** live verified.

---

# Final AEP V1 Completion Checklist

AEP V1 is considered complete when:

## Existing Learning System

* [/] Standard lab system complete
* [/] All 10 labs built
* [/] Lab quality review complete
* [/] API integration demonstrated
* [/] Validation demonstrated
* [/] Pagination demonstrated
* [/] Retry/backoff demonstrated
* [/] Idempotency demonstrated
* [/] DLQ demonstrated
* [/] Logging demonstrated
* [/] Structured AI demonstrated
* [/] AI guardrails demonstrated
* [/] Human-in-the-loop demonstrated

## Capstone

* [/] Core Capstone runtime working
* [/] Safe success path live-tested
* [/] Invalid/duplicate paths live-tested
* [/] Approval/rejection live-tested
* [/] Retry/DLQ/recovery live-tested
* [ ] Final Capstone workflow exports packaged
* [ ] Capstone README complete
* [ ] Old demo/test rows cleaned before public demo

## Website Foundation

* [ ] Website foundation complete
* [ ] Light/Dark themes complete
* [ ] Floating dock complete
* [ ] Invite-only passwordless access complete
* [ ] Admin invite/access section complete

## Learning Experience

* [/] Home complete — contextual Kaz note and completion percentage added; not live verified since
* [/] Labs journey complete — `locked` state and Capstone link added
* [/] Focus Mode lesson engine complete — nine chunk kinds, all ten labs authored
* [/] Learner progress persistence complete — implemented; **schema not yet applied**, so it has never run against a real table
* [/] Sequential unlocking complete — structurally verified; blocked on the schema for live proof
* [/] Notes complete — autosave, general + per-lab, Save to Notes from the recap
* [ ] Interactive lesson visuals complete

## Test & Diagnostics

* [ ] Inline Send Test complete — **not built.** Every lab uses a paste-output self-check instead; see the fast-track log
* [/] Expected-vs-actual complete — self-check, 20 cases across ten labs
* [/] Checkpoint diagnostics complete — stop-at-first-failure checkpoints
* [ ] Per-lab webhook storage complete
* [ ] Optional n8n connection complete and secure
* [/] Supabase in-lab guidance complete — SQL setup is a build step inside Labs 07, 08 and 10

## Kaz

* [ ] Kaz n8n teacher workflow complete
* [ ] Knowledge retrieval complete
* [ ] Learner/test context integration complete
* [ ] Teaching modes complete
* [/] Challenge guardrails complete — progressive server-side hints, one per request; no model involved
* [ ] English/Tagalog/Taglish complete
* [/] Alien-orb website experience complete — orb states (intensity only), timing rules; no Ask Kaz chat

## Completion & Sharing

* [ ] Onboarding complete
* [ ] Final Kaz → creator completion message complete
* [ ] Accessibility checks pass
* [ ] Student pilot complete when possible
* [ ] Portfolio README complete
* [ ] Repository ready to share
* [ ] No secrets exposed

---

# Build Rule

We will work on **one Aim Point at a time** inside each phase.

Before starting an Aim Point:

1. Understand what we are building.
2. Understand what problem it solves.
3. Check the approved product/design docs.
4. Run the AEP Architect review.
5. Create or follow the detailed implementation plan.
6. Build the smallest working version.
7. Use the Automation Specialist when APIs/webhooks/n8n/Supabase/external integrations are involved.
8. Run QA / regression checks.
9. Run Project Manager reconciliation.
10. Document verified results.
11. Commit cleanly.
12. Move to the next Aim Point.

Do not build future phases early unless required by the current Aim Point.

Do not push unless explicitly requested.

---

# Roadmap Summary

```text
Phase 0  — Project Foundation
Phase 1  — Learning System Foundation
Phase 2  — Development Environment
Phase 3  — Labs 01–02: Fundamentals
Phase 4  — Labs 03–05: APIs & Data
Phase 5  — Labs 06–08: Reliability
Phase 6  — Logging & Observability
Phase 7  — Labs 09–10: AI Engineering
Phase 8  — Lab Quality Review
Phase 9  — Capstone
Phase 10 — AEP Website Foundation
Phase 11 — Invite-Only Access & Learner State
Phase 12 — Learning Experience Engine
Phase 13 — Inline Test & Smart Diagnostics
Phase 14 — Kaz AI Teacher
Phase 15 — Completion, Onboarding & Student Polish
Phase 16 — Student / Academy Pilot Experience
Phase 17 — Portfolio, Release & Repository Polish
Phase 18 — External Pilot / Academy Adoption
```
