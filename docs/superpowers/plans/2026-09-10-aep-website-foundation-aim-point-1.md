# Implementation Plan — Phase 10, Aim Point 1

**Web App Scaffold + App Shell Foundation**

Date: 2026-09-10
Repo: `C:\Users\Mark\Documents\AEP Project`
Branch: `main` (base commit `e2a586c`)
Status: approved by AEP Architect, ready for AEP Developer

---

## 1. Goal

Create the smallest working AEP website foundation and prove it runs locally and
builds for production, using the approved stack.

This Aim Point establishes structure only. It ships no learning content, no
authentication, and no persistence.

---

## 2. Authority Documents

The paths named in `CLAUDE.md` and `AGENTS.md` are stale. The current
equivalents, which govern this plan, are:

| Referenced as | Actual file |
|---|---|
| `FEATURES.md` | `FEATURES-WEBSITE-FULL-BUILD.md` |
| `ROADMAP.md` | `ROADMAP-WEBSITE-FULL-BUILD.md` (Phase 10 at line 788) |
| `docs/AEP-WEBSITE-VISION.md` | `AEP-WEBSITE-VISION-UPDATED.md` |
| `docs/AEP-KAZ-DESIGN.md` | `AEP-KAZ-DESIGN.md` |

Governing sections: Vision §7–§12, §14–§16; Kaz §9–§10; ROADMAP Phase 10.

Correcting these stale paths is **not** part of this Aim Point. It is recorded
in §12 Open Items.

> **Resolved 2026-09-10 (Phase 10 Aim Point 1 Closeout).** The paths above were
> not stale — they were the canonical targets and the files had never been moved
> there. The four documents now live at `FEATURES.md`, `ROADMAP.md`,
> `docs/AEP-WEBSITE-VISION.md` and `docs/AEP-KAZ-DESIGN.md`, and the five agent
> definitions at `.claude/agents/`. §15 items 1–3 are closed; no reference in
> `CLAUDE.md`, `AGENTS.md` or `README.md` required a change.

---

## 3. Scope Decision — Authentication Is Deferred

The `aep-architect` "Slice 1 default boundary" and Vision §14 both list
invite-only passwordless access under Foundation. **ROADMAP Phase 10 does not**
— its four steps are Scaffold, Design System, App Shell, Foundation Pages.
Authentication is ROADMAP Phase 11.

The explicit user request for this Aim Point also defers auth. Per `CLAUDE.md`
precedence (explicit current user request > approved product docs), auth is out
of scope here. This is a deliberate, recorded decision, not an omission.

---

## 4. Architecture Decisions (locked)

| # | Decision | Reason |
|---|---|---|
| 1 | `web/` at repo root. Single git repo. **No monorepo/workspaces.** | `labs/`, `capstone/`, `sample-data/` are n8n JSON and Markdown, not npm packages. Nothing to share. Vercel supports Root Directory = `web`. |
| 2 | `create-next-app`, then correct pins | Generator gets PostCSS wiring, `tsconfig` plugins and flat ESLint config right. |
| 3 | App Router, `src/` dir, alias `@/*` → `./src/*`, ESLint flat config | Approved stack; single alias avoids config-path collisions. |
| 4 | **Tailwind v4**, not v3. No `tailwind.config.ts`. | v4's `@theme` *is* CSS custom properties, so themeable tokens are declared once instead of twice. `create-next-app@16` generates v4. |
| 5 | **Vitest**, not Jest | Fewer dev deps, native TS/ESM (`motion` is ESM-only), no transform layer. Neither runner can render async Server Components, so setup cost decides. |
| 6 | **TypeScript pinned to `~5.9.3`** | `typescript-eslint@8` peer range is `>=4.8.4 <6.1.0`. `typescript@latest` is **7.0.2** and breaks lint on day one. |
| 7 | Tokens as CSS custom properties; three-state theme (`light`/`dark`/`system`); blocking inline no-flash script | Theme switches by re-resolving `var()`, with no React re-render. `next/script` is too late to prevent FOUC. |
| 8 | One typed `async getSession()` seam with a `status` discriminant | Phase 11 replaces the function body only. No call site changes. |
| 9 | Dock uses **plain tab order**, not roving tabindex | Six links in a `nav` landmark is not a composite widget. Roving tabindex would remove 5 of 6 items from the tab sequence and impose a custom arrow-key contract the learner must discover. |
| 10 | Dock labels **always in the DOM**, revealed by CSS on `:hover, :focus-visible` | Keyboard parity is structural, not a second JS path that can drift. |
| 11 | Motion package is `motion` (v13), imported from `motion/react`, client components only | Successor to `framer-motion`. |
| 12 | Enter-only page transition via `(app)/template.tsx` | App Router unmounts the outgoing page first; exit animations need View Transitions or a keying hack. Not worth it at Foundation. |

