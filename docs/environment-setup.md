# AEP Environment Setup

This guide gets you from nothing to running Lab 01, and unblocks the labs that
need a database or an AI credential later on.

You do not need everything here on day one. Set up each piece when a lab asks
for it.

---

## Two Experiences

AEP is being built toward a final product that uses three tools:

```text
AEP Website  →  lessons, Send Test, expected vs actual, hints, approvals
n8n          →  you build the automation yourself
Supabase     →  the database, where a lab genuinely teaches persistence
```

**The AEP Website is under construction** (Phase 10 shell built, Phase 11 authentication
in progress — see "AEP Website environment" below). So today the repo experience is:

| Need | Today | Once the website exists |
|---|---|---|
| Lesson content | This repo's lab READMEs | AEP Website |
| Build automations | n8n | n8n (unchanged) |
| Database | Supabase | Supabase (often in the background) |
| AI labs | Google Gemini credential | Gemini credential (unchanged) |
| Sending test requests | Postman **or** curl | **Send Test** in the website |
| Public webhook URL | ngrok, only if your n8n is local | Not needed for most labs |

Postman and ngrok are temporary scaffolding, not part of what AEP teaches.
When the website ships, Postman becomes optional Developer Mode.

---

## What Each Lab Needs

| Labs | n8n | Supabase | Gemini | Send a webhook request |
|---|---|---|---|---|
| 01, 02 | yes | – | – | – |
| 03, 04 | yes | – | – | yes |
| 05, 06 | yes | – | – | – |
| 07, 08 | yes | yes | – | yes |
| 09 | yes | – | yes | yes |
| 10 | yes | yes | yes | yes |

Labs 01, 02, 05 and 06 run entirely inside n8n with a Manual Trigger, so you can
start the course with nothing but n8n.

---

## A. n8n

n8n is where you build the actual automation. It is the one tool you use in
every single lab.

**Self-hosted or n8n Cloud both work.** Use whichever you already have. The labs
only use standard nodes.

### Credentials in n8n

n8n has its own encrypted credential store. This matters for AEP:

- You create a credential **once**, give it a name, and select it on a node.
- The node stores only a **reference** to the credential, never the secret.
- That is why the workflow JSON files in this repo can be committed safely.

**Never paste an API key, database key, or password directly into a node field,
a Code node, or a lab file.** If you find yourself typing a secret into a URL or
a header by hand, stop and make it a credential instead.

---

## B. Supabase

Supabase is the database used by Labs 07, 08 and 10. Those labs store processed
event IDs, dead letter queue records, and pending approval requests.

### 1. Create a project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Choose any region and set a database password when prompted.
3. Wait for the project to finish provisioning.

### 2. Get the connection details

In your Supabase project, open **Project Settings → API**. You need two values:

- **Project URL** — looks like `https://<your-project-ref>.supabase.co`
- **Service role key** — a long secret string

The service role key bypasses row level security. Treat it like a password:
never commit it, never paste it into a lab file, never share a screenshot of it.

### 3. Create the n8n credential

In n8n: **Credentials → New → Supabase API**

- **Host**: your Project URL
- **Service Role Secret**: your service role key
- Name it something clear, for example `AEP Supabase`

Save it. Every Supabase node in Labs 07, 08 and 10 then just selects this
credential by name.

### 4. Create the tables

Each lab that needs a table gives you the SQL in its README. Run it in the
Supabase **SQL Editor**:

- Lab 07 — `processed_events`, `lab07_business_actions`
- Lab 08 — `dlq_events`
- Lab 10 — `approval_requests`

Create them when you reach the lab, not in advance.

---

## C. Google Gemini

Labs 09 and 10 use Gemini to classify a customer message and recommend an
action. You need an API key.

### 1. Get an API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in and create an API key.
3. Copy it once and store it safely.

The free tier is enough for these labs.

### 2. Create the n8n credential

In n8n: **Credentials → New → Google Gemini (PaLM) API**

- Paste the API key
- Name it clearly, for example `AEP Gemini`

Then select that credential on the **Google Gemini Chat Model** node.

**Never hardcode the key into a node, a Code node, or any file in this repo.**

---

## D. Sending a Webhook Test Request

