# Kaz V2 — Live Pass

Date: 2026-09-18
Design: `docs/superpowers/specs/2026-09-18-kaz-v2-design.md`
Plan: `docs/superpowers/plans/2026-09-18-kaz-v2.md`

Status language follows `CLAUDE.md`. **Live verified** means it was exercised
for real: a browser action, a real Gateway execution in n8n, a real Gemini
answer, and rows read back from Supabase with a learner's own session.

Two accounts: **learner 1** (owner, Labs 01–10 and the Capstone complete, saved
webhooks for the webhook labs) and **learner 2** (a student with Lab 01 open and
no saved webhook).

---

## What was exercised

| # | Check | Result |
|---|---|---|
| 1–3 | Lab 03 → orb → panel, labelled "Lab 03 · Work out why" | The panel opens on the step on screen and follows it |
| 4 | "What does idempotency mean?" | Answered; the Gateway made **no** n8n call (`inspectedWorkflow` false, `readLatestRun` false) |
| 5 | "Why did my test fail?" | Inspected the learner's workflow **and** its latest run, and named the real 404 on `Fetch External Customer Data` |
| 6 | Canonical reference at a nudge | Prompt carried "Not available at this help level"; she diagnosed from the learner's own run without a solution |
| 7 | "still not working, another hint?" | Climbed to HINT: named the node and the field to open, still no fix, canonical still withheld |
| 8 | "just show me the exact fix" | Jumped to SHOW ME: prompt carried the canonical node configuration, and she gave the exact expression plus one line of why |
| 9 | Refresh | The 12-turn Lab 03 thread came back |
| 10 | Switch to Lab 04 | A separate, empty thread |
| 11 | Back to Lab 03 | The original thread, with no Lab 04 content in it |
| 12 | Two failed checks on one step | The orb offered "Want another set of eyes on that?" only after the second, and did not open itself |
| 13 | Taglish ("di ko gets bakit ayaw gumana 😭") | Natural Taglish with the technical terms in English, using the learner's real execution value |
| 14 | "ang bobo ko dito hahaha, give up na ako" | Refused the self-put-down in one line, no lecture, then one concrete thing to check and one question |
| 15 | Learner 2, nothing to inspect | "I can't see your workflow or the execution data yet" — then helped from the lesson |
| 16 | Replayed action with `workflowId`, `helpLevel`, `userId` forged | All ignored: answered at level 1, `looked` false/false, and no n8n call was made |
| 17 | Cross-learner Kaz rows | See the table below |
| 18 | Learner 2 aiming at learner 1's lab and workflow | Refused as `locked`; the forged workflow id changed nothing |
| 19 | Secrets in the model context | 10 real prompts scanned: no credentials object, no key literal, no JWT, none of the three configured secrets, no full webhook URL; 3 prompts show `[redacted]` where the sanitizer did its job |
| 20 | 360 px (Chrome would not go narrower than this, so stricter than 375) | Panel fills the width as a sheet, input in view, no sideways scroll |
| 21 | Light and dark | Panel, context label and Send button take the theme tokens in both |

The Capstone has its own thread too: "Capstone · Replaying a dead-lettered
request", separate from Labs 03 and 04, each with its own help level.

## Isolation — real sessions, both directions

| Attempt | Result |
|---|---|
| Learner 2 reads learner 1's Kaz messages / threads | HTTP 200, 0 rows |
| Learner 1 reads learner 2's Kaz messages | HTTP 200, 0 rows |
| Unfiltered read of every Kaz row each learner can see | Only their own; one distinct user id in each result |
| Learner 2 inserts a message as learner 1 | HTTP 403, `42501` |
| Learner 2 raises learner 1's help level | HTTP 200, 0 rows affected |
| Learner 2 deletes learner 1's messages | HTTP 403, `42501` |
| Learner 1 edits their **own** message | HTTP 403 — append-only by design |
| Anonymous read of either table | HTTP 401, `42501` |

## The Gateway

One workflow, `AEP Kaz Gateway`, published, exported to
`docs/kaz/aep-kaz-gateway.json` with credential references and no secrets.

- **Authentication:** a Header Auth credential on the webhook node. A request
  without the header is refused with HTTP 403 (checked live).
- **n8n access:** an API key scoped to `workflow:read/list` and
  `execution:read/list`. A write attempt (`POST /workflows`) returns 403
  (checked live).
- **Resolution:** the learner's saved webhook **path** only — never the URL, and
  only when its host matches the n8n the Gateway can read. Exactly one matching
  workflow, or Kaz says she cannot inspect it.
- **Streaming:** not implemented. The Gateway answers once through the webhook
  response; the panel shows a typing state. True streaming would need a second
  transport and a more fragile Gateway for a cosmetic gain.

## Bugs found and fixed during the pass

| Severity | Bug | Fix |
|---|---|---|
| HIGH | The sanitizer redacted by key name, so n8n's `{name: "Authorization", value: "Bearer …"}` header pairs passed a bearer token through to the model | Both sanitizers now redact the `value` of any secret-named pair; found by running the deployed Gateway code against hostile input |
| MEDIUM | Closing and reopening the panel dropped the visible conversation until a refresh, because the thread lived in the panel | The launcher owns the thread; regression test added |
| LOW | The panel's autoscroll used `scrollTo`, which not every environment implements | Plain `scrollTop` assignment |
| LOW | A launcher effect reset state directly, tripping the project's `set-state-in-effect` rule | The failure count is keyed by chunk, so no reset effect is needed |

## Verification

`npm run verify`: exit 0 — lint clean, typecheck clean, **859 tests across 71
files**, production build 10 routes plus Proxy.

Secret scan with all three secrets configured (Supabase secret key, Kaz Gateway
secret, n8n API key): **0** hits in 35 browser bundle files, 0 in 342 build
output files, 0 in 344 git-tracked files, and no server-only variable name or
key-shaped literal anywhere that ships. The scan also caught a key-shaped
literal in one of Kaz's own test fixtures; it is now assembled at runtime, and
the repo's invariant test was widened to forbid the n8n key prefix too.

## Accepted residuals

- Two learners who save the **same** webhook URL would share the workflow Kaz
  inspects. That is what sharing a webhook URL already means, and AEP cannot
  tell them apart from the URL alone.
- Kaz inspects only the n8n the Gateway can read. A learner running their own
  n8n elsewhere gets lesson and test help, and is told so plainly.
- Paste remains equal-trust (V1.1's recorded residual): a learner can still type
  a response rather than run their workflow.
- The throttle is in-memory, so it bounds a burst per server instance rather
  than globally — the same trade-off as Send Test's.

## Test data left in place

Kaz threads for learner 1 (Lab 03, Lab 04, Capstone) and learner 2 (Lab 01),
plus the `AEP Kaz Gateway` workflow and its two credentials in n8n.
