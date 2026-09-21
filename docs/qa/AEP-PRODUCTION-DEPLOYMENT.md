# Production deployment sprint evidence

Date: 2026-09-19. Baseline: clean `main` at `v1.2.0`.
Status: **LIVE — READY WITH NOTES for the tested beta scope**.

Final Project Manager reconciliation: deployment and the 20-check functional smoke
matrix are supported by the recorded evidence. Integration PASS; QA PASS WITH NOTES.
No observed BLOCKER/HIGH failure remains in the tested scope. Hosted canonical
lookup, complete host/editor controls and n8n API-key exact-value scanning remain
the explicitly open verification limits. This is not a full operational/security audit.

## Final Send Test retest

After the owner published the exact existing `AEP-E2E-Lab 03 APIs & Webhooks`
copy, the deployed Lab 03 Send Test passed both assertions. Technical details:
HTTP 404 (the expected business response), 1479 ms, one delivery, and
`{"success":false,"message":"External customer data not found"}`.
This is no longer the n8n webhook-registration 404. The response establishes
successful live workflow behavior; a separate n8n execution ID/log was not inspected.
Screenshot: `tmp/production-send-test-pass.png` (local ignored verification artifact).
Integration retest: PASS. QA independently inspected the screenshot and returned
PASS WITH NOTES for observed production smoke scope, with no remaining observed
BLOCKER/HIGH failure in that scope. No agent edited workflow logic or backend code.

This final retest supersedes the registration-failure history below.

### Latest activation retest

After the owner reported activation complete, deployed Send Test was retried and
still displayed `webhook not registered`. A separate POST to the current saved
Supabase webhook with the same read-only missing-customer input (`user_id: 999`)
returned HTTP 404 with n8n's unregistered-webhook response and no ngrok error.
The required route is `POST /webhook/aep-e2e-lab-03-lead`.

Do not infer that the owner failed to publish: publication, route/method mismatch,
or the published workflow version still needs inspection on the Mac. The next
owner action is to check the published workflow's Webhook HTTP Method and Path.
No saved URL, workflow, credential or backend behavior was changed during retest.

The owner subsequently confirmed Webhook HTTP Method `POST`, Path
`aep-e2e-lab-03-lead`, and a published workflow in the editor. Further public checks
returned health/readiness 200, but the exact POST route still returned n8n 404
`not registered` (no ngrok error). A fresh authenticated Gateway inspection returned
`looked.workflow=true` and `looked.execution=true`; its model-mediated answer named
the same workflow/path and described it as not published. This is a diagnostic clue,
not authoritative raw API evidence of activation state.

Next discriminator: owner runs the same read-only missing-customer request against
the Mac's local n8n port, bypassing ngrok, and supplies Docker port mappings. A local
success with public registration failure points toward differing upstreams; the same
local registration failure points toward n8n publication/registration state. No
restart, republish, configuration mutation or workflow change was performed.

Owner's Mac Terminal screenshot confirms container `n8n` binds
`127.0.0.1:5678->5678/tcp`; containers `n8n-ngrok` and `n8n-postgres` are running.
The direct local POST returned the identical n8n unregistered-webhook 404.
Registration failure therefore exists inside the local n8n service independently
of Vercel/ngrok. Next read-only check: n8n version and CLI active-workflow listing
inside the confirmed existing container. No restart or workflow mutation requested.

Owner supplied n8n version `2.25.7` and `list:workflow --active=true` output.
The active list contains `W2YqgaJuZ0mzQLNG|AEP Lab 03 - APIs & Webhooks` and
`AEP Kaz Gateway`, but does not contain `AEP-E2E-Lab 03 APIs & Webhooks`.
The saved production test URL still targets the E2E path, previously matched by
Gateway inspection to the E2E workflow. This establishes an active-workflow mismatch;
the canonical Lab 03 being active does not establish activation of the E2E copy.
Next owner action: locate and publish the exact existing E2E workflow by name,
without changing the canonical workflow, node definitions, credentials or saved URL.

## Current production evidence

Production URL: https://automation-engineer-playground.vercel.app

Current deployment: `dpl_97frjbd6SEjqhbhzE2pfCZapVj4j`, READY, production, Node 24,
Next.js, Root Directory `web`, Fluid enabled. Owner confirmed Supabase Site URL
matches this origin and redirect allowlist includes `/sign-in`, preserving localhost.
Seven Production variables remain configured; no secret values appear in this report.

