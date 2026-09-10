# AEP Web App

The learner-facing Automation Engineer Playground website.

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Motion · Vitest.

## Status

Phase 10, Aim Point 1: scaffold and app shell only. There is no
authentication, no database, no lesson content and no Kaz AI yet. Every screen
is a placeholder.

`/admin` is **not** access-controlled at this stage. Hiding the Admin item in
the dock is presentation, not authorization. Server-side enforcement arrives in
Phase 11.

## Run

```bash
npm install
cp .env.example .env.local   # optional; no secrets required yet
npm run dev                  # http://localhost:3000
```

## Verify

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify   # all four in sequence
```

## Layout

- `src/app/(app)/` — the six shell routes, wrapped by the dock and providers
- `src/components/` — shell, dock, theme, session, ui, kaz
- `src/lib/` — theme resolver, nav model, session seam, motion tokens

Design tokens live in `src/app/globals.css`. Tailwind v4 is CSS-first, so there
is no `tailwind.config.ts`.
