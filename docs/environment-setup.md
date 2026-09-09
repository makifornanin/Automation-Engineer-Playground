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

**The AEP Website does not exist yet.** So today the repo experience is:

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

## Secrets

- Real credentials never go in Git.
- `.env` is git-ignored; `.env.example` documents variable names only.
- The labs do not read `.env` at runtime — n8n's credential store holds the real
  connection details.
- Workflow JSON exports contain only credential **references**, which is why
  they are safe to commit.

If you ever paste a key somewhere by accident, rotate it in Supabase or Google
AI Studio rather than only deleting the text.
