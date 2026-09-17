# AEP V1 — Autonomous End-to-End Pass

Date: 2026-09-17
Mode: owner-directed. Claude acted as the learner, end to end, in a real browser
against the running AEP app, the real Supabase project and the real n8n 2.25.7
instance behind the project's ngrok domain.

Status language follows `CLAUDE.md`. **Live verified** below means the path was
exercised for real in this pass: a browser action, a real request to n8n, a real
execution, and a real row read back from Supabase with the learner's own session.

---

## Setup

- AEP: `next dev` on `localhost:3000`, learner 1 signed in (invited test learner).
- Browser: Chrome for Testing with a disk-backed profile, driven by agent-browser
  over CDP. Occluded-window throttling was disabled; before that, Chrome dropped
  synthetic input to windows hidden behind the editor.
- n8n: every lab was built as a dedicated `AEP-E2E-` workflow with its own
  `aep-e2e-` webhook paths, so the canonical lab workflows were never modified.
- Supabase: learner rows read back through PostgREST with learner 1's own access
  token. Lab tables read through n8n with the lab's existing credential.

## Labs 01–10

| Lab | Built in real n8n | Test | Break It → Debug It | Challenge | Complete + next unlocked |
|---|---|---|---|---|---|
| 01 | Editor UI, node by node | Paste, real output — pass | `email: null`, as the lesson says | Real output — pass | Yes |
| 02 | From lesson | Paste — pass; OR output fails as it should | 2 leads in Priority Sales | Jamie, Jordan, Casey — pass | Yes (recap open-step flow exercised) |
| 03 | From lesson; Test URL via curl | **Send Test — pass**, execution 6116 | `/userz/` and 999 both 404 | 2, 7 found; 999 honest 404 — pass | Yes |
| 04 | Export, then lesson code as rendered | **Send Test — pass**; failure diagnostics checked | `email is required` | Accepted, fully cleaned — pass | Yes |
| 05 | From lesson | Paste (trimmed) — pass; 452 KB paste refused | 2 pages, 10 records | 30 pages, 208 records — pass | Yes |
| 06 | Export, then lesson code as rendered | Paste — pass | Stops after 2 attempts | Backoff 2, 4, 8; 4 attempts — pass | Yes (re-opened by a content change, re-completed via recap) |
| 07 | Export | **Send Test — pass**, 2 deliveries; 1 business row | Bypass writes 2 rows | Processed, duplicate, processed — pass | Yes |
| 08 | Export; lesson recovery flow verified | **Send Test — pass**, queued after 3 attempts | Bypass marks a failed replay recovered | Recovered one, kept one pending — pass | Yes |
| 09 | Export, real Gemini | **Send Test — pass** (sales) | Simulator → safe fallback | Sales, support, billing, other; fallback — pass | Yes |
| 10 | Export, real Gemini | **Send Test — pass** (held at confidence 1.00) | — | Auto, held, held; approve, reject, repeat — pass | Yes; Capstone unlocked |

Gemini failed transiently twice in about fifteen calls (a 503 and a failed
fetch). Both succeeded on retry. Real learners will meet this.

## Live-verified behaviour

- **Progress:** refresh and leave-and-return resume the current chunk; completed
  labs stay complete; each completion unlocks exactly the next lab; the recap
  names open steps and links to them.
- **Persistence:** every milestone's evidence and hint count read back from
  `aep_web_lab_chunk_state` under the learner's own RLS.
- **Notes:** autosave with a "Saved" state, persistence across reload, Save to
  Notes attaches the recap to the right lab.
- **Send Test:** saved Production URL (hostname only shown); refused localhost,
  http and IP-literal URLs with plain messages; `localtest.me` and
  `10.0.0.1.nip.io` blocked at send time after DNS resolved them to private
  addresses; unpublished workflow → "not registered" hint; a pass records
  `verified`, a failure records nothing.
- **Evidence integrity:** the captured `recordChunkEvidence` Server Action,
  replayed from the learner's browser with test and challenge chunk ids, wrote
  nothing (`recorded_at` unchanged); the same replay on `break-it` wrote, proving
  it reached the action.
- **Session:** sign-out ends only that session, clears the auth cookies, every
  protected route redirects, Back does not restore the page.
- **Browser exposure:** no answer keys, full webhook URLs or key material in any
  scanned page's HTML or RSC payload.
- **Responsive:** Home, Labs, Notes, Capstone, Kaz and lesson pages at 375 px in
  light and dark — no page-level horizontal scroll; lesson nav clears the dock.
- **Keyboard:** logical tab order with visible focus; Enter activates Back, Next,
  Send Test and Kaz hints; notes typed from the keyboard autosave.
- **Kaz V1:** Home note reflects real progress; Break It note claims no result;
  hints progressive and persisted; Kaz page honest about what she cannot do.
- **Capstone:** unlocks after Lab 10; overview, requirements and proof list render.

## Final checks — two learners (2026-09-18)

A second invited learner signed in, confirmed as a different account by hashed
user id (`user#2174b104`, learner 1 `user#45d6c2fe`). Learner 2 was fresh: Lab 01
not started, Labs 02–10 locked, empty notes.

### Isolation — live verified, both directions

Real authenticated PostgREST requests with each learner's own session, aimed at
the other learner's real user id (never printed):