Labs 03, 04, 07, 08, 09 and 10 start with a **Webhook** node. When a lab says
"Send this payload", it means: make an HTTP request to that webhook.

Every one of those requests is the same shape:

```text
Method:        POST
URL:           your n8n webhook URL
Header:        Content-Type: application/json
Body:          the JSON shown in the lab
```

### Test URL vs Production URL

n8n gives a webhook node two URLs, and mixing them up is the single most common
reason a lab "does nothing":

- **Test URL** — only listens after you click **Execute workflow** in the editor,
  and only for one request. Use this while building, because it shows you the
  data flowing through each node.
- **Production URL** — always listening, but only while the workflow is
  **Active**. It does not display execution data live.

Use the Test URL for the guided builds. Click Execute workflow first, then send
your request.

### Option 1 — curl

Works anywhere, nothing to install on most systems:

```bash
curl -X POST "http://localhost:5678/webhook-test/aep-lab-04-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"Dana Reyes","email":"dana.reyes@example.com"}'
```

To send a payload straight from a lab's sample data file:

```bash
curl -X POST "http://localhost:5678/webhook-test/aep-lab-04-lead" \
  -H "Content-Type: application/json" \
  --data @labs/04-validation-normalization/sample-data/valid-lead.json
```

On Windows PowerShell, use `curl.exe` rather than `curl`, since `curl` is an
alias for `Invoke-WebRequest`.

### Option 2 — Postman

If you prefer a GUI:

1. New request, method **POST**
2. Paste the webhook URL
3. **Body → raw → JSON**
4. Paste the JSON from the lab
5. Send

Postman is a convenience here, not a requirement. Do not build lab logic that
depends on it.

### If your n8n is local and the caller is not

For the labs in this repo you are calling n8n from your own machine, so
`localhost` is fine and **you do not need ngrok**.

