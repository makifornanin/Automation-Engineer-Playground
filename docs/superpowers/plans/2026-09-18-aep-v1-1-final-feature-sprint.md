# AEP V1.1 — Final Feature Sprint

Date: 2026-09-18
Scope: three features, one sprint — Admin, Capstone completion tracking, and Send
Test for challenges. No other features.

Status language follows `CLAUDE.md`. Evidence is in
`docs/qa/AEP-V1.1-SPRINT.md`.

---

## 1. Admin

### Boundary

| Concern | Where |
|---|---|
| Rendering `/admin` | `requireAdmin()` — `requireSession()`, then `notFound()` for a non-admin |
| Every admin action | `requireAdminAction()` inside each Server Action, before anything is read |
| The secret key | `getAdminClient()` only, behind `server-only`, and it re-checks the role itself |

Three independent checks, because a Server Action is a public endpoint: it can
be called with a replayed action id whether or not the page ever rendered for
that learner. Hiding the dock item is presentation; none of it is the guard.

Role comes from `app_metadata.role` on a user the Auth server just verified.
Nothing reads a client role, `user_metadata` or a query parameter.

### Supabase semantics — verified, not assumed

Read from the `supabase/auth` source rather than guessed:

- **Invite to a confirmed account** → `email_exists` (422). The Admin page says
  that address already has access.
- **Invite to an unconfirmed account** → GoTrue re-sends the invite and rotates
  `confirmation_token`, so the earlier link stops working. That *is* resend:
  there is no separate endpoint, and it is offered only before acceptance.
- **Email frequency** → `over_email_send_rate_limit` (429), named in the UI
  rather than collapsed into a generic failure.
- **Ban** (`ban_duration`) only sets `banned_until`. It deletes no session.
  Enforcement comes from GoTrue refusing a banned user on any authenticated
  request — which includes the `getUser()` AEP runs per request — and from
  `verify` refusing a banned user a sign-in. `"none"` lifts it.
- **A code for an unconfirmed invitee** goes down the signup path, which a
  project with signups disabled refuses. So the invite link must be accepted
  first; that confirms the address, after which the normal 6-digit code works.
  `InviteLinkNotice` on `/sign-in` handles that landing: it strips the session
  Supabase puts in the URL fragment (AEP signs in with a code, not a link) and
  tells the learner what to do next.

### Revoke, stated honestly

Revoke is a ban, never a delete: progress, evidence and notes stay, and restore
brings access back. On the learner's next request AEP sees no session and they
cannot sign in again. It does **not** invalidate an access token already
issued: for up to an hour that token still reaches Supabase's database API,
where row-level security limits it to that learner's own rows. The Admin page
says exactly this on screen.

Refused server-side: revoking yourself, and revoking an admin. There is no
promotion UI — the admin role is set by hand in Supabase, on purpose.

---

## 2. Capstone completion tracking

**Amends** `2026-09-17-aep-v1-fast-track-completion.md`, which recorded "the
Capstone has no completion button" and deferred "verified Capstone completion —
needs Capstone workflow exports". The reasoning there was that AEP cannot
evaluate what it cannot see. That still holds, and the answer is not a button:
it is **nine pasted proofs**, one per scenario in `CAPSTONE_SCENARIOS`, each
checked on the server by its own case. AEP does not run the learner's agent; it
checks the response the learner's agent produced. The page says so.

### One progression system

The Capstone reuses the lab rows under `CAPSTONE_SLUG = "11-capstone"`, which
satisfies the schema's `lab_slug` CHECK. **No DDL, no new table, no second
progress model, and no policy change** — the same RLS that isolates lab
progress isolates this.

- `CourseProgress.capstone { started, completed }`, assembled from those rows.
- `deriveCourseState` locks the Capstone while any lab is incomplete **whatever
  Capstone evidence exists**, then completed → in-progress → not-started. A lab
  that later gains a milestone re-locks a Capstone completed under the old bar.
- `labAccess` gates every Capstone write on all ten labs being complete.
- Proofs are `test` chunks in `self-check` mode, so `verified` can only come
  from a passing evaluation — pressing Next earns nothing.

### The proofs

Each states the request to send and the response fields it checks, because the
learner builds their own agent and needs the contract. That is a spec, not an
answer: the scenario still has to really happen. Every field and value was read
from the owner's reference Capstone in n8n (the four workflows are named in
`web/src/lib/testing/cases/capstone.ts`), never invented.

The AI's recommended action is never asserted — it comes from Gemini, and these
proofs are about what the system does with a recommendation.

---

## 3. Send Test for challenges

**Amends** the same plan's deferred "Send Test for challenges (paste-only
today)".

A challenge may carry `mode: "send-test"` with a payload and an expected
outcome. It reuses the existing action, the lab's saved Production webhook, the
URL guard and DNS private-address block, the throttle and the lock check —
**no second proxy and no second testing framework**.

Only **Labs 03 and 04** opt in, pinned by an allowlist in `registry.test.ts`:
their challenges are one request with a known answer. Labs 01, 02, 05 and 06
have no webhook at all; Labs 07–10 need ids from earlier runs or a sequence of
calls, so they stay paste — Send Test is not forced in for consistency.

Evidence is recorded against the challenge chunk only, from its own case. The
paste fallback stays available for a learner whose n8n AEP cannot reach.

---

## Accepted residuals

- **Paste is equal-trust everywhere.** `runSelfCheck` is deliberately not mode-
  gated, so a learner could hand-type a correct response instead of running
  their workflow — including for a Capstone proof or a Send Test lab. This is
  the V1 position (the "Paste the response" fallback exists under every Send
  Test, for learners whose n8n is unreachable), and removing it would lock
  those learners out of finishing. Recorded rather than silently accepted.
- **Revoke does not end an issued token** (above), for up to an hour, own rows
  only.
- `listUsers` reads one page of 200 accounts; more than that is reported as
  truncated rather than silently cut.
- `SUPABASE_SECRET_KEY` rotation before production — the existing deferred
  security task, unchanged.