| Attempt | Result |
|---|---|
| Read progress, evidence, notes, webhooks filtered to the other learner | HTTP 200, 0 rows — all four tables, both directions |
| Update the other learner's notes, evidence, webhook URLs | HTTP 200, 0 rows affected |
| Delete the other learner's notes | HTTP 200, 0 rows |
| Delete the other learner's progress | HTTP 403, 42501 |
| Insert a note or `verified` evidence as the other learner | HTTP 403, 42501 |
| Victim's data, hashed before and after | Unchanged — learner 1: 10 progress, 75 evidence, 2 notes, 6 webhook rows; learner 2: 1 note |

In the UI, learner 2's Home, Labs and Notes showed none of learner 1's progress
or notes; learner 2's note saved, survived reload, and never appeared in learner
1's Notes.

### Locked-lab refusal — live verified, after a fix

Captured Server Actions replayed from learner 2's browser against locked labs:

| Action | First run | After `cfd8543` |
|---|---|---|
| Open `/labs/03` | Preview, "Complete Lab 02 first", no lesson | same |
| `recordChunkEvidence` (Lab 03 build) | no row | no row |
| `setCurrentChunk` (Lab 03) | no row; lab stays locked | same |
| `revealNextHint` (Lab 03 challenge) | `null`, no hint text | same |
| `runSelfCheck` (Lab 05, correct output) | **evaluated, "Pass"** (no evidence) | `locked` |
| `saveLabWebhook` (Lab 03) | **URL saved** | `locked`, nothing saved |
| `sendTest` (Lab 03) | **request delivered to n8n** | `locked`, nothing sent |

Learner 2's progress, evidence and webhook rows were 0 before and after the
final run; the webhook row the first run created was deleted with learner 2's
own session. A learner with the labs unlocked still passed a self-check and
reached n8n with Send Test after the fix.

## Defects found and fixed in this pass

| Severity | Defect | Commit |
|---|---|---|
| HIGH | Labs 04, 06, 07, 08, 09, 10 (and 03's bodies) condensed their builds until a learner following the lesson could not build a workflow that passes its checks; several pointed at repo files learners cannot open | `da6aa22` `a373ed9` `542bdfb` `a1cbcc8` `6f9225f` `3196c4e` `c6e6a70` |
| HIGH | Lab 08 Build DLQ Record code omitted `event_type`, which its own table declares not null | `6f9225f` |
| HIGH | Lab 07 challenge required a fixed event id, so it could never pass twice | `a1cbcc8` |
| HIGH | Lab 01 and 02 challenges hid their required field names or input data | `69d6cc5` `66fa94f` |
| MEDIUM | Incomplete recap did not say what was open (owner-reported) | `69d6cc5` |
| MEDIUM | Hints vanished on reload and the count regressed | `69d6cc5` |
| MEDIUM | Lab 05 told learners to paste a 452 KB output AEP refuses | `2c31c97` |
| MEDIUM | Lab 02 IF wording ("ALL / AND", untyped false) did not match n8n 2.25; the String reading errors | `66fa94f` |
| MEDIUM | n8n 2 replaced Active with Publish; Send Test copy said Activate | `69d6cc5` |
| MEDIUM | Home and Kaz Continue pointed a finished learner back at Lab 10 | `dbc2134` `a67ae61` |
| MEDIUM | Debug It printed answers under its questions | `69d6cc5` |
| HIGH | A locked lab's self-check still ran, its webhook could be saved, and Send Test sent a real request | `cfd8543` |
| LOW | Disabled Send Test had no reason; paste panel had no Expected line; JSON view non-breaking spaces rejected; empty-body hint misleading | `66fa94f` `69d6cc5` `3196c4e` |

## Owner notes — lab workflow files (not modified)

- **Lab 08 export:** Increment Recovery Attempts writes `recovery_attempts`,
  which the lesson's table does not have, and it replaces the item with the
  database row, so Keep DLQ Pending emits no `dlq_id`. The lesson now follows a
  flow without that node.
- **Lab 02 challenge data:** Dana Reyes's country is `Pilipins`.
- **Lab 07 tables** already held `evt_challenge_001`/`_002` and `evt_break_001`
  from earlier testing; the lesson now asks for fresh ids.
- **Labs 09 and 10:** consider Retry On Fail on the Gemini node; transient
  failures leave a webhook caller an empty HTTP 200.

## Test data left in place

- n8n: workflows prefixed `AEP-E2E-` (published ones unpublished at the end of
  the pass), plus two read-only `AEP-E2E-db probe` workflows.
- Supabase lab tables: rows with `aep_e2e` / `AEP-E2E` ids, and Send Test's
  fixed sample ids (`evt_504`, `evt_dlq_001`, `req_ai_001`,
  `req_guard_restricted_001`).
- AEP: learner 1's progress, notes and saved webhooks; learner 2's one test
  note (`AEP-E2E learner 2 private note`).

## Final verification

`npm run verify` at `cfd8543`: exit 0 — lint clean, typecheck clean, 621 tests
across 49 files, production build 9 routes plus Proxy.

## Result

**AEP V1 DONE: YES.** Every Definition of Done step has been exercised live by a
learner, including isolation between learners and locked-lab refusal.