You only need a public URL when a real external service has to reach your
workflow. If you get there, [ngrok](https://ngrok.com) can expose your local
n8n, and you would use the forwarding URL in place of `localhost:5678`.

### Later

Once the AEP Website exists, this whole section collapses into one **Send Test**
button that builds the request, sends it, and shows you expected vs actual.

---

## AEP Website environment

The website has its **own** environment contract, separate from the labs'. It lives in
`web/`, and Next.js only loads env files from inside that directory — the root `.env` is
never read by the website.

Copy `web/.env.example` to `web/.env.local` (git-ignored, and it must be **UTF-8**; the
root `.env` is UTF-16LE, which Node's parser will mangle). Variable names only are
documented there; never real values.

```text
NEXT_PUBLIC_SITE_URL            public site origin
NEXT_PUBLIC_SUPABASE_URL        Supabase project URL — public by design
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   anon/publishable key — public by design; RLS is the protection, and RLS must actually be enabled
# SUPABASE_SERVICE_ROLE_KEY     server-only, not used yet, arrives with the Admin section
```

Two rules that are not negotiable:

- **`NEXT_PUBLIC_*` is inlined into the browser bundle at build time.** Anything with that
  prefix is public and permanent. A service-role key must never carry it.
- **The website's names deliberately differ from the labs' names** (`SUPABASE_URL`,
  `SUPABASE_SECRET_KEY` at the repo root). That divergence is intentional: it makes it
  impossible to "fix" a missing website variable by copying the root `.env` across, which
  would drop a real service-role key into the web app's env space.

**Owner decision — RESOLVED 2026-09-11:** the AEP website reuses the existing AEP
Supabase project while keeping website-specific application data logically isolated
from Labs and Capstone. The website's variable names above still deliberately differ
from the labs' root `.env` names for the reason above — that divergence protects against
a copy-paste mistake, not against project sharing.

**Configured 2026-09-13.** `web/.env.local` now exists (git-ignored, untracked, UTF-8 no
BOM) and holds a validated URL + publishable key pair for the shared AEP project —
confirmed live, `GET /auth/v1/settings` returns 200 with the key and 401 both without it
and with a bogus one. With the file removed the app still resolves every session as
signed-out, safely, logging one sanitized warning rather than crashing.

Two things that bit us here, recorded so they do not bite again:

1. **The key was first pasted into the root `.env`.** Next only loads env files from inside
   `web/`, so the site stayed signed-out while the key looked configured. If a website
   variable seems to have no effect, check which file it is actually in.
2. **A wrong URL or a revoked key looks exactly like success** on the signed-out path.
   `getUser()` returns locally without contacting the Auth server when there is no session,
   and `resolveSession()` swallows errors into `anonymous`. Validate a new pair with a
   direct `GET /auth/v1/settings` (with `apikey`, plus a no-key control) rather than
   inferring it from the app redirecting correctly.

See `docs/qa/AEP-PHASE-11-AIM-POINT-1-LIVE-QA.md`.

### Website table security rule

The website shares one Supabase project with the Labs and the Capstone, so table security
is handled **per table, explicitly**. Project default ACLs are not a security mechanism
here and must not be treated as one.

**Naming: `aep_web_*`** — `aep_web_profiles`, `aep_web_progress`, `aep_web_notes`,
`aep_web_lab_connections`, `aep_web_kaz_*`. Not bare `aep_*`: `aep_connection_test` already
occupies that namespace and is an existing internal table, not a website one. Use the
existing `public` schema — a custom schema adds PostgREST exposure config and client
plumbing for no security benefit, because RLS, not schema placement, is the boundary.

**Every website-table migration must do all six, in this order:**

1. create the table
2. `enable row level security` **immediately** — never "temporarily" off
3. revoke inherited privileges from `anon` and `authenticated`
4. grant back only the minimum operations actually required
5. create explicit RLS policies (owner-scoped on `auth.uid()`)
6. verify anonymous and authenticated behaviour against the real table

Step 3 is not redundant with step 2. The public-schema default ACLs for `postgres` and
`supabase_admin` grant broadly to `anon`/`authenticated` for *future* tables, so a new
table inherits privileges the moment it is created. Those defaults are deliberately left
alone — changing them would alter behaviour for a project the Labs and Capstone also use —
so each migration revokes for itself.

**Existing internal tables** (`aep_connection_test`, `approval_requests`, `dlq_events`,
`execution_logs`, `lab07_business_actions`, `processed_events`, `service_actions`) have RLS
enabled, no policies, and no `anon`/`authenticated` table privileges. They are not
browser-reachable and must not be given policies without a real learner-facing need.
`service_role` is untouched, which is why n8n keeps working — see §B.3.

---

## AEP authentication email delivery (Supabase)

**Architecture, recorded so it is never re-derived from the code:**

- **Supabase Auth = authentication authority AND email delivery.** Approved users, OTP
  generation, OTP expiry, OTP verification, sessions, roles, invite-only enforcement, and
  sending the 6-digit code.
- **AEP website = learner-facing sign-in UI and session consumer.** It calls
  `signInWithOtp({ shouldCreateUser: false })` and `verifyOtp`, and nothing else.
- **n8n = NOT involved in authentication.** No workflow, no webhook, no hook secret.

```text
approved user in Supabase -> learner enters email in AEP
  -> signInWithOtp({ shouldCreateUser: false })
  -> Supabase sends the 6-digit code directly
  -> learner enters the code -> verifyOtp -> authenticated session
```

> **SUPERSEDED 2026-09-14.** An earlier revision of this section described n8n receiving a
> Supabase **Send Email Hook** and sending the mail via Gmail. That architecture was
> withdrawn by owner decision before it ever ran — the hook was never configured and the
> workflow never executed a real call. `AEP_AUTH_HOOK_SECRET` and
> `NODE_FUNCTION_ALLOW_BUILTIN=crypto` are **not** part of the auth inventory and should not
> be set for authentication. The reasoning that justified withdrawing it is preserved in
> `docs/superpowers/plans/2026-09-14-aep-phase-11-aim-point-4-n8n-auth-email-delivery.md`
> under "Known exposures" — it is the clearest statement of why routing auth mail through a
> laptop, a tunnel and a personal mailbox was the wrong trade.

### Environment names (names only, never values)

```text
NEXT_PUBLIC_SITE_URL                  public site origin; also decides the cookie Secure flag
NEXT_PUBLIC_SUPABASE_URL              Supabase project URL - public by design
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  publishable key - public by design; RLS is the protection
# SUPABASE_SERVICE_ROLE_KEY           server-only, not used yet, never NEXT_PUBLIC_
```

No authentication-specific variable is added. Nothing in `web/` references n8n.

### Supabase dashboard configuration — the minimum for the 6-digit code flow

1. **Authentication -> Email Templates -> Magic Link: the body MUST contain `{{ .Token }}`.**
   **This is the hard blocker, and it fails in the worst possible way.** The stock template
   contains only `{{ .ConfirmationURL }}`, so without this edit the learner receives a link
   and no six digits, the form sits on the code step, and every code entered returns
   `otp_expired` — which looks exactly like a broken `verifyOtp`. Do this before anything
   else. `signInWithOtp` on an existing user renders the **Magic Link** template, not
   Confirm Signup.

   This is documented by the SDK itself, not inferred —
   `@supabase/auth-js`'s `GoTrueClient.d.ts`, on `signInWithOtp`: *"Magic links and OTPs
   share the same implementation. To send users a one-time code instead of a magic link,
   modify the magic link email template to include `{{ .Token }}` instead of
   `{{ .ConfirmationURL }}`."*

   Note "**instead of**", not "in addition to": removing `{{ .ConfirmationURL }}` is the
   documented shape. It also avoids offering the link path at all — `@supabase/ssr` forces
   PKCE, so a link opened in a different browser or an email client's in-app browser fails
   with an error the learner cannot act on.
2. **Authentication -> Providers -> Email:** enabled. Do not add a password requirement.
3. **Email OTP Expiration: 600s** (from 3600). A 6-digit code with a one-hour life has a
   large brute-force window on its own terms.
4. **Public sign-up stays DISABLED.** This, not application code, is the invite-only
   boundary — the publishable key is public, so an attacker can call GoTrue directly.
   Confirm with `GET /auth/v1/settings` -> `disable_signup: true`.
5. **Authentication -> Users -> Add user**, with **Auto Confirm User ON**. No metadata is
   required: `map-user.ts` resolves an absent `app_metadata.role` to `student`.
6. **Do NOT use "Invite user".** It renders the Invite template with a different action
   type, so it appears to succeed while delivering the wrong email — a silent, plausible
   failure. Use Add user.
7. **Confirm no Send Email Hook is active:** Authentication -> Hooks -> Send Email Hook
   shows disabled/none. If a hook secret was ever generated while exploring, remove it — it
   would be a live credential for an endpoint that will never be used.

Not required, do not touch: URL Configuration / Redirect Allow List (a code is
origin-independent), custom SMTP, and any n8n environment variable.

### Operational cautions

- **Supabase's built-in mailer is rate-limited** (roughly a couple of sends per hour on a
  free project). Because the request step is deliberately uniform, the UI keeps saying
  "check your inbox" while nothing is being sent. The server warn carrying
  `over_email_send_rate_limit` is the only signal — check it before concluding the flow is
  broken.
- The auth cookie's `Secure` flag derives from `NEXT_PUBLIC_SITE_URL`. On
  `http://localhost` it is correctly absent; a production deploy that mis-sets that variable
  loses `Secure` with no build-time or runtime error.

### n8n Code-node sandbox finding (retained — not auth-related)

Discovered 2026-09-14 while evaluating the withdrawn auth email hook. The approach was
abandoned; **the finding itself stands** and will matter to any future lab or Kaz workflow
that needs an HMAC or another Node builtin:

```text
require('crypto')            blocked - "Module 'crypto' is disallowed"
globalThis.crypto            undefined
crypto.subtle                unavailable
Buffer / TextEncoder / atob  available
```

n8n's built-in **Crypto node** takes a *string* key, so it cannot be used where raw
base64-decoded key bytes are required. Enabling a builtin needs
`NODE_FUNCTION_ALLOW_BUILTIN=<module>` in n8n's environment — name the specific module, never
`*`, which would also unlock `fs` and `child_process` for every Code node in the instance.

---

## Secrets

- Real credentials never go in Git.
- `.env` is git-ignored; `.env.example` documents variable names only.
- The labs do not read `.env` at runtime — n8n's credential store holds the real
  connection details.
- Workflow JSON exports contain only credential **references**, which is why
  they are safe to commit.

If you ever paste a key somewhere by accident, rotate it in Supabase or Google
AI Studio rather than only deleting the text.
