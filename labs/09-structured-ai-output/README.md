# Lab 09 — Structured AI Output

- **Difficulty:** Advanced
- **Main Concept:** Making AI output safe enough for automation to act on
- **Estimated Time:** 60–75 minutes

---

## The Hook

Your AI classifier just told you this customer belongs in Sales.

Excellent. Ship it.

One small problem: the answer came back as *text that looks like JSON*. Your
Switch node reads `classification`, finds nothing there, and quietly routes a
paying customer into the void.

Nobody gets an error. Nobody gets called back either.

Today we fix that.

---

## The Business Problem

A company gets customer messages all day:

```text
"I want to know your pricing."
"I can't log into my account."
"I was charged twice."
```

Right now a human reads each one and forwards it to the right team. That works
until volume grows, and then it becomes a queue with a person stapled to it.

AI can read intent far faster than a person can. But automation cannot route
work based on a vibe. It needs a value it can compare, in a field it can find.

So the real problem in this lab is not *"can AI classify?"*

It's **"can automation trust the shape of what AI gives back?"**

---

## What You'll Build

A workflow that takes a customer message, asks Gemini to classify it, and then
refuses to act until the answer passes inspection.

```text
Receive Customer Inquiry
↓
Prepare AI Input
↓
Gemini Classifier ── Google Gemini Chat Model
        └────────── Structured Output Parser
↓
Validate AI Output
↓
AI Output Valid?
│
├── TRUE  → Route by Classification
│             ├── sales   → Sales Route
│             ├── support → Support Route
│             ├── billing → Billing Route
│             └── other   → Manual Review Route
│
└── FALSE → Build Safe Fallback
                        ↓
              Return Classification Result
```

By the end you'll understand raw AI output, structured output, schemas,
validation, safe fallbacks, and why routing happens *last*.

---

## What You Already Know

You are not starting from zero here. Three earlier labs already did the heavy
lifting:

- **Lab 01** — you reshaped messy data into the exact fields another system
  expects. That's what `Prepare AI Input` does.
- **Lab 02** — you routed records down different paths based on their values.
  That's `Route by Classification`.
- **Lab 04** — you refused to trust incoming data until it was validated.

Lab 04 is the one that matters most today. Back then the untrusted input came
from a web form. This time it comes from an AI model.

Same rule, new source:

> Never trust input. Validate, then act.

You already know how to route clean data. Now we add the unpredictable teammate.

---

## Prerequisites

Before starting this lab you need:

- [ ] n8n running
- [ ] A Google Gemini API key configured as an n8n credential
- [ ] A way to send a webhook test request

Setup steps are in [`docs/environment-setup.md`](../../docs/environment-setup.md).

This is the first lab that calls an AI model, so the Gemini credential has to be
in place before the workflow will run. Supabase is not needed here.

> **Sending requests:** POST the JSON to your webhook URL with
> `Content-Type: application/json`. The setup guide has curl and Postman
> examples. In the future AEP Website this becomes a **Send Test** button.

---

## Meet the New Nodes

Three of today's nodes are new. Two are old friends.

### Google Gemini Chat Model

**What it does**
Holds the connection to Gemini — which model, which credential. Nothing else.

**Why we're using it here**
It's the engine, not the driver. It doesn't know what a customer inquiry is or
what we want done with one. It just knows how to talk to Gemini.

**Think of it like**
The power socket. Useful, but it doesn't decide what you plug into it.

### Gemini Classifier (Basic LLM Chain)

**What it does**
Holds the prompt and runs the actual request through whatever model is attached
to it.

**Why we're using it here**
This is where the *decision-making* lives. Keeping the prompt separate from the
model connection means you can swap models later without rewriting your logic —
or rewrite your logic without touching credentials.

**Think of it like**
The driver. The socket supplies power; this decides where you're going.

### Structured Output Parser

**What it does**
Attaches a required shape to the model's answer, and hands back a real object
instead of a blob of text.

**Why we're using it here**
This is the node that solves our actual business problem. Without it, "sales"
might arrive as a sentence, wrapped in markdown, or as a string that merely
resembles JSON.

**Think of it like**
Handing someone a form with labelled boxes instead of a blank sheet of paper.
Same questions either way — but only one of them gives you answers you can file.

### Code — Validate AI Output

**What it does**
Plain JavaScript that inspects the parsed answer and stamps it `valid: true` or
`valid: false`.

**Why we're using it here**
The parser checks *shape*. This checks *business rules*. They are not the same
job, and we want both.

