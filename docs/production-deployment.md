# Production deployment

Status on 2026-09-19: **deployed; production functional smoke checks passed, with verification limits below**.
The owner restored the existing Mac/Docker/ngrok runtime. Health returned 200,
unauthenticated API access 401, unauthenticated Gateway POST 403, and an authenticated
Gateway request returned 200 with a nonempty answer. No instance, tunnel or workflow
was created or modified. The existing editor page is reachable through the tunnel;
editor/API routing restrictions and account hostname persistence still need review.

Vercel project `automation-engineer-playground` is linked to the existing GitHub
repository with the settings below. All seven production variables were uploaded
privately and their names verified. Reserved production origin:
`https://automation-engineer-playground.vercel.app` (live).
Current deployment: `dpl_97frjbd6SEjqhbhzE2pfCZapVj4j`.
Owner confirmed Supabase Site URL and exact production `/sign-in` redirect, retaining
localhost entries. Production OTP sign-in, session refresh, student Admin refusal,
admin page access, Home/Labs/Notes/Capstone, Kaz response/persistence and learner
sign-out have been exercised. Following owner publication of the exact existing E2E
Lab 03 workflow, deployed Send Test passed both expected-response checks. Full evidence is in
`docs/qa/AEP-PRODUCTION-DEPLOYMENT.md`.

Keep the Mac, Docker n8n and the existing ngrok connector online. The September 21
sweep inspected saved production Lab 03 executions and confirmed hosted canonical
lookup at help level 3, with canonical material absent at levels 1 and 2. Editor
sign-in was exercised; routing restrictions and account hostname persistence still
need host review. See `docs/qa/AEP-FULL-SWEEP-2026-09-21.md` for the evidence and limits.

Keep the existing hostname `handcraft-tubeless-bonded.ngrok-free.dev`:
`docs/kaz/aep-kaz-gateway.json` uses it in n8n API calls. Changing website variables
alone cannot migrate those calls. The owner subsequently authorized synchronizing
only the existing Kaz Gateway's locally fixed Code nodes for the sweep release;
preserve its identity, credentials and all other workflows.

## Build and packaging

| Setting | Value |
| --- | --- |
| Vercel team | `maki-s-projects2` |
| Root Directory | `web` |
| Framework | Next.js |
| Node.js | `24.x` |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | Next.js default; do not set a static export directory |
| Outside-root source files | Enable inclusion in the build step |

