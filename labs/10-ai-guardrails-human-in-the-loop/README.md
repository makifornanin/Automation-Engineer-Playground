# Lab 10 — AI Guardrails & Human-in-the-Loop

- **Difficulty:** Advanced
- **Main Concept:** Separating what AI recommends from what automation is allowed to do
- **Estimated Time:** 75–90 minutes

---

## The Hook

A customer writes in: *"Please cancel my account today."*

Your AI reads it, understands it perfectly, and recommends `cancel_account`
with a confidence of **1.00**.

It is completely correct. That *is* what the customer asked for.

Now: should your workflow just... do it?

Sit with that for a second, because the answer is no — and the reason has
nothing to do with whether the AI was right.

---

## The Business Problem

Some actions are cheap to get wrong.

Route an inquiry to Sales when it was really Support? Someone forwards the
email. Ten seconds lost, nobody notices.

Cancel the wrong account? Refund the wrong invoice? Now you're in a conversation
with a customer who is no longer a customer.

The cost of a mistake is not evenly distributed across your actions. So your
automation shouldn't treat them as if it were.

That gives us the idea the whole lab is built on:

> **Confidence is not permission.**

Confidence is the AI telling you how sure it is. Permission is your business
telling the AI what it's allowed to touch. Those are two different systems, and
today we build the second one.

---

## What You'll Build

Two workflows that together form one business process.

**Part A — the request comes in and gets judged:**

```text
Receive Service Request
↓
Prepare Guardrail Input
↓
Gemini Guardrail Decision ── Google Gemini Chat Model
              └───────────── Structured Output Parser
↓
Apply Guardrails
↓
Can Auto Execute?
│
├── TRUE  → Execute Automatic Action → Return Guardrail Decision
│
└── FALSE → Create Pending Approval → Return Pending Approval
                                            ↓
                                   Return Guardrail Decision
```

**Part B — a human decides what the machine wouldn't:**

```text
Receive Human Decision
↓
Prepare Human Decision
↓
Fetch Pending Approval
↓
Approve or Reject?
│
├── APPROVE → Mark Approved → Execute Approved Action ─┐
│                                                       ↓
└── REJECT  → Mark Rejected → Return Rejected Decision ─┴→ Return Human Decision Result
```

---

## What You Already Know

Lab 10 is where several earlier labs finally shake hands.

- **Lab 09** — structured AI output and validation. Today's Gemini node uses the
  same chain-plus-parser pattern. We won't re-teach it.
- **Lab 02** — routing on a boolean. `Can Auto Execute?` is exactly that.
- **Lab 07** — you stopped the same event being processed twice. That idea comes
  back today, wearing a suit.

Lab 09 asked: *is this AI answer well-formed?*

Lab 10 asks the question that comes immediately after: *is this AI answer
allowed to happen?*

---

## Prerequisites

Before starting this lab you need:

- [ ] n8n running
- [ ] A Supabase project and an n8n Supabase credential
- [ ] A Google Gemini API key configured as an n8n credential
- [ ] A way to send a webhook test request
- [ ] Lab 09 completed, or an understanding of structured AI output and validation

Setup steps are in [`docs/environment-setup.md`](../../docs/environment-setup.md).

This lab needs the most setup in the course: it combines the Gemini credential
from Lab 09 with the Supabase credential from Labs 07 and 08.

> **How to send these requests:** this lab has **two** webhooks — one for the
> incoming service request, one for the human decision. Both are plain POSTs with
> `Content-Type: application/json`. See the setup guide for curl and Postman
> examples. In the future AEP Website the service request becomes **Send Test**,
> and the human decision becomes a real approval screen.

---

## The Policy

Before writing a single node, decide the rules. This is a business decision, not
a technical one — which is exactly why it lives in configuration rather than
buried in code.

**Actions Gemini may recommend:**

```text
send_to_sales
create_support_ticket
send_to_billing
issue_refund
cancel_account
manual_review
```

