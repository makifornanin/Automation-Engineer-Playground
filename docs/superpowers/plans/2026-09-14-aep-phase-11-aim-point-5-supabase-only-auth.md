# Phase 11 — Aim Point 5: Supabase-only Authentication

Date: 2026-09-14
Status: **COMPLETE 2026-09-14 — core authentication path LIVE VERIFIED.**

> **Owner-reported live evidence, 2026-09-14**, driven in a real browser (no agent session can
> read an inbox, so this could only ever come from the owner):
>
> - an approved user received the OTP email
> - a valid OTP verified successfully
> - the authenticated AEP app loaded
> - the session survived a hard refresh
> - sign-out returned to `/sign-in`
> - public sign-up remains disabled
> - **n8n is not involved in authentication**
>
> This is the first real session in the project's history. It closes the auth Aim Point under
> the owner's stated rule: close once approved-user → OTP email → verify → session → reload →
> sign-out works live.
>
> **Not part of that evidence, and therefore not claimed:** the RSC payload inspected for
> token-shaped data on a real session (A9), a protected route requested again after sign-out
> (A11), an unknown address confirmed to create no user, an invalid code, an expired code,
> cookie attributes read in devtools, and — noted precisely — **a full browser close-and-reopen**.
> "Active session restores on return" is ticked on the *hard refresh* that was reported; the
> cookie's 400-day `maxAge` makes a restart very likely to work, but likely is not observed. Each is structurally verified or unit-tested already;
> none was live-observed. Recorded as unobserved rather than quietly folded into the passes
> above — and **not** reopened as new auth work, per the scope freeze.
Supersedes: `2026-09-14-aep-phase-11-aim-point-4-n8n-auth-email-delivery.md` (withdrawn).

## Goal

Finish authentication with the smallest maintainable Supabase-only implementation and close
the auth Aim Point. Do not redesign authentication again absent a real blocking defect.

## Architecture

**Supabase Auth = authentication authority *and* email delivery. AEP = sign-in UI and session
consumer. n8n = not involved in authentication.**

```text
owner adds approved user in Supabase (Add user, Auto Confirm ON)
  -> learner enters email in AEP
  -> signInWithOtp({ email, options: { shouldCreateUser: false } })
  -> Supabase generates the OTP, owns expiry, and sends the 6-digit code itself
  -> learner enters the code
  -> verifyOtp({ email, token, type: "email" })
  -> HttpOnly cookies -> redirect("/") -> requireSession() in (app)/layout.tsx
```

## What changed

**No executable code.** `web/` never referenced n8n — no fetch, no webhook URL, no hook
secret, no ngrok host, no environment variable. Removing n8n from authentication therefore
required no code edit, and the test count is unchanged at 212/22. A changed count would have
been a defect signal, not progress.

The diff is:

1. **Four comment blocks rewritten** (`sign-in-state.ts`, `sign-in-actions.ts` and their two
   test files) so the enumeration control is justified by Supabase-only facts instead of by a
   hook that no longer exists.
2. **Documentation superseded** — `docs/environment-setup.md`, `ROADMAP.md`,
   `docs/AEP-WEBSITE-VISION.md` §8, and the withdrawn Aim Point 4 plan.

Three `web/` hits for "n8n" were deliberately left alone: the learner-facing "n8n connection"
placeholder in `settings/page.tsx` (a future product feature, not auth), an `n8n-inspired
coral` colour comment in `globals.css`, and `.env.example` naming an n8n API key as an example
of a secret. None is authentication.

## Two decisions, recorded so they are not re-litigated

### `toRequestCodeState` is KEPT — it was never n8n-specific

The enumeration asymmetry it closes is a property of GoTrue plus `shouldCreateUser: false`:
an uninvited address is rejected at the existence check and **no mail is dispatched**
(confirmed live — `otp_disabled`, HTTP 422, 14/14 requests, ~130ms), while an invited address
**actually sends**, so only an invited address can hit `over_email_send_rate_limit` or a
mail-provider failure. Under the Aim Point 3 mapping that produced "Too many attempts" for
invited and "check your inbox" for uninvited — a working oracle, logged as an open MEDIUM
**before the hook architecture was designed**.

