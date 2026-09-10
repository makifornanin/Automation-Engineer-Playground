# Phase 11 — Aim Point 1: Supabase Web Foundation + Real Session Architecture

Date: 2026-09-11
Status: approved for implementation
Architect review: complete
Preceding work: Phase 10 Aim Point 1 (commits `44cd6bd` … `4d9b56b`), governance `874afb8`

## Goal

Replace the Phase 10 placeholder session seam with the smallest secure Supabase-backed
server/session foundation that real authentication needs. Establish the architecture that
later invite, magic-link, role, onboarding and learner-state Aim Points build on.

This is a body replacement plus a cookie/refresh layer. The `Session` type shape does not
change — the Phase 10 seam was built for exactly this swap.

## Non-goals

Invites, resend, revoke, magic-link UI, onboarding, profile editing, learner progress,
Notes persistence, per-lab webhook persistence, n8n connection, Admin user-management UI,
`requireRole()`, `/admin` enforcement, Kaz AI, test/diagnostics engine, Phase 12, and any
visual redesign. The current visual system and the separated desktop glass dock are
accepted and stay exactly as they are.

## Decisions taken

| # | Decision | Resolution |
|---|---|---|
| 1 | Supabase project for the website | **Owner decision required before real values are entered.** Code is identical either way; only `web/.env.local` values differ. Recommendation: a project separate from the labs' project, so a leak of the labs service-role key cannot compromise learner auth. **SUPERSEDED 2026-09-11 — reuse the existing AEP Supabase project.** |
| 2 | Key variable name | `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the conventional name, still supported. If the dashboard issues `sb_publishable_…` instead, rename to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `env.ts` and `web/.env.example` together. |
| 3 | Sign-in path | `/sign-in` |
| 4 | `getSession()` name | Kept. ROADMAP Step 1 names it explicitly. The collision with Supabase's forbidden `auth.getSession()` is guarded by a source-scan invariant test. |
| 5 | `SUPABASE_SERVICE_ROLE_KEY` in `web/.env.example` | Declared as a commented name with no value line, so Step 4 cannot invent a different name and the never-`NEXT_PUBLIC_` rule is documented at the point of temptation. |

## Security contract

These are the load-bearing rules. Every one is verified by a test or a check in Task 11.

1. **Authorization uses `supabase.auth.getUser()`, never `supabase.auth.getSession()`.**
   `getSession()` decodes an attacker-suppliable cookie locally without verifying it.
   `getUser()` revalidates against the Auth server. This is also what makes a future
   revoke terminate live access instead of only future logins.
2. **Role is read from `app_metadata.role` only, never `user_metadata`.** `user_metadata`
   is writable by the user via `auth.updateUser()`. Reading role from it would be a
   privilege-escalation button with a nice API.
3. **`Session` carries no credentials.** Only `{ id, displayName, role }`, and only when
   authenticated. No access token, refresh token, JWT, cookie value, `app_metadata`,
   `user_metadata`, client instance, expiry, or email. The whole object is serialised into
   the browser-visible RSC payload by `SessionProvider`.
4. **Fail safe, never fail open.** Missing env, malformed cookie, network error, Supabase
   5xx, unexpected exception — every one resolves to `status: "anonymous"`. No failure path
   returns `"authenticated"`.
5. **No import-time throw.** `next build` must exit 0 with no Supabase env set at all.
6. **No service-role client exists in this Aim Point.** Nothing here needs it.

## Interfaces

```ts
// web/src/lib/supabase/env.ts
export function getSupabaseConfig(): { url: string; anonKey: string } | null;

// web/src/lib/supabase/browser-client.ts
export function createSupabaseBrowserClient(): SupabaseClient;

// web/src/lib/supabase/server-client.ts   ("server-only")
export async function createSupabaseServerClient(): Promise<SupabaseClient | null>;

// web/src/lib/supabase/middleware-client.ts
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }>;

// web/src/lib/session/map-user.ts
export function toSessionUser(user: User): SessionUser;

// web/src/lib/session/types.ts   (additive)
export type AuthenticatedSession = Extract<Session, { status: "authenticated" }>;
export function sessionRole(session: Session): UserRole;
export function sessionDisplayName(session: Session): string;

// web/src/lib/session/get-session.ts   ("server-only")
export const getSession: () => Promise<Session>;   // cache()-wrapped resolveSession

// web/src/lib/auth/protected-routes.ts
export const SIGN_IN_PATH = "/sign-in";
export const PUBLIC_PATHS: readonly string[];
export function isProtectedPath(pathname: string): boolean;   // default deny

