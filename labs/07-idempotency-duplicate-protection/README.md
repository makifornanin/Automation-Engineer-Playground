# Lab 07 - Idempotency & Duplicate Protection

## The Hook

A CRM sends you a webhook: new lead created. Your workflow handles it perfectly.

Then the CRM's own retry logic fires, because it never saw your response in
time. The same event arrives again.

Your workflow handles it perfectly. Again. The customer now has two welcome
emails and two records with their name on them.

---

## The Business Problem

Every serious webhook provider retries. Stripe, Shopify, GitHub, your CRM — all
of them would rather deliver an event twice than risk delivering it zero times.
That is the correct decision on their side, and it becomes your problem.

The cost depends entirely on what your workflow does. Duplicate log line? Nobody
cares. Duplicate refund, duplicate order, duplicate invoice? Now you are on the
phone to a customer.

---

## What You'll Build

A workflow that recognises an event it has already handled and refuses to do the
work twice — backed by a database constraint, not just an IF node.

```text
Receive External Event → Extract Event Identity → Check Processed Event
        → Already Seen? → Return Duplicate Ignored
                ↓ (new)
        Reserve Event → Execute Business Action → Mark Processed
```

---

## What You Already Know

Lab 06 taught you to retry failures automatically. That was the right call — and
it quietly created today's problem.

Retrying is useful, right up until the same event performs the same business
action twice. A retry is just a duplicate you asked for on purpose.

This is also the first lab with a database, and that is not a coincidence. "Have
I seen this before?" is a question no workflow can answer from memory — the
answer has to outlive the execution that created it.

---

## What You Learn

In this lab, you will learn how to prevent duplicate events from causing duplicate business actions.

You will practice:

- Understanding idempotency
- Receiving external webhook events
- Extracting a stable event identity
- Checking whether an event was already processed
- Using Supabase for processed-event storage
- Using a unique event ID
- Reserving an event before running a business action
- Preventing duplicate actions
- Handling duplicate webhook deliveries
- Handling race conditions
- Using database uniqueness as a safety net
- Returning clean duplicate responses
- Creating fallback idempotency keys
- Breaking and debugging duplicate protection
- Verifying that duplicate events create only one business action

---

## Simple Explanation

Idempotency means:

> Even if the same request or event arrives multiple times, the actual business action should happen only once.

Example:

```text
Same webhook arrives twice
↓
First delivery → process
Second delivery → ignore
↓
Business action happens once
```

---

## Business Scenario

Imagine a CRM sends a webhook when a new lead is created.

Because of a timeout or retry, the same webhook may be delivered twice.

Without duplicate protection:

```text
Webhook #1
→ Create lead

Webhook #2
→ Create lead again

Result:
2 duplicate leads
```

With idempotency:

```text
Webhook #1
→ New event
→ Process

Webhook #2
→ Already seen
→ Ignore

Result:
1 lead only
```

This same problem can happen with:

- Payments
- Orders
- Emails
- Bookings
- CRM records
- Notifications
- Database updates
- API calls

---

## Main Learning Outcome

Understand how to stop duplicate events from causing duplicate actions.

---

# Automation Flow

```text
Receive External Event
↓
Extract Event Identity
↓
Check Processed Event
↓
Already Seen?
│
├── TRUE
│   ↓
│   Return Duplicate Ignored
│
└── FALSE
    ↓
    Reserve Event
    ↓
    Reservation Succeeded?
    │
    ├── FALSE
    │   ↓
    │   Return Duplicate Ignored
    │
    └── TRUE
        ↓
        Execute Business Action
        ↓
        Mark Processed
        ↓
        Return Processed Success
```

There are two duplicate-protection layers:

```text
Layer 1:
Lookup existing event

Layer 2:
Database unique constraint during reservation
```

The second layer protects against race conditions.

---

# Tools

- n8n
- Supabase
- Webhook node
- Code node
- IF nodes
- Supabase nodes
- Respond to Webhook nodes
- PostgreSQL unique constraints

---

# Prerequisites

Before starting this lab you need:

- [ ] n8n running
- [ ] A Supabase project and an n8n Supabase credential
- [ ] A way to send a webhook test request

Setup steps for all three are in [`docs/environment-setup.md`](../../docs/environment-setup.md).

This is the first lab that needs a database, so if you have not set up Supabase
yet, do that before continuing.

---

# Database Tables

## processed_events

This table stores event IDs that have already been reserved or processed.

```sql
create table if not exists processed_events (
  event_id text primary key,
  event_type text,
  status text not null default 'reserved',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
```

The most important field is:

```text
event_id
```

because it is the primary key.

That means the same event ID cannot be inserted twice.

---

## lab07_business_actions

This table represents the real business action.

```sql
create table if not exists lab07_business_actions (
  id bigint generated by default as identity primary key,
  event_id text not null,
  action_type text not null,
  lead_id text,
  created_at timestamptz not null default now()
);
```

This table intentionally does not have a unique constraint on `event_id`.

Why?

Because we want to prove that idempotency protection comes from the workflow and `processed_events`.

If protection is removed, duplicate actions can appear here.

---

# Guided Build

## Step 1 - Receive External Event

Create a Webhook node.

Rename it:

```text
Receive External Event
```

Configure:

```text
HTTP Method: POST
Path: aep-lab-07-event
Response: Using Respond to Webhook node
Authentication: None
```

Example payload:

```json
{
  "event_id": "evt_500",
  "event_type": "lead.created",
  "data": {
    "lead_id": "lead_101",
    "name": "Alex Rivera",
    "email": "alex@example.com"
  }
}
```

---

# Step 2 - Extract Event Identity

Add a Code node.

Rename it:

```text
Extract Event Identity
```

The goal is to create a stable identity for the event.

Final lab logic:

```javascript
const body = $json.body;

const eventId =
  body.event_id ??
  `${body.event_type}:${body.data?.lead_id}`;

return {
  json: {
    event_id: eventId,
    event_id_source: body.event_id ? 'provider' : 'generated',
    event_type: body.event_type,
    data: body.data
  }
};
```

If the provider gives:

```text
event_id = evt_500
```

then we use it.

If the provider does not provide an event ID, the lab creates a fallback key.

Example:

```text
lead.created:lead_203
```

---

# Why Event Identity Matters

Idempotency requires a stable key.

The system needs a way to answer:

```text
"Have I already processed this exact event?"
```

Without a stable identity, duplicate detection becomes unreliable.

---

# Step 3 - Check Processed Event

### Supabase — a new node

**What it does**
Reads and writes rows in your Supabase (PostgreSQL) database from inside a
workflow.

**Why we're using it here**
A workflow execution forgets everything the moment it ends. To answer "have I
already handled this event?", the answer has to be written somewhere that
outlives the run — and be visible to every future run.

**Think of it like**
The workflow's long-term memory. Everything else it knows disappears when the
execution finishes.

One detail that matters more than it looks: the database is *shared*. Two
executions running at the same second see the same table, which is exactly why
we can use it to stop them both doing the same work.

Add a Supabase node.

Rename it:

```text
Check Processed Event
```

Use:

```text
Table: processed_events
Operation: Get
```

Filter:

```text
event_id
=
{{ $json.event_id }}
```

Enable:

```text
Always Output Data
```

This allows the workflow to continue even when no row exists.

---

# Step 4 - Detect Whether the Event Already Exists

Add an IF node.

Rename it:

```text
Already Seen?
```

Use:

```text
{{ Object.keys($json).length > 0 }}
```

Operation:

```text
is true
```

Meaning:

```text
Supabase returned a real row
→ TRUE
→ duplicate
```

If Supabase returns:

```json
{}
```

then:

```text
FALSE
→ new event
```

---

# Step 5 - Return Duplicate Ignored

Connect the TRUE branch of `Already Seen?` to a Respond to Webhook node.

Rename it:

```text
Return Duplicate Ignored
```

Example response:

```json
{
  "success": true,
  "duplicate": true,
  "message": "Duplicate event ignored",
  "event_id": "evt_500"
}
```

A duplicate is not treated as a system failure.

The system intentionally ignores it.

---

# Step 6 - Reserve the Event

Connect the FALSE branch to a Supabase Create Row node.

Rename it:

```text
Reserve Event
```

Insert into:

```text
processed_events
```

Values:

```text
event_id
{{ $('Extract Event Identity').item.json.event_id }}
```

```text
event_type
{{ $('Extract Event Identity').item.json.event_type }}
```

```text
status
reserved
```

---

# Why Reserve Before the Business Action?

This is critical.

Bad order:

```text
Execute Business Action
↓
Save event ID
```

If two duplicate requests arrive at almost the same time, both may execute the business action before either one saves the event ID.

Better order:

```text
Reserve Event
↓
Execute Business Action
```

The reservation becomes the gatekeeper.

Only the request that successfully reserves the event should continue.

---

# Step 7 - Handle Reservation Collisions

Configure `Reserve Event` so the workflow can continue when the database returns an error.

This allows us to detect duplicate-key collisions instead of crashing the entire workflow.

