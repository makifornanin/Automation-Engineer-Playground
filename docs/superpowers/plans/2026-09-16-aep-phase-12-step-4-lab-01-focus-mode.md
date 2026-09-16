# Phase 12 — Step 4: Lab 01 Focus Mode

Date: 2026-09-16
Status: **COMPLETE 2026-09-16 — owner browser verification PASS.**

> **Owner-reported browser evidence, 2026-09-16**, verified while authenticated: Home's Continue
> opens Lab 01 Focus Mode; Step 1 shows "The problem" with "Step 1 of 2" visible and Back
> disabled; Next opens "The concept" with "Step 2 of 2" visible and Next disabled; Back returns
> correctly; keyboard Enter navigation works and focus moves to the new heading; the mouse-click
> behaviour reads as intentional under `focus-visible`; light and dark are both readable; ~375px
> shows no clipping on the navigation row.
>
> No agent could produce this — there is no browser and no obtainable session here, and none was
> faked.
>
> **Still unobserved, and not claimed:** a real screen-reader pass. The step position is exposed
> as the focused heading's accessible description and asserted in jsdom, which proves it is
> *computed*, not that an assistive technology announces it.
Preceding work: Phase 12 Step 2 (Labs Journey), closed 2026-09-16.

> **Process note, recorded rather than hidden.** The Architect stage was attempted as a
> subagent and terminated on a session rate limit before producing a review. Rather than
> re-spawn into the same limit, the architectural decisions below were made directly. They are
> not an Architect agent's output, and this note exists so nobody later mistakes them for one.

## Goal

The smallest real lesson experience: Lab 01's Problem and Concept chunks, one at a time, with
Next/Back and a position indicator. This is the first screen in the product that terminates in
actual learning content rather than a placeholder sentence.

## Owner decisions — fixed

1. **Focus Mode lives on the existing route** `/labs/01-data-mapping-transformation`. No second
   lesson route.
2. **`isHandsOnAvailable` gets a separate seam.** "Current lab" must not automatically mean
   hands-on access is unlocked, and the split must be ready for Step 3 progression.

## Decisions

### 1. Server/client boundary — one client component, nothing more

`app/(app)/labs/[slug]/page.tsx` **stays a server component**. It keeps doing all data
resolution: slug lookup, `notFound()`, status, `isCurrent`, prerequisite. It then hands a
plain serializable array of chunks to a single `"use client"` component that owns nothing but
the chunk index.

This matters because chunk position is client state by owner decision, and a server component
cannot hold `useState`. Confining the client boundary to the stepper keeps every existing
guarantee: no data fetching moves to the browser, the route stays protected by
`(app)/layout.tsx`, and the app's "server components everywhere" default survives with one
deliberate, minimal exception.

### 2. The `isHandsOnAvailable` split — name the conflation instead of hiding it

Today `LabGroupSection` computes its action as `isCurrent || isHandsOnAvailable(status)`. That
inline `||` is exactly the conflation the owner wants removed: it makes "this is the lab to
continue" and "hands-on is unlocked" the same expression.

The fix is to give the union an explicit name and a docstring, and leave `isHandsOnAvailable`
alone as the narrower question:

- **`isHandsOnAvailable(status)`** — unchanged. Answers *may the learner do the Build, Success
  Test and Challenge?* Today: `completed` or `in-progress` only. **Step 3 gates hands-on work
  on this and nothing else.**
- **`isLessonReadable(status, isCurrent)`** — new. Answers *may the learner open this lab's
  lesson reading at all?* True when hands-on is available **or** it is the current lab. The
  current lab is readable because Vision §3 says Lab 01 is available to a first-time learner;
  that does not make its hands-on work unlocked.

`deriveCourseState()` and `statusForLab()` stay untouched — making labs derive as `locked`
would silently break Home's `JourneyStrip`, where `locked` shares the `not-started` glyph and
the legend omits it.

The practical consequence, and the point of the split: when Step 3 lands, **"Continue" on the
current lab must never be read as proof that hands-on access is open.** Reading is open;
building is a separate question with a separate predicate.

### 3. Lesson content — typed into a module, never parsed from disk

`web/src/lib/lesson/chunks.ts` holds a `LessonChunk` type and Lab 01's two chunks, looked up by
slug.

```ts
interface LessonChunk { id: string; title: string; body: readonly string[] }
```

Ordered list, stable ids for keys and `aria` wiring, body as plain paragraphs. No markdown
renderer and therefore no new dependency. Adding chunks or labs is adding data, not changing
shape. Deliberately **not** adding `media`, `code`, or `type` fields for content that does not
exist yet.

**Content is typed, not read from `labs/` at runtime.** Two reasons, both real: a
`- **Difficulty:** Beginner` line sits directly under Lab 01's H1, immediately above the Hook
the Problem chunk draws from, and Vision §16 forbids surfacing difficulty anywhere; and reading
files by slug at runtime would re-create the path-traversal surface the `[slug]` route was
deliberately built to avoid.

Sources: **Problem** from `## The Hook` + `## The Business Problem`. **Concept** from
`## 2. Simple Explanation`, which is already written as *What is it? / What problem does it
solve? / How does this help a real business?* — the exact three-part shape CLAUDE.md's Learning
Rule requires. The copy is condensed from the owner's own words, not authored fresh.

### 4. What the overview still shows

The header — number, title, description, status — survives unchanged for every lab. Below it:

| Lab | Shows |
|---|---|
| Lab 01 (current, readable, has chunks) | Focus Mode |
| A future lab (not readable) | its prerequisite line, as today |
| Labs 02–10 (no chunks yet) | "Lesson content arrives with Focus Mode.", as today |

So nothing regresses, and only Lab 01 gains a lesson.