### IF — AI Output Valid?

**What it does**
The safety gate. Valid output goes forward; anything else goes to the fallback.

### Returning friends

**Webhook** — still the front door. **Edit Fields (Set)** — still shaping data.
**Switch** — Lab 02's routing, just with more exits. No re-introduction needed.

---

# Guided Build

Create a new workflow. Name it:

```text
AEP Lab 09 - Structured AI Output
```

## Step 1 — Receive the Inquiry

Add a **Webhook** node. Rename it `Receive Customer Inquiry`.

- **HTTP Method:** POST
- **Path:** `aep-lab-09-ai-classification`
- **Respond:** Using 'Respond to Webhook' Node

That last setting matters. It means *we* decide what goes back to the caller,
after our logic has run. Not before.

A request will look like this:

```json
{
  "request_id": "req_ai_001",
  "message": "Hi, I'm interested in your service and would like to know your pricing."
}
```

## Step 2 — Prepare Only What the AI Needs

Add an **Edit Fields (Set)** node. Rename it `Prepare AI Input`.

Add four fields:

| Field | Value |
|---|---|
| `request_id` | `{{ $json.body.request_id }}` |
| `message` | `{{ $json.body.message }}` |
| `allowed_classifications` | `sales,support,billing,other` |
| `allowed_actions` | `send_to_sales,create_support_ticket,send_to_billing,manual_review` |

Two things are happening here, and only one of them is obvious.

The obvious one: we're pulling the message out of the webhook body.

The less obvious one: **we are deciding what the AI is allowed to choose from.**
Those two lists are not decoration. They get injected into the prompt, and they
are the first place we constrain the model's imagination.

Notice what we did *not* forward: headers, IP address, whatever else the caller
sent. The AI gets the message and nothing more. Smaller input, fewer surprises,
lower cost.

## Step 3 — Ask Gemini to Classify

Add a **Basic LLM Chain** node. Rename it `Gemini Classifier`.

Set **Source for Prompt** to `Define below`, and use this prompt:

```text
You are a business inquiry classifier.

Classify this customer message:

{{ $json.message }}

Allowed classifications:
{{ $json.allowed_classifications }}

Allowed recommended actions:
{{ $json.allowed_actions }}

Return ONLY a JSON object with exactly these fields:

{
  "classification": "sales | support | billing | other",
  "confidence": 0.00,
  "recommended_action": "send_to_sales | create_support_ticket | send_to_billing | manual_review"
}

Rules:
- confidence must be a number from 0 to 1
- choose only from the allowed classifications
- choose only from the allowed actions
- do not add explanations
- do not add markdown
```

Now attach the model. Add a **Google Gemini Chat Model** node and connect it to
the Classifier's model input. Select your Gemini credential and pick a model —
`models/gemini-3.1-flash-lite` is fast and more than capable of this.

Connect `Prepare AI Input` → `Gemini Classifier`.

## Step 4 — Run It Before You Trust It

Stop building. We're going to look at what Gemini actually hands back.

Execute the workflow and send the sales inquiry:

```text
sample-data/sales-inquiry.json
```

Open the `Gemini Classifier` node output.

**Before you look — a question.** The prompt said "return ONLY a JSON object."
Gemini almost certainly complied. So: what *type* is that `output` value going
to be? An object you can read fields from? Or something else?

Commit to an answer, then look.

## Step 5 — The Discovery

Here's roughly what comes back:

```json
{
  "text": "{ \"classification\": \"sales\", \"confidence\": 1, \"recommended_action\": \"send_to_sales\" }"
}
```

Look closely at that value. See the `\"` escapes? Those exist because the whole
thing is **one long string**. Gemini did exactly what we asked — it returned
JSON — but it returned it *as text*, because text is the only thing a language
model produces.

Which means this expression returns nothing:

```text
$json.classification
```

There is no `classification` field. There's a `text` field that happens to
contain those characters.

This is the single most important idea in the lab:

```text
JSON-looking text   ≠   structured JSON object
```

It's also a nasty bug to catch in production, because nothing *errors*. The
Switch node just finds `undefined`, matches no route, and the customer's message
evaporates. A green execution and a lost customer.

Could you parse that string yourself in a Code node? Sure. And then handle the
run where Gemini wraps it in a markdown fence, or adds a friendly sentence
first. That's a game you lose slowly.

Let's not play it.

## Step 6 — Add the Structured Output Parser