The hook widened the failure surface; it did not create the asymmetry. Reverting the control
as "n8n leftovers" would reopen a MEDIUM the roadmap records as resolved. The comment rewrite
is required work rather than polish: a comment justifying a security control by a mechanism
that no longer exists is an invitation to delete the control.

The `console.warn` is kept for the same reason — the UI now reports success unconditionally,
so without it a mail outage, a rate limit or a bad template is silent. It logs `error.code`
only. **Do not add the email address to it.** Because the address is never logged, a stream of
`otp_disabled` tells the operator "someone is probing" without recording *who*; adding the
address would convert a benign signal into a membership record on disk.

### The response-timing channel is ACCEPTED at LOW — no latency floor

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ships in the browser bundle by design, so anyone can
call `POST /auth/v1/otp` directly and time *that*, with no AEP Server Action in the path. A
floor inside `requestSignInCode` could only close the channel for an attacker who politely
routes through AEP's own form. **The oracle lives in GoTrue, not in AEP, and is reachable
without AEP** — the floor was never a complete fix, and it would stall the learner's first
interaction by seconds.

Re-open if public/self-serve signup is enabled, if the population grows beyond a private
invite list where membership is not sensitive, or if a higher-latency delivery layer is
reintroduced. If it must be closed, the fix belongs at the GoTrue/edge layer.

## The `{{ .Token }}` requirement, and why it is the hard blocker

Aim Point 3 recorded it. Aim Point 4 retired it as "superseded by the hook", because the n8n
workflow formatted its own mail and bypassed the template. With the hook withdrawn it is
**permanent and blocking again**.

It fails in the worst possible way: without it the learner receives an email containing a link
and no six digits, the form is already on the code step, and every code entered returns
`otp_expired` → "That code is incorrect or has expired." An owner debugging that would
reasonably suspect `verifyOtp` or the state machine. The template is **Magic Link** —
`signInWithOtp` on an existing user renders that one, not Confirm Signup.

## Owner dashboard configuration (minimum)

1. **Authentication → Email Templates → Magic Link — include `{{ .Token }}`. HARD BLOCKER.**
   Not an inference — the installed SDK says so itself, in
   `web/node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts` on `signInWithOtp`:
   *"Magic links and OTPs share the same implementation. To send users a one-time code
   instead of a magic link, modify the magic link email template to include `{{ .Token }}`
   instead of `{{ .ConfirmationURL }}`."*
   Note the SDK says **instead of**, not "in addition to" — so removing
   `{{ .ConfirmationURL }}` is the documented shape, and it also avoids offering the PKCE
   link path that the §8 2026-09-13 amendment exists to avoid.
2. Authentication → Providers → **Email enabled**; no password requirement.
3. **Email OTP Expiration: 600s** (from 3600). A 6-digit code with a one-hour life has a large
   brute-force window on its own terms.
4. **Public sign-up stays DISABLED** — the actual invite-only boundary, since the publishable
   key is public. Confirmed live: `disable_signup: true`.
5. Authentication → Users → **Add user**, **Auto Confirm User ON**. No metadata required —
   `map-user.ts` resolves an absent `app_metadata.role` to `student`.
6. **Do NOT use "Invite user."** It renders the Invite template with a different action type,
   so it appears to succeed while delivering the wrong email — a silent, plausible failure.
   (Under the withdrawn hook this failed loudly with a 422; without the hook it fails quietly,
   which is worse.)
7. Authentication → Hooks → **confirm no Send Email Hook is active.** Expected: never enabled.
   If a hook secret was generated while exploring, remove it — a live credential for a dead
   endpoint.

Not required, do not touch: URL Configuration / Redirect Allow List (a code is
origin-independent), custom SMTP, any n8n environment variable.

## Live verification (owner-driven — nothing here can read an inbox)