Upload/link the repository root, preserving both `web/` and `labs/`; do not
upload `web/` alone. Kaz dynamically reads `../labs/*/workflow/*.json` from the
app working directory. `web/next.config.ts` expands the tracing root and includes
only those canonical JSON assets. Keep them server-side, never in `public/`.
Next.js supports [outside-root tracing and explicit includes](https://nextjs.org/docs/app/api-reference/config/next-config-js/output);
Vercel exposes [Root Directory build settings](https://vercel.com/docs/builds/configure-a-build).

Run `npm run verify` from `web/`. Then run this assertion from the repository root:

```powershell
$expected = @(Get-ChildItem -Path 'labs/*/workflow/*.json' -File)
$traces = @(Get-ChildItem -LiteralPath 'web/.next/server/app' -Recurse -Filter 'page.js.nft.json')
if ($expected.Count -ne 10 -or $traces.Count -eq 0) { throw 'Missing source workflows or build traces' }
foreach ($trace in $traces) {
  $files = (Get-Content -LiteralPath $trace.FullName -Raw | ConvertFrom-Json).files
  $resolved = @($files | ForEach-Object { [IO.Path]::GetFullPath((Join-Path $trace.DirectoryName $_)) })
  foreach ($source in $expected) {
    if ($resolved -notcontains $source.FullName) { throw "Canonical workflow absent from $($trace.Name): $($source.Name)" }
  }
}
'PASS: all application page traces include all ten canonical workflows'
```

The baseline contained 15 trace files and zero canonical workflow entries.
After local verification, inspect the hosted function artifacts and exercise Kaz:
trace inclusion does not alone prove that the hosted working directory resolves
`../labs` correctly.

## Environment contract

Set values privately in the Vercel Production environment before building. Use
`web/.env.example` as the inventory; never put real values into docs or command
history. All seven names were present locally during preparation, which does not
prove they are configured in Vercel.

| Name | Exposure / value contract |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public; final HTTPS production origin, no path. Controls Secure session cookies and invite redirect. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public; existing Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public; publishable key for that same project. |
| `SUPABASE_SECRET_KEY` | Server-only; existing admin secret key. |
| `KAZ_GATEWAY_URL` | Server-only; active production `/webhook/` endpoint, never `/webhook-test/`. |
| `KAZ_GATEWAY_SECRET` | Server-only; matches existing Gateway Header Auth `x-aep-kaz-secret` credential. |
| `KAZ_N8N_HOST` | Server-only; hostname only, matching the existing Gateway's n8n host. |

Public variables are bundled at build time: rebuild after changing them. A preview
built for another origin is not proof of correct production cookie/invite behavior.
Keep the n8n API key and model credentials in existing n8n credentials; they are
not website environment variables. Do not print env files or secrets in logs.

## Supabase and tunnel gate

1. Confirm the existing schema, RLS and approved users are present; do not run
   migrations or reset data for deployment.
2. Set Supabase Site URL to the final HTTPS production origin. Allow the exact
   production `/sign-in` URL used by admin invites; retain existing approved local
   URLs. There is no `/auth/callback` route to configure.
3. Preserve email OTP sign-in: Email provider enabled, public signup disabled,
   Magic Link template renders `{{ .Token }}`, and no n8n Send Email Hook.
   Confirm email delivery for a designated approved test account. Older bootstrap
   instructions in `environment-setup.md` predate the implemented admin invite flow.
4. Restore the existing n8n runtime and tunnel. Confirm the production Gateway is
   active, its Header Auth credential is configured, and its existing n8n/model
   credentials work. An HTTP response from ngrok alone is insufficient.
5. Verify an unauthenticated Gateway POST is rejected and a legitimate server-side
   Kaz request succeeds without redirects or an interstitial. Use an approved test
   account; do not send learner secrets or dump response payloads into evidence.

Only after this gate passes, create/link the AEP project in the intended team,
configure the settings above, and deploy with the production environment. Record
project identifier, deployment URL, revision and time without credential values.
Project creation/linking and production variable configuration are complete.
Production deployment and owner confirmation of Supabase URLs are complete.
Continue the remaining live gates; do not equate deployment readiness with beta readiness.

## Required live smoke evidence

| Area | Required result |
| --- | --- |
| Sign-in | Approved test user receives six-digit OTP, authenticates, refreshes and signs out; invalid/expired code fails safely. |
| Sessions | HTTPS session cookies are Secure; signed-out protected requests fail safely. |
| Admin | Owner can access admin; student and signed-out users cannot perform admin actions. Test invites only to an approved recipient. |
| Learning | Home and a representative lab load; notes and progress persist for the test account; settings remains usable. |
| Test mediation | A designated existing test workflow returns expected success and safe failure diagnostics. |
| Kaz | A lesson question succeeds; authorized workflow inspection succeeds; unavailable/wrong-host states remain honest; canonical context is available under its existing help-level policy. |
| UI | Dock, themes, keyboard focus, mobile layout and reduced-motion behavior remain intact. |
| Secrets | Server secrets absent from tracked changes and browser assets; browser requests do not expose Gateway/n8n credentials. |

Record each item as passed, failed or not tested. A local build or green workflow
alone does not satisfy this matrix. Integration review, QA and Project Manager
reconciliation must precede any production-complete claim.

## Recovery

If live verification fails, keep access limited and record the failure. Once a
known-good production deployment exists, use Vercel's deployment rollback to that
specific deployment and recheck auth and Kaz. For an initial failed deployment
there is no previous production release to roll back to; remove its public domain
assignment or disable access until fixed. Do not roll back database contents or
mutate existing n8n workflows to compensate for a website deployment problem.
