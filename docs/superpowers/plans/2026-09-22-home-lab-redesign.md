# Home and Inside-Lab Redesign Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task, preserving the AEP Architect → Developer → Integration → QA → Project Manager sequence. Track steps with checkboxes. The user explicitly authorized audit, plan, then implementation; stop for visual approval only after local verification. Do not commit, push, tag, or deploy.

**Goal:** Make Home a useful learning launchpad and individual lessons an action-first engineering workspace without changing learning or backend contracts.

**Architecture:** Retain the existing server pages, typed lesson registry, FocusMode controller, actions, and evaluators. Improve the shared presentation components and add scoped workspace composition; preserve narrow layouts on unrelated pages. Keep ordinary paragraphs readable while using desktop width for actions, code, visuals, and expected outcomes.

**Tech Stack:** Existing Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Motion 13, Vitest/Testing Library. No new dependencies or services.

**Spec:** User request “AEP HOME + INSIDE-LAB UX REDESIGN” attached 2026-09-22; authoritative constraints in `CLAUDE.md`, `AGENTS.md`, `FEATURES.md`, `docs/AEP-WEBSITE-VISION.md`, and `docs/AEP-KAZ-DESIGN.md`. Current request supersedes older exact visual ordering only; technical teaching and progression remain protected.

**Execution record:** Product tasks implemented locally. Final `npm run verify` passes (937 tests / 77 files); independent Integration and QA reports are under `docs/qa/2026-09-22-redesign-*.md`. Browser coverage is isolated fixture verification, not live authenticated integration. Owner visual approval remains pending; no commits, pushes, tags, or deployment. Task checklists below retain the original implementation instructions; reports contain the actual evidence and limitations.

## Global Constraints

- “LESS READING. MORE DOING.”
- “DO NOT substantially redesign” Labs index, Admin, Notes standalone, authentication, or unrelated sections.
- “Preserve the actual technical lesson.”
- “Do not change” test semantics, challenge answer rules, or completion requirements.
- “DO NOT PUSH TO GITHUB YET. DO NOT DEPLOY TO VERCEL YET. DO NOT CREATE A RELEASE TAG.”
- Wait for local visual approval before commit/push/deployment.
- Preserve light blue / dark coral themes, focus fixes, reduced motion, and floating dock.
- Preserve all existing tests; run `npm run verify`; baseline supplied by user is 930 tests.
- No new APIs, tables, workflows, lesson mechanics, analytics, or gamification.

## Review Focus

1. Rapid Back/Next and recap jumps must focus the current heading, keep one active form, and preserve correct chunk context for Kaz.
2. Saved progress failures remain visible and retryable; a check pass does not falsely imply persistence succeeded.
3. Locked/previews must never serialize protected chunks, hints, or evaluator answers; shared presentation cannot weaken server gating.
4. At 375px and tablet widths code scrolls internally; dock, orb, and open Kaz panel do not cover progression controls or composer.
5. All-completed Home points to review, while first-time Home avoids fabricated progress and test result visuals never invent execution evidence.

## ARCHITECT REVIEW

### Existing Repo Findings

The relevant frontend is under `web/src`. Home derives course state server-side and renders ContinueLearningCard, JourneyStrip, a deterministic Kaz note, and Notes. All ten labs use one FocusMode controller and nine chunk kinds. Five content primitives (prose, callout, code, ASCII diagram, actions) already carry actionable data; GuidedBuild additionally carries purpose, actions, visual, and explanation. Test/Challenge delegate to SendTestPanel or SelfCheckPanel, whose evaluator contracts are server-owned. Capstone is a separate proof-based page using those shared renderers. Notes has independent autosave; Kaz maintains conversation state in the persistent launcher. The dock remains outside content.

Concise student audit:

- **Wasted desktop space:** AppShell caps every page at `max-w-3xl`; full-width compositions cannot work until that constraint is scoped.
- **Weak Home hierarchy:** all sections have similar weight; Continue is a small text link in a glass card. Ten numbers and glyphs require a legend instead of showing the curriculum phases immediately.
- **Reading before doing:** GuidedBuild stacks why, visual, extra prose, actions, another why, and every teaching definition. Long code lessons become a document even though the content model supports a workspace.
- **Weak step orientation:** generic titles (“The problem”, “The concept”) and position text lack a short action cue. Navigation is low-emphasis text at the end of the content.
- **Repetitive containment:** code/callouts/test panels use similar rounded borders; the Send Test paste fallback nests another full panel.
- **Feedback:** checkpoints have glyphs and accessible descriptions but mostly identical styling; the overall result and expected-versus-found comparison need stronger hierarchy. AEP pass/fail must remain distinct from n8n execution color.
- **Static Kaz:** the Break It line quoted by the user exists verbatim in `lib/kaz/notes.ts`. Home’s all-labs note announces an unlocked Capstone even after it is completed.
- **Motion:** PageTransition already gives a 260ms enter animation with hydration/reduced-motion protection; FocusMode swaps steps immediately.
- **Mobile risk:** content and code already have useful overflow primitives, but widening requires `min-width: 0` throughout split compositions. KazPanel is `z-40` while dock is `z-50`; its mobile composer needs visual verification for overlap. These are source findings, not claims of a live defect.

The parent inspected current `https://n8n.io/` with web and a 1440×1000 browser: broad dark canvas, strong left headline/right technical visual, compact primary CTA, generous negative space, restrained dot-grid workflow sections. Translate that composition into AEP’s existing themes; do not copy marketing navigation, giant imagery, or product features.

### Approved Aim Point

Redesign Home and actual Lab 01–10 teaching screens, shared lesson/result presentation, static Kaz copy, and purposeful transitions. Minor shared effects on Capstone are acceptable; do not redesign its proof flow.

### Proposed Architecture

Use three compositions: launchpad (Home), action + context (build/test/challenge), and open explanation + visual (problem/concept/debug/recap). All share a compact orientation header and progression footer. Use visible short purpose before actions, expected outcomes beside/below them, then optional deeper explanation. Keep authored technical content available through semantic disclosures rather than deleting it.

### File / Module Boundaries

| Files | Classification and permitted change |
| --- | --- |
| `web/src/components/home/ContinueLearningCard.tsx`, `JourneyStrip.tsx` | Presentation with destination/status mapping: preserve props and link decisions; change hierarchy, grouping, and visual layout. |
| `web/src/components/lesson/blocks/ContentBlocks.tsx`, `TeachingNotes.tsx`, `chunks/GuidedBuildChunk.tsx` | Presentation-only renderers: action/result columns, intentional code surfaces, diagrams, accessible disclosures. |
| `web/src/components/testing/CheckResultView.tsx` | Presentation-only, security-sensitive output selection: preserve first-failure-only detail and progressSaved notice. |
| `web/src/components/shell/AppShell.tsx`, `web/src/app/globals.css` | Shared presentation: add an explicit scoped Home/Lab width opt-in; unrelated routes keep existing width/tokens. |
| `web/src/components/shell/PageTransition.tsx`, `web/src/lib/motion/motion-tokens.ts` | Presentation animation; retain hydration/no-JS visibility and reduced-motion handling. |
| `web/src/app/(app)/page.tsx` | Mixed: JSX and static completion copy only; preserve session/progress derivation. |
| `web/src/app/(app)/labs/[slug]/page.tsx` | Mixed, protected: header JSX/marker only; preserve every server read/write, visibleChunks, hints, webhook projection, completion, and Kaz context. |
| `web/src/components/lesson/FocusMode.tsx` | Mixed, protected: layout/animation only; preserve navigation, evidence recording/retry, resume, focus, recap, Notes, and Kaz props. |
| `web/src/components/lesson/chunks/PredictChunk.tsx`, `TestChunk.tsx`, `ChallengeChunk.tsx` | Mixed: presentation only; preserve prediction/reveal/evidence, conditions, hint rules, and panel props. |
| `web/src/components/testing/SendTestPanel.tsx`, `SelfCheckPanel.tsx` | Mixed: JSX/classes only; retain form fields, actions, pending, effect dependencies, refresh, signals, fallback and status regions. |
| `web/src/components/kaz/KazLauncher.tsx`, `KazPanel.tsx` | Mixed: only targeted positioning/stacking if browser evidence needs it; no conversation, context, focus or gateway logic edits. |
| `web/src/lib/kaz/notes.ts` | Static frontend copy; preserve deterministic triggers/cooldown. Completed Home note can be selected in Home from existing Capstone status. |
| `web/src/lib/lesson/content/lab-01.ts` through `lab-10.ts` | Mixed instructional data: prose/title/caption/alt wording or explicit non-answer visuals only. Freeze IDs, kinds, order, code, payloads, case IDs, modes, deliveries, hint counts, verification rules. |
| Adjacent existing `*.test.tsx`, optional new renderer tests | Preserve behavior assertions; replace obsolete exact-DOM assumptions with equivalent accessible behavior checks. |

