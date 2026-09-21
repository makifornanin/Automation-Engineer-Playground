# AEP Full Sweep and Defect Fixes

**Goal:** Audit existing AEP functionality including Kaz, fix reproduced defects, and distinguish missing scope from bugs and live verification gaps.

**Architecture:** Preserve website/server/Supabase/n8n boundaries. Fix defects in their existing modules with regression tests; no new features or schema changes.

**Spec:** Current user sweep/fix request; `AGENTS.md`, `CLAUDE.md`, `docs/AEP-WEBSITE-VISION.md`, `docs/AEP-KAZ-DESIGN.md`.

## Constraints

- Preserve existing uncommitted deployment work.
- No push, deployment, destructive data operations, or unrelated workflow edits.
- Authentication remains owner-entered in browser; never disclose credentials.
- Follow Architect, Developer, Integration, QA, Project Manager review order.

## Tasks

- [x] Architect review: identify bounded defects and acceptance criteria.
- [x] Establish baseline lint/typecheck/tests/build and inspect live site.
- [x] Kaz developer: reproduce and fix latest-history window, turn order, missing guided-build code, and honest persistence failure feedback. Files: `web/src/lib/kaz/{thread-store,context,ask-actions,types}.ts` and related tests; `KazPanel.tsx` and tests as needed.
- [x] Notes developer: reproduce slow-save overlap and inaccurate Saved status; serialize writes and preserve newest text and returned row identity. Files: `web/src/components/notes/NoteEditor.tsx` and its tests. Check length handling for silent truncation.
- [x] Inspect core auth, labs/Capstone, notes, testing, admin, themes, keyboard/mobile, and Kaz live where access permits. Record blocked checks explicitly.
- [x] Integration review: session/RLS, Kaz boundaries, saved execution evidence, and failure behavior.
- [x] QA: focused regressions, full `npm run verify`, browser checks, diff review.
- [x] Project Manager: reconcile actual built scope, fixes, missing features, and readiness without overstating live verification.

## Regression focus

Use deferred persistence responses to reproduce slow network races. For history, exercise more than 50 messages and ties. Preserve hidden challenge/prediction content and authorization. Verify no success indicator hides failed or incomplete persistence. Test keyboard focus after Kaz closes. Do not treat successful unit tests as proof of Gemini output compliance.

## Deliverable

One-paragraph user report, followed by missing items and feedback. Detailed evidence in `docs/qa/AEP-FULL-SWEEP-2026-09-21.md`. No commit or release claim.
