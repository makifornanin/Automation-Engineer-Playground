# Lab 08 - Dead Letter Queue & Failure Recovery

## The Hook

Three retries. Three failures. The downstream service is not coming back this
afternoon.

Your workflow does the only thing it knows how to do: it stops.

And the customer's order — the actual thing this automation existed to handle —
is now gone. Not delayed. Gone.

---

## The Business Problem

Retries handle failures that end. Some don't. A service is down for hours, a
credential expired overnight, a downstream system is mid-migration.

When retries run out, the work has to go *somewhere*. If it doesn't, you lose
real business events and only find out when a customer asks why nothing
happened.

The difference between a fragile system and a resilient one is not that the
resilient one never fails. It's that failed work is still there in the morning.

---

## What You'll Build

Two workflows: one that catches unrecoverable failures and preserves them with
their full context, and one that replays them once the problem is fixed.

```text
Processing Successful? → Retry Allowed? → Build DLQ Record → Save to DLQ

Start DLQ Recovery → Fetch Pending DLQ Event → replay → Mark DLQ Recovered
```

---

## What You Already Know

Lab 06 gave you retries with backoff. Lab 07 gave you duplicate protection and
your first database table.

You can retry temporary failures and block duplicates. But some failures still
cannot recover on their own — and right now, those events simply vanish.

Today you build the safety net underneath everything you have made so far.

---

## What You Learn

In this lab, you will learn what happens after normal retry logic can no longer recover a failed event.

You will practice:

- Defining an unrecoverable failure
- Retrying temporary processing failures
- Detecting when retry attempts are exhausted
- Creating Dead Letter Queue storage
- Preserving the original failed payload
- Saving error information
- Saving retry counts
- Saving failure timestamps
- Moving unrecoverable events into a DLQ
- Replaying failed events later
- Distinguishing successful and failed recovery attempts
- Keeping failed replays pending
- Marking successful replays as recovered
- Tracking recovery attempts
- Debugging missing DLQ records
- Breaking incorrect recovery logic
- Verifying DLQ state in Supabase

---

## Simple Explanation

A Dead Letter Queue, or **DLQ**, is a safe place where failed events are stored after the system has tried to process them but still cannot succeed.

Example:

```text
Event arrives
↓
Processing fails
↓
Retry
↓
Fails again
↓
Retry
↓
Still fails
↓
Save to DLQ
```

The event is not deleted.

It is preserved so the system can inspect or replay it later.

---

## Business Scenario

Imagine your automation sends a lead to an external CRM.

The CRM temporarily goes offline.

Your automation tries several times:

```text
Attempt 1 → fails
Attempt 2 → fails
Attempt 3 → fails
```

If you simply stop the workflow, the lead may be lost.

Instead:

```text
Attempts exhausted
↓
Save event to DLQ
↓
CRM becomes healthy later
↓
Replay event
↓
Success
↓
Mark DLQ event recovered
```

This gives the business a recovery path instead of silently losing important work.

---

## Main Learning Outcome

Understand how failed events can be preserved safely and recovered later instead of being lost after retries are exhausted.

---

# Relationship to Lab 06

Lab 06 taught retry logic.

```text
Temporary failure
↓
Retry automatically
↓
Maybe recover
```

Lab 08 continues from that idea.

```text
Temporary failure
↓
Retries exhausted
↓
Still failing
↓
Dead Letter Queue
```

A DLQ is what happens **after normal recovery attempts have failed**.

---

# Automation Architecture

Lab 08 contains two related flows.

## Flow A - Normal Processing and DLQ Routing

```text
Receive Service Event
↓
Prepare Processing Attempt
↓
Simulate Downstream Processing
↓
Processing Successful?
│
├── TRUE
│   ↓
│   Return Processing Success
│
└── FALSE
    ↓
    Retry Allowed?
    │
    ├── TRUE
    │   ↓
    │   Increase Retry Count
    │   ↓
    │   Simulate Downstream Processing
    │
    └── FALSE
        ↓
        Build DLQ Record
        ↓
        Save to DLQ
        ↓
        Return Queued for Recovery
```