A collision may return:

```json
{
  "error": "duplicate key value violates unique constraint \"processed_events_pkey\""
}
```

---

# Step 8 - Check Reservation Success

Add an IF node.

Rename it:

```text
Reservation Succeeded?
```

Use:

```text
{{ !$json.error }}
```

Operation:

```text
is true
```

Logic:

```text
No error
→ TRUE
→ reservation succeeded
→ execute business action
```

```text
Error exists
→ FALSE
→ reservation failed
→ duplicate ignored
```

---

# Step 9 - Execute Business Action

Connect the TRUE branch to a Supabase Create Row node.

Rename it:

```text
Execute Business Action
```

Insert into:

```text
lab07_business_actions
```

Values:

```text
event_id
{{ $('Extract Event Identity').item.json.event_id }}
```

```text
action_type
create_lead
```

```text
lead_id
{{ $('Extract Event Identity').item.json.data.lead_id }}
```

This table represents the real-world side effect.

In a real system, this could instead be:

```text
Create CRM record
Send email
Charge card
Create booking
Send notification
Update external API
```

---

# Step 10 - Mark the Event as Processed

After the business action succeeds, update the original row.

Rename the node:

```text
Mark Processed
```

Update:

```text
processed_events
```

Filter:

```text
event_id
=
{{ $('Extract Event Identity').item.json.event_id }}
```

Set:

```text
status = processed
```

and:

```text
processed_at = current timestamp
```

The lifecycle becomes:

```text
reserved
↓
business action
↓
processed
```

---

# Step 11 - Return Processed Success

Add a Respond to Webhook node.

Rename it:

```text
Return Processed Success
```

Example:

```json
{
  "success": true,
  "duplicate": false,
  "message": "Event processed successfully",
  "event_id": "evt_504",
  "status": "processed"
}
```

---

# First Delivery Test

> **How to send these requests:** POST the JSON to your webhook URL with
> `Content-Type: application/json`. See
> [`docs/environment-setup.md`](../../docs/environment-setup.md) for curl and
> Postman examples. In the future AEP Website this will be handled by **Send Test**.

Send:

```json
{
  "event_id": "evt_504",
  "event_type": "lead.created",
  "data": {
    "lead_id": "lead_104",
    "name": "New Event",
    "email": "new@example.com"
  }
}
```

Expected:

```text
Check Processed Event
→ not found

Already Seen?
→ FALSE

Reserve Event
→ success

Execute Business Action
→ runs

Mark Processed
→ processed

Return Processed Success
```

---

# Duplicate Delivery Test

Send the exact same payload again.

Expected:

```text
Check Processed Event
→ evt_504 found

Already Seen?
→ TRUE

Return Duplicate Ignored
```

These should not execute:

```text
Reserve Event
Execute Business Action
Mark Processed
```

---

# Verify Business Action Count

Run:

```sql
select count(*) as action_count
from lab07_business_actions
where event_id = 'evt_504';
```

Even after sending the webhook twice:

```text
action_count = 1
```

This proves:

```text
2 deliveries
→ 1 business action
```

---

# Break It

Temporarily bypass duplicate protection.

Connect:

```text
Extract Event Identity
↓
Execute Business Action
```

Use:

```json
{
  "event_id": "evt_break_001",
  "event_type": "lead.created",
  "data": {
    "lead_id": "lead_break_001",
    "name": "Break Test",
    "email": "break@example.com"
  }
}
```

Send it twice.

Then run:

```sql
select count(*) as action_count
from lab07_business_actions
where event_id = 'evt_break_001';
```

Expected:

```text
action_count = 2
```

---

## Break It Lesson

Without idempotency protection:

```text
duplicate delivery
→ duplicate business action
```

This can cause real business problems such as:

- Double charges
- Duplicate emails
- Duplicate CRM contacts
- Duplicate bookings
- Duplicate orders
- Duplicate notifications

---

# Debug It - Empty Supabase Result

When `Check Processed Event` finds nothing, n8n may output:

```json
{}
```

Trying to check:

```text
$json.event_id
```

may result in:

```text
undefined
```

Instead, the lab checks:

```javascript
Object.keys($json).length > 0
```

This safely determines whether Supabase returned a real row.

---

# Debug It - Lost Event Data

Because an empty Supabase result becomes:

```json
{}
```

the original event data is no longer available in the current item.

The workflow solves this by referencing:

```text
Extract Event Identity
```

directly.

Example:

```text
{{ $('Extract Event Identity').item.json.event_id }}
```

This allows later nodes to retrieve the original event identity.

