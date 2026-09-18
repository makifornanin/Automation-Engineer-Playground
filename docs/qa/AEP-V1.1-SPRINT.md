# AEP V1.1 — Sprint Evidence

Date: 2026-09-18
Design and decisions: `docs/superpowers/plans/2026-09-18-aep-v1-1-final-feature-sprint.md`

Status language follows `CLAUDE.md`. **Live verified** means the path was
exercised for real: a browser action, a real request to n8n, a real row read
back from Supabase with that learner's own session.

Two accounts were used, as in the V1 pass: **learner 1** is the owner account
(`app_metadata.role = admin`, Labs 01–10 complete) and **learner 2** is a
second invited learner (student, Lab 01 not started).

---

## Capstone completion tracking — live verified

Nine `AEP-E2E-Capstone` copies of the reference workflows were published in n8n
so the canonical Capstone was never modified, and every scenario was run for
real against them.

| # | Scenario | Real response | Proof |
|---|---|---|---|
| 1 | Valid, safe request | `action_executed`, `attempts_used` 1 | Pass |
| 2 | Invalid request | `validation_failed` (HTTP 400) with two errors | Pass |
| 3 | Same request twice | second delivery `duplicate_ignored` | Pass |
| 4 | Restricted action | `pending_approval`, `requires_approval` true | Pass |
| 5 | Approval, then rejection | `approved_and_executed` + `rejected` | Pass |
| 6 | Deciding the same request twice | `not_pending` (HTTP 409) | Pass |
| 7 | Temporary external failure | `action_executed`, `attempts_used` 3 | Pass |
| 8 | Permanent external failure | `queued_for_recovery` with a `dlq_id` | Pass |
| 9 | Replaying a dead-lettered request | `recovered`, replay executed | Pass |

- **State:** Labs page "Unlocked" → opening `/capstone` wrote the Capstone row
  and showed "In progress · 0 of 9" → refresh kept it → nine passes →
  "Completed · 9 of 9" with the completion line.
- **Surfaces:** Home showed "Capstone · in progress / Continue the Capstone",
  then "Capstone · complete / Review the Capstone"; Your Journey and the Labs
  page followed.
- **Evidence:** nine `verified` rows under `lab_slug 11-capstone`, read back
  with learner 1's own session. No new table; the existing RLS applies.
- **Wrong evidence is refused:** a normal success pasted into the
  temporary-failure proof failed on "It took more than one attempt" (expected
  `attempts_used` of at least 2, found 1) and wrote nothing.
- **Isolation:** learner 2's Capstone showed "Preview", 0 of 10 labs, no
  proofs in the page at all, and no Capstone rows.

## Send Test for challenges — live verified

| Check | Result |
|---|---|
| Lab 03 challenge → Send Test | Pass; n8n execution 6291 ended at Return API Not Found |
| Lab 04 challenge → Send Test | Pass, all seven checkpoints; execution 6292 received the exact challenge lead |
| Evidence | Both challenge rows re-recorded `verified` at the time of the run |
| Locked learner (learner 2) replays `sendTest` for Lab 03's challenge | `locked`; n8n's last execution unchanged; no rows written |
| `sendTest` for Lab 07's challenge (paste-only) | `unknown_case`; nothing sent |
| `recordChunkEvidence` replayed for Lab 03's challenge | no write; `recorded_at` unchanged |

## Admin — partly live verified

| Check | Result |
|---|---|
| Owner sees the Admin item; learner 2 does not | Live verified |
| Learner 2 opens `/admin` directly | 404, no admin content |
| Owner opens `/admin` | Renders; learner list says the server has no secret key |
| Learner 2 replays the invite Server Action | "Only an admin can do this." |
| Invite, list, resend, revoke against real Supabase | **Not tested — blocked** |

**Blocked:** `SUPABASE_SECRET_KEY` is not set anywhere the app can read it —
not in `web/.env.local` (last saved 2026-09-13), and not in the process, user
or machine environment. Checked by name only; no value was read or printed.
Until it is set and the dev server restarted, the live invite → accept →
status → revoke path cannot be run.

## Secret exposure — scanned

`npm run verify` build output: **0** of 35 browser bundle files contain
`SUPABASE_SECRET_KEY` or an `sb_secret_` prefix; 0 of 336 build files and 0 of
293 git-tracked files contain a key value. The value scan is vacuous while no
key is configured — the name and prefix scans are not. `security-invariants`
also pins the name to `admin-client.ts` (plus its test), `auth.admin.*` to
`lib/admin/`, and bans any `NEXT_PUBLIC_*SECRET*`.

## Reviews

- **Architect:** approved with changes; all applied (admin client re-checks the
  session itself, `isRevoked` in session resolution, explicit allowlists,
  Capstone cases sourced from the live workflows, Capstone locked regardless of
  stored evidence).
- **Automation Specialist:** no blockers. One HIGH — `runSelfCheck` is not
  mode-gated, so paste is equal-trust everywhere. Accepted deliberately: the
  paste fallback exists for learners whose n8n AEP cannot reach, and gating it
  would lock them out. Recorded in the plan's accepted residuals.
- **QA:** PASS with notes. Mutation testing confirmed each admin check, the
  Capstone lock and the Capstone write gate fail a test when removed.

## Defects found and fixed in this sprint

| Severity | Defect | Fix |
|---|---|---|
| MEDIUM | Revoke's confirm step unmounted the focused button, dropping a keyboard user to the page body | Focus moves to Confirm revoke, and back on Cancel; mutation-proven test |
| LOW | `listLearners` had no test, and reported "truncated" at exactly 200 accounts | Uses Supabase's own next-page signal; five tests added |
| LOW | `InviteLearnerForm` had no test | Added |

## Verification

`npm run verify`: exit 0 — lint clean, typecheck clean, **727 tests across 60
files**, production build 10 routes plus Proxy.

## Test data left in place

- n8n: `AEP-E2E-Capstone` copies (service request, approval, DLQ recovery,
  action executor) and the republished `AEP-E2E-Lab 03/04` workflows.
- Capstone tables: rows with `aep_e2e_cap_` request ids.
- AEP: learner 1's nine Capstone proofs and re-recorded Lab 03/04 challenges.