---

## 5. Dependencies — Complete and Final

Any addition beyond this list requires Architect sign-off.

**Runtime**
```
next@16.3.4  react@19.3.0  react-dom@19.3.0
motion@^13.2.0  server-only@^0.0.1  clsx@^2.1.1
```

**Dev**
```
typescript@~5.9.3            <- PIN. Do not accept 7.x.
@types/node@^24.13.4  @types/react@^19.3.0  @types/react-dom@^19
tailwindcss@^4.3.3  @tailwindcss/postcss@^4.3.3
eslint@^9.39.5  eslint-config-next@16.3.4
vitest@^5.0.0  vite@^8.2.2  @vitejs/plugin-react@^6.1.1  vite-tsconfig-paths@^6.1.1
jsdom@^30.0.1
@testing-library/react@^16.3.3  @testing-library/dom@^10.4.1
@testing-library/jest-dom@^7.0.1  @testing-library/user-event@^14.6.7
```

**Two peer dependencies that are NOT bundled and must be installed explicitly:**

- `vite` — `vitest@5` declares vite as a *peer* (`^6.4.0 || ^7.0.0 || ^8.0.0`)
  and does not depend on it. Without it Vitest will not start.
- `@testing-library/dom` — a peer of `@testing-library/react@16`, not a
  dependency.

**ESLint version note:** `eslint-config-next@16.3.4` peers `eslint >=9.0.0` and
depends on `typescript-eslint@^8.46.0`, which resolves to 8.70.0 and accepts
`eslint ^10`. Whatever the generator installs is acceptable **provided
`npm ls` reports no unmet peer dependency**. If a conflict appears, pin
`eslint@^9.39.5`.

**Explicitly not installed:** any `@supabase/*` package, `next-themes`,
Playwright/Cypress, Storybook, a component library, a state manager.

---

## 6. Files to Create

`(gen)` = produced by `create-next-app`; keep as generated unless noted.