---

## Flow B - DLQ Recovery

```text
Start DLQ Recovery
↓
Set Recovery Config
↓
Fetch Pending DLQ Event
↓
Prepare Replay Payload
↓
Increment Recovery Attempts
↓
Simulate Recovery Processing
↓
Recovery Successful?
│
├── TRUE
│   ↓
│   Mark DLQ Recovered
│
└── FALSE
    ↓
    Keep DLQ Pending
```

---

# Tools

- n8n
- Supabase
- Webhook node
- Manual Trigger
- Edit Fields node
- Code nodes
- IF nodes
- Supabase nodes
- Respond to Webhook nodes
- PostgreSQL / JSONB

---

# Prerequisites

Before starting this lab you need:

- [ ] n8n running
- [ ] A Supabase project and an n8n Supabase credential
- [ ] A way to send a webhook test request
- [ ] Lab 06 completed, or an understanding of retries and retry limits

Setup steps are in [`docs/environment-setup.md`](../../docs/environment-setup.md).

This lab picks up exactly where retries give up, so the Lab 06 concepts matter
more here than the Lab 06 workflow does.

---

# DLQ Storage

The main DLQ table is:

```sql
create table if not exists dlq_events (
  id bigint generated by default as identity primary key,
  event_id text not null,
  event_type text not null,
  original_payload jsonb not null,
  error_message text not null,
  retry_count integer not null default 0,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  status text not null default 'pending',
  recovered_at timestamptz
);
```

Later in the Make It Your Own exercise, recovery-attempt tracking is added:

```sql
alter table dlq_events
add column if not exists recovery_attempts integer not null default 0;
```

---

# Important DLQ Fields

## `event_id`

Identifies which event failed.

Example:

```text
evt_dlq_001
```

---

## `event_type`

Describes what kind of event was being processed.

Example:

```text
lead.sync
```

---

## `original_payload`

Stores the original event data.

Example:

```json
{
  "event_id": "evt_dlq_001",
  "event_type": "lead.sync",
  "scenario": "permanent_failure",
  "max_attempts": 3,
  "data": {
    "lead_id": "lead_301",
    "name": "DLQ Test Lead",
    "email": "dlq@example.com"
  }
}
```

This is one of the most important parts of a DLQ.

Without the original payload, recovery may be impossible.

---

## `error_message`

Explains why the event failed.

Example:

```text
Downstream service unavailable
```

---

## `retry_count`

Records how many processing attempts were used before the event was sent to the DLQ.

In this lab:

```text
max_attempts = 3
```

produces:

```text
retry_count = 3
```

---

## `first_failed_at`

Records when the processing failure began.

---

## `last_failed_at`

Records when the final failed processing attempt occurred.

---

## `status`

Tracks the DLQ lifecycle.

Values used in this lab:

```text
pending
recovered
```

---

## `recovered_at`

Stores the time the event was successfully replayed.

When still pending:

```text
recovered_at = null
```

When recovered:

```text
recovered_at = timestamp
```

---

## `recovery_attempts`

Tracks how many times the DLQ item has been replayed.

Example:

```text
1
2
3
```

This helps identify events that repeatedly fail recovery.

---

# Guided Build

## Step 1 - Receive Service Event

Create a Webhook node.

Rename it:

```text
Receive Service Event
```

Configure:

```text
HTTP Method: POST
Path: aep-lab-08-dlq
Response: Using Respond to Webhook node
Authentication: None
```

Example permanent-failure payload:

```json
{
  "event_id": "evt_dlq_001",
  "event_type": "lead.sync",
  "scenario": "permanent_failure",
  "max_attempts": 3,
  "data": {
    "lead_id": "lead_301",
    "name": "DLQ Test Lead",
    "email": "dlq@example.com"
  }
}
```

---

# Step 2 - Prepare Processing Attempt

Add a Code node.

Rename it:

```text
Prepare Processing Attempt
```

The node creates the internal processing state.

Example output:

```json
{
  "event_id": "evt_dlq_001",
  "event_type": "lead.sync",
  "scenario": "permanent_failure",
  "max_attempts": 3,
  "success_on_attempt": 3,
  "attempt": 1,
  "first_failed_at": null,
  "original_payload": {}
}
```

The original incoming payload is preserved in:

```text
original_payload
```

---

# Step 3 - Simulate Downstream Processing

Add a Code node.

Rename it:

```text
Simulate Downstream Processing
```

The lab uses deterministic scenarios instead of depending on an unreliable real external API.

Supported scenarios include:

```text
permanent_failure
eventual_success
success
```

---

## Permanent Failure

Every attempt returns:

```text
503 Service Unavailable
```

Example:

```text
Attempt 1 → 503
Attempt 2 → 503
Attempt 3 → 503
```

---

## Eventual Success

The first attempts fail.

A later attempt succeeds.

Example:

```text
Attempt 1 → 503
Attempt 2 → 503
Attempt 3 → 200
```

---

# Step 4 - Check Processing Success

Add an IF node.

Rename it:

```text
Processing Successful?
```

Check:

```text
{{ $json.processing_result.success }}
```

If TRUE:

```text
Return Processing Success
```

If FALSE:

```text
Retry Allowed?
```

---

# Step 5 - Check Whether Retry Is Allowed

Add another IF node.

Rename it:

```text
Retry Allowed?
```

Condition:

```text
{{ $json.attempt < $json.max_attempts }}
```

Example:

```text
attempt = 1
max_attempts = 3

1 < 3
→ true
```

Retry continues.

At:

```text
attempt = 3
max_attempts = 3

3 < 3
→ false
```

The event becomes unrecoverable by the normal retry path.

---

# What Is an Unrecoverable Failure?

For this lab:

> A failure becomes unrecoverable when processing still fails after the maximum allowed attempts.

Example:

```text
Attempt 1 → failed
Attempt 2 → failed
Attempt 3 → failed
↓
Maximum attempts reached
↓
Move to DLQ
```

This does not mean the event can never succeed in the future.

It means **normal processing has given up for now**.

---

# Step 6 - Increase Retry Count

On the TRUE branch of `Retry Allowed?`, add a Code node.

Rename it:

```text
Increase Retry Count
```

Increase:

```text
attempt
```

by one.

Also preserve the first failure timestamp.

Then connect back to:

```text
Simulate Downstream Processing
```

The retry loop becomes:

```text
Fail
↓
Retry Allowed?
↓
Increase Retry Count
↓
Process Again
```

---

# Important Retry Lesson

Retries happen inside one workflow execution.

Running the entire workflow manually three times does not produce:

```text
Attempt 1
Attempt 2
Attempt 3
```

because each new workflow execution starts again at:

```text
attempt = 1
```

The loop must happen inside the workflow.

---

# Step 7 - Build DLQ Record

When:

```text
Retry Allowed? = FALSE
```

add a Code node.

Rename it:

```text
Build DLQ Record
```

Create a clean DLQ object containing:

```text
event_id
event_type
original_payload
error_message
retry_count
first_failed_at
last_failed_at
status
```

Example:

```json
{
  "event_id": "evt_dlq_001",
  "event_type": "lead.sync",
  "original_payload": {},
  "error_message": "Downstream service unavailable",
  "retry_count": 3,
  "status": "pending"
}
```

---

# Step 8 - Save to DLQ

Add a Supabase Create Row node.

Rename it:

```text
Save to DLQ
```

Insert into:

```text
dlq_events
```

A stored DLQ record should contain enough information to answer:

```text
What failed?
Why did it fail?
What payload was being processed?
How many attempts happened?
When did it fail?
Can we replay it later?
```

---

# Step 9 - Return Queued for Recovery

After `Save to DLQ`, add a Respond to Webhook node.

Rename it:

```text
Return Queued for Recovery
```

Example response:

```json
{
  "success": false,
  "queued_for_recovery": true,
  "message": "Event moved to dead letter queue",
  "event_id": "evt_dlq_001",
  "retry_count": 3,
  "status": "pending"
}
```

This makes it clear that processing did not succeed, but the event was safely preserved.