**Allowed to run automatically:**

```text
send_to_sales
create_support_ticket
send_to_billing
```

**Restricted — a human decides:**

```text
issue_refund
cancel_account
```

**Confidence threshold:** `0.85`

Automatic execution requires all three:

```text
the action is on the allowed list
AND confidence >= 0.85
AND the action is NOT restricted
```

Anything else stops and waits for a person.

Read that third condition again. It looks redundant — if `cancel_account` isn't
on the allowed list, isn't it already blocked?

Today, yes. But allowed-lists get edited by humans in a hurry. The restricted
check is a second lock on the same door, and it's the one that survives someone
pasting an extra action into the wrong list at 5pm on a Friday.

---

## Approval Storage

Human decisions don't happen inside your workflow execution. Someone might
approve this tomorrow morning. So the pending request has to outlive the run
that created it.

Create this table in Supabase:

```sql
create table public.approval_requests (
  id bigint generated by default as identity primary key,
  request_id text not null,
  recommended_action text not null,
  confidence numeric not null,
  reason text,
  status text not null default 'pending',
  human_decision text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
```

`status` is the important column. A row moves `pending` → `approved` or
`pending` → `rejected`, exactly once.

---

## Meet the New Nodes

Gemini, the parser, the Webhook, Set and IF nodes are all familiar by now. Three
things here are genuinely new.

### Code — Apply Guardrails

**What it does**
Takes the AI's recommendation and the policy, and decides whether the action may
proceed without a human.

**Why we're using it here**
This is the entire point of the lab. Gemini recommends; this node authorises.
Keeping them in separate nodes means the AI can never be the thing that grants
its own permission.

**Think of it like**
A bouncer. The guest list is not up for negotiation, and enthusiasm at the door
counts for nothing.

### Supabase — Create Pending Approval

**What it does**
Writes the blocked request to the database with `status = 'pending'`.

**Why we're using it here**
The workflow is about to end. Without this row, the request simply disappears
and the customer waits forever.

**Think of it like**
A ticket dropped into someone's inbox. The person who raised it has gone home;
the ticket hasn't.

### Supabase — Fetch Pending Approval

**What it does**
Looks up an approval row by `id` **and** `status = 'pending'`.

**Why we're using it here**
That second filter is doing real work. It means an already-decided request
cannot be decided again. You met this idea in Lab 07 as idempotency — don't
process the same thing twice. Same principle, applied to human decisions.

---

# Guided Build — Part A

Create a new workflow. Name it:

```text
AEP Lab 10 - AI Guardrails & Human-in-the-Loop
```

## Step 1 — Receive the Service Request

Add a **Webhook** node. Rename it `Receive Service Request`.

- **HTTP Method:** POST
- **Path:** `aep-lab-10-guardrails`
- **Respond:** Using 'Respond to Webhook' Node

## Step 2 — Load the Policy

Add an **Edit Fields (Set)** node. Rename it `Prepare Guardrail Input`.

| Field | Type | Value |
|---|---|---|
| `request_id` | String | `{{ $json.body.request_id }}` |
| `message` | String | `{{ $json.body.message }}` |
| `allowed_automatic_actions` | String | `send_to_sales,create_support_ticket,send_to_billing` |
| `restricted_actions` | String | `issue_refund,cancel_account` |
| `confidence_threshold` | Number | `0.85` |

Your policy now travels with the request.

This is worth pausing on. The rules are *data*, not hard-coded logic. Changing
who may auto-execute what becomes editing a field — no code review, no redeploy.
When a compliance person asks "what are the current rules?", you can show them a
node instead of a source file.

## Step 3 — Ask Gemini for a Recommendation Only

Add a **Basic LLM Chain** node. Rename it `Gemini Guardrail Decision`.

Set **Source for Prompt** to `Define below`:

```text
You are an AI service-request decision assistant.

Customer request:
{{ $json.message }}

Allowed automatic actions:
{{ $json.allowed_automatic_actions }}

Restricted actions:
{{ $json.restricted_actions }}

Choose the single best recommended action for the request.

Possible actions:
- send_to_sales
- create_support_ticket
- send_to_billing
- issue_refund
- cancel_account
- manual_review

Return:
- recommended_action
- confidence from 0 to 1
- a short reason

Important decision rules:

- If the customer explicitly asks to cancel, close, terminate, or delete their account, recommend "cancel_account".
- If the customer explicitly requests a refund, recommend "issue_refund".
- If the request is about billing but does NOT explicitly ask for a refund, recommend "send_to_billing".
- If the request is a technical/account-access problem, recommend "create_support_ticket".
- If the request is about buying, pricing, plans, or speaking with sales, recommend "send_to_sales".
- Use "manual_review" only when the intent is genuinely unclear.

Do not replace restricted actions with safer alternatives.
Your job is to recommend the action that best matches the user's request.
The guardrail system will decide whether it can run automatically.
```

Attach a **Google Gemini Chat Model** node with your credential.

Turn on **Require Specific Output Format** and attach a **Structured Output
Parser** with this schema:

```json
{
  "type": "object",
  "properties": {
    "recommended_action": {
      "type": "string",
      "enum": [
        "send_to_sales",
        "create_support_ticket",
        "send_to_billing",
        "issue_refund",
        "cancel_account",
        "manual_review"
      ]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "reason": {
      "type": "string"
    }
  },
  "required": ["recommended_action", "confidence", "reason"],
  "additionalProperties": false
}
```

Notice the last three lines of that prompt. We are explicitly telling Gemini
**not** to be helpful by softening a risky request into a safe one.

That sounds backwards until you think about who is responsible for what. If the
model quietly downgrades "cancel my account" to "create a support ticket", your
guardrail never sees a restricted action, the human is never asked, and the
customer's actual request is silently ignored. The model would be protecting you
by lying to you.

We want the honest recommendation. Authorisation is not its job.

Note also that the schema permits `issue_refund` and `cancel_account` —
recommending them is fine. Whether they *run* is decided next.

## Step 4 — Apply the Guardrails

Add a **Code** node. Rename it `Apply Guardrails`.

```javascript
const ai = $json.output;
const input = $('Prepare Guardrail Input').item.json;

const allowedAutomaticActions = input.allowed_automatic_actions
  .split(',')
  .map(action => action.trim());

const restrictedActions = input.restricted_actions
  .split(',')
  .map(action => action.trim());

const threshold = Number(input.confidence_threshold);

const isAllowedAutomatic = allowedAutomaticActions.includes(
  ai.recommended_action
);

const isRestricted = restrictedActions.includes(
  ai.recommended_action
);

const highConfidence = ai.confidence >= threshold;

const canAutoExecute =
  isAllowedAutomatic &&
  highConfidence &&
  !isRestricted;

let guardrailReason;

if (isRestricted) {
  guardrailReason = 'restricted_action';
} else if (!highConfidence) {
  guardrailReason = 'low_confidence';
} else if (!isAllowedAutomatic) {
  guardrailReason = 'not_allowed_automatically';
} else {
  guardrailReason = 'automatic_action_allowed';
}

return {
  json: {
    request_id: input.request_id,
    recommended_action: ai.recommended_action,
    confidence: ai.confidence,
    reason: ai.reason,
    is_allowed_automatic: isAllowedAutomatic,
    is_restricted: isRestricted,
    high_confidence: highConfidence,
    can_auto_execute: canAutoExecute,
    requires_approval: !canAutoExecute,
    guardrail_reason: guardrailReason
  }
};
```

Three things to notice.

**It reads back to `Prepare Guardrail Input`.** The line
`$('Prepare Guardrail Input').item.json` reaches across the workflow to fetch the
policy, because Gemini's output doesn't carry it. Remember this — it matters
when we start testing with simulators.

