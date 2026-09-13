# Phase 11 — Aim Point 4: n8n as the Authentication Email Delivery Layer

Date: 2026-09-14
Status: **SUPERSEDED / WITHDRAWN 2026-09-14 by owner decision. Retained for the record.**

> **This architecture was never used.** The Supabase Send Email Hook was never configured, the
> n8n workflow was never activated, and no hook call ever executed. AEP V1 uses **Supabase Auth
> email delivery directly**; n8n is not part of authentication. See
> `2026-09-14-aep-phase-11-aim-point-5-supabase-only-auth.md`.
>
> **What was withdrawn:** the Send Email Hook, the n8n delivery workflow, ngrok on the auth
> path, HMAC/Standard Webhooks verification, `AEP_AUTH_HOOK_SECRET`,
> `NODE_FUNCTION_ALLOW_BUILTIN=crypto` for auth, and the proposed latency floor — which
> existed only because the hook inflated the timing delta.
>
> **What survived, and where it now lives:**
> - `toRequestCodeState()` — **kept**, on its own merits. The enumeration asymmetry it closes
>   is a property of GoTrue plus `shouldCreateUser: false`, not of any mail carrier: only an
>   invited address dispatches mail, so only an invited address can produce a mail-related
>   failure. It was an open MEDIUM in Aim Point 3, *before* this architecture was designed.
>   Reverting it would reopen that. Its comments were rewritten to say so without citing a
>   hook that no longer exists.
> - The n8n Code-sandbox finding (`require('crypto')` blocked, no `globalThis.crypto`, Crypto
>   node takes a string key) — relocated to `docs/environment-setup.md` as a general n8n note.
>   The auth use was abandoned; the finding stands.
> - The `{{ .Token }}` email-template requirement — this document retired it as "superseded by
>   the hook". That is now reversed: it is the **single most critical dashboard setting** again.
>
> **Read the "Known exposures" section below.** It is the clearest justification for the
> decision to withdraw this architecture: routing authentication mail through a laptop, an
> ngrok tunnel that terminates TLS, and a personal Gmail mailbox that permanently archives
> every learner's code and address. It is retained deliberately, not quietly retired.
Preceding work: Aim Point 3 (`2026-09-13-aep-phase-11-aim-point-3-passwordless-sign-in.md`).

## Goal

Stop relying on Supabase's built-in email delivery while preserving Supabase authentication
itself. Approved chain:

```text
AEP → Supabase Auth → n8n delivery
```

never `AEP → n8n → custom auth`.

**Supabase remains the authentication authority**: approved users, OTP generation, OTP
expiry, OTP verification, sessions, roles, invite-only enforcement. **n8n is only a mail
carrier**: it receives a signed hook, formats one email, sends it, and returns a status.

## Prerequisite verification — done before any code, as instructed

Verified against current Supabase behaviour and docs rather than assumed:

| Requirement | Result |
|---|---|
| Hook receives the OTP | ✅ `email_data.token` (6-digit) plus `token_hash`, `email_action_type`, `redirect_to`, `site_url` |
| Hook can call an external HTTPS endpoint | ✅ HTTPS hook type supported alongside Postgres functions |
| Verifiable signing mechanism | ✅ Standard Webhooks — `webhook-id`, `webhook-timestamp`, `webhook-signature` |
| Supabase still owns OTP expiry and verification | ✅ the hook only delivers; `verifyOtp` is untouched |
| No service-role key in the browser | ✅ hook is server-to-server; browser still uses only the publishable key |
| Plan availability | ✅ **Send Email hook is available on Free and Pro** (MFA / Password Verification hooks are Teams+; not needed) |

Signature scheme, from the spec: signed content is
`{webhook-id}.{webhook-timestamp}.{raw_body}`, HMAC-SHA256, base64. The
`webhook-signature` header is a **space-delimited list** of `v1,<sig>` entries — plural, to
allow key rotation — so verification must check every entry. The secret is
`v1,whsec_<base64>`: strip through `whsec_` and **base64-decode to raw bytes** before use as
the HMAC key.

## BLOCKER — n8n's Code sandbox has no HMAC primitive

Found empirically by probing the owner's actual n8n, not inferred:

```text
require('crypto')      -> blocked: "Module 'crypto' is disallowed"
globalThis.crypto      -> undefined
crypto.subtle          -> unavailable
Buffer / TextEncoder / atob -> available
```

