# Phase 11 — Aim Point 3: Minimal Invite-Only Passwordless Sign-In

Date: 2026-09-13
Status: implemented 2026-09-13; **not complete** — L2–L8 are unrun and blocked on owner
dashboard actions (below).
Preceding work: Aim Point 2 Part 2 (Supabase configured, publishable-key rename) in
`2026-09-11-aep-phase-11-aim-point-2-proxy-migration.md`.

## Goal

The smallest real sign-in path that establishes an authenticated Supabase session, so live
criteria L2–L7 in `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md` become runnable at all.
Before this Aim Point they were unreachable for a reason no test user could fix: there was
no sign-in form, no route handler and no auth callback anywhere in `web/src/app`, so a
dashboard-created user could not become a session cookie.

## The decision that shaped everything: code, not link

**Owner decision 2026-09-13 — a 6-digit emailed code, not a magic link.**
`docs/AEP-WEBSITE-VISION.md` §8 specified a magic link and has been amended in place, with
the original wording retained. Every principle it stated is unchanged and still binding:
passwordless, email-verified, invite-only, no password creation.

The link was rejected on cost, not preference:

- `@supabase/ssr` forces `flowType: "pkce"` and it cannot be overridden
  (`createServerClient.js:37`, `createBrowserClient.js:44`), so a link must be opened in the
  **same browser** that requested it. Email clients' in-app browsers break that.
- Corporate link-scanners consume a single-use link before the human clicks it.
- A link needs Auth → URL Configuration maintained for every origin, including each preview
  deployment. A code is origin-independent.
- A link needs a callback route; a code does not.

Not foreclosed: `web/src/proxy.ts:50` already reserves `/sign-in/...` as public, so a
`/sign-in/callback` can be added later with no change to the form, the actions, the cookie
handling, or the protected-route map.

## A defect found before any feature was written

`@supabase/ssr@0.12.7`'s `DEFAULT_COOKIE_OPTIONS` is
`{ path: "/", sameSite: "lax", httpOnly: false, maxAge: 400d }` — verified directly in
`node_modules/@supabase/ssr/dist/main/utils/constants.js:4-9`, with **no `secure` key at
all**. Neither server factory passed `cookieOptions`, so **AEP's auth cookies were not
HttpOnly and live criterion L5 was failing** before this Aim Point existed. That is fixed
here, and the fix is independent of the sign-in feature.

The subtle half: applying `cookieOptions` to `server-client.ts` but not
`middleware-client.ts` would set an HttpOnly cookie at sign-in and then **silently
downgrade it on the proxy's first token refresh**, hours later. One shared constant plus a
wiring test that fails if either factory stops forwarding it.

## Architecture

Server Actions, not the browser client. Four reasons, in order of weight:

1. **`HttpOnly` is only possible server-side.** JavaScript cannot set an HttpOnly cookie. A
   browser-client sign-in leaves the refresh token readable by any script and L5 can never
   pass.
2. **We control what the browser is told** — the enumeration boundary only exists if the
   raw `AuthApiError` is caught server-side.
3. **Cookie correctness for the proxy + RSC read path**: a Server Action's `Set-Cookie` is
   carried by the next request exactly as `updateSession()` expects.
4. **No second source of session truth.**

`browser-client.ts` is therefore intentionally unexercised. It is kept, not deleted, and
its docstring now says why.

```text
/sign-in (client component, no Supabase client)
  step 1 -> requestSignInCode  -> signInWithOtp({ shouldCreateUser: false })
                               -> CODE_SENT_STATE (closed literal, no session)
  step 2 -> verifySignInCode   -> verifyOtp({ email, token, type: "email" })
                               -> cookies written with SUPABASE_COOKIE_OPTIONS
                               -> revalidatePath("/", "layout") -> redirect("/")
next request -> proxy -> updateSession -> (app)/layout -> requireSession -> getSession
```

No route handler. No new public path. No `?next=` parameter. No database table.

