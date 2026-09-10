# AEP Phase 10 — Aim Point 1 Human Browser Verification

> Purpose: Close the remaining browser-only evidence gap for Phase 10 / Aim Point 1.

> **STATUS: BLOCKED as of 2026-09-11 — not merely deferred. Do not delete this file.**
>
> Phase 11 Aim Point 1 put every `(app)` route behind `requireSession()`. With no
> Supabase project configured, `/` redirects to `/sign-in`, so the dock, theme,
> motion, glass and responsive criteria below are currently **unreachable in a
> browser**. `/sign-in` lives outside `(app)` and has no dock and no ThemeProvider,
> so it cannot substitute.
>
> This checklist unblocks at the same moment Phase 11 Aim Point 1's L1–L8 do —
> when a real Supabase project exists and `web/.env.local` is configured. See
> `AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`.
>
> Section 10 is superseded; see its own note. Everything else stands unchanged.

## Before You Start

- [x] Restart Claude Code so `.claude/agents/` are discovered natively.
- [x] Confirm the five project agents appear — **verified 2026-09-11**, all five
      are natively discoverable and were used for this revision:
  - [x] `aep-architect`
  - [x] `aep-developer`
  - [x] `aep-automation-specialist`
  - [x] `aep-qa-tester`
  - [x] `aep-project-manager`
- [ ] From `web/`, run `npm run dev`.
- [ ] Open Chrome DevTools Console.
- [ ] Keep the Network panel available for Slow 3G testing.

## 1. Route & Console Check

Visit `/`, `/labs`, `/notes`, `/kaz`, `/settings`, `/admin`, and one bogus route such as `/this-route-does-not-exist`.

- [ ] Every real route renders visibly.
- [ ] No blank content before hydration.
- [ ] No hydration warnings.
- [ ] No runtime console errors.
- [ ] Bogus route shows the styled 404.

## 2. Theme Behavior

On `/settings`:

- [ ] Light changes without reload and uses the restrained blue accent.
- [ ] Dark changes without reload and uses the restrained coral/red-orange accent.
- [ ] System follows the OS theme.
- [ ] Light persists across reload.
- [ ] Dark persists across reload.
- [ ] Clearing `localStorage` gives sensible first-load behavior.
- [ ] Private/incognito first load is sensible.

### Active dock chip (both themes)

- [ ] The active chip is visibly tinted with the theme accent.
- [ ] It still reads as glass — not a solid filled button.
- [ ] Light: restrained blue, not a saturated blue button.
- [ ] Dark: restrained coral, no neon glow.
- [ ] Sampled composited pixel — active icon/label vs the active chip's own
      background — meets AA in both themes. Measure the *rendered* pixel, not
      the token: the chip now composites blurred page + glass + accent tint.
- [ ] **Active chip on hover AND on keyboard focus** — the accent tint stays,
      and the icon/label colour change is acceptable in both themes.
      Known and confirmed in the compiled CSS: `.hover\:text-ink:hover` is
      emitted after `.hover\:text-accent-ink:hover` at equal specificity, so
      hovering the active chip switches its text from `--accent-ink` to
      `--ink`. This is pre-existing, not caused by this revision, and is
      expected to *raise* contrast rather than lower it — but it contradicts
      the code comment's stated intent, so confirm it looks right before we
      decide whether to remove the redundant class.

## 3. No-Flash First Paint

1. Set AEP to Dark.
2. DevTools → Network → Slow 3G.
3. Hard reload.

- [ ] No white/light flash before Dark mode appears.
- [ ] Main content remains visible.
- [ ] No hydration warning/error appears.

## 4. Floating Dock — Mouse (desktop ≥768px)

Separated-chip revision. Each item is its own floating glass button.

- [ ] Each item reads as an independent floating glass button.
- [ ] Visible vertical space separates the buttons.
- [ ] No large shared glass panel is visible behind or around the group.
- [ ] The column still reads compact — not a sidebar, toolbar card, giant
      vertical pill, or HUD.
- [ ] Hovering one chip expands only that chip.
- [ ] Neighbours magnify subtly but do not expand or reveal labels.
- [ ] **The hovered chip reads as clearly more prominent than its neighbours.**
      Magnify is 1.08 and neighbour is 1.06 — only 0.02 apart. If they look
      indistinguishable, say so: the fix is one constant in
      `web/src/lib/motion/motion-tokens.ts`.
- [ ] Chips expand rightward and are never clipped by the left viewport edge.
- [ ] Magnification is subtle (`DOCK_MAGNIFY_SCALE` is now 1.08, down from 1.14).
- [ ] Hover/focus end returns the chip smoothly to a compact icon-only circle.
- [ ] Click gives a small compression/spring feel.
- [ ] Navigation lands on the correct route.
- [ ] Dock does not obscure important content.
- [ ] Clicks in the gaps *between* chips reach the page content behind them and
      are not swallowed by the transparent wrapper.