| # | Step | Pass condition |
|---|---|---|
| A1 | Request a code for the confirmed test address | Form advances to the code step |
| A2–A4 | Open the email | Six digits present; **sender is Supabase's, not a personal Gmail** — this is what proves no hook is involved |
| A5–A6 | Enter the code | Redirect to `/`; Home renders with the derived display name; dock renders |
| A7 | — | Session resolves via server-side `getUser()` |
| A8 | Reload, then close and reopen the browser | Still authenticated both times |
| A9 | Devtools → Network → `/` document; search `access_token`, `refresh_token`, `eyJ` | All three zero |
| A10–A11 | Sign out, then visit `/` and `/admin` | Back at `/sign-in`; both 307 |
| — | Request a code for a non-user address | **Identical** "check your inbox"; **no email arrives** |
| — | Enter a wrong code | "That code is incorrect or has expired." No session |
| — | Devtools → Application → Cookies | `HttpOnly` set; `SameSite` set. **`Secure` absent on `http://localhost` is correct** — it derives from `NEXT_PUBLIC_SITE_URL` |

**Operational warning:** Supabase's built-in mailer is rate-limited (roughly a couple of sends
per hour on a free project). Because the request step is deliberately uniform, the UI keeps
saying "check your inbox" while nothing is sent. The server warn carrying
`over_email_send_rate_limit` is the only signal — check it before declaring a defect.

## The n8n workflow

`ABANDONED - AEP Auth - Send Sign-In Email` (`ZF9iA9BT24c7oxOO`) — inactive, never activated,
never executed a real call, renamed and described as withdrawn. **Not deleted**: deletion
needs explicit approval and keeping it costs nothing. No other n8n workflow was touched.

## Deferred — documented, not blocking local development

- `SUPABASE_SECRET_KEY` rotation — **DEFERRED, REQUIRED before production deployment**
- deep rate-limit enumeration hardening (includes the accepted timing channel)
- long-duration refresh/expiry testing (L6)
- Supabase Security Advisor review
- production URL / redirect verification
- production email-delivery hardening if Supabase's built-in mailer proves unsuitable

## Closure — CLOSED 2026-09-14

The core path was observed live by the owner (see the header). Roadmap bullets ticked on that
evidence: Phase 11 Step 1 "configure secure environment variables" and "add auth/session
middleware"; Step 2 "learner verifies email", "passwordless session is created", "active
session restores on return".

**Deliberately left open, because evidence did not cover them:** Step 2's invite-flow bullets
(there is no invite UI — V1 adds learners by hand; "the owner manually adds users" is not
"invite flow works"), Step 2's expired-session recovery, and the authorization half of
"unauthorized users cannot enter protected routes" — `/admin` still admits any signed-in role.

**Do not reopen authentication.** The unobserved sub-checks listed in the header are recorded
as unobserved, not as defects, and are not a reason to start new auth work.

## Next Aim Point

**Server-side `student`/`admin` role enforcement for `/admin`.** It currently admits any
signed-in role, and building the learning product on an unenforced admin boundary would
propagate a false assumption into every later feature.

Now unblocked in a way it was not before: its acceptance criterion is *"verified by an actual
unauthenticated and an actual student request"*, and a student request is finally possible.

Smallest version: `requireRole("admin")` in `web/src/lib/auth/guards.ts` — whose docstring
already reserves the name — built on the existing `sessionRole()` and the `app_metadata`-only
resolution in `map-user.ts`, applied in a new server `web/src/app/(app)/admin/layout.tsx` so
nothing admin-shaped renders before the check. Replace the on-screen "not role-access-controlled
yet" notice. `proxy.ts` stays defence in depth; do not move authorization into it.

One decision for the Architect: `notFound()` (does not confirm `/admin` exists to a student)
versus `redirect("/")` (friendlier). Choose deliberately and record why.

Prerequisite worth knowing before starting: role must be set as **`app_metadata.role`** in the
Supabase dashboard — `user_metadata` is deliberately ignored to prevent self-escalation — so
live verification needs a second user, or `app_metadata.role = "admin"` on one of two.

Out of scope for it: the Admin invite/list/resend/revoke section (Step 4), any service-role
key usage, and any new table.