---

# Permanent Failure Test

> **How to send these requests:** POST the file contents to your webhook URL with
> `Content-Type: application/json`. See
> [`docs/environment-setup.md`](../../docs/environment-setup.md) for curl and
> Postman examples. In the future AEP Website this will be handled by **Send Test**.

Use:

```text
sample-data/permanent-failure-event.json
```

Expected:

```text
Attempt 1 → fail
Attempt 2 → fail
Attempt 3 → fail
↓
Build DLQ Record
↓
Save to DLQ
```

Expected Supabase record:

```text
event_id = evt_dlq_001
error_message = Downstream service unavailable
retry_count = 3
status = pending
original_payload = preserved
recovered_at = null
```

---

# Eventual Success Test

Use:

```text
sample-data/eventual-success-event.json
```

Example:

```text
Attempt 1 → fail
Attempt 2 → fail
Attempt 3 → success
```

Expected:

```text
Processing Successful? = TRUE
↓
Return Processing Success
```

The event should **not** enter the DLQ.

Verify:

```sql
select *
from dlq_events
where event_id = 'evt_dlq_002';
```

Expected:

```text
0 rows
```

---

# Why Successful Events Must Not Enter the DLQ

The DLQ is only for events that normal processing could not recover.

Bad behavior:

```text
temporary failure
→ later succeeds
→ still saved to DLQ
```

Correct behavior:

```text
temporary failure
→ retry
→ success
→ finished
```

No DLQ record is needed.

---

# DLQ Recovery

Saving failed events is only half of the problem.

The other half is:

```text
How do we recover them later?
```

Lab 08 includes a separate recovery path.

---

# Step 10 - Start DLQ Recovery

Create a Manual Trigger.

Rename it:

```text
Start DLQ Recovery
```

This represents an operator or recovery process deciding to replay a failed DLQ item.

---

# Step 11 - Set Recovery Config

Add an Edit Fields node.

Rename:

```text
Set Recovery Config
```

Example:

```text
dlq_id = 1
recovery_scenario = success
```

The `dlq_id` identifies which DLQ record should be recovered.

> **Use your own ID, not this one.** `1` is only an example. Postgres assigns
> `id` values in insert order, so the row created by *your* run will almost
> certainly have a different number.
>
> Find yours in the Supabase table editor, or run:
>
> ```sql
> select id, event_id, status from dlq_events order by id desc;
> ```
>
> Use the `id` of the record you just created. The same applies to the
> `dlq_id` values in `sample-data/recovery-success-config.json` and
> `sample-data/recovery-failure-config.json` — treat those as placeholders and
> replace them before testing.
>
> The future AEP Website will look this ID up for you.

---

# Step 12 - Fetch Pending DLQ Event

Add a Supabase Get Row node.

Rename:

```text
Fetch Pending DLQ Event
```

Filter:

```text
id = {{ $json.dlq_id }}
```

AND:

```text
status = pending
```

This prevents already-recovered items from being replayed as pending events.

---

# Debug It - No Output from Supabase

During the lab, the recovery workflow stopped at:

```text
Fetch Pending DLQ Event
```

The reason was not an n8n error.

The requested record had:

```text
status = recovered
```

but the node was filtering:

```text
status = pending
```

Therefore no row matched.

Example:

```text
id = 1
status = recovered
```

Query:

```text
id = 1
AND
status = pending
```

Result:

```text
no output
```

---

## Lesson

When a database lookup returns nothing, inspect the filters and current database state before changing the workflow.

---

# Step 13 - Prepare Replay Payload

Add a Code node.

Rename:

```text
Prepare Replay Payload
```

The node takes:

```text
original_payload
```

from the DLQ record and prepares it for another processing attempt.

Important:

> Recovery should use the payload preserved in the DLQ instead of asking the original sender to send the event again.

---

# Why Preserve the Original Payload?

Imagine the original sender no longer has the event.

If your DLQ only stores:

```text
event_id
error_message
```

you may know something failed but not have enough information to replay it.

Storing the original payload gives you the recovery data.

---

