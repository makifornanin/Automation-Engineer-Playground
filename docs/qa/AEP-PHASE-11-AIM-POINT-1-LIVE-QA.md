# AEP Phase 11 — Aim Point 1 Live Supabase Verification

> Purpose: hold the criteria that a real Supabase project is required to prove.
> Everything here is currently **not tested**. Nothing in this file may be ticked
> without actually exercising a live Auth server.

## Blocked on an owner decision

`web/.env.local` cannot be created until this is answered:

- [ ] **Does the website use the labs' existing Supabase project, or a separate one?**

Code is identical either way — only the values in `web/.env.local` differ.

Recommendation on record: **a separate project.** The labs' project already holds
`processed_events`, `dlq_events` and `approval_requests`, and its service-role key is
in the root `.env` and configured inside n8n. If the website shares that project, a leak
of the labs' service-role key also compromises learner authentication. A separate
project makes that coupling impossible, and the free tier allows two.

Also confirm before filling in values:

- [ ] Key style. The variable is currently named `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the
      dashboard issues `sb_publishable_…` / `sb_secret_…` instead of the legacy
      `anon` / `service_role` JWTs, rename it to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      in `web/src/lib/supabase/env.ts` and `web/.env.example` **together** — the name is
      baked into an inlined literal.
- [ ] `web/.env.local` is written as **UTF-8**. The root `.env` is UTF-16LE; Node's
      parser will mangle a UTF-16 file.
- [ ] `web/.env.local` is git-ignored and not staged.

## Setup

```bash
cd web
# create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Create one test user by hand in the Supabase dashboard (Auth → Users). Aim Point 1 has
no invite or magic-link UI — that is Step 2.

## L1 — Unauthenticated redirect

- [ ] Signed out, visiting `/` redirects to `/sign-in`.
- [ ] Same for `/labs`, `/notes`, `/kaz`, `/settings`, `/admin`.
- [ ] No flash of the app shell before the redirect.
- [ ] No redirect loop.
- [ ] `/sign-in` itself renders and stays put.

## L2 — Authenticated resolution

- [ ] With a real session, `/` renders the app.
- [ ] Home greets by the derived display name (`full_name` → email local part → `Learner`).
- [ ] The dock renders with the session's role.

## L3 — Role from `app_metadata` (replaces Phase 10 checklist §10)

In the Supabase dashboard, on the test user, set Raw App Meta Data `role` to `admin`:

- [ ] The Admin dock item appears.

Remove it again:

- [ ] The Admin dock item disappears.

Then, as a control, set **`user_metadata.role = "admin"`** (Raw User Meta Data) with no
`app_metadata.role`:

- [ ] The Admin item does **NOT** appear, and the session resolves as `student`.
      This is the escalation the design exists to prevent. Unit-tested already; confirm
      it live.

## L4 — `/admin` is still reachable by a signed-in student — CONFIRM IN WRITING

- [ ] While signed in as a **student**, `/admin` opens by direct URL.

This is expected and correct for Aim Point 1. Role enforcement is Phase 11 Step 3.
Record the result in writing below — do not silently tick it.

```text
Result:
```

## L5 — Cookie attributes

In devtools → Application → Cookies:

- [ ] The Supabase auth cookie is `HttpOnly`.
- [ ] Over HTTPS it is `Secure`.
- [ ] `SameSite` is set (not blank).
- [ ] Session survives a full browser restart.

## L6 — Token refresh

Wait past the access-token TTL (Supabase default 3600s), or lower it in the dashboard:

- [ ] The next request refreshes transparently.
- [ ] No sign-out.
- [ ] No redirect loop.
- [ ] The rotated cookie reaches the browser (value changes in devtools).

This is the half of the middleware cookie path that unit tests cannot reach.

## L7 — Supabase unreachable

Block the Supabase host (hosts file, or devtools request blocking):

- [ ] Requests resolve as anonymous and redirect to `/sign-in`.
- [ ] No 500.
- [ ] **Cookies are NOT cleared** — a brief outage must not force-sign-out every learner.
- [ ] Once unblocked, the existing session works again without re-authenticating.

## L8 — No Supabase env at all

Remove `web/.env.local`, restart:

- [ ] The app renders the signed-out state.
- [ ] The server log shows the sanitized warning once, naming only the two variable
      names — no URL, no key, no prefix, no length.
- [ ] No crash, no 500.

## Also unblocked at this point

- [ ] Run `AEP-PHASE-10-AIM-POINT-1-BROWSER-QA.md` in full. It is blocked until a real
      session exists, because every `(app)` route now requires one.

## Carried debt this checklist does not cover

- Real token-expiry refresh is L6 above. The pure-logic half of the middleware cookie
  path (dual-write to request and response, `options` forwarding, `headers` forwarding,
  redirect cookie copy) is unit-tested and does not need a live project.
- Renaming `middleware.ts` → `proxy.ts` (Next 16 deprecation) is a separate Aim Point 2
  task. Do it with a verification gate: read the installed Next's own types to confirm
  the export name, matcher semantics and runtime are unchanged, then re-prove with a
  temporary marker log that the file actually executes. A silently non-running
  `proxy.ts` looks fine until sessions start dying an hour later.

# Final Verdict

- [ ] PASS
- [ ] PASS WITH NOTES
- [ ] FAIL

```text
Supabase project (shared labs / separate):
Browser / OS:
Blocking issues:
Non-blocking notes:
```
