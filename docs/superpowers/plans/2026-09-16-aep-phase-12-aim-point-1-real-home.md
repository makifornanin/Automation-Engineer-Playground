# Phase 12 — Aim Point 1: Real Home Experience

Date: 2026-09-16
Status: **COMPLETE 2026-09-16 — owner browser verification PASS.**

> **Owner-reported browser evidence, 2026-09-16**, verified while authenticated: Home renders;
> the greeting renders; Continue Learning shows Lab 01 for a first-time learner; Labs 01–10
> render in the journey; the Capstone renders separately; the Kaz placeholder is visible; the
> Notes shortcut is visible and usable; the Continue action has a valid destination; light and
> dark both remain usable; a narrow viewport shows no blocking visual break.
>
> No agent could produce this — there is no browser and no obtainable session in this
> environment, and none was faked. It closes the five criteria that were recorded as NOT TESTED
> below.
>
> **Still unobserved, and not claimed:** a real screen-reader pass. The AT contract is
> unit-tested via RTL role and accessible-name queries, which is stronger than a snapshot but
> is not the same as hearing it announced.
Preceding work: Phase 11 authentication, closed 2026-09-14.

## Goal

The smallest functional Home that connects the learner to the course. Not the learning engine,
not the progress system — the screen that makes the course reachable.

## What was built

Footprint, held to the Architect's budget exactly: **2 lib files + 3 components/tests + 1 edit.**

| File | Role |
|---|---|
| `web/src/lib/course/catalog.ts` | Static `LABS` (ten, real README titles, slugs pinned to the on-disk `labs/NN-*` folders), a separate `CAPSTONE` constant, and `labHref()` |
| `web/src/lib/course/progress.ts` | `LabStatus`, `CourseProgress`, pure `deriveCourseState()`, async `getCourseProgress()` stub |
| `web/src/components/home/JourneyStrip.tsx` | The lightweight Labs 01–10 strip plus a separate Capstone line |
| `web/src/components/home/ContinueLearningCard.tsx` | Current lab, position, one Continue action |
| `web/src/app/(app)/page.tsx` | Composition only — the five Vision §10 slots |

Plus four test files: `catalog.test.ts`, `progress.test.ts`, `JourneyStrip.test.tsx`,
`ContinueLearningCard.test.tsx`.

## Decisions worth keeping

**Capstone is a separate constant, not an eleventh lab.** It has no lab number; a nullable
`number` field would be abstraction tax paid by every lab for the sake of one item.

**`labHref()` is a single function, not a routing layer.** Every lab resolves to `/labs`
today. Aim Point 2 flips one function body. Creating `/labs/[slug]` now would add a second
placeholder to maintain and a URL surface that the Focus Mode renderer will redesign anyway.

**Labs never render as `locked`; the Capstone always does until all ten complete.** With no
persistence everything after Lab 01 is simply not-started, and painting nine lock markers on a
strip the Vision defines as `01 ✓ 02 ● 03 ○` would contradict "lightweight". Capstone locking
is real and deterministic (Vision §3).

**The strip is non-interactive.** Ten identical `/labs` links would be worse than none. They
become links when per-lab routes exist.

**Position, never a percentage.** No persistence exists to back a completion figure, so showing
one would be inventing it.

**No "Ask Kaz" entry on Home.** Vision §10 and ROADMAP Phase 12 Step 1 both list one; the
owner's Aim Point list omits it. Following the owner per CLAUDE.md precedence — and `/kaz`
already holds a permanent dock slot, so the learner is one tap from Kaz on every screen.
Deferred deliberately, not dropped.

## Accessibility

The glyph notation is decorative and `aria-hidden`; each item carries an `sr-only` string with
number, title and status ("Lab 01, Data Mapping and Transformation, not started"), so assistive
tech gets the full journey that sighted users read from the notation, without ten titles
appearing on screen at 375px. `&` is spoken as "and". The Continue link's visible text is
"Continue" and its accessible name prefixes that with the lab identity, satisfying WCAG 2.5.3
Label in Name.

## Verification

`npm run verify` exits 0 — lint, typecheck, **237 tests across 26 files**, production build of
8 routes plus Proxy. **No new route.** Scope guard against `labs/ capstone/ database/
sample-data/ scripts/` is empty. No secrets. Anonymous `/` still 307s to `/sign-in`.

The catalog test reads the real `labs/` directory and asserts the slugs match — a genuine drift
guard, not a tautology.

**NOT TESTED — five criteria, awaiting the owner's browser pass.** Light/dark rendering, mobile
and desktop layout, keyboard focus in practice, a real screen-reader pass, and the
authenticated first-run view. There is no browser and no obtainable authenticated session in
this environment, and no session was faked to manufacture one. These are **unobserved**, not
delegated-and-passed: until the owner reports back, treat them as untested.

**One runtime fact was collected, and it is easy to over-read:** anonymous `/` still returns
307 to `/sign-in`. That is evidence Home did **not** render — it confirms the Phase 11 redirect
still holds and says nothing whatsoever about this Aim Point's output.

## Open notes — recorded, deliberately not built

1. **All-labs-completed `currentLab` falls back to the last lab**, so Continue would read
   "Continue Lab 10" rather than pointing at the newly unlocked Capstone. Unreachable today —
   progress is never persisted. Accepted rather than designed: wiring Capstone into
   `ContinueLearningCard` would mean building Capstone routing before anything can reach it.
   Revisit when persistence lands.
2. **`locked` shares the `not-started` glyph** and the legend omits it. Safe only because labs
   never emit `locked` today and the Capstone renders as text. Give `locked` its own glyph and
   legend entry the moment a lab can be locked.
3. **`progress.ts` is not `server-only`.** Correct while it is a pure constant stub; add the
   import in the same change that swaps the body for a Supabase read scoped to `auth.uid()`
   under RLS — not before, and it must not become a browser fetch.
4. ROADMAP Step 1's "Current-lab progress" is satisfied as *position* only. Mark partial, not
   complete, until persistence exists.

## Not built

Persistence, milestones, unlock logic, `/labs/[slug]`, the Labs screen rebuild, Notes
functionality, Kaz AI, n8n, any database table, analytics, goals, gamification, difficulty
badges, visual redesign, new tokens, new dependencies.