---

# Race Conditions

A normal duplicate lookup is useful, but it is not enough by itself.

Imagine two identical events arrive at almost the same time.

```text
Request A
→ checks database
→ not found

Request B
→ checks database
→ not found
```

Both think they are the first request.

This is called a:

```text
race condition
```

---

# Database Protection Against Race Conditions

The `processed_events` table uses:

```text
event_id text primary key
```

That means only one identical event ID can be inserted.

If two requests both reach `Reserve Event`:

```text
Request A
→ insert evt_race_test
→ success

Request B
→ insert evt_race_test
→ duplicate-key error
```

The database becomes the final safety layer.

---

# Reservation Collision Test

Example duplicate-key response:

```json
{
  "error": "duplicate key value violates unique constraint \"processed_events_pkey\""
}
```

The workflow checks:

```text
Reservation Succeeded?
```

If FALSE:

```text
Return Duplicate Ignored
```

The business action does not execute.

---

# Why the Lookup Still Matters

You may ask:

> If the unique database constraint already protects us, why check first?

Because the lookup provides clean, expected duplicate handling.

Normal duplicate:

```text
lookup
→ already exists
→ clean response
```

Race-condition duplicate:

```text
lookup missed collision
→ reservation fails
→ database safety net
→ clean response
```

Both layers work together.

---

# Challenge

The challenge sends three webhook deliveries.

```text
Delivery 1
→ evt_challenge_001

Delivery 2
→ evt_challenge_001 again

Delivery 3
→ evt_challenge_002
```

Payloads are stored in:

```text
challenge/challenge-input.json
```

---

# Challenge Prediction

Before running, predict:

```text
evt_challenge_001 first delivery
→ processed

evt_challenge_001 second delivery
→ duplicate ignored

evt_challenge_002
→ processed
```

---

# Progressive Hints

Use these only if a delivery behaves differently than you predicted.

### Hint 1 — The symptom

Count the rows in `lab07_business_actions` for `evt_challenge_001`.

Three deliveries went out, but only two events were unique. If you see two
business actions for `evt_challenge_001` instead of one, the duplicate was not
recognised as a duplicate.

### Hint 2 — The evidence

Look at `processed_events` after delivery 1:

```sql
select event_id, status, created_at, processed_at
from processed_events
order by created_at desc;
```

Was a row written at all? If not, nothing exists for delivery 2 to find, and
every delivery will look brand new.

### Hint 3 — The concept

Idempotency depends on a *stable identity*. The same event must produce the same
key every time it arrives.

Open `Extract Event Identity` on both deliveries of `evt_challenge_001` and
compare the value it produces. If those two values differ, the workflow is
technically correct and still broken — it is comparing two different keys.

### Hint 4 — Where to look

Open the `Check Processed Event` node on the **second** delivery and read its
output, not its input.

An empty result means the lookup found nothing, and `Already Seen?` will send the
event down the "new" path. From there, work backwards: wrong key, wrong filter,
or no row written the first time.

---

# Challenge Verification

Run:

```sql
select event_id, count(*) as action_count
from lab07_business_actions
where event_id in (
  'evt_challenge_001',
  'evt_challenge_002'
)
group by event_id
order by event_id;
```

Expected:

```text
evt_challenge_001 → 1
evt_challenge_002 → 1
```

Therefore:

```text
3 webhook deliveries
→ 2 unique events
→ 2 business actions
```

---

# Make It Your Own

What if the provider does not give you an `event_id`?

Example:

```json
{
  "event_type": "lead.created",
  "data": {
    "lead_id": "lead_203",
    "name": "No Event ID",
    "email": "noevent@example.com"
  }
}
```

The lab generates a fallback key:

```text
lead.created:lead_203
```

Using:

```javascript
const eventId =
  body.event_id ??
  `${body.event_type}:${body.data?.lead_id}`;
```

---

# Provider ID vs Generated ID

The workflow records:

```text
event_id_source
```

Possible values:

```text
provider
generated
```

Example:

```text
event_id = evt_504
event_id_source = provider
```

or:

```text
event_id = lead.created:lead_203
event_id_source = generated
```

---

# Important Fallback-Key Warning

A generated key is only safe if the fields used truly represent one unique business event.

For example:

```text
lead.created + lead_id
```

may work if one lead can only be created once.

But if the same lead can legitimately trigger the same event multiple times, that key may incorrectly block valid actions.

Provider-supplied event IDs are preferred whenever available.

---

# Sample Data

## New Event

```text
sample-data/new-event.json
```

This represents the first delivery of an event.