**The three checks are separate booleans.** `is_allowed_automatic`,
`high_confidence`, `is_restricted` — each one is returned individually, not just
folded into the final answer. When something routes unexpectedly, you can see
*which* check decided it without adding a single log line.

**`guardrail_reason` records why.** Not just that approval is needed, but which
rule triggered it. That string is what a support screen would show a human.

## Step 5 — Split Automatic from Approval

Add an **IF** node. Rename it `Can Auto Execute?`.

Condition: `{{ $json.can_auto_execute }}` **is true** (Boolean).

All the thinking already happened in the Code node. This just opens one of two
doors.

## Step 6 — The Automatic Path

From **TRUE**, add an **Edit Fields (Set)** node. Rename it
`Execute Automatic Action`.

| Field | Type | Value |
|---|---|---|
| `success` | Boolean | `true` |
| `status` | String | `auto_executed` |
| `request_id` | String | `{{ $json.request_id }}` |
| `action` | String | `{{ $json.recommended_action }}` |
| `confidence` | Number | `{{ $json.confidence }}` |
| `requires_approval` | Boolean | `false` |
| `decision_source` | String | `ai_guardrail` |

In a real system this node would be an HTTP Request creating the ticket or
notifying Sales. Here it stands in for the side effect, which keeps the lab
focused on the decision rather than the plumbing.

## Step 7 — Persist the Pending Approval

From **FALSE**, add a **Supabase** node. Rename it `Create Pending Approval`.

- **Operation:** Create
- **Table:** `approval_requests`

| Column | Value |
|---|---|
| `request_id` | `{{ $json.request_id }}` |
| `recommended_action` | `{{ $json.recommended_action }}` |
| `confidence` | `{{ $json.confidence }}` |
| `reason` | `{{ $json.reason }}` |
| `status` | `pending` |

The workflow is about to end. This row is the only thing that will remember the
request existed.

## Step 8 — Tell the Caller What Happened

Add an **Edit Fields (Set)** node after it. Rename it `Return Pending Approval`.

| Field | Type | Value |
|---|---|---|
| `success` | Boolean | `true` |
| `status` | String | `pending_approval` |
| `request_id` | String | `{{ $json.request_id }}` |
| `action` | String | `{{ $json.recommended_action }}` |
| `confidence` | Number | `{{ $json.confidence }}` |
| `requires_approval` | Boolean | `true` |
| `decision_source` | String | `ai_guardrail` |

`success` is `true` here, and that is not a mistake.

Stopping a restricted action is the system **working**, not failing. The request
was received, understood, and correctly held for review. Marking that as a
failure would teach every dashboard downstream to treat correct behaviour as an
incident.

Add a **Respond to Webhook** node, rename it `Return Guardrail Decision`, set
the code to `200`, and connect both `Execute Automatic Action` and
`Return Pending Approval` into it.

Part A is done.

---

# Predict & Test

Three scenarios. Predict each one *before* you run it — that's where the lesson
lives.

## Scenario A — Allowed action, high confidence

Send `sample-data/auto-execute-request.json`:

```json
{
  "message": "I'd like to know your pricing and speak with someone about your plans.",
  "request_id": "req_guard_auto_001"
}
```

**Predict:** which action, and should this run automatically?

Run it. You should see `status: auto_executed` and `requires_approval: false`.

All three conditions passed: allowed, confident, not restricted. This is the
happy path — and most of your traffic should live here. If everything needs a
human, you haven't built automation, you've built a form.

## Scenario B — Restricted action, high confidence

Send `sample-data/restricted-request.json`:

```json
{
  "message": "Please cancel my account today.",
  "request_id": "req_guard_restricted_001"
}
```

**Predict:** Gemini will recommend `cancel_account`, and it'll be very sure.
Confidence around 1.00. Does that earn permission?

Run it.