In the `Gemini Classifier` node, turn on **Require Specific Output Format**.

Add a **Structured Output Parser** node and connect it to the Classifier's
output parser input.

Set **Schema Type** to `Define below` and paste this schema:

```json
{
  "type": "object",
  "properties": {
    "classification": {
      "type": "string",
      "enum": ["sales", "support", "billing", "other"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "recommended_action": {
      "type": "string",
      "enum": [
        "send_to_sales",
        "create_support_ticket",
        "send_to_billing",
        "manual_review"
      ]
    }
  },
  "required": [
    "classification",
    "confidence",
    "recommended_action"
  ],
  "additionalProperties": false
}
```

Read the schema as a set of promises about the answer:

- `enum` — you may pick from this list and no other
- `minimum` / `maximum` — confidence lives between 0 and 1
- `required` — all three fields must be present
- `additionalProperties: false` — no bonus fields you invented

Run the same request again and look at the Classifier output now:

```json
{
  "output": {
    "classification": "sales",
    "confidence": 1,
    "recommended_action": "send_to_sales"
  }
}
```

No escapes. No `text` wrapper. `output.classification` is a real value you can
route on.

That's the whole lesson in one before-and-after.

## Step 7 — Validate Anyway

Add a **Code** node. Rename it `Validate AI Output`.

```javascript
const output = $json.output;

const validClassifications = ['sales', 'support', 'billing', 'other'];
const validActions = [
  'send_to_sales',
  'create_support_ticket',
  'send_to_billing',
  'manual_review'
];

const isValid =
  output &&
  validClassifications.includes(output.classification) &&
  typeof output.confidence === 'number' &&
  output.confidence >= 0 &&
  output.confidence <= 1 &&
  validActions.includes(output.recommended_action);

return {
  json: {
    ...output,
    valid: isValid
  }
};
```

Fair question at this point: *the parser already enforced all of that. Why check
it twice?*

Because they're different guarantees.

```text
Structured Parser  →  "Is this the right shape?"
Validator          →  "Is this acceptable to my business?"
```

The parser is part of the AI call. If a model update changes its behaviour, if
the parser is misconfigured, if someone edits the schema, or if this node ever
receives data from somewhere other than Gemini — the parser's promise is gone.
The validator is *yours*, it runs in your workflow, and it doesn't care where
the data came from.

Cheap insurance on the boundary between a probabilistic system and a
deterministic one. Take it.

Notice the shape it returns: the original fields spread out, plus a `valid` flag.
Everything downstream reads flat fields, and the gate reads one boolean.

## Step 8 — The Safety Gate

Add an **IF** node. Rename it `AI Output Valid?`.

Condition: `{{ $json.valid }}` **is true** (Boolean).

One condition, one job. TRUE means we route. FALSE means we don't.

## Step 9 — Route the Valid Decisions

Add a **Switch** node from the TRUE output. Rename it `Route by Classification`.

Add four rules on `{{ $json.classification }}`, and rename each output:

| Value equals | Output name |
|---|---|
| `sales` | Sales route |
| `support` | Support route |
| `billing` | Billing route |
| `other` | Manual review |

This is Lab 02's routing with a new source of truth. The important detail is
*where* it sits: **after** the gate. The Switch never sees output that failed
validation.

Now add an **Edit Fields (Set)** node on each output — `Sales Route`,
`Support Route`, `Billing Route`, `Manual Review Route`. Each carries the
decision forward and stamps its destination:

| Field | Value |
|---|---|
| `success` | `true` (Boolean) |
| `classification` | `{{ $json.classification }}` |
| `confidence` | `{{ $json.confidence }}` (Number) |
| `recommended_action` | `{{ $json.recommended_action }}` |
| `route` | `sales_team` / `support_team` / `billing_team` / `manual_review` |

Only the `route` value differs between the four.

On `Sales Route` only, add one extra field for now:

| Field | Value |
|---|---|
| `decision_source` | `ai_classification` |

We'll come back to that one at the end. Leave the other three routes without it.

## Step 10 — Build the Safe Fallback

From the **FALSE** output of `AI Output Valid?`, add an **Edit Fields (Set)**
node. Rename it `Build Safe Fallback`.

| Field | Value |
|---|---|
| `success` | `false` (Boolean) |
| `classification` | `other` |
| `confidence` | `0` (Number) |
| `recommended_action` | `manual_review` |
| `route` | `manual_review` |
| `reason` | `invalid_ai_output` |