# Step 14 - Simulate Recovery Processing

Add a Code node.

Rename:

```text
Simulate Recovery Processing
```

Use:

```text
recovery_scenario = success
```

to simulate a healthy downstream service.

Use:

```text
recovery_scenario = failure
```

to simulate another failed replay.

---

# Step 15 - Check Recovery Result

Add an IF node.

Rename:

```text
Recovery Successful?
```

Condition:

```text
{{ $json.recovery_result.success }}
```

Then:

```text
TRUE → Mark DLQ Recovered
FALSE → Keep DLQ Pending
```

---

# Step 16 - Mark DLQ Recovered

On the TRUE branch, add a Supabase Update Row node.

Rename:

```text
Mark DLQ Recovered
```

Update:

```text
status = recovered
recovered_at = current timestamp
```

Example lifecycle:

```text
pending
↓
replay succeeds
↓
recovered
```

---

# Successful Recovery Test

A successfully replayed event should become:

```text
status = recovered
recovered_at = populated
```

Example:

```sql
-- replace 1 with the dlq_id you recovered
select id, event_id, status, recovered_at
from dlq_events
where id = 1;
```

Expected:

```text
status = recovered
recovered_at = timestamp
```

---

# Step 17 - Keep Failed Recovery Pending

On the FALSE branch of `Recovery Successful?`, add a Code node.

Rename:

```text
Keep DLQ Pending
```

Example output:

```json
{
  "recovery_success": false,
  "status": "pending",
  "error_message": "Recovery attempt failed"
}
```

The DLQ record should remain:

```text
status = pending
recovered_at = null
```

---

# Failed Recovery Test

Use a pending DLQ record and:

```text
recovery_scenario = failure
```

Expected:

```text
Simulate Recovery Processing
→ failure

Recovery Successful?
→ FALSE

Keep DLQ Pending
```

Verify:

```sql
select id, event_id, status, recovered_at
from dlq_events
where id = 3;
```

Expected:

```text
status = pending
recovered_at = null
```

---

# Recovery Principle

A failed replay is still failed work.

Therefore:

```text
Failed replay
≠
Recovered event
```

Only confirmed success should mark the DLQ item recovered.

---

# Break It

Temporarily bypass:

```text
Recovery Successful?
```

and connect:

```text
Simulate Recovery Processing
↓
Mark DLQ Recovered
```

Use:

```text
recovery_scenario = failure
```

The processing fails.

But because the success check was removed:

```text
Mark DLQ Recovered
```

still runs.

The database may incorrectly show:

```text
status = recovered
recovered_at = populated
```

even though recovery failed.

---

## Break It Lesson

Never mark failed work as recovered without verifying the replay result.

Correct:

```text
Replay
↓
Verify Result
↓
Mark Recovered
```

Incorrect:

```text
Replay
↓
Mark Recovered
```

---

# Challenge

The challenge uses two events.

```text
evt_dlq_challenge_001
evt_dlq_challenge_002
```

Both initially fail permanently and enter the DLQ.

---

## Challenge Part 1

Recover:

```text
evt_dlq_challenge_001
```

with:

```text
recovery_scenario = success
```

Expected:

```text
status = recovered
recovered_at = populated
```

---

## Challenge Part 2

Recover:

```text
evt_dlq_challenge_002
```

with:

```text
recovery_scenario = failure
```

Expected:

```text
status = pending
recovered_at = null
```

---

# Progressive Hints

Use these only if the recovery run does not behave the way you expected.

### Hint 1 — The symptom

Start by checking what is actually in the queue:

```sql
select id, event_id, status, retry_count, recovered_at
from dlq_events
order by id desc;
```

If you see fewer than two rows, the problem happened *before* recovery — the
events never made it into the DLQ in the first place. Fix that before touching
the recovery flow.

### Hint 2 — The evidence

If `Fetch Pending DLQ Event` returns nothing, there are only two possibilities:
the `dlq_id` you supplied does not exist, or that row is no longer `pending`.

Both filters have to match. Check the `id` you put in `Set Recovery Config`
against the IDs the query above actually returned — remember they are yours, not
the example values.