`status: pending_approval`. `guardrail_reason: restricted_action`.

This is the sentence the whole lab exists to produce:

> The AI was completely right, and it still doesn't get to do it.

Check Supabase — there's a new row with `status = 'pending'`. Note its `id`;
you'll need it shortly.

## Scenario C — Allowed action, low confidence

This one needs to be deterministic. You can't reliably ask a model to be unsure
on demand, so we'll supply the uncertainty ourselves.

Find the **Code** node named `Simulate Low Confidence Decision`:

```javascript
return {
  json: {
    output: {
      recommended_action: 'send_to_sales',
      confidence: 0.60,
      reason: 'The intent may be sales-related, but it is unclear.'
    }
  }
};
```

To use it, rewire temporarily:

```text
Prepare Guardrail Input → Simulate Low Confidence Decision → Apply Guardrails
```

Gemini is bypassed, but `Prepare Guardrail Input` still runs — which matters,
because `Apply Guardrails` reaches back to it for the policy. Wire the simulator
in on its own and the Code node will fail looking for a node that never
executed. (Worth knowing generally: `$('Node Name')` only works if that node ran
in the same execution.)

**Predict:** `send_to_sales` is on the allowed list and isn't restricted. So why
might we still stop?

Run it. `status: pending_approval`, `guardrail_reason: low_confidence`.

The action was safe. The *AI* wasn't sure. Low confidence means the model may
have misread the request entirely — and quietly doing the wrong safe thing still
means the customer didn't get what they asked for.

**Restore the original wiring** when you're done:
`Prepare Guardrail Input → Gemini Guardrail Decision → Apply Guardrails`.

---

# Guided Build — Part B: The Human Decides

A pending row is sitting in Supabase. Nothing is going to happen to it on its
own.

Part B is the other half of the business process: a person makes the call, and
the system records it.

## Step 9 — Receive the Human Decision

Add a **Webhook** node. Rename it `Receive Human Decision`.

- **HTTP Method:** POST
- **Path:** `aep-lab-10-approval-decision`
- **Respond:** Using 'Respond to Webhook' Node

Payload shape:

```json
{
  "approval_id": 1,
  "decision": "approve"
}
```

> **Use your own ID.** `1` is only an example — your pending row will have
> whatever `id` Postgres assigned it. Find it with:
>
> ```sql
> select id, request_id, recommended_action, status
> from approval_requests
> where status = 'pending'
> order by id desc;
> ```
>
> The `approval_id` values in `sample-data/approve-decision.json` and
> `sample-data/reject-decision.json` are placeholders — swap in your own.
>
> In the AEP Website, the approver clicks a real request and never types an ID.

## Step 10 — Extract the Decision

Add an **Edit Fields (Set)** node. Rename it `Prepare Human Decision`.

| Field | Value |
|---|---|
| `approval_id` | `{{ $json.body.approval_id }}` |
| `decision` | `{{ $json.body.decision }}` |

## Step 11 — Fetch Only If Still Pending

Add a **Supabase** node. Rename it `Fetch Pending Approval`.

- **Operation:** Get
- **Table:** `approval_requests`

Filters — **both** of them:

```text
id     = {{ $json.approval_id }}
status = pending
```

That `status = pending` filter is the quiet hero of this workflow.

Without it, someone could approve the same cancellation three times and it would
execute three times. With it, the second attempt finds no row and stops.

You've seen this before. Lab 07 called it idempotency and used a
`processed_events` table. Same defence, different shape: **state in the database
decides what may still happen**, not the caller's good intentions.

## Step 12 — Route Approve vs Reject

Add an **IF** node. Rename it `Approve or Reject?`.

Condition:

```text
{{ $('Prepare Human Decision').item.json.decision }}   equals   approve
```

Note where that value comes from. `Fetch Pending Approval` returned the database
row, and the row knows nothing about what the human just decided. So we reach
back to the node that holds it.