| Requested smoke check | Evidence / result |
| --- | --- |
| 1. HTTPS production loads | PASS; sign-in 200, root redirects to production `/sign-in` when anonymous. |
| 2. Sign-in page | PASS; rendered visually and in browser snapshot. |
| 3. OTP sign-in | PASS; owner entered actual emailed codes in separate learner/admin browser windows. |
| 4. Session refresh | PASS for learner; session remains authenticated. Cookie flags Secure, HttpOnly, SameSite=Lax. |
| 5. Home | PASS; learner's existing Lab 01 state visible. |
| 6. Labs | PASS; existing sequence and locked labs rendered. |
| 7. Notes | PASS; existing E2E note survived and was not edited. |
| 8. Admin for admin | PASS; invite form and existing learners rendered; no invites/revocations performed. |
| 9. Admin refusal for student | PASS; student receives existing 404 refusal page, no admin controls. |
| 10. Lab progression | PASS read-only; learner Lab 01 in progress, admin's previously completed Lab 03 available. |
| 11. Existing progress | PASS; existing learner/admin state rendered without migration or direct state changes. |
| 12. Send Test reaches n8n | PASS; deployed Lab 03 action returned the expected business response and passed both checks. |
| 13. Real test workflow execution | PASS by expected live response: HTTP 404, 1479 ms, one delivery, success=false and expected missing-customer message. Separate execution ID/log not inspected. |
| 14. Kaz panel | PASS; opened on deployed Lab 01 and Lab 03. |
| 15. Real Gateway | PASS; deployed AEP question returns answer; Lab 03 inspection identifies saved existing E2E workflow. |
| 16. Gemini reply | PASS response through existing Gateway/model path; no workflow/model changes. |
| 17. Kaz persistence | PASS; new learner question/reply remain after full refresh and reopening panel. |
| 18. Capstone | PASS; preview loads for learner. |
| 19. Sign-out | PASS; learner returns to production `/sign-in`. |
| 20. Production redirects | PASS on observed auth/session paths; no localhost redirects. |

### Final upload and security checks

The first deployment uploaded the root `.env` containing only a public Supabase URL;
`web/.env.local` containing secrets was excluded. Added deployment-only `.vercelignore`
and redeployed. Final deployment source listing contains only `.env.example` files,
no real env files. Existing application code and workflow exports are unchanged.
Eleven served sign-in JS/CSS assets and 15 assets referenced by the authenticated
Lab 03 page were scanned against the configured Supabase admin and Kaz secrets:
zero hits (counts may overlap). n8n API key remains unavailable for exact comparison.
Browser session cookies are not readable through `document.cookie`.

Both remote production builds passed. Prior full local `npm run verify` passed
893 tests, lint, typecheck and build. No application/test modifications followed it;
the additional change is deployment file exclusion. No commit, push or tag.

### Remaining gates

- Successful Send Test is now verified after owner activation; independent n8n execution-log inspection was not performed.
- Canonical files are traced locally and uploaded as source; hosted runtime resolution
  remains unproven by a generic Kaz answer. No debug endpoint or backend change added.
- Existing n8n editor is reachable; API/Gateway reject unauthenticated calls. Editor
  authentication, routing restrictions and account domain persistence remain unverified.
- Final QA and Project Manager reconciliation is complete: READY WITH NOTES for
  tested beta scope; retain the remaining verification limitations as open follow-up.

Current Git scope: two modified files (`web/README.md`, `web/next.config.ts`) and
four new files (`.vercelignore`, deployment runbook, plan and this report).
No backend source, schema, UI, workflow, commit, push or tag changes.

The sections below preserve earlier preparation and prerequisite history; this
current-production section supersedes their pending deployment/URL statuses.

## Resumed deployment evidence

The owner restored the existing Mac/Docker/n8n/ngrok runtime. Direct checks against
the same endpoint returned health 200, unauthenticated API 401 and unauthenticated
Gateway POST 403. An authenticated Gateway request returned 200, a nonempty answer
and no configured secret echo. This is a direct Gateway check, not a deployed AEP
Kaz smoke test. No learner state was changed and no workflow was edited.

Vercel project `prj_YRWsENHlG9msKKJQRofqwy5iw9G5` was created in `maki-s-projects2`
and connected to `makifornanin/Automation-Engineer-Playground`. Confirmed settings:
Next.js, Root Directory `web`, Node 24.x, outside-root sources enabled, Fluid enabled,
`npm ci`, `npm run build`. The verified project domain is
`automation-engineer-playground.vercel.app`; there is no deployment yet.
All seven required variables were configured for Production and verified by name;
Supabase and Gateway secrets are sensitive variables. No credentials were printed.

The next owner action is to save the existing Supabase project's URL configuration:
Site URL `https://automation-engineer-playground.vercel.app`, redirect allowlist
entry `https://automation-engineer-playground.vercel.app/sign-in`, preserving existing
development entries. No Supabase management connection is available in this session.
The owner must confirm this prerequisite before deployment.