Protected and outside implementation: `lib/auth/**`, `lib/session/**`, `lib/supabase/**`, `lib/admin/**`, `lib/notes/**`, `lib/course/progress*`, `lib/testing/**`, all `lib/kaz/**` except static `notes.ts`, registry/types/contracts, `proxy.ts`, migrations, n8n exports/workflows, Capstone data/route logic, standalone Notes, Labs index and auth/admin routes. Course catalog/groups may be imported unchanged.

### Data Flow

Unchanged: session → learner progress under RLS → server-derived readable chunks and completion → FocusMode → existing action → server authorization/evaluation/write → sanitized result and refresh. Home receives the same derived labs/Capstone state. No new persistence or fetch path.

### Security Boundaries

Never send canonical challenge answers, full saved webhook URLs, service keys, or new server modules into client components. Never derive unlocks from animation or UI completion. Never claim a green execution proves correctness. Status decoration must use only actual TestResult fields, not assumptions about HTTP status or expected failures.

### Acceptance Criteria

Home exposes one obvious Continue/Start/Review primary action and curriculum phases from actual course groups. Each lesson clearly exposes Lab, step, action, expected outcome when present, and Back/Next. Desktop uses meaningful width; paragraphs remain about 60–70 characters. Build details remain accessible but do not precede a long wall of text. Results distinguish pass/fail/checkpoint/skipped/persistence warning in words and symbols. All ten labs inherit shared improvements. Motion follows direction without delaying interaction and is instant with reduced motion. First paint remains visible. All protected tests pass, no tests silently disappear, full verify and secret scan are recorded. QA and PM distinguish fixture UI checks from authenticated/live integration checks.

### Explicitly Out of Scope

Backend rewrite, lesson mechanics, new progress navigation/unlocks, new editor/tools, Labs index redesign, full Capstone redesign, Kaz intelligence or prompt changes, production mutations, deployment, and commits.

### Risks / Decisions

Do not parse arbitrary prose or ASCII into guessed workflow semantics. A conservative diagram renderer may enhance only simple linear diagrams and preserve complex ASCII with its alt text; explicit presentation flow nodes may instead be authored locally without changing evaluator data. Disclosures preserve teaching substance. Prefer a scoped CSS width marker over a new router/client dependency in AppShell. Motion must not remount Kaz or duplicate active forms; keep heading/focus outside keyed animated body where necessary. Existing test fixtures may require `waitFor` for animation; do not weaken assertions.

### Developer Handoff

Implement tasks below in order, preserving all protected controller logic. Record actual changed files and test count. Integration reviewer must inspect the mixed files even though no backend change is intended. Stop after QA/PM reconciliation and local preview for owner approval.

## Task 1: Home launchpad and scoped width

**Files:** AppShell.tsx, globals.css, `(app)/page.tsx`, home components and their tests.

**Interfaces:** Keep ContinueLearningCardProps and JourneyStripProps. Import unchanged `labsByGroup(labs, item => item.lab.group)`. Add `data-workspace="home"` or `data-workspace="lesson"` markers at route content roots, with scoped styling such as:

```css
main:has([data-workspace]) { max-width: 88rem; }
[data-workspace] { min-width: 0; }
```

- [ ] Preserve default AppShell width and opt in only Home and individual Lab roots.
- [ ] Test Continue destinations for first/in-progress lab, unlocked/in-progress Capstone, and completed Capstone review; preserve accessible visible-label matching.
- [ ] Compose a substantial primary area with current lab/title/context and solid accent Continue. Show actual course-group journey alongside/beneath using connected milestones, text statuses, and one Capstone endpoint. No invented metrics.
- [ ] Keep Kaz and Notes secondary. For completed Capstone show a truthful concise review note selected from existing `capstone.status`.
- [ ] Run `npm test -- src/components/home` in `web`; inspect desktop/mobile screenshots. Keep ten lab entries and equivalent accessible number/title/status information even if grouping changes the list structure.

## Task 2: Shared lesson workspace

**Files:** Lab route JSX, FocusMode.tsx, GuidedBuildChunk.tsx, ContentBlocks.tsx, TeachingNotes.tsx, PredictChunk.tsx, TestChunk.tsx, ChallengeChunk.tsx; their existing tests plus renderer tests if needed.