```
web/
├── package.json                (gen) + scripts in §7
├── package-lock.json           (gen) committed
├── next.config.ts              (gen) defaults
├── tsconfig.json               (gen) strict; @/* -> ./src/*
├── eslint.config.mjs           (gen) flat config
├── postcss.config.mjs          (gen) @tailwindcss/postcss only
├── .gitignore                  (gen) keep
├── vitest.config.mts           NEW  jsdom, react plugin, tsconfig paths, setup file
├── vitest.setup.ts             NEW  jest-dom matchers + controllable matchMedia stub
├── .env.example                NEW  see §8
├── public/                     (gen)
└── src/
    ├── app/
    │   ├── globals.css         NEW  Tailwind v4 import, @custom-variant dark, all tokens
    │   ├── layout.tsx          NEW  <html suppressHydrationWarning>, ThemeScript, metadata
    │   ├── not-found.tsx       NEW  minimal 404 using shell tokens
    │   └── (app)/
    │       ├── layout.tsx      NEW  getSession() once; SessionProvider + MotionProvider + AppShell
    │       ├── template.tsx    NEW  enter-only page transition
    │       ├── page.tsx        NEW  Home placeholder
    │       ├── labs/page.tsx   NEW  Labs placeholder — group headings only
    │       ├── notes/page.tsx  NEW  Notes placeholder — no editor, no persistence
    │       ├── kaz/page.tsx    NEW  static orb, no chat
    │       ├── settings/page.tsx NEW  working ThemeToggle
    │       └── admin/page.tsx  NEW  placeholder + "not access-controlled yet" notice
    ├── components/
    │   ├── shell/{AppShell,SkipLink,PageTransition,MotionProvider}.tsx   NEW
    │   ├── dock/{AppDock,DockItem,DockIcons}.tsx                          NEW
    │   ├── theme/{ThemeProvider,ThemeScript,ThemeToggle}.tsx              NEW
    │   ├── kaz/KazOrb.tsx                                                 NEW
    │   ├── session/SessionProvider.tsx                                    NEW
    │   └── ui/{GlassSurface,PagePlaceholder}.tsx                          NEW
    └── lib/
        ├── theme/{theme.ts,theme.test.ts}                                 NEW
        ├── nav/{nav-items.ts,nav.ts,nav.test.ts}                          NEW
        ├── session/{types.ts,get-session.ts}                              NEW
        ├── motion/{motion-tokens.ts,use-prefers-reduced-motion.ts,
        │            use-prefers-reduced-motion.test.ts}                    NEW
        └── __tests__/AppDock.test.tsx                                     NEW
```

**Only file changed outside `web/`:** root `.gitignore` (§8). Nothing in
`labs/`, `capstone/`, `database/`, `sample-data/`, or `scripts/` is touched.

---

## 7. `web/package.json` Scripts

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest",
"verify": "npm run lint && npm run typecheck && npm run test && npm run build"
```

If `next lint` is removed in Next 16, use `eslint .` and record the change. **Recorded: `next lint` was removed in Next 16, so `web/package.json` ships `"lint": "eslint ."`. `eslint.config.mjs` is the generated flat config extending `next/core-web-vitals`; coverage is unchanged.**

---

## 8. Environment and Ignore Rules

**`web/.env.example`** (committed, placeholders only):

```
# AEP Website environment variables
# Copy to `web/.env.local` (git-ignored). Never commit real values.
#
# RULE: NEXT_PUBLIC_* is inlined into the browser bundle at build time.
# Anything with that prefix is PUBLIC and permanent. Never use it for a
# Supabase service-role key, an n8n API key, or any other secret.

# Public site origin. Safe to expose.
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Dev scaffolding only - PHASE 11 DELETES THIS.
# Drives the placeholder session role so Admin nav visibility is verifiable
# before real auth exists. `student` (default) or `admin`. Server-only.
# This is NOT an access control.
AEP_PLACEHOLDER_ROLE=student
```

No Supabase variables at this Aim Point.

**Append to the root `.gitignore`:**

```gitignore
# Next.js
.next/
out/
next-env.d.ts

# TypeScript incremental build info
*.tsbuildinfo

# Vercel
.vercel
```

Already covered, do not duplicate: `node_modules/`, `coverage/`, `dist/`,
`build/`, `.env` / `.env.*` with the `!.env.example` negation.

**Do not copy the root `.env` into `web/`.** It holds a Supabase service-role
key. Write any `.env.local` as UTF-8 — the root `.env` is UTF-16LE from a
PowerShell redirect, and Node's dotenv mis-parses that encoding.

---

## 9. Design Tokens

Five token groups only: **surface, text, border, accent, glass** (plus
`--radius-*` and the motion constants). Light is the `:root` default; dark
overrides under `:root[data-theme="dark"]`; a
`@media (prefers-color-scheme: dark)` block guarded by `:root:not([data-theme])`
gives the no-JS fallback.

- Light accent: calm blue `#2563EB`
- Dark accent: n8n-inspired coral `#FF6D5A`
- `color-scheme` is set alongside `data-theme` so native scrollbars and form
  controls paint correctly from the first frame.

**`--text-on-accent` flips between themes.** White on `#FF6D5A` is ≈2.9:1 and
fails WCAG AA. Dark-mode accent buttons use near-black label text (`#1A1113`).
This is the single most likely accessibility mistake in this Aim Point.