### 5. Stepper accessibility — focus management, not a live region

One chunk visible at a time is a step pattern, and the main risk is a screen-reader user not
being told anything changed.

- Each chunk renders inside a `<section>` labelled by its own `<h2>`.
- On chunk change, **focus moves to that heading** (`tabIndex={-1}`). This is the standard
  wizard treatment: it announces the new heading and puts the user at the top of the new
  content.
- A visible **"Step 1 of 2"** indicator, wired to the heading with `aria-describedby` — exposed
  as the focused heading's accessible description. **Computed, not heard:**
  `toHaveAccessibleDescription` proves jsdom builds the description; only a real screen-reader
  pass proves an AT announces it.

  > **Corrected after QA, 2026-09-16.** This bullet originally claimed the visible indicator
  > was "also the accessible position cue" — but nothing in the markup tied it to the heading,
  > so a screen reader announced only "The concept, heading level 2": what the reader arrived
  > at, not where they were in the sequence. The claim was in this plan before it was in the
  > code. `aria-describedby` now closes it, asserted by
  > `FocusMode.test.tsx` → "carries the step position in the focused heading's description".
  > Describing the heading adds one short phrase; an `aria-live` region would have
  > re-announced on every press, which is what this design was avoiding.
- Next/Back carry accessible names that state the destination, not just a direction.
- Back is disabled on the first chunk and Next on the last.

Deliberately **not** `aria-live` on the chunk body: a polite region re-announcing several
paragraphs on every press is noisier and less useful than landing the user on the heading.

## Files

New: `lib/lesson/chunks.ts` + test; `components/lesson/FocusMode.tsx` + test.
Edited: `lib/course/progress.ts` (+ `isLessonReadable`) + test;
`components/labs/LabGroupSection.tsx` (use the named predicate);
`app/(app)/labs/[slug]/page.tsx` (+ test).

Four new files, four edits — comparable to Step 2, smaller than it in source.

## `LessonChunk` is an extension point, not a settled content model

Flagged by the PM stage as the one decision here that outlives this Aim Point and **did not get
an Architect review**. `{ id, title, body: readonly string[] }` is right for prose and wrong as a
contract: it cannot express a Guided Build chunk's 2–4 ordered actions (Vision §19), a code block
with the What / Why here / Business reason framing CLAUDE.md's Guided Build Rule mandates, a
diagram or cropped screenshot (§20), or an inline Send Test (§23).

Declining to add `media` / `code` / `type` fields for content that does not exist is correct
YAGNI. Recording the shape as **settled** would not be. The next Aim Point must extend it
deliberately rather than force-fitting instructions into paragraphs, and **its Architect stage is
mandatory** — that is where this stops being a private detail of two prose chunks and becomes the
contract for every remaining chunk type.

**Owner direction, 2026-09-16 — the contract the next Architect stage must design for:**

| Must support | Status today |
|---|---|
| prose | built — `body: readonly string[]` |
| ordered actions | not expressible |
| code blocks | not expressible |
| diagrams / visuals where useful | not expressible |
| future Send Test blocks | not expressible |

Design the shape against all five, and build only what the smallest Guided Build slice for Lab
01 actually needs. The point of designing against the full list is that the *shape* survives;
it is not licence to implement chunk kinds nothing renders yet.

## Open notes — recorded, deliberately not fixed here

1. **The placeholder branch has no positive-path test, and is currently unreachable.** With the
   empty-progress stub only Lab 01 is readable and it has chunks, so
   `"Lesson content arrives with Focus Mode."` cannot render today. It is the correct fallback
   for the moment Step 3 marks a later lab in-progress before its content exists — a near-term
   scenario, since only Lab 01 has content. The only test touching that string asserts its
   *absence*, so a refactor of the page's branching could break it silently. **Add a
   positive-path test in the change that makes `getCourseProgress()` real.**
2. **The hands-on seam is enforced by convention, not structure.** `isHandsOnAvailable` stays
   narrow and `isLessonReadable` names the union, and a test fails if the two are merged — but
   nothing stops a *new* Step 3 call site from writing `isCurrent || isHandsOnAvailable(status)`
   inline again for a Build/Test/Challenge gate. **At Step 3 code review, explicitly check that
   the hands-on gate imports `isHandsOnAvailable` directly rather than hand-rolling the union.**
   QA confirmed the current split is a genuine separation, not a renamed conflation; this note
   is about keeping it that way. PM sharpened the risk: `isHandsOnAvailable` now has **no
   production call site except `isLessonReadable`**, which is exactly the condition under which
   a future author re-hand-rolls the union instead of importing it.
3. **Leaving a lab and returning resets to Step 1.** Chunk position is component state by owner
   decision. Trivial at two chunks; a real defect as the count grows. **Trigger to name rather
   than guess at: persistence becomes required before Lab 01 exceeds roughly four chunks.**
4. **Lesson copy has no drift guard.** The catalog's test reads the real `labs/` directory and
   compares slugs; nothing equivalent protects the hand-typed chunk copy from diverging as the
   READMEs change. Acceptable at one lab, and it grows with every lab added.

## Not built

Persistence, autosave, database tables, other labs' content, Guided Build, Success Test,
Break It, Debug It, Challenge, Make It Your Own, Recap, Notes, Kaz panel or backend, inline
test or Send Test, unlocking or milestones, visual redesign, new dependency.

## Verification

`npm run verify` must exit 0 with lint at 0 problems, and `components/home/**` must remain
untouched with its tests passing unedited. Route count stays at 8 — Focus Mode adds no route.

Owner-verifiable only: the authenticated click-through of Lab 01's Focus Mode, Next/Back
behaviour, light and dark rendering, mobile width, keyboard operation, and a real
screen-reader pass over the stepper.