**Interfaces:** Existing LessonChunk/ContentBlock/TeachingNote unions and all chunk component props unchanged. Optional local presentation helper components accept `children: ReactNode` and className, not application state.

- [ ] Preserve protected FocusMode and route code. Build a compact Lab header, explicit step position/type/action cue, and clear Back/Next footer.
- [ ] Use `grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]` with `min-w-0` children for activity/context where meaningful; mobile source order is objective → action → outcome → supporting explanation.
- [ ] In GuidedBuild retain a short visible why, promote actions, place visual/expected observations nearby, and disclose deep TeachingNotes and retrospective explanation with keyboard-operable `<details><summary>`.
- [ ] Give code a labeled header/caption and internally scrollable pre. Preserve exact code strings, whitespace, and every action’s expected observation. Style debug answers as existing disclosures, never pre-reveal them.
- [ ] Make concept/problem/recap compositions open and spacious; use existing diagrams to explain faster. Do not create a full-width prose wall or wrap every region in another card.
- [ ] Preserve prediction required input, reveal timing, retries; preserve test/challenge routing and all hints/verification. Add a renderer check that expected observation and exact code remain present and a debug answer remains behind details.
- [ ] Run `npm test -- src/components/lesson src/app/\(app\)/labs` or quote paths appropriately in PowerShell; run `npm run typecheck` after structural edits.

## Task 3: Results, teaching copy, and motion

**Files:** testing components, FocusMode.tsx, motion-tokens.ts, notes.ts, selected `content/lab-*.ts` prose only, globals.css; adjacent tests.

**Interfaces:** `CheckResultView({result, progressSaved})` unchanged; result truth comes exclusively from TestResult. Motion uses existing reduced-motion hook and shared tokens.

- [ ] Improve actual pass/fail headline, checkpoint status text/symbols, and expected/found comparison. Keep only first failure values visible. Present unsaved progress as separate attention state.
- [ ] Flatten SendTest/SelfCheck nested chrome while preserving fallback form and every action/effect. Do not move the result out of its status region.
- [ ] Replace static Break It copy with “Okay, this is the fun part — break it on purpose.” Shorten Home notes and selected verbose lesson prose without modifying technical facts or required outcomes.
- [ ] Add small directional step motion using direction from existing index changes; roughly 220ms and 12px. Example transition values: `initial={{opacity:0,x:direction*12}}`, `animate={{opacity:1,x:0}}`; reduced motion uses `initial={false}` and duration 0. Keep KazLauncher outside animated/keyed body, keep heading focus reliable, and avoid simultaneous interactive outgoing/incoming forms.
- [ ] Add focused regression coverage for rapid step changes/focus, reduced motion behavior, and passed-but-unsaved results. Retain all existing persistence/guardrail tests.
- [ ] Run focused lesson/testing/Kaz-note tests; inspect Back/Next, results, and disclosures in browser.

## Task 4: Integration, QA, local review

**Files:** evidence report under `docs/qa/`; only required defect fixes in above scope.

- [ ] Integration reviewer inspects diff for server/action/contract preservation, serialized data, test mediation, Kaz context, progress writes, and Capstone shared effects. Record “no backend behavior changed” only when supported.
- [ ] Run `npm run verify` from `web`, recording lint, typecheck, total test count, build exit and any environmental limitations. Do not count a skipped command as passed.
- [ ] Run repository secret scan without printing secret values. Inspect `git diff --check` and changed-file scope.
- [ ] Browser-check desktop Home (first/incomplete/completed), early/middle/Lab 10, code-heavy/build/test/challenge/result/recap, Kaz open/closed, Back/Next and completion. Test 1440×1000, 1024×768, 768×1024, and 375×812 plus reduced motion and both themes.
- [ ] If no authenticated test session is available, use an ignored fixture-only browser harness importing real components with mocked server modules, separate from production app routes. Seed incomplete/completed/result states without writing learner/production data. Label these checks fixture UI verification, not live backend integration. Never add an auth bypass to the app.
- [ ] QA rechecks focus visibility, status announcements, responsive overflow, dock/orb/panel obstruction, and all relevant existing route protection tests. Resolve BLOCKER/HIGH findings through the Developer.
- [ ] Project Manager reconciles evidence and records exact remaining visual/live limitations. Start the normal local app, provide its exact URL for real sign-in and owner review, summarize changed files and test count, then stop. No commit boundary is executed; the entire reviewed working tree remains uncommitted by user request.