## Files

New: `lib/supabase/cookie-options.ts`, `lib/auth/{email,sign-in-state,sign-in-actions,sign-out-action}.ts`,
`components/auth/{SignInForm.tsx,SignOutButton.tsx}`, plus a test file for each.
Changed: `lib/supabase/{server-client,middleware-client,browser-client}.ts`,
`app/(auth)/sign-in/page.tsx`, `app/(app)/settings/page.tsx`,
`lib/__tests__/security-invariants.test.ts`, `web/.env.example`.

## Security decisions

- **Invite-only is enforced at the project, not the app.** `disable_signup: true` is the
  boundary — verified live 2026-09-13, closing the blocker Aim Point 1 recorded.
  `shouldCreateUser: false` is defence in depth, because the publishable key is public and
  an attacker can call GoTrue directly without our flag.
- **Uniform unknown-email response.** `otp_disabled` / `signup_disabled` / `user_not_found`
  return the same frozen `CODE_SENT_STATE` as success — asserted with `toBe`, not `toEqual`.
  The cost, named honestly: a learner who typos their email sees "check your inbox" and
  waits for nothing.
- **`signOut({ scope: "local" })`**, deliberately not auth-js's `global` default, which
  would kill the learner's other devices. Sign-out fails safe: if `signOut()` throws, the
  `sb-*` cookies are still cleared and the redirect still happens.
- **Sign-out is POST-only via a real `<form>`**, avoiding the `<img src="/sign-out">` CSRF
  footgun a GET route handler would have.
- `verifyOtp` returns `data.session` with access and refresh tokens; the action destructures
  only `{ error }`, so that object is never bound, returned, stored in `useActionState`, or
  logged. Logging is `error.code` only.
- The `Session` projection is untouched and still the closed `{id, role, displayName}`.

## Verification

`npm run verify` exits 0 — lint, typecheck, 190 tests across 22 files, production build of
8 routes plus Proxy (no new public route). Scope guard empty. No key material in the diff.

Live, re-confirmed after the form replaced the placeholder: L1 unchanged — all six
protected routes 307 to `/sign-in`, `/sign-in` 200, `/sign-in-help` 307, `/favicon.ico`
200, one hop, no loop.

**Live verified: nothing about the sign-in flow itself.** No test user exists, so the
request-code → email → verify → session round trip has never executed.

## Open items

1. **Owner dashboard action — email template.** Authentication → Email Templates → Magic
   Link must include `{{ .Token }}`. The stock template has only `{{ .ConfirmationURL }}`;
   without this the learner receives a link and no code, and the form is unusable.
2. **Owner dashboard action — test user.** Auth → Users → Add user, **Auto Confirm User
   ON**, no metadata initially. An unconfirmed address returns `email_not_confirmed`, which
   looks like a code defect.
3. **Open security decision — rate-limit enumeration side channel (QA, MEDIUM).**
   `over_email_send_rate_limit` can only fire for an address that passed the existence
   check, so repeated submissions may distinguish invited from uninvited addresses even
   though a single submission does not. **This is reasoned from the code and GoTrue
   semantics, not observed** — it must be confirmed or ruled out during live verification
   before it is either fixed or formally accepted. Closing it fully (uniform delay or
   throttle regardless of existence) is more than "smallest working version", so it is
   recorded as an explicit accept/defer decision for the owner, not silently fixed.
4. **Pre-launch checklist item.** Cookie `Secure` derives from `NEXT_PUBLIC_SITE_URL`; a
   production deploy that omits or mis-sets it loses `Secure` with no build-time or runtime
   error.
5. **Accessibility evidence is RTL/jsdom-level**, not browser-verified: focus movement is
   asserted programmatically, but visible focus ring, screen-reader announcement and a
   keyboard-only end-to-end pass still need a manual run.
6. `SUPABASE_SECRET_KEY` rotation remains DEFERRED-but-mandatory before production.