Accent is used only for active navigation, buttons, progress, important
feedback, and Kaz highlights (Vision §11). Everything else stays neutral.

Theme preference persists in `localStorage['aep-theme']`, with every read and
write wrapped in `try/catch` so private windows and blocked site-data render
correctly with no stored value.

---

## 10. Security Boundaries

| Surface | This Aim Point |
|---|---|
| Authentication | None. Does not exist. |
| Authorization | None. `/admin` is reachable by anyone with the URL. |
| Learner data | None stored, none read. |
| Secrets in `web/` | Zero. |

Rules the Developer must hold:

1. No Supabase clients, no `@supabase/*` package, no Supabase env vars.
2. Never copy the root `.env` into `web/`.
3. Nothing secret behind `NEXT_PUBLIC_*` — that prefix is public and permanent.
4. `get-session.ts` carries `import 'server-only'` so Phase 11's privileged code
   cannot be pulled into a client bundle by an accidental import.
5. **Admin nav visibility is presentation, not authorization.** Do not add a
   client-side redirect, a `useEffect` bounce, or a fake "not authorized"
   screen. A guard that *looks* like auth is worse than an honest gap, because
   downstream work will assume protection that is one devtools toggle away. The
   `/admin` page states its unprotected status on screen and in a comment.
6. `AEP_PLACEHOLDER_ROLE` is server-only, validated against the role union with
   a `student` fallback, marked `// PHASE 11: delete`, and must never gain a
   `NEXT_PUBLIC_` prefix.
7. Do not log the session object.

---

## 11. Build Order

Each step is verifiable before the next.

1. Confirm generator flags: `npx create-next-app@16.3.4 --help`.
2. Scaffold from the repo root:
   `npx create-next-app@16.3.4 web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git`
3. **Immediately** `cd web && npm i -D typescript@~5.9.3 @types/node@^24.13.4`,
   then verify with `npm ls typescript` (must report 5.9.x).
4. Install the remaining dependencies from §5. Add nothing beyond that list.
5. Append the `.gitignore` block from §8 to the **root** `.gitignore`.
6. Write `web/.env.example` exactly as in §8.
7. Configure Vitest: `vitest.config.mts` + `vitest.setup.ts`. **jsdom does not
   implement `window.matchMedia`** — install a controllable stub in the setup
   file or every theme and reduced-motion test fails with
   `matchMedia is not a function`. Add the §7 scripts.
8. **TDD from here.** `src/lib/theme/theme.test.ts` first, then `theme.ts`. Then
   tokens in `globals.css`, `ThemeScript`, `ThemeProvider`, `ThemeToggle`.
9. `src/lib/nav/nav.test.ts` first, then `nav-items.ts` + `nav.ts`.
10. Session seam: `src/lib/session/types.ts` + `get-session.ts`.
11. `AppShell`, `SkipLink`, `MotionProvider`, `SessionProvider`, `GlassSurface`,
    `PagePlaceholder`.
12. `AppDock.test.tsx` first, then `AppDock` + `DockItem` + `DockIcons`, and
    `use-prefers-reduced-motion.test.ts` before its hook.
13. `(app)/template.tsx` + `PageTransition`.
14. The six placeholder pages + `not-found.tsx`. Keep them genuinely minimal —
    Vision §10 and §15 forbid padding Home with cards.
15. `npm run verify`. All green.
16. Walk acceptance criteria 9–35 manually.
17. Secret scan, criteria 36–38.
18. Report in the `DEVELOPER BUILD REPORT` format from `AGENTS.md`, with real
    command output, not claims.

---

## 12. Tests

### Automated suites

1. `resolveTheme()` — full matrix: `light`/`dark`/`system` × system-prefers-dark
   true/false.
2. `readStoredTheme()` — empty storage → `system`; corrupt value → `system`;
   `localStorage` access throws → `system`, no crash.