Worth being clear about what this IF node is *not*: it isn't asking the AI
anything. Gemini's involvement ended at Step 4. This is a person's decision
travelling through the workflow.

## Step 13 — Record an Approval

From **TRUE**, add a **Supabase** node. Rename it `Mark Approved`.

- **Operation:** Update
- **Table:** `approval_requests`
- **Filter:** `id` equals `{{ $json.id }}`

| Column | Value |
|---|---|
| `status` | `approved` |
| `human_decision` | `approved` |
| `decided_at` | `{{ $now }}` |

Three columns, three different jobs:

- `status` closes the row so it can never be fetched as pending again
- `human_decision` records what the person chose
- `decided_at` records when

The last one is what turns a database row into an audit trail. "Who approved
this and when" is the first question asked after any expensive mistake.

> Watch the field types here. `decided_at` is a timestamp column — it wants
> `{{ $now }}`, not the word `approved`. Sending a status string into a
> timestamp column is an easy slip and Postgres will reject it outright.

## Step 14 — Resume the Approved Action

Add an **Edit Fields (Set)** node. Rename it `Execute Approved Action`.

| Field | Type | Value |
|---|---|---|
| `success` | Boolean | `true` |
| `status` | String | `approved_and_executed` |
| `approval_id` | Number | `{{ $json.id }}` |
| `request_id` | String | `{{ $json.request_id }}` |
| `action` | String | `{{ $json.recommended_action }}` |
| `human_decision` | String | `approve` |
| `decision_source` | String | `ai_guardrail` |

This is where the restricted action finally happens — after a person said yes.

That `decision_source` value is worth a raised eyebrow. Is `ai_guardrail`
really accurate for an action a human just authorised? Hold that thought until
Make It Your Own.

## Step 15 — Record a Rejection

From **FALSE**, add a **Supabase** node. Rename it `Mark Rejected`.

Same setup as `Mark Approved`, with `status` and `human_decision` set to
`rejected`.

Then an **Edit Fields (Set)** node, `Return Rejected Decision`:

| Field | Type | Value |
|---|---|---|
| `success` | Boolean | `true` |
| `status` | String | `rejected` |
| `approval_id` | Number | `{{ $json.id }}` |
| `request_id` | String | `{{ $json.request_id }}` |
| `action` | String | `{{ $json.recommended_action }}` |
| `human_decision` | String | `rejected` |
| `decision_source` | String | `ai_guardrail` |

`success: true` again — a rejection is a successful outcome. The system asked, a
human answered, the answer was recorded. Nothing failed.

Note what *doesn't* happen on this branch: no action is executed. The row is
closed and the story ends there.

## Step 16 — Respond

Add a **Respond to Webhook** node. Rename it `Return Human Decision Result`,
code `200`. Connect both `Execute Approved Action` and
`Return Rejected Decision` into it.

## Test the Human Path

Take the pending `id` from Scenario B and approve it:

```json
{ "approval_id": <your id>, "decision": "approve" }
```

Expect `status: approved_and_executed`. Check Supabase: `status = approved`,
`decided_at` populated.

Now **send the exact same request again.**

**Predict:** what happens?

The workflow finds no row — because that row is no longer `pending`. Your
double-decision guard works, and you just proved it rather than assuming it.

Create another pending request and reject that one. Confirm `status: rejected`
and that no action was executed.

---

# Break It

Now we deliberately build the bug that this entire lab exists to prevent.

A tired engineer simplifies the guardrail. Confidence is basically a quality
score, right? High confidence means the AI knows what it's doing. Ship it.

In `Apply Guardrails`, temporarily replace the `canAutoExecute` line:

```javascript
// TEMPORARY - the bad rule
const canAutoExecute = highConfidence;
```

That's it. One line. The allowed-list check and the restricted check are gone.

Now rewire the restricted simulator:

```text
Prepare Guardrail Input → Simulate Restricted Decision → Apply Guardrails
```