The n8n editor page is reachable publicly on the existing tunnel (200); unauthenticated
API access is rejected. Routing restrictions remain unverified. Mac, Docker and the
existing tunnel must remain online. No new instance or tunnel was created.

The table below preserves the initial local-preparation evidence; this resumed
section supersedes its tunnel, project, environment and next-owner-action statuses.

## Requested deployment report

| Item | Actual result |
| --- | --- |
| Production URL | None; no AEP deployment created. |
| Vercel configuration | Authenticated access confirmed for `maki-s-projects2`. Prepared: Root Directory `web`, Next.js, Node 24.x, `npm ci`, `npm run build`, default output, include outside-root sources. No project settings changed. |
| Production environment | No variables uploaded. All seven required names exist locally: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `KAZ_GATEWAY_URL`, `KAZ_GATEWAY_SECRET`, `KAZ_N8N_HOST`. |
| Supabase URLs | Unchanged. Final production origin not assigned. Code requires Site URL = production origin and invite redirect = origin + `/sign-in`; no callback route. Retain approved localhost entries. |
| n8n HTTPS architecture | Existing Docker n8n through existing ngrok hostname is the candidate. Account ownership, persistence, routing restrictions and host configuration remain unverified. No tunnel changes made. |
| n8n availability | Owner host, Docker n8n and tunnel must stay running with network connectivity. No Docker/ngrok executable, process or ports 5678/4040 listener found in inspected environment; a Docker context exists but no reachable runtime was established. |
| URL audit | Baseline tracked matches: 33 documentation, 17 test fixtures, 2 development-example lines, 1 application comment. Two actual production dependencies are Gateway workflow API calls to the existing ngrok hostname; preserve them. Local site origin must be replaced in Vercel before building. |
| Production smoke tests | All 20 requested production checks remain NOT TESTED: no deployed AEP URL exists. |
| Kaz production | NOT TESTED. Existing configured tunnel responds HTTP 404 with `ERR_NGROK_3200`. |
| Send Test production | NOT TESTED; no real production n8n execution triggered. |
| Auth production | NOT TESTED; no OTP requested, invitation sent or learner state modified. |
| Secret scan | Final exact-value scan: zero matches for locally available Supabase admin and Kaz Gateway secrets in 351 tracked/new files and 884 non-cache build files including 170 browser files. n8n API key unavailable for exact-value comparison. Existing security invariant tests pass. |
| Verification | Final `npm run verify` from `web/`: exit 0; lint and typecheck clean, 893 tests in 73 files pass, production build succeeds. |
| Files changed | `web/next.config.ts`, `web/README.md`, `docs/production-deployment.md`, `docs/superpowers/plans/2026-09-19-production-deployment.md`, this evidence report. |
| Backend guard | No changes under `web/src`, `database`, `labs`, `capstone` or `docs/kaz` relative to `v1.2.0`. Backend/application behavior, UI and workflow logic were not modified. |
| Open issues | BLOCKER: existing tunnel offline. HIGH readiness gaps: no deployed auth/Kaz/Send Test evidence; hosted canonical filesystem layout and production secrets not verified. Tunnel persistence and public editor/API restrictions need host inspection. |
| Git | `main` tracks `origin/main`; two modified files and three new documentation files. No commit, push or tag. |

## Packaging evidence

Existing traces omitted canonical workflow JSON. Next configuration now sets
repository-level tracing and Turbopack roots and includes `../labs/*/workflow/*.json`.
QA independently confirmed all 11 final application page traces contain all ten
canonical workflows and the referenced files exist. Hosted working-directory/file
placement remains a live gate.

## Review sequence

- Architect: identified canonical packaging and existing hostname dependencies.
- Developer: implemented deployment configuration and documentation only.
- Integration: no required configuration/documentation fixes; production blocked.
- QA: PASS WITH NOTES for local preparation; FAIL for production readiness.
  Independently checked final traces and configuration/documentation-only scope.
- Project Manager: NOT READY for production; local preparation READY WITH NOTES.
  Final verification/review documentation reconciled; no roadmap item marked complete.

## Initial owner blocker (resolved)

Start the existing ngrok tunnel for `handcraft-tubeless-bonded.ngrok-free.dev`
on the machine hosting the existing n8n instance. Do not create a replacement
instance or change workflows. Expected result: the endpoint is online and forwards
to the existing n8n; the coordinator will verify authentication and routing next.

The observed error is documented as an [offline endpoint](https://ngrok.com/docs/errors/err_ngrok_3200).
An [account-assigned ngrok development domain](https://ngrok.com/docs/pricing-limits/free-plan-limits)
can be a no-cost beta option, but the current account assignment has not been verified.