// web/src/lib/auth/guards.ts   ("server-only")
export async function requireSession(): Promise<AuthenticatedSession>;   // else redirect
```

## Import rules

- `env.ts` imports nothing project-local; everything else imports it.
- `server-client.ts` and `guards.ts` carry `import "server-only"` and may never be imported
  by a `"use client"` module.
- `middleware.ts` imports `middleware-client.ts` and `protected-routes.ts` only. It must
  **not** import `get-session.ts`, which uses `next/headers` (unavailable in middleware).
- `types.ts`, `env.ts`, `map-user.ts`, `browser-client.ts` must **not** carry `server-only`.
  `types.ts` is imported by the client `SessionProvider`; adding it breaks the build.

## Tasks

Each task is test-first where behaviour is involved. Verify before moving on.

### Task 1 — Install packages
`cd web && npm install @supabase/ssr @supabase/supabase-js`

Both are direct dependencies. `@supabase/supabase-js` is a **peer** dependency of
`@supabase/ssr` and is not installed automatically.

Then read `web/node_modules/@supabase/ssr/dist/main/index.d.ts` and confirm the real
exported factory names and the exact cookie-adapter shape. **If the installed API differs
from this plan, the installed package wins — report the difference, do not improvise.**
Confirm with `npm ls @supabase/ssr @supabase/supabase-js` (no unmet peer dependency).

### Task 2 — `web/src/lib/supabase/env.ts` + `env.test.ts`
Test first. Reads `process.env.NEXT_PUBLIC_SUPABASE_URL` and
`process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` as **literal member expressions** — Next inlines
`NEXT_PUBLIC_*` by static text substitution, so `process.env[name]` yields `undefined` in the
browser bundle and produces a bug that only appears in production.

Returns `null` when either value is missing **or an empty string**. `NEXT_PUBLIC_SUPABASE_URL=`
with nothing after it is the most common `.env` mistake and must count as missing.

Tests use `vi.stubEnv` across present / absent / empty-string.

### Task 3 — `web/src/lib/session/map-user.ts` + `map-user.test.ts`
Test first, and **write the escalation regression test first of all**: a user with
`user_metadata.role === "admin"` and no `app_metadata.role` must resolve to `"student"`.
Name it so its purpose is unmistakable.

`toSessionUser(user)`:
- `id` — `user.id`
- `role` — `user.app_metadata?.role` through the existing `isUserRole()` guard, else `"student"`.
  Absent, `null`, `{}`, unknown string, number and array all yield `"student"`.
- `displayName` — `user.user_metadata.full_name` → local part of `user.email` → `"Learner"`.
  Reading `user_metadata` for a display *string* is fine; it grants nothing. Add a comment
  saying so, or someone will later "tidy" the role read to match.

Pure function, no `server-only`, plain object fixtures.

### Task 4 — `web/src/lib/session/types.ts` additions + `types.test.ts`
Additive only. `UserRole`, `SessionUser`, `Session`, `USER_ROLES`, `isUserRole` unchanged.

Add `AuthenticatedSession`, `assertNever()`, `sessionRole()`, `sessionDisplayName()`. The
latter two use an exhaustive `switch` on `session.status` with a `return` in every case and
`assertNever(session)` in `default`, so adding a third union state fails `tsc --noEmit` at a
named line. A ternary with an else branch cannot do that — this is the fix for the carried
issue where call sites narrowed with a ternary.

Update the stale "Phase 10 ships no authentication" comment.

### Task 5 — `web/src/lib/supabase/server-client.ts`
`import "server-only"`. Builds a `createServerClient` bound to `next/headers` `cookies()`,
using the modern `{ cookies: { getAll, setAll } }` adapter — **not** the deprecated
`get`/`set`/`remove` trio. `setAll` is a **no-op inside `try/catch`**: RSCs cannot set
cookies, and middleware has already refreshed on this request, so there is nothing to
persist. Returns `null` when `getSupabaseConfig()` is `null`.

### Task 6 — Rewrite `web/src/lib/session/get-session.ts` + `get-session.test.ts`
Test first. Delete `readPlaceholderRole()` and the hardcoded `"placeholder-learner"`.
Keep `import "server-only"`.

`resolveSession()`: config check → server client → `auth.getUser()` → `toSessionUser` →
`Session`. Anonymous on `user: null`, on error, on rejection, and on `null` config (without
constructing a client). Export `getSession = cache(resolveSession)` so the layout's call and
Home's call collapse to one network round trip per render pass.

Comment must state that it uses `getUser()`, never Supabase's `getSession()`, and why.

**Test gotcha:** `server-only`'s default export throws outside a `react-server` condition —
i.e. it throws under Vitest. Put `vi.mock("server-only", () => ({}))` at the top of this test
file. `vi.mock` is hoisted, so the throwing module never evaluates. Without this the suite
fails with a message that looks like a bundler error. Fallback if it misbehaves: a
`resolve.alias` to an empty stub in `web/vitest.config.mts`.

Target `resolveSession()` in tests so `cache()` stays a pure wrapper and never gets in the way.
Mock via `vi.mock("@/lib/supabase/server-client")`, matching the existing
`vi.mock("next/navigation")` house style.

### Task 7 — `web/src/lib/auth/protected-routes.ts` + `protected-routes.test.ts`
Test first. Pure, runtime-neutral, **default deny**: `/sign-in` is public; `/`, `/labs`,
`/notes`, `/kaz`, `/settings`, `/admin`, their nested paths, and any unknown path are
protected.

### Task 8 — `web/src/lib/supabase/middleware-client.ts` and `web/src/middleware.ts`
`updateSession(request)` builds a request/response-bound client and calls
`auth.getUser()` — that call is what *triggers* refresh; it is the mechanism, not an extra check.

`setAll` must write each cookie to **both** the mutable request cookies (so the RSC render
later in the same request sees the fresh token) **and** the outgoing `NextResponse` (so the
browser stores it). Writing only one is the classic bug: either the current render uses a
stale token, or the browser refreshes on every single request. **Forward the `options`
argument** — dropping it silently downgrades `HttpOnly`, `SameSite` and `Secure`.

`middleware.ts` composes refresh + protection. It must **return the same `NextResponse` the
cookies were written to**; on redirect, copy the cookies onto the redirect response or the
result is an infinite redirect loop. When config is `null`, skip refresh and pass through —
a throwing middleware 500s every route including `/sign-in`.

`config.matcher` must exclude `/sign-in`, `_next/static`, `_next/image`, `favicon.ico` and
static asset extensions.

AEP code never reads or writes `sb-*-auth-token` cookies directly; the package owns them.

**Verify empirically that the middleware actually runs** before building on it. With a `src/`
directory Next expects `src/middleware.ts`; a file in the wrong place fails **silently**,
leaving the app apparently working until sessions die an hour later. Log a non-secret marker
on a real request, confirm, then remove the log.

### Task 9 — `web/src/lib/auth/guards.ts` and `web/src/app/(auth)/sign-in/page.tsx`
`guards.ts` carries `import "server-only"` and exports `requireSession()`, which returns an
`AuthenticatedSession` or redirects to `SIGN_IN_PATH`. It is the named home for a future
`requireRole()` — do not add that now.

`sign-in/page.tsx` is a **static placeholder**: no form, no Supabase call, no new visual
language. Existing tokens and `GlassSurface` only. It exists because the protection seam
needs somewhere to redirect to.

### Task 10 — Update call sites
- `web/src/app/(app)/layout.tsx` — `requireSession()`; role via `sessionRole(session)`;
  delete the now-satisfied PHASE 11 TODO comment (both of its instructions are being carried out).
- `web/src/app/(app)/page.tsx` — greeting via `sessionDisplayName(session)`; keep the
  `getSession()` call, now deduped by `cache()`.
- `web/src/components/session/SessionProvider.tsx` — **comment only**. Fix the stale first
  sentence; **keep** "never treat a value read from here as proof of identity or permission."
- `web/.env.example` — delete the `AEP_PLACEHOLDER_ROLE` block; add
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the commented
  `SUPABASE_SERVICE_ROLE_KEY` name with no value line. Keep the existing header explaining
  that `NEXT_PUBLIC_*` is public and permanent.

**No change** to `web/src/lib/nav/nav.ts`, the `AppDock` role prop, `web/src/app/(app)/admin/page.tsx`,
or any of the 6 existing test suites / 49 tests. The dock prop's meaning is unchanged; only its
provenance is. All 49 existing tests must still pass — pressure to change `nav.test.ts` or
`AppDock.test.tsx` is a signal the seam has been broken, not a test-maintenance chore.

`/admin` stays honestly unprotected: role enforcement is ROADMAP Step 3, not Step 1. Keep its
on-screen notice. After this Aim Point it is reachable by any *signed-in* user — a narrower but
still-honest gap.

### Task 11 — `web/src/lib/__tests__/security-invariants.test.ts`
A `node:fs` scan of `web/src` asserting:
1. `auth.getSession(` appears nowhere.
2. No `service_role` / `SUPABASE_SERVICE_ROLE` identifier appears.
3. `AEP_PLACEHOLDER_ROLE` appears nowhere under `web/`.

Cheap, and the only mechanical proof of the three rules most likely to be broken by a future
well-meaning edit.

## Verification

From `C:\Users\Mark\Documents\AEP Project\web`:

```bash
npm run verify        # lint && typecheck && test && build
npm ls @supabase/ssr @supabase/supabase-js
```

Structural checks:

- **S1** `npm run verify` exits 0.
- **S2** No unmet peer dependency.
- **S3** Build with placeholder env, then grep `web/.next/static`: no service-role identifier,
  no secret value. Only the URL and anon key appear.
- **S4** `grep -rn "AEP_PLACEHOLDER_ROLE" web/` returns nothing.
- **S5** `web/.env.example` has no value after any secret-bearing name; `.env.local` not staged.
- **S6** `npm run build` exits 0 with **no** Supabase env set — proves no import-time throw.
- **S7** Matcher excludes `/sign-in`, `_next/static`, `_next/image`, `favicon.ico`.
- **S8** `git diff --stat HEAD -- labs capstone database sample-data scripts` is empty.
- **S9** `import "server-only"` present in exactly `get-session.ts`, `server-client.ts`,
  `guards.ts`; absent from `types.ts`, `env.ts`, `browser-client.ts`, `map-user.ts`.
- **S10** Typecheck fails if a third `Session` state is added without updating `sessionRole` /
  `sessionDisplayName`. Verify once with a scratch edit, then **revert it**.

Requires live Supabase — must not be claimed otherwise:

- **L1** Signed-out browser hitting `/`, `/labs`, `/settings`, `/admin` → redirected to
  `/sign-in`, no shell flash, no loop.
- **L2** A real session resolves as `authenticated`; Home greets by the derived display name.
- **L3** Setting `app_metadata.role = "admin"` in the dashboard makes the Admin dock item
  appear; removing it makes it disappear.
- **L4** `/admin` is still reachable by a signed-in student by direct URL — **confirm in writing.**
- **L5** Session survives a browser restart; cookies are `HttpOnly` and, over HTTPS, `Secure`.
- **L6** After the access token expires the next request refreshes transparently.
- **L7** Supabase unreachable → anonymous, redirect to `/sign-in`, no 500, **cookies not cleared**.
- **L8** No Supabase env → signed-out state renders; log shows the sanitized warning with no
  key material.

## Commit boundaries

1. `chore(web): add Supabase SSR client packages` — `package.json`, `package-lock.json`.
2. `feat(web): add the Supabase client and environment foundation` — `env.ts`,
   `browser-client.ts`, `server-client.ts`, `env.test.ts`.
3. `feat(web): resolve the session from a verified Supabase user` — `map-user.ts`,
   `types.ts`, `get-session.ts` and their tests.
4. `feat(web): refresh sessions in middleware and guard protected routes` —
   `middleware-client.ts`, `middleware.ts`, `protected-routes.ts`, `guards.ts`,
   `(auth)/sign-in/page.tsx` and tests.
5. `feat(web): read the dock role and greeting from the real session` — `layout.tsx`,
   `page.tsx`, `SessionProvider.tsx` comment, `web/.env.example`, security-invariants test.
6. `docs: record the Phase 11 Aim Point 1 session foundation` — plan, `docs/environment-setup.md`,
   `ROADMAP.md` (Project Manager reconciles the roadmap, not the Developer).

No push. No force push. No history rewrite. No AI attribution. No secrets.

## Known limitations, recorded not hidden

- **Two `getUser()` calls per full page load** — one in middleware, one in the RSC render.
  React `cache()` dedupes within a render pass only; middleware is a separate context.
  Accepted at AEP's scale. Recorded so nobody later "discovers" it as a bug.
- **Layout-level gating misses client-side navigation between sibling routes**, because the
  App Router does not re-run a shared layout there. The middleware redirect covers it. Once
  Step 5 adds real learner data, per-page and per-Server-Action `requireSession()` becomes
  required — a page shell rendering for a just-revoked user is harmless today only because
  every page is an empty placeholder.
- **Middleware is not the authorization boundary.** It is defence in depth and UX. The
  authoritative check is server-side in the layout, and later per page and per action.

## Forward requirements for later Aim Points

1. **Revoke must terminate live access, not just future logins.** Today's `getUser()` call
   revalidates on every server request, which is exactly what makes revoke non-toothless.
   Do not later "optimise" to local JWT verification without adding a server-side revocation
   check — local verification cannot see revocation and would leave a revoked token working
   until it expires. Today's design precludes neither a short TTL nor a server-side check.
2. **Revocation without deleting the auth user** needs an app-level status
   (`invited` / `active` / `revoked`), implying a `profiles` / `app_users` table that
   `getSession()` consults per request. `getSession()` is a single choke point returning
   `Session`, so this is a change to one function. Not precluded.
3. **Invite email failures must surface to Admin.** Needs the admin client plus a record of
   invite attempts and outcomes. The admin client must live in a dedicated `server-only`
   module imported by exactly one Server Action — never by anything the layout imports.
4. **Role's durable home** (`app_metadata` alone vs a table) is decided at Step 4, when
   invite status needs a home anyway.
5. **Email in the Session model** will be needed when Settings shows the signed-in account.
   Add it then, deliberately, with a comment — not pre-emptively.
6. **`requireRole("admin")`** has a named home in `guards.ts`. Step 3 fills it in and applies
   it to `/admin`, replacing that page's honest unprotected notice.