That Code node produces a confident restricted recommendation:

```javascript
return {
  json: {
    output: {
      recommended_action: 'cancel_account',
      confidence: 0.95,
      reason: 'The customer explicitly asked to cancel their account.'
    }
  }
};
```

**Predict before running:** where does `cancel_account` at 0.95 confidence go
now?

Run it.

`status: auto_executed`.

Look at that response for a moment. No error. No warning. Green execution.
Your workflow just cancelled an account on its own authority — and every
monitoring dashboard you own would report this run as a success.

**This is the failure mode that matters.** Not a crash. A confident, silent,
technically-perfect violation of business policy.

---

# Debug It

You've seen the symptom. Find the cause before reading the hints.

**Investigate in order:**

1. Which condition sent this request down the automatic path?
2. Did we check the action *itself*, or only how sure the AI was?
3. Is `is_restricted` still being calculated? Is anyone reading it?
4. Look at the returned JSON — what do `is_allowed_automatic` and
   `is_restricted` actually say?
5. What rule is missing from the decision?

### Hint 1 — The symptom

A restricted action executed automatically. So either the restricted check
didn't run, or it ran and nobody listened to the answer.

Open the `Apply Guardrails` output and read `is_restricted`. What does it say —
and did that value change anything?

### Hint 2 — The data

`is_restricted` is `true`. It was calculated correctly. The restricted list is
fine, the `.includes()` works, the policy is intact.

So the bug is not in *detecting* the problem. It's somewhere between detection
and the decision.

### Hint 3 — The rule

Compare two things side by side:

```text
The policy says:   allowed AND high confidence AND NOT restricted
The code says:     high confidence
```

Two of the three conditions vanished. Which two, and what does each one protect
you from?

Ask yourself specifically: with only a confidence check, is there *any* value of
`confidence` that would have stopped this?

### Root cause and lesson

`canAutoExecute` was reduced to a single condition. `highConfidence` was `true`,
so the gate opened. The restricted check was still computed — visible in the
output as `is_restricted: true` — but nothing consumed it.

A calculated safety signal that nothing acts on is decoration.

Restore the correct rule:

```javascript
const canAutoExecute =
  isAllowedAutomatic &&
  highConfidence &&
  !isRestricted;
```

Rewire `Prepare Guardrail Input → Gemini Guardrail Decision → Apply Guardrails`
and re-run Scenario B. `pending_approval` should return.

**Make sure the correct rule is what you leave in place.** The weakened version
is a teaching exercise, not a save point.

The lesson, stated plainly:

> A workflow that runs perfectly can still do something it was never permitted
> to do. Correctness and compliance are different tests.

Lab 02 taught you that a green execution can be logically wrong. This is the
same idea with a bill attached.

---

# Challenge

Prove the full authorisation lifecycle works, end to end.

Use:

```text
challenge/challenge-input.json
```

### Requirements

- [ ] One safe action executes automatically, with no human involved
- [ ] One restricted action is stopped and becomes a pending row
- [ ] One allowed-but-low-confidence action also becomes pending
- [ ] One pending request is approved, and the action then executes
- [ ] One pending request is rejected, and no action executes
- [ ] Both human decisions are persisted with a `decided_at` timestamp
- [ ] A decided request cannot be decided a second time

### What you must prove

For each of the three incoming scenarios: record the `guardrail_reason` and
explain, in your own words, which of the three conditions failed.

For the two human decisions: show the Supabase row before and after, and confirm
`status`, `human_decision` and `decided_at` all changed together.

For the replay: show that re-sending a decision for an already-decided request
produces no second execution.

Check your results against:

```text
challenge/expected-result.json
```

Record your own predictions **first**. Opening the answers before you predict
turns a challenge into a reading exercise.

### Progressive Hints

**Hint 1**
Two of the three scenarios can go through the live Gemini path. The third
specifies a confidence value directly — which means Gemini is not the tool for
it. You built something in Scenario C for exactly this.