n8n's built-in **Crypto node** cannot substitute: it takes a **string** key, while Standard
Webhooks requires the base64-**decoded** key bytes. Feeding it the base64 string would
compute a different signature every time.

**Required fix — one environment variable on the n8n instance:**

```text
NODE_FUNCTION_ALLOW_BUILTIN=crypto
```

Use exactly `crypto`, **not** `*` — `*` would also unlock `fs` and `child_process` for every
Code node in the instance.

**Deliberately not done: hand-rolling SHA-256 + HMAC in pure JS.** It would work in about
eighty lines, and it would put unreviewable hand-written crypto on the authentication path.
It is also squarely against this Aim Point's own scope freeze on "custom authentication
protocol". One documented environment variable is the correct trade.

## The security regression this Aim Point introduces, and the fix

**The finding.** An uninvited address returns `otp_disabled` **before GoTrue ever invokes the
hook** — confirmed live, 14/14 requests, HTTP 422, ~130ms, no email dispatched. So only an
**invited** address can ever reach a delivery failure. Once the hook is live, every delivery
failure (bad signature, stale timestamp, Gmail down, ngrok down, workflow deactivated, secret
mismatch) returns non-2xx to GoTrue and surfaced as a generic error, while an uninvited
address kept showing "check your inbox".

That inverts the invariant `sign-in-state.test.ts` exists to protect: "Something went wrong"
would have meant **this address is invited**, and "check your inbox" would have meant **it is
not**. An outage would have become an enumeration oracle.

**The fix.** `toRequestCodeState()` in `web/src/lib/auth/sign-in-state.ts` returns
`CODE_SENT_STATE` **by reference** for every Supabase-originated outcome — success, any known
or unknown error code, a thrown value, a rejection. It contains no branch that inspects the
error, by design. `requestSignInCode` uses it.

This was done as a **policy, not an allow-list**, for three reasons: we would otherwise be
guessing GoTrue's hook-failure error code and shipping a security control based on an
unverified string; it closes the previously-open MEDIUM `over_email_send_rate_limit` oracle
in the same change, since that code can also only fire for an existing user; and it cannot be
defeated by a future GoTrue error code nobody has heard of yet.

Local input validation (malformed email) stays distinguishable — it never contacts Supabase
and therefore cannot be an oracle.

**Accepted cost:** the request step can no longer show "Too many attempts". Recorded in the
docstring so a future edit cannot remove it innocently.

**Compensating control:** `requestSignInCode` warns on failure with `error.code` **only** —
never the email, never `error.message`, never a token. Without it the operator would be blind,
because the UI now says "sent" unconditionally.

## The n8n workflow

`AEP Auth - Send Sign-In Email` — id `ZF9iA9BT24c7oxOO`, 7 nodes, **not activated**.

```text
Webhook (POST /webhook/aep-auth-send-email, rawBody on, responseNode)
  -> Code "Verify Signature and Gate"
       require crypto | headers | freshness +/-300s | raw body | secret
       | HMAC-SHA256 over {id}.{ts}.{raw} | multi-signature loop, no early exit
       | JSON.parse | email_action_type === 'magiclink'
       -> returns ONLY { ok, to, token }
  -> IF "Verified?"
       true  -> Gmail "Send Sign-In Code" (text, no attribution, retryOnFail OFF)
                  -> Respond 200 {}
                  -> (error output) Respond 502 Delivery Failed
       false -> Respond Rejected (401 / 400 / 422 / 500, reason named)
```

Design decisions worth keeping:

- **Raw body is mandatory.** Go's `encoding/json` HTML-escapes `<`, `>` and `&`, so
  re-serializing the parsed JSON would break every signature whose `redirect_to` contains an
  `&`. The HMAC is computed over the bytes as received.
- **Freshness is checked before the HMAC**, so a flood of stale garbage is cheap to reject.
- **Every `v1` signature entry is checked with no early exit**, because the header is a list
  and key rotation depends on the second entry being acceptable.
- **`retryOnFail: false` on Gmail.** GoTrue's hook timeout is short and GoTrue retries itself.
  Retrying inside that budget would convert a fast, honest 502 into a guaranteed timeout.
  Supabase owns the retry policy — that is what "Supabase is the authority" means
  operationally.
- **401, not 200, on an invalid signature.** The response to a forged request is never seen by
  any learner. The overwhelmingly likely cause of a signature failure is a secret mismatch
  after a paste or a rotation, and a 200 would make that catastrophic and invisible: Supabase
  records a successful send, n8n records success, the learner never receives a code, and
  nothing anywhere reports an error. The enumeration concern that motivates "return 200" is
  real but belongs in `web/`, where the fix above solves it once for every failure mode.
