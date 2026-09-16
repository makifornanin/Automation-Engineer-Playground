# AEP V1 — Fast-Track Completion Log

Date: 2026-09-16 → 2026-09-17
Mode: owner-directed fast-track. One continuous completion program replacing
per-feature Aim Points. Architect once at the start, Developer continuously, one
consolidated QA pass and one PM reconciliation at the end.

This is the single log for the program. It records what was built, how it was
verified, and what is still owed — not a narrative of every step.

---

## Status language

Per `CLAUDE.md`. Nothing below is **live verified** unless it says so. The
`aep_web_*` tables do not exist yet, so every persistence path has run only
against its fail-safe fallback.

---

## What was built

| Area | State | Commit |
|---|---|---|
| Lesson contract — `LessonChunk` as a discriminated union, 9 kinds, 5 content primitives | structurally verified, unit tested | `02da1fb` |
| Learner persistence — 4 `aep_web_*` tables, RLS, server-only reads, server-action writes | implemented, **not applied** | `b0a2d01` |
| Sequential unlocking — `locked` status, hands-on chunks filtered server-side | unit tested | `b0a2d01` |
| Lab 01 end to end, with a real expected-vs-actual self-check | unit tested | `564c883` |
| Notes — autosaving notebook, general + per-lab | unit tested | `ce31eed` |
| Labs 02–10 authored, full teaching arc each | unit tested | `82614af` → `b00dfe1` |
| Self-check evaluator — 20 cases, stop-at-first-failure checkpoints | unit tested | `564c883` → `b00dfe1` |
| Kaz V1 — progressive challenge hints, timing rules, honest page | unit tested | `96bfc18` |
| Capstone page, Save to Notes from the recap, visible unlock | unit tested | `1a04e6c` |
| Lab-agnostic self-check copy; stale copy removed | unit tested | `615a75a` |

All ten labs walk: problem → concept → guided build → predict → test →
break it → debug it → challenge → recap.

---

## Decisions that shape the product

**Every lab is self-check, not Send Test.** Labs 01, 02, 05 and 06 run on a
Manual Trigger and expose no webhook, so AEP has nothing to call. The learner
runs their own workflow and pastes the output; the server evaluates it against a
`server-only` case registry. Send Test (AEP posting to the learner's webhook)
needs a stored, SSRF-validated URL and is not built. The evidence is the same
either way: the output the learner's own workflow produced.

**Answers never reach the browser.** Expected values, checkpoint predicates and
hint text live in `server-only` modules. Proven against build output, not
assumed: a grep of `.next/static` finds three positive-control literals from
client components and zero of six server-only strings, while those same answers
exist in `.next/server`.

**Evidence is derived, never accepted.** Server actions name a lab and a chunk;
the server derives the evidence value from the chunk's kind. No action takes an
evidence value, an expected output or a checkpoint from the client.

**Test cases were checked against the real workflows, not the READMEs.** Every
asserted field was verified against the lab's exported n8n JSON. That caught
three README/workflow mismatches that would have failed correct learners — see
*Owner notes* below.

**Model output is never asserted where a model decides it.** Lab 09 does not
check confidence; Lab 10 checks that a restricted request was *held*, not which
action Gemini called it.

**The fallback is not empty progress.** With no store, the learner is placed at
Lab 01 with hands-on open and nothing saved — the pre-persistence behaviour.
Empty progress would have hidden Lab 01's build steps: a regression dressed as a
fail-safe.

**Kaz speaks at Break It and at challenges, and never on consecutive chunks.**
Kaz §6 names Break It, Debug It and Challenge as good moments, but those three
are adjacent in the arc and §7 forbids consecutive appearances. The cooldown is
code, not an authoring habit.

**The Capstone has no completion button.** `capstone/` holds no workflow
exports, so there is nothing to evaluate against. The page asks the learner to
prove each scenario in their own executions instead of offering a button that
would record nothing real.

---

## Verification — last full run

`3ccd857`: lint 0 problems, typecheck clean, **484 tests across 41 files**,
production build **9 routes plus Proxy** (8 → 9 for `/capstone`).

Client bundle checked against build output after the final fix: zero expected
answers, hint text or case ids in `.next/static`, with a client-component
literal present as a positive control.

---

## QA — one consolidated pass

**First pass: FAIL.** Two real defects, both in work from this program:

- **BLOCKER — no lab could ever be completed.** Every lab has a `predict` chunk
  demanding `predicted` evidence, and nothing in the product wrote it.
  `isLabComplete` was therefore false for every lab forever — a wiring bug, not
  a persistence gap, so applying the schema would not have fixed it. 455 green
  tests did not notice because none walked a real lab's milestones. Fixed: the
  learner writes a prediction, and the reveal records `predicted`.
- **HIGH — a self-check could credit a chunk with a different case.** The case
  id came from a hidden form field checked only against the lab, so one
  devtools edit let the easy guided case credit the Challenge. Fixed by removing
  the field: the server uses the chunk's own case.
- Two LOWs fixed: a stale "stub" docstring on Home; a hint error banner that
  never cleared after a successful retry.

Both regression tests were **proven by mutation**, not by being green:
reintroducing each bug turns its guarding test red. QA reproduced the
case-binding mutation independently.

**Targeted retest: PASS.** Lab 02's full evidence chain traced to a reachable
path for every milestone; no remaining client-controlled case selector; no
regressions; no new defects.

Accepted and not re-raised: `hint-actions` trusts the client's count of hints
already seen (same category as self-awarded evidence); a disabled button
carries no separate reason text (a pre-existing pattern).

---

## Owner actions required

1. **Apply `database/aep_web_schema.sql`** in the Supabase SQL Editor. It is
   idempotent. Until this runs, nothing persists and no lab can complete.
2. **Confirm RLS isolation with a second signed-in learner** who must see none
   of the first learner's rows. This cannot be inferred from the policy text and
   is the one check that proves RLS works.

## Owner notes — README / workflow mismatches

Recorded, not fixed: lab content is outside this program's scope.

- **Lab 06** — README lists `failed_attempts = 3` in the challenge's expected
  result. `Return Success` never emits that field; only `Return Permanent
  Failure` does. The challenge exits through `Return Success`.
- **Lab 10** — README shows `guardrail_reason: restricted_action` on the pending
  response. `Return Pending Approval` never emits it; it exists only upstream on
  `Apply Guardrails`.
- **Lab 10** — `Execute Approved Action` sets `human_decision = approve` while
  `Return Rejected Decision` sets `rejected`: inconsistent tense in the workflow.

---

## Deferred — post-V1

- Send Test against a learner webhook, with SSRF validation and URL storage
- Free-form Ask Kaz — blocked on a model credential AEP does not hold
- Kaz RAG and memory; Tagalog and Taglish
- Server-side `/admin` role enforcement and the invite UI (manual Supabase user
  creation is accepted for V1)
- Verified Capstone completion — needs Capstone workflow exports
- Completion experience and creator message (Phase 15)
- Interactive diagrams (Vision §21); screenshots
- `SUPABASE_SECRET_KEY` rotation before production (existing deferred security task)
