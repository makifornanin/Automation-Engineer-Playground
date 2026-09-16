# Phase 12 — Step 2: Labs Journey

Date: 2026-09-16
Status: **COMPLETE 2026-09-16 — owner browser verification PASS.**

> **Owner-reported browser evidence, 2026-09-16**, verified while authenticated: `/labs`
> renders the journey; Lab 01 reads Current and offers Continue; that Continue opens the
> correct Lab 01 overview; future labs render as Preview and their pages show the prerequisite;
> Foundations, Reliability and AI Engineering are all present; the Capstone renders separately
> at the bottom, locked; an invalid lab URL 404s without crashing; **Home's Continue Learning
> opens the correct Lab 01 destination**; light mode shows no blocking issue; ~375px shows no
> clipping or broken layout; keyboard tab navigation works through the journey links.
>
> No agent could produce this — there is no browser and no obtainable session here, and none
> was faked.
>
> **Owner decisions taken at close:** the Capstone copy is accepted as **provisional**, not to
> be polished now; and the two missing future-lab preview elements ("what will be built",
> "concepts involved") are **deliberately deferred** until the real lesson experience exists,
> since that is where the material comes from.
>
> **Still unobserved, and not claimed:** dark mode (light was confirmed, dark was not) and a
> real screen-reader pass. The AT contract is unit-tested through RTL role and accessible-name
> queries, which beats a snapshot but is not the same as hearing it announced.
Preceding work: Phase 12 Aim Point 1 (Real Home), closed 2026-09-16.

## Goal

Replace the `/labs` placeholder with the real journey screen, driven by the catalog and
derivation already built for Home. No persistence, no unlock engine, no lesson content.

## What was built

| File | Role |
|---|---|
| `lib/course/catalog.ts` | edit — `description` on `Lab` and `CAPSTONE`; `labHref()` now returns `/labs/<slug>` |
| `lib/course/groups.ts` | new — `LAB_GROUPS`, `CAPSTONE_FRAMING`, generic `labsByGroup()` |
| `lib/course/progress.ts` | edit — added `isHandsOnAvailable()` **only**; the derivation is untouched |
| `components/labs/FeaturedLabCard.tsx` | new — current lab: position, title, description, group, one Continue |
| `components/labs/LabGroupSection.tsx` | new — group heading, framing, lab rows |
| `app/(app)/labs/page.tsx` | edit — the real page |
| `app/(app)/labs/[slug]/page.tsx` | new route — lab overview, not a lesson |

Plus seven test files. 268 tests across 31 files, up from 237/26.

## Decisions worth keeping

**`/labs/[slug]` is the one expansion, and it earns its place.** With `labHref()` returning
`/labs`, the featured card's Continue would link the learner to the page they are already
standing on. Step 2 also requires a Preview destination for future labs. It stays an overview
stub — no lesson content, no unlocking. **Do not let it grow into Focus Mode by accretion.**

**Descriptions are a catalog field, condensed from each README's `## The Hook`.** The voice is
the owner's, not invented. Parsing READMEs at runtime was rejected: it is a content pipeline
(Step 4/5 work) and it would create exactly the path-traversal temptation the `[slug]` route is
careful to avoid.

**The READMEs carry a `Difficulty` line under each H1, and Vision §16 forbids surfacing it.**
A test scans rendered output to keep it out — a real negative invariant, not ceremony.

**Position, never a percentage.** Vision §16 asks the featured card for a completion figure;
there is no persistence, so any figure would be invented. Same ruling as Home.

**Labs never render `locked`; only the Capstone does.** `deriveCourseState()` is untouched on
purpose: making labs derive as `locked` would silently break Home's journey strip for sighted
users only, because `locked` shares the `not-started` glyph there and the legend omits it.

**No shared `variant` component with Home.** `FeaturedLabCard` and `ContinueLearningCard`
overlap on a few lines but differ in content and role; a shared component with a variant prop
is the abstraction the owner ruled out.

## The defect found in review, and why it mattered

With no persisted progress every lab is `not-started`, including the current one. The featured
card offered **Continue** for Lab 01 while Lab 01's own row, directly below, offered
**Preview** — two clickable links, opposing verbs, conflicting accessible names, pointing at
one destination.

QA rejected the "Home's `JourneyStrip` does the same" defence, correctly: that strip is
non-interactive — a glyph and a legend, no action verb at all. This put two competing calls to
action on the primary Labs screen, and it is worse for screen-reader users, who navigate a link
list without the card-prominence and page-position cues that might suggest the two surfaces
differ.

Vision §3 settles it independently: "Lab 01 — available/completed". A first-time learner's
Lab 01 genuinely is available, so "Preview" was wrong on its own terms, not merely inconsistent.

Fixed by passing the current lab's slug into `LabGroupSection` so the row agrees with the card.
Netted at two levels: the component test, and a new **composition test** driving the real
`getCourseProgress()` → `deriveCourseState()` → page path. That composition test is the point —
every component was previously tested in isolation with hand-picked fixtures, which is exactly
why nothing caught the contradiction.

## Verification

`npm run verify` exits 0 — lint **0 problems**, typecheck clean, **268 tests / 31 files**,
production build. Routes 7 → 8, `/labs/[slug]` the only addition. `components/home/**`
untouched and its tests pass unedited. `progress.ts` has **zero deletions**. Scope guard against
`labs/ capstone/ database/ sample-data/ scripts/` empty. No new dependency.

**NOT TESTED — awaiting the owner's browser pass:** light/dark rendering, responsive layout at
mobile widths, keyboard focus in practice, a real screen-reader pass, and the authenticated
click-through of `/labs` and `/labs/<slug>`. No browser or obtainable session exists here and
none was faked.

## Open items

1. **Home's Continue destination evidence is stale.** The Aim Point 1 browser pass confirmed
   "the Continue action has a valid destination" when `labHref()` returned `/labs`. This Aim
   Point changed that href underneath that evidence, so Home now points at a route the owner
   has never opened. Re-check it in this pass.
2. **Capstone copy has no approved source.** Both `CAPSTONE.description` (written from ROADMAP
   Phase 9 — `capstone/` holds only `.gitkeep`) and `CAPSTONE_FRAMING`. Unlike the three group
   lines, neither traces to Vision §16 text. Needs the owner's sign-off on the words.
3. **A seam Step 3 must not inherit.** `isHandsOnAvailable("not-started")` is `false`, yet the
   current lab's row reads "Continue" because `isCurrent ||` short-circuits. Correct today —
   nothing is lockable. When Step 3 lands, "Continue" on the current lab must not be read as
   proof that hands-on access is open.
4. **Future-lab preview is partial.** Vision §3/§16 list four preview elements; this delivers
   roughly two — why it matters, and the prerequisite. "What will be built" and "concepts
   involved" are absent.
5. **Completed / in-progress are unreachable at runtime.** Both states render correctly under
   test fixtures but cannot occur with the empty-progress stub, and nothing is actually locked.
   Closes with Step 3.

## Not built

Persistence, milestones, unlock enforcement, lesson content, Focus Mode, Notes, Kaz AI, n8n,
any database table, analytics, gamification, difficulty labels, visual redesign, new tokens,
new dependencies, auth or admin work.