Every value here is a deliberate choice.

We do not guess a classification. We do not keep the AI's confidence score — the
output was rejected, so its self-assessment is worthless. We send it to a human,
and we record *why* in `reason`.

The design rule underneath:

```text
Bad AI output → a human looks at it
Bad AI output → NOT an automatic action
```

A workflow that fails toward "do something" is a workflow that eventually does
something expensive.

## Step 11 — Respond

Add a **Respond to Webhook** node. Rename it `Return Classification Result`.
Set the response code to `200`.

Connect all four routes *and* the fallback into it. Every path ends here — one
exit for the whole workflow.

---

# Predict & Test

Send the sales inquiry:

```text
sample-data/sales-inquiry.json
```

**Predict first.** Which classification, which route, and will `success` be true
or false?

Then run it. You should get something like:

```json
{
  "success": true,
  "classification": "sales",
  "confidence": 1,
  "recommended_action": "send_to_sales",
  "route": "sales_team",
  "decision_source": "ai_classification"
}
```

Now trace what that actually proves — in order:

1. Gemini responded
2. The parser produced a real object, not a string
3. Every value survived the schema's `enum` and range limits
4. Your validator independently agreed
5. **Only then** did routing happen

Step 5 is the one worth remembering. Routing is the *last* thing that happens,
not the first.

Try `support-inquiry.json` and `billing-inquiry.json` too. Confidence will
wobble between runs — that's a language model being a language model. The
classification and route should not.

---

# Break It

Time to find out what your fallback is actually worth.

We're going to feed the workflow output that violates the contract. Note what
we're testing here: **not Gemini — our own workflow.** Real invalid output is
rare and random, which makes it useless for a test. So we'll fake it, on
purpose, and get the same result every single time.

Add a **Code** node, unconnected for now. Rename it
`Simulate Invalid AI Output`.

Before you write it: the validator checks four things. Try to break **all** of
them at once. What would you put in `classification`? In `confidence`? In
`recommended_action`?

Write your version first, then compare with this one:

```javascript
return [
  {
    json: {
      output: {
        classification: "marketing",
        confidence: 1.4,
        recommended_action: "auto_delete"
      }
    }
  }
];
```

Three violations, one payload:

```text
"marketing"    → not in the allowed classifications
1.4            → outside the 0–1 range
"auto_delete"  → an action we never authorised
```

That third one is the nightmare scenario in miniature. An AI inventing an action
name that your automation might happily execute.

Now connect `Simulate Invalid AI Output` → `Validate AI Output`, and run *from
the simulator node*.

**Predict:** which branch fires, and what does the caller receive?

---

# Debug It

Say you ran that and the workflow returned a `sales_team` route anyway. Bad
output sailed through. Work out why before reading on.

**Investigate in order:**

1. Did Gemini fail? (Trick question — did Gemini even run this time?)
2. Did the parser reject anything?
3. What exactly does `Validate AI Output` receive? Open the node and read its
   input, not its output.
4. What is `valid` set to?
5. Which branch of `AI Output Valid?` actually fired?

Answer those five and you'll have it. Hints below if you want them.

### Hint 1 — The symptom

A workflow that should have blocked something didn't block it. So either the
check never ran, or it ran and said yes.

Which of those two is it? The `valid` field tells you immediately.

### Hint 2 — The data shape

The validator's very first line is `const output = $json.output;`.

It expects the incoming item to have an `output` property, with the three fields
nested *inside* it.

Open the input panel on `Validate AI Output`. Is that what you see — or are the
fields sitting at the top level, with no `output` wrapper?

If `output` is undefined, `output && ...` short-circuits and `isValid` becomes
falsy. But if something reshapes the data on the way in, the checks can end up
inspecting fields that aren't the ones you think they are.

### Hint 3 — The rules

Take the validator's four checks and run them by hand against your simulated
payload:

- is `classification` in the allowed list?
- is `confidence` a number?
- is it `>= 0` and `<= 1`?
- is `recommended_action` in the allowed list?

Every one should fail. If `valid` still came out `true`, one of the arrays in
your Code node doesn't match the one in the schema. Compare them character by
character — a stray entry in `validActions` is enough.

### Root cause and lesson

The usual culprit is a shape mismatch: the simulator has to produce the same
structure the parser produces, `{ output: { ... } }`, because that's what the
validator reads. Flatten it and the validator inspects `undefined`.

The wider lesson is the one from Lab 02, wearing a different hat:

> A workflow can execute perfectly and still be wrong.

Nothing here throws an error. The only way to know your safety check works is to
attack it deliberately.

**When you're done, disconnect the simulator** so the normal Gemini path runs
again. Leave the node on the canvas — it's a testing tool worth keeping.

---

# Challenge

Prove the workflow handles all four classifications, and fails safely.

Use:

```text
challenge/challenge-input.json
```

Three real inquiries in there. Plus one more case you'll construct yourself.

### Requirements

- [ ] Send all three challenge inquiries through the live workflow
- [ ] For each, record the classification, the route taken, and the confidence
- [ ] Produce a fourth request that should land on `manual_review` via the
      `other` classification — write the message yourself
- [ ] Trigger the invalid-output path once and capture the fallback response
- [ ] Confirm the fallback's `reason` explains what happened
- [ ] Confirm no invalid output ever reached `Route by Classification`

### What you must prove

For each of the four classifications: the right route fired, and it fired
*after* validation — not instead of it.

For the invalid case: `success` is `false`, the route is `manual_review`, and
nothing was executed automatically.

Check your results against:

```text
challenge/expected-result.json
```

Open that file **after** you've recorded your own answers. Predicting first is
the part that teaches.

### Progressive Hints

**Hint 1**
Two of the three challenge messages are easy to place. The third mentions money.
Ask yourself whether that makes it billing, or something else — and what the
customer actually wants done.

**Hint 2**
For your `other` request: what kind of message genuinely fits none of sales,
support, or billing? Look at `sample-data/other-inquiry.json` for the flavour,
then write a different one.

**Hint 3**
To trigger the fallback deterministically, reconnect the simulator you built in
Break It. You don't need Gemini to misbehave on command.

**Hint 4**
If a route fires but `confidence` arrives empty in the response, check the field
**type** on that route's Set node. `confidence` is a Number, not a String —
n8n will not quietly convert it for you.

---

# Make It Your Own

Back in Step 9 you added `decision_source` to `Sales Route` only. Time to
finish the job.

**Your task:** add `decision_source` to `Support Route`, `Billing Route`, and
`Manual Review Route` as well, so every response says where its decision came
from.

Then think about the fallback. `Build Safe Fallback` has a `reason` field but no
`decision_source`. Should it have one? If so, what value — it definitively did
*not* come from an AI classification.

Why bother with any of this? Because six months from now someone will open a
support ticket asking why a customer ended up in Billing. Provenance turns that
from an archaeology project into a single field lookup:

- **Debugging** — was this a model decision or a fallback?
- **Auditing** — which automated decisions were made, and on what basis?
- **Trust** — you can measure how often the fallback fires. A rising number is
  an early warning that something upstream is degrading.

Small field. Large payoff. Production systems are full of these.

*(Optional, if you want to push further:* add a `classified_at` timestamp using
`{{ $now }}`, and see whether it's still useful once you imagine a thousand of
these rows.*)*

---

# What You Learned

**What we built:** a classifier that reads customer messages and routes them to
the right team, without ever acting on an answer it hasn't checked.

**The business problem it solves:** inbound messages get to the right team in
seconds instead of sitting in a shared inbox — and the failure mode is a human
review, not a wrong action.

**The technical lesson that mattered most:** an AI response that *looks* like
JSON can still be a string. Structured output makes the shape reliable;
validation makes it acceptable. You need both, and you route only after both.

**In a real production system**, you'd also log every classification with its
confidence, alert when fallback rates climb, and review the `manual_review` pile
weekly to find gaps in your categories. The pattern would stay exactly the same:

```text
INPUT → AI → STRUCTURE → VALIDATE → ROUTE
```

Never this:

```text
AI said something → do it
```

You should now be able to explain the difference between a JSON-looking string
and a structured object, why a schema constrains an AI model, why validation
still matters after parsing, and why a safe fallback beats a confident guess.

---

# What's Next

We can now make AI output *predictable*.

But predictable is not the same as *permitted*.

Consider: your classifier returns `cancel_account` with a confidence of 1.00.
The shape is perfect. The schema is satisfied. Your validator is delighted.

Should the workflow cancel that account?

Obviously not — and notice that nothing you built today would stop it. Lab 09
asks *"is this answer well-formed?"*. It never asks *"is this action allowed?"*

**Lab 10 — AI Guardrails & Human-in-the-Loop** draws that second line: which
actions AI may take on its own, which ones require a human, and why a confidence
score is not a permission slip.