3. `isNavItemActive()` — `/` matches `/` only; `/labs` matches `/labs` and
   `/labs/03/lesson-2`; `/labs` does not match `/labs-archive`; `/` is not
   active on `/labs`.
4. `getVisibleNavItems()` — `student` → 5 items, no Admin; `admin` → 6 items
   with Admin last; order stable in both.
5. `usePrefersReducedMotion()` — initial `true`/`false`; updates on a `change`
   event; returns `false` and does not throw when `matchMedia` is undefined.
6. `<AppDock />` — one `<nav aria-label="Primary">`; 5 links for `student` and 6
   for `admin`; every label's text is queryable in the DOM (proving it is not
   `display:none` and is in the accessibility tree); exactly one link carries
   `aria-current="page"` for a given pathname.

### Not automatable at this Aim Point

Verified manually; QA must not be asked for automated proof of:

- the no-flash inline theme script (needs a real browser paint)
- `backdrop-filter` glass rendering, magnification physics, spring feel
- actual colour-contrast ratios
- anything auth-related — it does not exist

### Verification commands

Run from `C:\Users\Mark\Documents\AEP Project\web`:

```bash
npm install
npm ls typescript          # expect 5.9.x
npm run lint               # expect exit 0
npm run typecheck          # expect exit 0
npm run test               # expect exit 0, 6 suites
npm run build              # expect exit 0
npm run start              # serve production build, check Home
```

From the repo root:

```bash
git status --short          # no node_modules/, .next/, next-env.d.ts, *.tsbuildinfo, .vercel, .env.local
git diff --stat HEAD -- labs capstone database sample-data scripts   # expect empty
grep -rIn "service_role\|SUPABASE_SECRET\|eyJ" web/ --exclude-dir=node_modules --exclude-dir=.next
```

---

## 13. Acceptance Criteria

**Build & tooling**
1. `npm install` completes with no unmet peer-dependency error; `npm ls typescript` reports 5.9.x.
2. `npm run dev` serves `http://localhost:3000` with no console errors and no hydration warnings.
3. `npm run lint` exits 0.
4. `npm run typecheck` exits 0.
5. `npm run test` exits 0, all six suites pass.
6. `npm run build` exits 0.
7. `npm run start` serves the production build; Home renders.
8. After a full install+build+test cycle, `git status` shows no `node_modules/`, `.next/`, `out/`, `next-env.d.ts`, `*.tsbuildinfo`, `.vercel`, or `.env.local`.

**Routes**
9. All six routes render distinct placeholders: `/`, `/labs`, `/notes`, `/kaz`, `/settings`, `/admin`.
10. An unknown URL renders the styled 404.
11. `/admin` displays its "not access-controlled yet — Phase 11" notice.
12. `/kaz` shows the static orb and no chat interface.

**Theme**
13. Light / Dark / System in Settings switches immediately with no reload.
14. Reload with `dark` selected paints dark on the first frame — no white flash. Verify with devtools throttled to Slow 3G.
15. With `system`, changing the OS theme flips the app live.
16. Cleared `localStorage` → defaults to `system` and renders.
17. Private window / blocked site data → renders without throwing.
18. Native scrollbars and form controls match the theme.
19. Light shows the blue accent, Dark the coral accent; accent used only where Vision §11 permits.
20. Dark-mode accent buttons use dark label text, not white.

**Dock**
21. Icon-only at rest; on desktop each item is its own translucent glass chip floating independently, with no shared visible panel behind the group — not a full-height sidebar.
22. Hover expands the item, reveals its label, subtly magnifies it and neighbours.
23. Tab reaches every dock item in visual order; each focused item reveals its label and shows a visible focus ring — equivalent to hover.
24. Enter navigates; the press shows compression/release.
25. The active route's item is visually distinct and is the only one with `aria-current="page"`.
26. "Skip to content" is the first Tab stop, becomes visible on focus, and moves focus to `<main>`.
27. With `student`, Admin is absent from the dock. With `AEP_PLACEHOLDER_ROLE=admin` and a restart, Admin appears — and QA confirms **in writing** that `/admin` was still reachable by direct URL as `student`. That is the documented Phase 10 state, not a defect.