**Hint 2**
For the two pending requests, you need their database IDs before you can decide
them. Query `approval_requests` for `status = 'pending'` and work from what's
actually there.

**Hint 3**
Testing "cannot be decided twice" doesn't need a new mechanism. Send an approval,
then send the identical request again and compare the two responses. The second
one should find nothing.

**Hint 4**
If `Fetch Pending Approval` returns nothing on your *first* attempt, check the
type of `approval_id` you're sending, and confirm the row's `status` is still
exactly `pending` — a leftover row from an earlier test run may already be
closed.

---

# Make It Your Own

Look again at the responses from `Execute Approved Action` and
`Return Rejected Decision`. Both say:

```text
decision_source = ai_guardrail
```

For those two paths, that is simply not true. The AI recommended the action, but
a **human** authorised it. The field is recording the wrong actor.

**Your task:** make `decision_source` tell the truth.

- Automatic execution → `ai_guardrail`
- Approved by a person → `human_approval`
- Rejected by a person → `human_approval`

Small change. Now ask what it buys you:

- **Debugging** — "why did this account get cancelled?" is answered by one
  field, not an investigation
- **Audit trail** — you can produce every action a human authorised, separately
  from every action the machine took alone
- **Tuning** — if 90% of pending requests get approved anyway, your threshold is
  too strict and you're wasting people's time. If 90% get rejected, your prompt
  or your allowed-list needs work. You cannot see either pattern without this
  field.

> While you're in those nodes, check the field names carefully against what you
> expect. A stray space in a field name produces a field that exists but never
> matches — and it's invisible until something downstream quietly reads nothing.

*(Optional:* add the approver's identity as well. What would break if two people
decided the same request at nearly the same moment — and does your
`status = pending` filter already handle it?*)*

---

# What You Learned

**What we built:** an authorisation layer that sits between an AI's
recommendation and any real action, plus the human approval loop that handles
everything the machine isn't allowed to do alone.

**The business problem it solves:** routine work happens instantly, risky work
stops for a person, and every decision leaves a record. You get the speed of
automation without handing an AI your account-cancellation button.

**The technical lesson that mattered most:** confidence is a measure of
certainty, not a grant of authority. AI recommends; guardrails authorise; humans
own the risky calls. Keeping those three in separate nodes is what makes the
boundary real rather than aspirational.

**In a real production system**, you'd add notifications so approvers know work
is waiting, an expiry for requests nobody answers, permissions controlling who
may approve what, and full logging of every authorisation. The core pattern
wouldn't change:

```text
AI RECOMMENDS
↓
GUARDRAILS CHECK  (allowed? confident? restricted?)
↓
AUTO-EXECUTE  or  HUMAN DECIDES
↓
RECORD THE DECISION
```

You should now be able to explain why confidence is not permission, why
restricted actions need a second lock, why pending decisions must be persisted,
and why an already-decided request must never be decided again.

---

# What's Next — The Capstone

Look at what you can now do:

- **Lab 04** — validate and normalise an incoming request
- **Lab 07** — refuse to process the same event twice
- **Lab 06** — retry what's worth retrying, with backoff
- **Lab 08** — keep failed work recoverable instead of losing it
- **Lab 09** — force AI output into a shape automation can trust
- **Lab 10** — authorise what AI may do, and bring in a human when it may not

That is genuinely the toolkit of an automation engineer. Every one of those is a
real production concern, and you've built each one with your own hands.

But they're still ten separate workflows in ten separate folders. Real systems
don't get to be tidy like that. A single customer request has to be validated
*and* deduplicated *and* classified *and* authorised — and when the downstream
API is having a bad afternoon, retried, and if it stays down, recovered.

That's the **Capstone: the AI Service Request Agent** — one system where all of
this runs together, and where the interesting problems live in how the pieces
interact.

You have the parts. Next, we build the machine.
