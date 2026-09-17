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
| Send Test — Labs 03, 04, 07, 08, 09, 10 call the learner's own webhook; SSRF controls; paste fallback | unit tested, **not live verified** | `cd85c3a` → `17c5a08` |
| Progress writes behind `server-only`; `verified` and the lock unreachable through AEP's own endpoints | unit tested, mutation-proven | `b6a0cdd` → `9756359` |
| Kaz Break It note no longer claims a pass; error boundary for signed-in pages | unit tested | `51f3a94` |

All ten labs walk: problem → concept → guided build → predict → test →
break it → debug it → challenge → recap.

---

## Decisions that shape the product

**Send Test where a webhook exists; paste-the-output where it does not.** Labs
03, 04, 07, 08, 09 and 10 start with a Webhook node, so their success test is a
real Send Test: the learner saves the Production URL once per lab, AEP's server
posts the lab's sample request, and the response is judged against a
`server-only` case. Labs 01, 02, 05 and 06 run on a Manual Trigger and expose no
webhook, so the learner pastes their output instead. Paste-the-response also
stays under every Send Test: a deployed AEP cannot reach n8n on a learner's own
machine, and those learners must still finish. Challenges remain paste-only.
Either way the evidence is the output the learner's own workflow produced.

**Send Test is the one learner-chosen outbound request, so it is fenced.** The
browser names a lab and a chunk and nothing else — the URL comes from the
learner's own saved row and is re-checked at send time; the payload, case and
evidence all come from the server. Controls: https on the default port, no
credentials, no IP literals or internal names; DNS resolved at send time and
refused if *any* address is non-public (IPv6 by allow-list); redirects never
followed; 15s timeout; 64KB response cap; two outbound headers; a 2s per-learner,
per-lab throttle. The redirect and private-address controls are proven by
mutation. Accepted residual: DNS rebinding between resolution and connection,
and an in-memory throttle that is per warm instance on serverless.

**Lab 07 sends the same event twice and judges the second answer.** Only a
repeat proves duplicate protection.

**Answer keys never reach the browser.** Expected values, checkpoint predicates
and hint text live in `server-only` modules. Proven against build output, not
assumed: a grep of `.next/static` finds three positive-control literals from
client components and zero of the server-only strings, while those same answers
exist in `.next/server`. By design (Vision §23, expected vs actual), each
attempt does return the expected value of its *first failing* checkpoint,
challenges included. That reveals the target output one field at a time, never
the workflow that produces it.

**Completion is recomputed from evidence against current lesson content.**
Nothing a learner does un-completes a lab, so "completed stays" holds for
learners. An owner content change that adds a milestone *would* re-open that
lab for everyone who finished it; that is deliberate, and `completed_at` is
never written. Revisit if lab content is edited after learners start.

**Evidence is derived, never accepted — and no AEP endpoint lets a browser write
`verified`.** Server actions name a lab and a chunk; the server derives the
evidence value from the chunk's kind. No action takes an evidence value, an
expected output or a checkpoint from the client. Every export of a `"use
server"` file is a browser-callable endpoint, so progress writers live behind
`server-only`: the browser can record position and self-reported steps, and
only a passing self-check or Send Test writes `verified`. Every write refuses a
lab the learner could not have opened, because the lock is derived from those
same rows.

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

**Final `npm run verify` at `51f3a94`: exit 0.** Lint 0 problems, typecheck
clean, **609 tests across 49 files**, production build **9 routes plus Proxy**
(`/capstone` added by this program; Send Test added no route).

Client bundle, grepped in `.next/static` against the same build: zero hits for
expected answers, hint text, the Send Test user agent and n8n error matching,
the evidence table name and the server-only writer names. All of them are
present in `.next/server`, and three client-component literals are present in
`.next/static` as positive controls.

Signed-out smoke test against `next start` on the `9756359` build: every app route,
including `/capstone`, `/admin` and a lab page, and a POST to a lab page, answers
307 to `/sign-in`. `/sign-in` itself answers 200, and the server logged no
errors. `/sign-in` screenshotted at 1280px and a true 375px (Playwright's
headless shell; desktop Chrome enforces a wider minimum window) in forced light
and forced dark: the card fits with a gutter, and both themes render.

**Not run:** any signed-in page in a browser. That needs an invited account's
code, which this program does not hold. It is the owner's final pass.

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

## Integration review — Send Test

**PASS WITH FINDINGS**, no blockers. Fixed in `17c5a08`, both code fixes proven
by mutation:

- **MEDIUM — 6to4 and Teredo passed the IPv6 allow-list.** Both sit inside
  2000::/3 but tunnel to an IPv4 address that may be private. Refused now, and
  addresses are expanded to eight hextets first, since `2001::1` (Teredo) has no
  written second group to compare.
- **LOW** — a body that stalled after the headers was reported as unreachable,
  not as a timeout. **LOW** — a stale "stays a self-check" docstring.

Verified by the reviewer: Node's fetch returns the real 302 under
`redirect: "manual"` (tested against a local server, not assumed); the saved URL
is re-guarded at send time; the Lab 03, 04, 07 and 08 payloads and checkpoints
match their exported workflows field by field, including Lab 07's duplicate
response; RLS gives no cross-learner path to a saved URL.

Not verifiable offline: the values Gemini produces in Labs 09 and 10. Field
names and guardrail logic match the workflows.

## QA — Send Test pass

**FAIL.** Send Test itself held: order, disabled states, hints, hostname-only,
trust boundary, completability and accessibility all confirmed. The failure was
older and more serious, and the earlier consolidated pass missed it:

- **BLOCKER — any learner could award themselves `verified` and unlock any
  lab.** `recordChunkEvidence` sat in a `"use server"` module imported by client
  components, so it was a browser-callable endpoint. Naming a test or challenge
  chunk wrote `verified` with no test run. Wider than reported: any progress
  row marks a lab started, and started beats locked, so even an `acknowledged`
  or position write on a locked lab opened its hands-on chunks.

Fixed in `b6a0cdd` by removing reach, not validating input. Every progress write
moved behind `server-only`; the two browser-callable actions can record only
position and the self-reported tiers; `verified` is written only after a passing
self-check or Send Test; every write refuses a lab the learner could not have
opened. Proven by mutation (three controls), and the new action tests fail
against the original file. The earlier claim that "the UI path cannot be used to
fabricate evidence" was false until this commit.

Still accepted: a determined learner can POST to PostgREST with their own JWT.
Closing that needs a privileged write key AEP does not hold.

**Retest: PASS WITH FINDINGS.** QA reproduced the original attack against the
new code with no write, mutation-checked the lock independently, and enumerated
every export of every `"use server"` module: none can write evidence or create a
row for a locked lab. The legitimate journey was traced with no write refused.
One MEDIUM remained, and it predated this program's fix: `revealNextHint`
served challenge hints for a locked lab. Fixed in `9756359`; the new test fails
with the check removed.

---

## Project Manager reconciliation — final

**Ready for the owner's final pass. V1 is not complete.** Every Definition of
Done step exists in code, and `npm run verify` is green. What remains needs the
owner: the schema, a second learner, a real n8n, a signed-in session.

- **Estimate:** about 90% built and verified offline; about 25% live verified,
  all of it predating this program; **about 65% overall**, weighting live
  evidence at 40%. Live evidence gets real weight because the first QA pass
  found "no lab could ever complete" while 455 tests were green.
- **Partial by design:** Kaz (no Ask Kaz panel; no model credential), Capstone
  (no connection to workflows or recorded completion; no exports), §11 browser
  QA (signed-out only).
- **Found by PM, fixed after reconciliation:** Kaz's Break It note said "Your
  workflow passed" although Next works on a test chunk without a pass — Kaz
  inventing a result. The copy now claims nothing, and a test forbids result
  words. §11's error state had no boundary: signed-in pages now have one, with
  a retry and a way Home. No `loading.tsx` was added. Navigation waits for the
  server, which is acceptable at current read sizes.
- **Corrected in ROADMAP and here:** overstated Send Test, mutation-proof,
  orb, Home and Notes wording; stale Phase 12 checkboxes; the checklist legend.
- The Architect's output is not reproduced in this log; its decisions are
  folded into *Decisions* above.

## Owner actions required

1. **Apply `database/aep_web_schema.sql`** in the Supabase SQL Editor. It is
   idempotent. Until this runs, nothing persists and no lab can complete.
2. **Confirm RLS isolation with a second signed-in learner** who must see none
   of the first learner's rows. This cannot be inferred from the policy text and
   is the one check that proves RLS works.
3. **Exercise Send Test once against a real n8n.** Import and **activate** one
   webhook lab (Lab 03 is simplest), save its *Production* URL in the lesson, and
   press Send Test. No request has yet reached a real n8n instance.
4. **One signed-in browser pass**, after 1–3. Nothing signed-in has been seen in
   a browser. See the checklist below.

## Owner's final browser pass — one pass only

Desktop first, then the same flow at 375px width. Toggle light/dark once.

1. **Sign in** with the invited email and 6-digit code → Home shows Continue
   Learning at Lab 01 and a Kaz note. No horizontal scroll at 375px.
2. **Labs** → Lab 01 is open; Lab 02 onwards shows the locked glyph, and opening
   one shows its overview and prerequisite but no lesson; Capstone is locked.
3. **Lab 01, keyboard only** — Tab to Next and walk the lesson. Focus lands on
   each new chunk's heading. Guided Build shows why → actions → why we're doing
   this. Predict needs written text before Reveal.
4. **Lab 01 test** — paste deliberately wrong JSON, then correct output → first
   failure explained, then Pass. Challenge: take one Kaz hint, then a second.
5. **Recap** → Save to Notes, then the unlock line → Lab 02 is now open.
   **Reload** — Lab 01 stays completed and Lab 02 resumes where you left it.
6. **Notes** — the saved recap is there; type a general note, wait, reload → it
   persisted.
7. **Send Test, Lab 03** (after Labs 01–02, or with a second account seeded) —
   save the *Production* URL of an activated workflow → only the hostname shows →
   Send Test → Pass. Deactivate the workflow → Send Test → the "not active" hint.
   Paste `https://localhost/x` as the URL → refused with a plain message.
8. **Second learner** — sign in as another invited account → none of the first
   learner's progress, notes or webhook appear.
9. **Kaz page and Capstone** — honest copy, no chat box; Capstone opens only when
   all ten labs are complete.
10. **Sign out** → any app URL returns you to sign-in.

Report any BLOCKER or HIGH in one list. Cosmetic items can batch into post-V1.

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

- Send Test for challenges (paste-only today); connection pinning to close DNS
  rebinding; a shared throttle store if AEP runs on many instances
- Free-form Ask Kaz — blocked on a model credential AEP does not hold; the orb
  opens no panel and does not float in lessons
- Notes panel inside lessons; the expandable section roadmap; loading states
- n8n API connection and execution ID in diagnostics
- Kaz RAG and memory; Tagalog and Taglish
- Server-side `/admin` role enforcement and the invite UI (manual Supabase user
  creation is accepted for V1)
- Verified Capstone completion — needs Capstone workflow exports
- Completion experience and creator message (Phase 15)
- Interactive diagrams (Vision §21); screenshots
- `SUPABASE_SECRET_KEY` rotation before production (existing deferred security task)