### Hint 3 — The concept

A failed recovery is not a completed recovery.

If `evt_dlq_challenge_002` ends up marked `recovered` after a failed replay, the
workflow is treating "we tried" as "we succeeded". Ask yourself which node is
allowed to change `status`, and on which branch it sits.

### Hint 4 — Where to look

Open `Recovery Successful?` and follow both outputs.

Only the TRUE branch should reach `Mark DLQ Recovered`. If the FALSE branch also
leads there — directly or indirectly — every failed replay quietly closes the
row, and the event is lost for the second time.

---

# Challenge Verification

Run:

```sql
select event_id, status, recovered_at
from dlq_events
where event_id in (
  'evt_dlq_challenge_001',
  'evt_dlq_challenge_002'
)
order by event_id;
```

Expected:

```text
evt_dlq_challenge_001
→ recovered
→ recovered_at populated

evt_dlq_challenge_002
→ pending
→ recovered_at null
```

This proves that recovery state reflects the real result of replay processing.

---

# Make It Your Own

Add recovery-attempt tracking.

First add the database field:

```sql
alter table dlq_events
add column if not exists recovery_attempts integer not null default 0;
```

Then update `Prepare Replay Payload` so each replay calculates:

```text
current recovery_attempts + 1
```

Example:

```text
0 → first replay → 1
1 → second replay → 2
2 → third replay → 3
```

---

# Increment Recovery Attempts

Add a Supabase Update Row node.

Rename:

```text
Increment Recovery Attempts
```

Place it before:

```text
Simulate Recovery Processing
```

Recovery flow becomes:

```text
Fetch Pending DLQ Event
↓
Prepare Replay Payload
↓
Increment Recovery Attempts
↓
Simulate Recovery Processing
↓
Recovery Successful?
```

---

# Debug It - Empty Update JSON

During the lab, `Increment Recovery Attempts` returned:

```text
Empty or invalid json
```

The row filter was correct.

The actual problem was:

```text
Fields to Send
```

was empty.

The Supabase Update node knew which row to update but did not know what data to change.

Fix:

```text
Field:
recovery_attempts

Value:
{{ $json.recovery_attempts }}
```

---

## Lesson

An update requires both:

```text
Which row?
```

and:

```text
What should change?
```

A correct filter alone is not enough.

---

# Why Recovery Attempt Tracking Helps

Imagine a DLQ item has:

```text
recovery_attempts = 12
```

That tells an operator:

> This event repeatedly fails recovery and probably needs investigation.

Without this field, repeated replay attempts may be invisible.

---

# Sample Data

## Permanent Failure

```text
sample-data/permanent-failure-event.json
```

Used to demonstrate:

```text
retries exhausted
→ DLQ
```

---

## Eventual Success

```text
sample-data/eventual-success-event.json
```

Used to demonstrate:

```text
temporary failure
→ retry
→ success
→ no DLQ
```

---

## Successful Recovery

```text
sample-data/recovery-success-config.json
```

Used to demonstrate:

```text
pending
→ replay succeeds
→ recovered
```

---

## Failed Recovery

```text
sample-data/recovery-failure-config.json
```

Used to demonstrate:

```text
pending
→ replay fails
→ remains pending
```

---

# Real-World Applications

DLQs are commonly useful for:

- Payment processing
- CRM synchronization
- Webhook consumers
- Order processing
- Email delivery
- Background jobs
- Queue workers
- Data synchronization
- AI API processing
- Third-party integrations
- Booking systems
- Event-driven systems

---

# Important Engineering Principles

## Do Not Lose Failed Work

A permanent processing failure should not automatically mean:

```text
delete event
```

Important work should be preserved.

---

## Preserve Recovery Context

A useful DLQ needs more than an error message.

Preserve:

```text
original payload
error
attempt count
timestamps
event identity
recovery state
```

---

## Retry Before DLQ

Temporary failures should normally be given a chance to recover before being dead-lettered.

---

## DLQ Is Not the End

A DLQ provides a recovery workflow.