- **Only `magiclink` is handled**; everything else returns 422 with no email. `signInWithOtp`
  on an existing user produces `magiclink`, and no learner-facing path can produce any other
  type. Failing loudly means the owner learns immediately rather than waiting for a learner
  who was never emailed.
- **Nothing is stored.** GoTrue retries carry the same token, so a duplicate email is the same
  code — harmless. `webhook-id` is the idempotency key if that ever stops being true. No
  dedupe table was built for a problem that does not exist.

## Trust boundaries

**Supabase trusts nothing from n8n.** A 2xx means "delivery accepted" — never an
authorization, role, identity or session claim. n8n cannot create a user, grant a role, mint
a session, or influence verification. It holds no Supabase credential.

**n8n trusts exactly one thing:** a request whose `webhook-signature` verifies against
`AEP_AUTH_HOOK_SECRET` over the exact raw bytes, with a timestamp inside ±300s. After that
passes, `user.email` is trusted as the recipient, because only GoTrue can produce a valid
signature.

**The webhook URL is public; the signature is the only boundary.** An attacker reaching it
without the secret can cause 401/400 responses and consume capacity. They **cannot** cause any
email to be sent, generate or learn any OTP, learn any learner's address, create or
authenticate any user, or reach Supabase at all.

**If the secret leaks**, the worst case is not auth compromise — it is that an attacker can
make n8n send arbitrary mail from the owner's real Gmail identity. Treat it as a credential.

## Response-timing side channel (QA, originally HIGH)

> **RE-GRADED LOW and ACCEPTED 2026-09-14 — see the Aim Point 5 plan.** The section below is
> retained as written. Its recommended mitigation, a latency floor, was **not** implemented and
> is not to be: the publishable key is in the browser bundle by design, so the oracle is
> reachable at `POST /auth/v1/otp` with no AEP Server Action in the path, and a floor inside
> `requestSignInCode` would only bind an attacker who politely uses AEP's own form. The HIGH
> grade reflected the delta this withdrawn architecture would have introduced (ngrok + n8n +
> Gmail); with it gone the delta is back to its pre-existing size.

**Original wording, retained — it was a gate on hook activation, and there is no longer a hook:**

The uniform-response fix equalises **what is returned**. It does nothing about **how long it
takes**, and here that difference is not subtle.

- An **uninvited** address is rejected by GoTrue *before the hook is invoked* — measured
  live at **~130ms**, 14/14 requests.
- An **invited** address must round-trip GoTrue → ngrok → n8n → HMAC verify → Gmail send →
  back. That is hundreds of milliseconds to low seconds.

A learner-visible message that is byte-identical, and a returned object that is identical by
reference, still leaks membership if one case answers in 130ms and the other in 2s. It is
measurable from a browser with no special tooling, so this reopens exactly the invariant this
Aim Point exists to protect.

**Materially smaller today; materially worse once the hook is live.** Do not record this as
zero-risk now. Aim Point 3 already made the returned value uniform, and stock Supabase SMTP
delivery for an invited address is *also* slower than a 130ms local reject — so a timing
channel exists at a smaller magnitude right now, and this Aim Point's diff neither creates nor
widens it. Enabling the hook widens it substantially, because the round trip grows to include
ngrok, n8n and Gmail. That is why this gates **hook activation**, not the current diff.

**Recommended mitigation:** give `requestSignInCode` a constant minimum duration (a floor of
roughly 2–3s, applied to every outcome including the local invalid-input path's Supabase-free
return). It costs every learner a short wait on an action performed once per session, and it
closes the channel completely. The alternative — accepting the risk on the grounds that the
population is tiny and invite-only and an attacker must already hold candidate addresses — is
a legitimate owner call, but it must be **written down as an accepted risk**, not left silent.

Do not close this by measuring the delta and deciding it is "probably small enough". Either
floor it or accept it explicitly.

## Known exposures, recorded rather than hidden

1. **n8n persists execution data by default**, and the Webhook node's own output *is* the
   payload — so the OTP and the learner's address land in n8n's database and UI. There is no
   node arrangement that avoids this. Mitigated per-workflow: successful production
   executions **not saved**, failed **saved** (blind debugging of an auth path is worse),
   manual **off**. Instance-wide settings are deliberately untouched because Lab and Capstone
   execution records are project evidence.