**Motion & responsive**
28. With OS reduced-motion on: no magnification, no press spring, effectively instant transitions — and labels still appear.
29. Navigation shows a subtle enter transition with no flash of unstyled or mis-themed content.
30. ≥768px: a vertical left-edge column of independent glass chips with visible spacing and no shared visible panel behind them. <768px: horizontal bottom capsule with always-visible captions and safe-area padding.
31. At 320 / 768 / 1280 / 1920px: no horizontal page scroll; the dock never occludes content.
32. Magnification is inactive on a coarse-pointer device.

**Content discipline**
33. Home shows greeting, Continue, Journey, Kaz note, and Notes shortcut slots only — no stat cards, analytics, goals, activity feed, or quick-action panel.
34. No Beginner / Intermediate / Advanced badges anywhere.
35. No permanent side panel, table of contents, or full-height rectangular sidebar.

**Security**
36. `grep -ri "service_role\|SUPABASE_SECRET\|eyJ" web/` returns nothing.
37. Build output contains no secret; `.env.local` is not committed; `web/.env.example` holds placeholders only.
38. No `@supabase/*` package is installed.

---

## 14. Out of Scope

**Phase 11** — Supabase clients and packages, any Supabase env var, invite-by-email, magic-link auth, session create/restore/expiry, `middleware.ts`, route protection, real roles, server-side admin enforcement, the `(auth)` route group, real Admin functionality.

**Phase 12** — the Focus Mode lesson engine, real lab data, populated lab rows and journey groups, sequential unlocking, progress persistence, lesson chunking, guided-build chunks, in-lab progress navigation, Notes persistence and editor, Save to Notes.

**Phase 13** — inline Send Test, expected-vs-actual, checkpoint diagnostics, per-lab webhook config, the optional learner n8n API connection, any n8n API call.

**Phase 14** — Kaz AI, the n8n Kaz workflow, RAG, chat UI, teaching modes, proactive comments, Kaz visual states, the global floating orb, the shared side utility panel. *This Aim Point ships one static decorative orb on `/kaz` only.*

**Phase 15** — onboarding, language selection and i18n (English/Tagalog/Taglish), the completion experience, the Kaz→creator handoff, the full axe accessibility audit.

**Never in V1** (Vision §15) — leaderboards, progress surveillance, analytics dashboards, goals/task management, social feed, certificates, billing, complex roles, a large admin dashboard, gamification, video-first structure.

**Not adopted as tooling** — monorepo tools, E2E runners, Storybook, component libraries, state managers, `next-themes`, `LazyMotion`, CI pipelines, Vercel deployment.

---

## 15. Open Items (separate commits, not this Aim Point)

1. `agents/` sits at the repo root, but `AGENTS.md` lines 18–30 and `CLAUDE.md`
   line 111 say the five agent definitions belong in `.claude/agents/`. Until
   moved, they are not natively discoverable as project agents.
2. `CLAUDE.md` and `AGENTS.md` reference `FEATURES.md`, `ROADMAP.md`,
   `docs/AEP-WEBSITE-VISION.md`, and `docs/AEP-KAZ-DESIGN.md`, none of which
   exist at those paths.
3. `FEATURES.md` and `ROADMAP.md` are deleted in the working tree and their
   replacements are untracked. This should be resolved as an explicit rename
   commit so history is preserved.
4. The root `.env` is UTF-16LE. Harmless today because nothing reads it, but it
   would be mis-parsed by any Node dotenv loader.

---

## 16. Definition of Done

- All 38 acceptance criteria pass, or any failure is recorded with severity and
  an owner.
- `npm run verify` is green from a clean `node_modules`.
- `git diff --stat HEAD -- labs capstone database sample-data scripts` is empty.
- No secret is staged or committed.
- QA verdict recorded; Project Manager reconciliation recorded.
- Work stops at Aim Point 1. Aim Point 2 is not started.