```text
failed
→ preserved
→ investigated
→ replayed
→ recovered
```

---

## Verify Before Marking Recovered

Do not assume replay success.

Use the actual processing result.

---

## Failed Replay Should Stay Pending

If recovery fails again, the work is still unresolved.

---

## Track Repeated Recovery Attempts

Repeated failures may indicate:

- Invalid data
- Permanent configuration problems
- Broken credentials
- Downstream outages
- Integration defects
- Business-rule violations

---

# Future AEP Website Experience

The future AEP website can support this lab with:

- Failure simulation controls
- Retry-attempt visualization
- DLQ record viewer
- Original payload viewer
- Error-message display
- Pending/recovered status indicators
- Recovery controls
- Replay simulation
- Recovery-attempt counters
- Break It exercises
- Debugging hints
- Challenge verification
- Recovery lifecycle visualization

The actual automation should still run inside the learner's own n8n environment.

---

# Why the Learner Still Uses n8n

The learner should experience the complete failure lifecycle directly.

```text
Build
↓
Fail
↓
Retry
↓
Exhaust retries
↓
Inspect DLQ
↓
Replay
↓
Verify
↓
Recover
```

The AEP website guides the learning.

n8n remains the hands-on automation environment.

---

# What You Learned

After completing this lab, you should understand:

- What a Dead Letter Queue is
- Why retry logic alone is not enough
- What an unrecoverable failure means
- When an event should enter the DLQ
- Why the original payload must be preserved
- Why error details matter
- Why retry counts matter
- Why timestamps matter
- How to distinguish temporary failure from permanent failure
- Why eventual success should not enter the DLQ
- How to replay a failed event
- How to mark successful recovery
- Why failed recovery must remain pending
- How database state affects recovery queries
- Why recovery should use the stored payload
- How incorrect recovery logic can produce false success
- How to track repeated recovery attempts
- How to debug empty database updates

---

# Completion Checklist

You have completed Lab 08 when you can:

- Define an unrecoverable failure
- Create DLQ storage
- Save the original payload
- Save the error message
- Save the processing attempt count
- Save failure timestamps
- Detect exhausted retry attempts
- Route permanent failure into the DLQ
- Keep successful events out of the DLQ
- Fetch a pending DLQ record
- Prepare its original payload for replay
- Simulate successful recovery
- Simulate failed recovery
- Mark successful recovery as recovered
- Keep failed recovery pending
- Explain why a recovered record cannot be fetched as pending
- Complete Break It
- Complete the Challenge
- Add recovery-attempt tracking
- Debug an empty Supabase update
- Complete Make It Your Own

---

# Lab Files

```text
08-dead-letter-queue-failure-recovery/
│
├── README.md
│
├── challenge/
│   ├── challenge-input.json
│   └── expected-result.json
│
├── sample-data/
│   ├── eventual-success-event.json
│   ├── permanent-failure-event.json
│   ├── recovery-failure-config.json
│   └── recovery-success-config.json
│
└── workflow/
    └── lab-08-dead-letter-queue-failure-recovery.json
```

---

# Final Takeaway

Reliable automation does not pretend failures will never happen.

It plans for them.

A strong failure-recovery system knows how to:

```text
TRY
↓
RETRY
↓
RECOGNIZE WHEN TO STOP
↓
PRESERVE THE FAILED WORK
↓
REPLAY IT LATER
↓
VERIFY RECOVERY
```

A Dead Letter Queue turns:

```text
"This event failed."
```

into:

```text
"This event failed safely, we know why, we preserved it, and we have a way to recover it."
```

That is the foundation of resilient failure recovery.


---

# What's Next

Your automation is now genuinely reliable. It validates what arrives, refuses
duplicates, retries what can recover, and preserves what cannot.

Everything it does is also completely predictable — every decision comes from a
rule you wrote yourself.

That is about to change. The next two labs introduce AI, which is remarkably good
at reading intent a human would need a minute to parse, and remarkably willing to
return something you did not expect. Useful, and not predictable.

**Lab 09 — Structured AI Output** makes an AI answer safe enough for automation
to act on.
