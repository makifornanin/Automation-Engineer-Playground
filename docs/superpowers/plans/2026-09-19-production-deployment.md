# Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Preserve the AEP Architect -> Developer -> Integration -> QA -> Project Manager order.

**Goal:** Prepare and verify the existing AEP website for Vercel production without changing application or workflow behavior.

**Architecture:** Vercel hosts the Next.js website and secure server mediation. Supabase owns authentication and persistence; existing n8n workflows remain on the owner's host behind the existing tunnel. Kaz's canonical lab JSON must be packaged as server files.

**Tech Stack:** Next.js 16.3.4, Node.js 24.x, npm, Vercel, Supabase, n8n, ngrok.

**Spec:** Approved deployment-only Architect handoff; [website vision](../../AEP-WEBSITE-VISION.md), [Kaz design](../../AEP-KAZ-DESIGN.md), and [operational runbook](../../production-deployment.md).

## Global Constraints

- Configuration and documentation only; no UI/backend/workflow changes or migrations.
- Preserve server-only secrets and the existing n8n hostname.
- No commit, push, project creation or deployment during local preparation.
- Do not call production complete before Integration, QA and Project Manager reconciliation.

## Review Focus

- Dynamic canonical workflow reads must survive server packaging (Task 1).
- Missing/offline tunnel must block deployment, not pass as an n8n response (Task 2).
- Public build-time site origin must match HTTPS production cookie behavior (Task 2).
- OTP and admin invite redirects have different contracts (Task 2).
- Local success must not be reported as deployed integration success (Task 2).

### Task 1: Package canonical workflow references

**Files:** Modify `web/next.config.ts`; inspect `web/src/lib/kaz/canonical.ts` and generated `web/.next/**/*.nft.json`.

**Interfaces:** `getCanonicalWorkflow` dynamically reads `process.cwd()/../labs/<slug>/workflow/*.json`. Produce traces containing all ten committed canonical workflow exports; preserve app working-directory layout. Align Turbopack and output tracing roots to the repository, as Next requires them to match.

- [x] Inspect existing traces before modification: 15 trace files, zero canonical workflow entries on 2026-09-19.
- [x] Add the following config properties and set `turbopack.root` to the same repository root:

```typescript
outputFileTracingRoot: path.resolve(import.meta.dirname, ".."),
outputFileTracingIncludes: {
  "/*": ["../labs/*/workflow/*.json"],
},
```

- [x] Final verification after root alignment: `npm run verify` from `web/` exited 0; lint/typecheck, 893 tests in 73 files and build passed without the mismatched-root warning.
- [x] QA independently verified all 11 final application page traces contain all ten canonical workflow files and the files exist. Inspect Vercel artifacts when deployment is unblocked; local traces alone do not prove hosted runtime layout.

### Task 2: Deployment runbook and gated execution

**Files:** Create `docs/production-deployment.md`; update `web/README.md`. Keep the existing `web/.env.example` inventory.

**Interfaces:** Seven environment names in the runbook; HTTPS site origin; Supabase OTP verification; existing production Kaz webhook and n8n hostname.

- [x] Document build settings, server/public environment separation, Supabase settings, tunnel prerequisite, smoke tests and rollback.
- [x] Owner restored existing Mac/Docker/ngrok; health/readiness return 200, Gateway rejects unauthenticated calls and answers authenticated requests. Production Kaz returned and persisted a real answer.
- [x] Configured Vercel Root Directory `web`, Node 24.x, all seven production variables and outside-root source inclusion. Owner confirmed Supabase production origin and exact `/sign-in` redirect; real emailed OTP sign-in succeeded for learner and admin.
- [x] Deployed `dpl_97frjbd6SEjqhbhzE2pfCZapVj4j` to `https://automation-engineer-playground.vercel.app`; recorded all 20 smoke outcomes and verification limits. Added `.vercelignore` and confirmed final uploaded sources exclude real env files. Existing E2E Lab 03 Send Test passed after owner activated the correct copy.
- [x] Integration, QA and Project Manager reconciled local evidence: preparation READY WITH NOTES; production NOT READY. See `docs/qa/AEP-PRODUCTION-DEPLOYMENT.md`.
- [x] Final Project Manager reconciliation: READY WITH NOTES for tested beta scope; Integration PASS and QA PASS WITH NOTES. Hosted canonical lookup and host/editor operational controls remain explicitly unverified beyond the recorded structural/endpoint checks.

**Commit boundaries:** One focused config/docs commit after review if requested. No commit or push is part of the current preparation task. No roadmap completion marks until live verification supports them.