---

## Duplicate Event

```text
sample-data/duplicate-event.json
```

This contains the same event ID as the new-event sample.

It should be ignored after the first event is processed.

---

## No Provider Event ID

```text
sample-data/no-provider-event-id.json
```

This demonstrates fallback idempotency-key generation.

---

## Race Condition Event

```text
sample-data/race-condition-event.json
```

This is used to simulate a reservation collision.

---

# Real-World Applications

Idempotency is commonly used for:

- Payment webhooks
- Stripe events
- Order processing
- Booking systems
- CRM integrations
- Email automations
- Form submissions
- Queue consumers
- API retries
- Background jobs
- External webhook deliveries
- AI workflow actions

---

# Important Engineering Principles

## Idempotency Protects Side Effects

The main goal is not merely avoiding duplicate database rows.

The real goal is:

```text
prevent duplicate business actions
```

---

## Use a Stable Identity Key

The system must know whether two requests represent the same event.

---

## Reserve Before Acting

Safer:

```text
reserve
→ act
```

Riskier:

```text
act
→ reserve
```

---

## Database Constraints Matter

Application logic alone is not enough for concurrent requests.

A database uniqueness constraint provides stronger protection.

---

## Duplicates Can Be Successful Requests

A duplicate webhook is not necessarily an error.

The system can return:

```text
success = true
duplicate = true
```

because the desired business outcome has already happened.

---

# Future AEP Website Experience

The future AEP website can support this lab with:

- Webhook payload testing
- First-delivery simulation
- Duplicate-delivery simulation
- Event identity visualization
- `processed_events` state display
- Business-action counters
- Duplicate response feedback
- Race-condition explanation
- Break It exercises
- Debugging hints
- Challenge verification
- Generated idempotency-key exercises

The learner should still build and run the real workflow inside their own n8n environment.

---

# Why the Learner Still Uses n8n

The AEP website is the learning interface.

n8n remains the automation-building environment.

The learner should experience:

```text
Understand
↓
Build
↓
Send event
↓
Observe
↓
Send duplicate
↓
Verify
↓
Break
↓
Debug
↓
Improve
```

---

# What You Learned

After completing this lab, you should understand:

- What idempotency means
- What problem idempotency solves
- Why webhook events may arrive more than once
- Why duplicate requests can cause duplicate side effects
- How to use an event ID
- How to store processed events
- How to check whether an event already exists
- Why reservations should happen before business actions
- How to prevent duplicate actions
- How database primary keys provide duplicate protection
- What race conditions are
- Why lookup checks alone are not enough
- How unique constraints protect concurrent processing
- How to gracefully handle duplicate-key collisions
- How to generate fallback idempotency keys
- Why generated keys require careful design
- How to verify idempotency using business-action counts

---

# Completion Checklist

You have completed Lab 07 when you can:

- Receive a webhook event
- Extract an event identity
- Use a provider event ID
- Generate a fallback event ID
- Check processed-event storage
- Detect first delivery
- Detect duplicate delivery
- Reserve a new event
- Prevent duplicate reservations
- Execute the business action once
- Mark the event as processed
- Return a clean success response
- Return a clean duplicate response
- Explain the difference between lookup protection and database protection
- Explain what a race condition is
- Handle reservation collisions
- Complete Break It
- Debug empty lookup output
- Complete the Challenge
- Complete Make It Your Own

---

# Lab Files

```text
07-idempotency-duplicate-protection/
│
├── README.md
│
├── challenge/
│   ├── challenge-input.json
│   └── expected-result.json
│
├── sample-data/
│   ├── duplicate-event.json
│   ├── new-event.json
│   ├── no-provider-event-id.json
│   └── race-condition-event.json
│
└── workflow/
    └── lab-07-idempotency-duplicate-protection.json
```

---

# Final Takeaway

Idempotency protects systems from doing the same real-world action more than once.

A strong design combines:

```text
stable event identity
+
processed-event storage
+
duplicate lookup
+
reservation before action
+
database uniqueness
+
graceful duplicate handling
```

The goal is simple:

```text
same event many times
→ business action once
```


---

# What's Next

The same event can arrive ten times and your business action runs exactly once.
Duplicates are handled, and the database enforces it rather than trusting your
logic.

But look at what happens when an event is genuinely new and genuinely fails —
permanently. Retries run out. The workflow stops. The event was real, the
customer is waiting, and there is now no record that it ever existed.

You have controlled duplicates. You have not yet controlled loss.

**Lab 08 — Dead Letter Queue & Failure Recovery** makes sure failed work
survives.