2. **The owner's Gmail Sent folder** becomes a permanent, searchable archive of every
   learner's code and address. Nobody designs this in; it happens anyway. Owner decision:
   accept, purge periodically, or use a dedicated sending account.
3. **ngrok terminates TLS**, so a third party is on the plaintext path of every OTP.
   Acceptable for local development; not acceptable for production.
4. **Authentication now depends on the owner's laptop** being on, n8n running, the workflow
   **active**, and the tunnel up. When any is false, nobody can sign in. Existing sessions
   survive; no new session can be created.
5. **ngrok's free-tier interstitial is a silent-failure trap**: if it ever fires for GoTrue's
   request, ngrok returns 200 with HTML, n8n never executes, and Supabase records a successful
   send. Verify the first live call produced an actual n8n execution, not just a 200.

**Rollback is one toggle:** disabling the Send Email hook in the Supabase dashboard restores
stock delivery instantly with zero code changes. Stock delivery then needs `{{ .Token }}` in
the Magic Link template, so that item is retained as a dormant rollback prerequisite even
though the hook makes it unused.

## Owner actions required before this can be verified

1. `NODE_FUNCTION_ALLOW_BUILTIN=crypto` in n8n's environment; restart n8n.
2. Supabase → Authentication → Hooks → Send Email hook → Enable → HTTPS → URI
   `https://handcraft-tubeless-bonded.ngrok-free.dev/webhook/aep-auth-send-email` →
   Generate secret.
3. `AEP_AUTH_HOOK_SECRET` = that full `v1,whsec_…` string, in **n8n's environment**. Never in
   the repo, never in `web/.env.local`, never `NEXT_PUBLIC_*`, never in the workflow JSON.
4. Authentication → Providers → Email → **Email OTP Expiration: 600** (from 3600). Bounds how
   long a token sitting in a failed-execution record stays useful.
5. Do **not** use dashboard "Invite user" while the hook is live — `invite` returns 422 by
   design. Create users with Add user → Auto Confirm User ON.
6. Confirm the Google OAuth consent screen is **not** in Testing — Google expires refresh
   tokens after 7 days in that state, which would break all sign-in on a weekly cycle.
7. Confirm Windows time sync is on (the ±300s replay window depends on it).

## Verification status

- **unit tested** — 212 tests across 22 files, up from 190/22. Includes the uniform-response
  policy asserted by reference identity (`toBe`, not `toEqual`) across sixteen inputs
  including thrown values, `null`, a bare string and unknown hook codes; and the compensating
  warn proven to carry the code and neither the email nor the error message.
- **structurally verified** — `npm run verify` exits 0: lint, typecheck, 212 tests, production
  build of 8 routes plus Proxy, no new public route. `proxy.ts`, `protected-routes.ts`,
  `guards.ts`, `lib/session/*`, `lib/supabase/*`, `components/auth/*` and `web/.env.example`
  are byte-identical. Scope guard against `labs/ capstone/ database/ sample-data/ scripts/` is
  empty.
- **live verified** — **two facts only**, measured against the real project: an uninvited
  address returns `otp_disabled` (HTTP 422, 14/14, ~130ms, no email dispatched), and
  `disable_signup: true`. Plus the negative probe that established the n8n crypto blocker.
- **documentation-verified, NOT live verified** — the hook payload carrying the 6-digit
  `token`, HTTPS endpoint support, Standard Webhooks signing, and Free/Pro plan availability.
  No hook call has ever occurred, so no `email_data.token` or `webhook-signature` header from
  this project has ever been seen. The distinction matters: these are the facts the whole
  design rests on, and they are currently taken from Supabase's documentation.
- **inferred, not observed** — that the `otp_disabled` rejection happens *before* the hook
  would fire. With no hook configured there is no hook to invoke, so the ordering could not
  have been measured. The inference is sound and the fix is a blanket policy that holds
  regardless.
- **not tested** — **the entire delivery path.** The workflow has never executed a real hook
  call. No email has been sent. A1–A10 are unrun.
- **blocked** — A1–A10 and L2–L7, on owner actions 1–3 above.

## Carried to pre-launch, not closed here

`SUPABASE_SECRET_KEY` rotation (**DEFERRED — REQUIRED BEFORE PRODUCTION DEPLOYMENT**);
replacing ngrok with a stable public host or real SMTP; Security Advisor review; production
URL/redirect verification; long-duration token refresh testing; deep rate-limit enumeration
hardening.
