# AEP full sweep — 2026-09-21

Scope: audit existing application, learning content, Kaz and integration boundaries; fix reproduced defects. No new roadmap features, schema changes, production deployment, live workflow edits, commits or pushes. Earlier uncommitted deployment preparation is preserved.

## Subsequent release authorization

After this audit, the owner authorized one fix commit on `main`, push to `origin/main`, deployment to the existing Vercel project, and synchronization of only the existing Kaz Gateway with this export. The no-deployment statements below describe the completed audit stage. Release gates are a fresh `npm run verify`, configured-secret scan, exact Gateway comparison, and production-only smoke tests. No schema/RLS migration, credential change, duplicate workflow/project, new feature, or release tag is authorized. Release outcomes must be verified independently from this audit evidence.

## Built scope

Invite-only OTP and admin access management; themed application shell/dock; Home and grouped Labs; ten registered lessons with Focus Mode, progress, sequential access, predictions, challenges and diagnostics; notebook; inline Send Test and paste checks; nine-scenario Capstone; Kaz companion, per-lab conversations, deterministic lesson/canonical retrieval, progressive help, language matching and privileged server-to-n8n-to-Gemini mediation.

## Reproduced defects and local fixes

| Area | Defect | Local correction / evidence |
| --- | --- | --- |
| Kaz history | Oldest 50 messages loaded after long conversations | Newest bounded window, chronologically displayed; regression reproduced before fix |
| Kaz turn order | Question and answer shared a timestamp | Distinct new timestamps and stable legacy tie ordering; historical equal-time multiple-pair ordering remains unrecoverable |
| Kaz lesson context | Guided-build action code omitted | Uses existing bounded action serializer |
| Kaz persistence | Failed save presented as normal persisted answer | Keeps answer and shows unsaved warning, including reopening |
| Sanitization | Sensitive name/value pairs copied unsanitized sibling properties | Recursive sibling redaction in canonical and Gateway sanitizers; synthetic reproduction, no actual credential disclosure established |
| Gateway execution evidence | Trigger omitted; false IF branch dropped; first run mistaken for latest | Bounded trigger and recent output samples with node/run/branch provenance and partial-evidence labels |
| Kaz prompt | Prior history and downstream output could lead to overconfident diagnosis/too much help | Restates current teaching limits after history, distinguishes output from input; model adherence still requires live retest after publication |
| Notes | Slow writes could overlap/create duplicate rows or report Saved too early | Serial writes reuse inserted identity, drain newest edit and only acknowledge matching saved content |
| Notes navigation | Debounced edit discarded on component unmount | Flush on in-app navigation; hard browser-close remains best-effort |
| Progress | Database save errors silently ignored | Boolean persistence result, separate warning from test verdict, failed-step rollback and save retry |
| Kaz keyboard | Closing removed focus | Focus restored to launcher by Close/Escape |
| Kaz sizing | Mobile launcher rendered 112px despite requested 44px | Removes conflicting default size; browser measured local 44px, proportional core |
| Invalid lab | Nested main landmarks in app 404 | Shared 404 content with one main landmark in each layout; browser verified both invalid routes |

## Live evidence

- Signed-in production Home, all ten lab routes, Capstone, Notes, Settings and Admin loaded. Lab desktop samples had no horizontal overflow or browser exception. This is page/interaction smoke coverage, not a rerun of every lab scenario.
- Dark theme survived reload; system selection restored. Mobile Lab03 inspected at 390×844.
- Production Lab03 missing-customer Send Test passed both assertions against the existing endpoint.
- Fresh production Kaz execution `7073` succeeded on 2026-09-21 through the existing Gateway.
- Read-only inspection of archived production executions `6796`, `6797`, `6798` confirmed help levels 1, 2, 3, canonical absent/absent/structure-only, learner workflow and execution inspection, and actual Gemini execution (`gemini-3.1-flash-lite`). Hosted Lab03 canonical lookup is established for those requests.
- Execution `6798` demonstrated an inaccurate answer: downstream HTTP response `body:{}` was described as missing incoming request data. Current deployed sanitizer lacked webhook/branch evidence. The export fix is local; do not report the production diagnosis or anti-spoiler behavior as fixed.
- Local browser checks on changed code: launcher 44px, no horizontal overflow, Escape restores focus; invalid app/root routes each have one main landmark.

## Automated verification and reviews

- Baseline `npm run verify`: lint/typecheck/build pass; 893 tests across 73 files pass.
- New regressions observed failing before behavior fixes.
- Developer Kaz store/context/persistence: 54 focused tests pass.
- Integration independently verified canonical/Gateway: 34 tests pass.
- QA independently verified Notes/Kaz: 106 tests across eight files pass.
- Integration independently verified progress fixes: 92 tests across six files pass.
- Final `npm run verify`: exit 0; lint/typecheck/build pass; **930 tests across 76 files pass**.
- Exact-value scan of the two locally available privileged Supabase/Gateway secrets: zero matches in 392 tracked/new and browser-build files. This does not claim coverage of unavailable credentials.
- Final Integration and QA: PASS WITH NOTES for reviewed local fixes; no confirmed regression found.
- Project Manager: READY WITH NOTES for audit/local fixes; NOT READY for release until deployment/publication and focused live retesting. No roadmap completion or production-fix claim.

## Remaining scope and limits

- Fixes require an application deployment and publication of the changed Gateway export, followed by live regression/model checks. No production mutation was made in this sweep.
- Own-n8n connection and persistent language preferences/localized lessons are absent; current per-message Kaz language matching works within existing scope.
- Dedicated onboarding, interactive diagrams, and Kaz-to-creator completion handoff remain unbuilt.
- `capstone/` lacks packaged workflow exports and a learner README despite historical runtime proof checks.
- Root README/roadmap contain stale status descriptions; preserve historical verification when reconciling them.
- Independent learner pilot/usability feedback remains missing.
- Existing Mac/Docker/tunnel availability is an operational dependency.
- Existing same-host saved webhook paths are inspection capabilities, not independently verified n8n ownership. Owner-row RLS protects cross-user app data; it does not make a learner's own progress tamper-proof.
- Process-local throttles, DNS rebinding residuals and key-based free-text redaction limits are existing hardening constraints, not newly solved by this patch.
- No claim of exhaustive accessibility compliance, every workflow scenario rerun, or guaranteed Gemini adherence.
