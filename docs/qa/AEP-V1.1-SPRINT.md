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

Four `AEP-E2E-Capstone` copies of the reference workflows (service request,
approval, DLQ recovery, action executor) were published in n8n so the canonical
Capstone was never modified, and all nine scenarios were run for real against
them.

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

## Admin — live verified

Authorization, first:

| Check | Result |
|---|---|
| Owner sees the Admin item; a student does not | Only the owner's dock shows it |
| A student opens `/admin` directly | 404, no admin content |
| A student replays the invite Server Action | "Only an admin can do this." |
| The owner's own row | Shown as ADMIN with no revoke control |

Then the whole learner lifecycle, with a real invited address (a plus-address
of the owner's own mailbox):

| Step | Result |
|---|---|
| Invite from the Admin page | "Invite sent." — Supabase records `invited_at`, unconfirmed |
| Listed status | "Invited — not accepted yet · Never signed in" |
| Resend invite | "Invite sent again. The earlier link no longer works." |
| Accept the invite link | Account confirmed; the landing strips the session from the URL and says "Invite accepted" |
| Listed status after accepting | "Active", ordered after the other active learners |
| Sign in with a 6-digit code | Signed in as that learner; wrote a note and opened Lab 01 |
| Invite the same address again | "That email already has access. They can sign in with a code." |
| Revoke | "Access revoked. Their progress and notes are kept."; status "Revoked"; only Restore is offered |
| The revoked learner's next request | Every protected page redirects to `/sign-in` |
| The revoked learner requests a code and verifies it | Refused; they stay signed out |
| Their data while revoked | 1 note and 1 progress row, unchanged — nothing deleted |
| Restore | "Access restored."; status "Active" |
| After restore | The learner reaches `/notes` again and their note reads exactly as written |

### The revoke residual, measured rather than asserted

With the learner revoked, the same access token they already held was sent to
three places at once:

| Destination | Response |
|---|---|
| AEP (a protected page) | Redirected to `/sign-in` |
| Supabase Auth `/user` | `403 user_banned` |
| Supabase database API | `200` — their own note row |

That is exactly what the Admin page tells an admin: revoking closes AEP
immediately and blocks signing in, and a token already issued keeps reading
that learner's own rows until it expires.

**Where the key was:** it had been saved to the repository-root `.env`, which
Next — running in `web/` — never reads. It was copied into `web/.env.local`
(git-ignored) without its value being read into the transcript, and the dev
server picked it up.

## Secret exposure — scanned, with a real key configured

Against the production build, searching for the configured key's actual value:

| Scanned | Key name | `sb_secret_` prefix | The key value |
|---|---|---|---|
| 35 browser bundle files | 0 | 0 | 0 |
| 336 build output files | — | — | 0 |
| 316 git-tracked files | — | 0 | 0 |

`security-invariants` also pins the name to `admin-client.ts` (plus its test),
`auth.admin.*` to `lib/admin/`, and bans any `NEXT_PUBLIC_*SECRET*` in any file
that ships. The one place the key may appear is `web/.env.local`, which is
git-ignored and never bundled.

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
| MEDIUM | The invite landing stripped the session from the URL but showed the learner nothing: it read the fragment through a store while its own effect was removing it, and on a real navigation the read lost the race | The landing is recorded on the history entry before the URL is cleaned; all three landings (accepted, expired, ordinary) verified live, plus a regression test |
| LOW | The same code replaced `history.state` wholesale, which the App Router also uses | Existing state is preserved |
| LOW | The secret-key scan failed once a real key existed, because it searched `web/.env.local` — the one file the key belongs in | Scoped to files that ship; `.env*.local` excluded, everything else still scanned |

## Verification

`npm run verify`: exit 0 — lint clean, typecheck clean, **728 tests across 60
files**, production build 10 routes plus Proxy.

## Test data left in place

- n8n: `AEP-E2E-Capstone` copies (service request, approval, DLQ recovery,
  action executor) and the `AEP-E2E-Lab 03/04` workflows. All six were
  unpublished at the end of the pass; the four reference Capstone workflows
  were never modified and remain unpublished.
- Capstone tables: rows with `aep_e2e_cap_` request ids.
- AEP: learner 1's nine Capstone proofs and re-recorded Lab 03/04 challenges.
- Supabase: one invited test learner (a plus-address of the owner's mailbox)
  with one note and one progress row, left with access restored. Remove it
  whenever you like — revoking is enough to close access without losing data.

## Result

**AEP V1.1 DONE: YES.** All three features are live verified end to end.