## 5. Floating Dock — Keyboard

- [ ] First Tab reveals the skip link.
- [ ] Skip link is visibly focused.
- [ ] Activating it moves focus to main content.
- [ ] Tab reaches every dock item in normal order.
- [ ] **One tab stop per item** — no phantom stop that shows no focus ring and
      does nothing on Enter. (5 stops as `student`, 6 as `admin`.)
- [ ] Focused dock item reveals its label.
- [ ] Focus ring is visible and follows the chip's pill radius.
- [ ] Enter activates the focused route.
- [ ] No keyboard trap.

## 6. Settings Control — Keyboard

- [ ] Tab reaches theme controls.
- [ ] Arrow keys move between native Light / Dark / System radios.
- [ ] Selection state is clear.
- [ ] Focus is visible.

## 7. Reduced Motion

Enable the OS reduced-motion preference.

- [ ] Magnification is removed or strongly reduced.
- [ ] Spring/page motion is removed or strongly reduced.
- [ ] Labels still appear.
- [ ] Navigation still works.
- [ ] No important information depends on animation.

## 8. Responsive Widths

### 320 px
- [ ] No horizontal page scroll.
- [ ] Content readable.
- [ ] Bottom/mobile dock usable and not obstructive.
- [ ] Mobile keeps the **shared bottom capsule** — the desktop separated-chip
      look is deliberately not forced onto mobile.
- [ ] Captions visible, safe-area padding respected.
- [ ] **Mobile items DID change.** `glass-chip` is applied unscoped, so each
      mobile link now carries its own glass fill, border, shadow and blur
      *inside* the shared capsule. Previously they had no glass at all. Judge
      whether this nested glass-on-glass reads as clean or busy at 320px.

### 768 px
- [ ] Breakpoint transition is correct.
- [ ] No overlap or clipped content.

### 1280 px
- [ ] Desktop whitespace/composition looks correct.
- [ ] Dock positioning is correct.

### 1920 px
- [ ] Layout remains composed and not excessively stretched.
- [ ] Dock remains reachable.

## 9. Firefox Glass / Backdrop

- [ ] Dock glass/backdrop renders correctly.
- [ ] `backdrop-filter` renders on six small chips without banding.
- [ ] Frosted surfaces remain readable.
- [ ] No major Chrome-vs-Firefox regression.
- [ ] Hover/focus still works.

## 10. Admin Placeholder Boundary — SUPERSEDED

> **Superseded by Phase 11 Aim Point 1 (2026-09-11). Retained, not deleted.**
> `AEP_PLACEHOLDER_ROLE` no longer exists — it was removed when the real Supabase
> session seam replaced the placeholder. The procedure below cannot be run as
> written. The equivalent check now lives in the Phase 11 live-QA checklist as
> **L3**: set `app_metadata.role` to `admin` in the Supabase dashboard (never
> `user_metadata`, which the user can write themselves).

~~Run with `AEP_PLACEHOLDER_ROLE=admin`:~~

- [ ] Admin navigation item appears — **now: set `app_metadata.role = "admin"`.**

~~Return to `AEP_PLACEHOLDER_ROLE=student`:~~

- [ ] Admin navigation item disappears — **now: remove `app_metadata.role`.**
- [ ] Direct `/admin` still opens for a signed-in non-admin.

Direct access remains expected. `/admin` now requires a signed-in session, but is
still reachable by any signed-in user regardless of role. Role authorization is
Phase 11 Step 3.

## 11. Production Build Check

From `web/`:

```bash
npm run build
npm run start
```

- [ ] Build exits successfully.
- [ ] Production server starts.
- [ ] Home renders.
- [ ] `/labs`, `/settings`, and `/admin` render.
- [ ] No obvious production-only console errors.

# Final Human Verdict

- [ ] PASS
- [ ] PASS WITH NOTES
- [ ] FAIL

## Browser / OS

```text
Chrome:
Firefox:
OS:
```

## Blocking Issues

```text
None / describe:
```

## Non-Blocking Notes

```text
None / describe:
```

## Screenshots Captured

- [ ] Light mode
- [ ] Dark mode
- [ ] Dock at rest (separated chips clearly visible)
- [ ] Dock hover
- [ ] Dock keyboard focus
- [ ] Active chip, Light
- [ ] Active chip, Dark
- [ ] 320 px
- [ ] 768 px
- [ ] 1280 px
- [ ] 1920 px
- [ ] Firefox
- [ ] Any failure found

# Completion Rule

Do not mark Phase 10 / Aim Point 1 complete until:

- clean-install verification is green
- this browser pass is complete
- blocking defects are fixed and retested
- QA evidence is recorded
- Project Manager reconciliation returns `READY` or an explicitly acceptable `READY WITH NOTES`

After the human pass, send the completed results back to Claude Code for final five-agent reconciliation.
