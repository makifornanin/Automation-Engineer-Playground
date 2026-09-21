# AEP Web App

The learner-facing Automation Engineer Playground website.

Next.js App Router, TypeScript, Tailwind CSS v4, Motion, Supabase and Vitest.
Requires Node.js 24.x. Current release includes invite-only authentication,
learning content, server-authorized admin actions and Kaz.

## Run

From `web/`, run `npm ci`, copy `.env.example` to `.env.local` only if the local
file does not already exist, then run `npm run dev`.

Populate `.env.local` privately using the names in `.env.example` before testing
connected features. Never commit secrets. The development site is
`http://localhost:3000`.

## Verify

```powershell
npm run verify
```

Runs lint, typecheck, tests and the production build in sequence.

## Production

Follow the [production deployment runbook](../docs/production-deployment.md).
Vercel uses `web/` as its Root Directory and must include repository files outside
that directory: Kaz reads the sibling `labs/` canonical workflows on the server.
Deployment readiness and live verification remain separate from a passing local build.

## Layout

- `src/app/` - application and sign-in routes.
- `src/components/` - shell, learning UI, notes, themes and Kaz.
- `src/lib/` - server actions, Supabase access, learning state and integrations.
- `src/app/globals.css` - design tokens and CSS-first Tailwind configuration.
