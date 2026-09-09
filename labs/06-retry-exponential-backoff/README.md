# Lab 06 - Retry Logic & Exponential Backoff

## The Hook

Your workflow calls a payment API. The API is having a bad afternoon and returns
a `503`.

Your automation gives up, marks the job failed, and moves on. Two seconds later
the API is perfectly fine.

Nothing was actually wrong. You just asked at the worst possible moment.

---

## The Business Problem

Most integration failures are temporary — a rate limit, a brief outage, a
timeout. Treating those as permanent means real work gets dropped for no reason,
and someone has to find and re-run it by hand.

But naive retries are their own disaster. Hammering a struggling service every
100ms is how you turn a brief wobble into a full outage, and how you get your API
key revoked.

So the engineering question is not *"should we retry?"* — it's *when*, *how
often*, and *when to stop*.

---

## What You'll Build

A retry loop that separates recoverable failures from permanent ones, waits
longer after each attempt, and gives up deliberately rather than by accident.

```text
Simulate API Request → Was Request Successful?
        ↓ (false)
Classify Failure → Should Retry? → Calculate Backoff → Wait → retry
```

---

## What You Already Know

Lab 03 taught you to read HTTP status codes. Lab 05 had you make many API calls
in sequence.

You can fetch all the data — as long as nothing goes wrong. So: what happens when
the service fails halfway through?

Today your automation learns to be patient instead of fragile.

---

## What You Learn

In this lab, you will learn how automation systems recover from temporary failures without retrying forever.

You will practice:

- Detecting failed API requests
- Distinguishing retryable and non-retryable errors
- Handling HTTP 429 rate limits
- Handling temporary 5xx server errors
- Tracking retry attempts
- Setting a maximum retry limit
- Adding delays between retries
- Implementing exponential backoff
- Adding jitter
- Logging failed attempts
- Handling eventual success
- Handling permanent failure
- Debugging retry configuration

---

## Simple Explanation

APIs do not always succeed on the first request.

Sometimes the problem is temporary.

Examples:

- The API is overloaded
- You hit a rate limit
- The server is temporarily unavailable
- There is a short network interruption

Instead of immediately giving up, an automation can wait and try again.

This is called **retry logic**.

Example:

```text
Request
↓
429 Too Many Requests
↓
Wait
↓
Retry
↓
503 Service Unavailable
↓
Wait longer
↓
Retry
↓
200 Success
```

However, retries must have limits.

Without a maximum retry count, a workflow could retry forever.

---

## Business Scenario

Imagine your business sends a customer booking, lead, payment, or order to an external API.

The API temporarily returns:

```text
503 Service Unavailable
```

If the workflow immediately gives up, the data may never reach the external system.

Instead, the workflow can automatically retry.

```text
Attempt 1 → fails
Wait
Attempt 2 → fails
Wait longer
Attempt 3 → succeeds
```

The customer or staff member does not need to resubmit anything manually.

The automation recovers by itself.

---

## Main Learning Outcome

Understand how systems recover from temporary failures automatically while still protecting themselves from infinite retry loops.

---

# Automation Flow

```text
Start Lab 06
↓
Set Retry Config
↓
Simulate API Request
↓
Was Request Successful?
│
├── TRUE
│   ↓
│   Return Success
│
└── FALSE
    ↓
    Classify Failure
    ↓
    Log Failed Attempt
    ↓
    Should Retry?
    │
    ├── FALSE
    │   ↓
    │   Return Permanent Failure
    │
    └── TRUE
        ↓
        Calculate Backoff
        ↓
        Wait Before Retry
        ↓
        Increase Retry Counter
        ↓
        Simulate API Request
```

The last connection creates the retry loop.

A retry happens inside the **same workflow execution**.

You do not manually run the workflow again for every attempt.

---

# Tools

- n8n
- Manual Trigger
- Edit Fields node
- Code nodes
- IF nodes
- Wait node
- JavaScript
- JSON configuration

---

# Prerequisites

Before starting this lab, you should understand:

- Basic n8n workflow execution
- Conditions
- JSON fields
- Expressions
- Basic HTTP status codes
- Basic JavaScript syntax

---

# Guided Build

## Step 1 - Start the Workflow

Create a Manual Trigger.

Rename it:

```text
Start Lab 06
```

This allows you to run the retry simulation manually while learning.

---

## Step 2 - Set Retry Configuration

Add an Edit Fields node.

Rename it:

```text
Set Retry Config
```

Use these fields:

```json
{
  "scenario": "eventual_success",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

### What Each Field Means

#### `scenario`

Controls which API behavior the simulator creates.

Examples:

```text
eventual_success
permanent_failure
non_retryable_failure
```

#### `max_attempts`

The maximum total number of request attempts allowed.

Example:

```text
max_attempts = 4
```

means the workflow may try at most four times.

---

#### `success_on_attempt`

Controls which attempt should simulate success.

Example:

```text
success_on_attempt = 3
```

means:

```text
Attempt 1 → fail
Attempt 2 → fail
Attempt 3 → succeed
```

---

#### `base_delay_seconds`

The starting delay used by exponential backoff.

Example:

```text
base_delay_seconds = 1
```

produces base delays like:

```text
1
2
4
8
```

---

#### `attempt`

Tracks the current request attempt.

The workflow begins with:

```text
attempt = 1
```

---

# Step 3 - Simulate the API Request

Add a Code node.

Rename it:

```text
Simulate API Request
```

The node creates predictable API responses so the lab does not depend on a random or unreliable public service.

The simulator can produce:

```text
200 → Request successful
400 → Bad request
429 → Too many requests
503 → Service unavailable
```

The main eventual-success scenario behaves like:

```text
Attempt 1 → 429
Attempt 2 → 503
Attempt 3 → 200
```

This gives us a reliable environment for learning retry behavior.

---

# Step 4 - Detect Success

Add an IF node.

Rename it:

```text
Was Request Successful?
```

Check:

```text
response.status_code = 200
```

If TRUE:

```text
Return Success
```

If FALSE:

```text
Classify Failure
```

---

# Step 5 - Return Successful Result

Add a Code node to the TRUE branch.

Rename it:

```text
Return Success
```

The final output should contain only useful result fields.

Example:

```json
{
  "success": true,
  "final_status_code": 200,
  "message": "Request successful",
  "attempts_used": 3,
  "retries_performed": 2,
  "retry_log": []
}
```

The actual `retry_log` will contain previous failed attempts.

---

# Why Shape the Final Output?

During processing, the workflow contains temporary fields such as:

```text
failure
retry
response
retry_log
```

Some of those fields may contain information from previous attempts.

Instead of forwarding every internal field, the final node deliberately returns only the information the next system needs.

This creates a cleaner data contract.

---

# Step 6 - Classify the Failure

Add a Code node to the FALSE branch.

Rename it:

```text
Classify Failure
```

The workflow checks whether the status code represents a temporary error.

Retryable status codes used in this lab:

```javascript
[429, 500, 502, 503, 504]
```

The result includes:

```text
failure.retryable
```

Example:

```json
{
  "failure": {
    "status_code": 429,
    "retryable": true
  }
}
```

---

# Retryable vs Non-Retryable Errors

Not every error should be retried.

## Retryable Errors

Typical retryable errors are temporary.

Examples:

```text
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

These errors may disappear after waiting.

---

## Non-Retryable Errors

Some errors usually require the request itself to be fixed.

Examples:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

Retrying the same broken request often creates the same result.

Example:

```text
400 Bad Request
↓
retryable = false
↓
STOP
```

---

# Step 7 - Log the Failed Attempt

Add a Code node.

Rename it:

```text
Log Failed Attempt
```

Each failed request is added to:

```text
retry_log
```

Example:

```json
[
  {
    "attempt": 1,
    "status_code": 429,
    "message": "Too many requests"
  },
  {
    "attempt": 2,
    "status_code": 503,
    "message": "Service unavailable"
  }
]
```

The logging node runs before the retry decision so even the final failed attempt is recorded.

---

# Why Logging Matters

Retry logs help with:

- Debugging
- Monitoring
- Auditing
- Incident investigation
- Understanding API reliability
- Identifying recurring failures

Without logs, you may only know that an automation failed.

With logs, you can understand how it failed.

---

# Step 8 - Decide Whether to Retry

Add an IF node.

Rename it:

```text
Should Retry?
```

Use two conditions with AND logic.

Condition 1:

```text
failure.retryable = true
```

Condition 2:

```text
attempt < max_attempts
```

Both must be true.

---

# Maximum Retry Limit

Every retry system needs a stopping condition.

Example:

```text
attempt = 4
max_attempts = 4
```

The condition becomes:

```text
4 < 4
```

Result:

```text
false
```

The workflow stops.

This prevents infinite retry loops.

---

# Attempt vs Retry

An attempt and a retry are not the same thing.

Example:

```text
Attempt 1 → initial request
Attempt 2 → retry #1
Attempt 3 → retry #2
Attempt 4 → retry #3
```

Therefore:

```text
4 attempts
=
1 initial attempt
+
3 retries
```

This distinction is important when reporting automation behavior.

---

# Step 9 - Calculate Exponential Backoff

The retry works. Unfortunately it fires again immediately — and the service that
was struggling a moment ago now has two requests instead of one.

Retrying instantly is not patience. It is impatience with a loop around it.

Add a Code node to the TRUE branch of `Should Retry?`.

Rename it:

```text
Calculate Backoff
```

The formula is:

```text
delay = base_delay × 2^(attempt - 1)
```

Example with:

```text
base_delay = 1
```

produces:

```text
Attempt 1 → 1 second
Attempt 2 → 2 seconds
Attempt 3 → 4 seconds
Attempt 4 → 8 seconds
```

---

# What Exponential Means

Exponential backoff multiplies the delay.

It does not simply add the same value each time.

For example, with:

```text
base_delay = 2
```

the pattern is:

```text
2
4
8
16
32
```

Not:

```text
2
4
6
8
10
```

The delay gets progressively larger.

---

# Why Exponential Backoff Helps

Imagine an external API is overloaded.

If you immediately retry:

```text
fail
retry
fail
retry
fail
retry
```

you may make the overload worse.

Instead:

```text
fail
↓
wait
↓
retry
↓
wait longer
↓
retry
```

This gives the external service time to recover.

---

# Step 10 - Add Jitter

The Make It Your Own improvement adds jitter.

Jitter is a small random value added to the retry delay.

Example:

Without jitter:

```text
System A → retry at 4 seconds
System B → retry at 4 seconds
System C → retry at 4 seconds
```

With jitter:

```text
System A → retry at 4.21 seconds
System B → retry at 4.74 seconds
System C → retry at 4.38 seconds
```

The systems no longer retry at exactly the same moment.

The lab uses:

```javascript
const jitterSeconds = Math.random();
```

The final delay becomes:

```text
delay_seconds
=
backoff_seconds
+
jitter_seconds
```

Example:

```json
{
  "backoff_seconds": 4,
  "jitter_seconds": 0.42,
  "delay_seconds": 4.42
}
```

---

# Why Jitter Matters

If thousands of clients receive the same error at the same time and all use identical retry delays, they may all reconnect together.

This can create another traffic spike.

Jitter spreads the retry traffic across slightly different times.

---

# Step 11 - Wait Before Retrying

### Wait — a new node

**What it does**
Pauses the workflow for a set amount of time, then carries on from where it left
off.

**Why we're using it here**
Everything before this calculated *how long* to wait. Without this node, that
number is just a value in some JSON — the retry fires instantly and we are back
to hammering a service that is already struggling.

**Think of it like**
The bit of a retry that actually shows some manners.

Add a Wait node.

Rename it:

```text
Wait Before Retry
```

Configure:

```text
Resume: After Time Interval
Wait Amount: {{ $json.retry.delay_seconds }}
Wait Unit: Seconds
```

The Wait node uses the delay calculated by the previous step.

---

# Step 12 - Increase the Retry Counter

Add a Code node.

Rename it:

```text
Increase Retry Counter
```

Increase:

```text
attempt
```

by one.

Example:

```text
attempt 1
↓
attempt 2
↓
attempt 3
```

---

# Step 13 - Create the Retry Loop

Connect:

```text
Increase Retry Counter
```

back to:

```text
Simulate API Request
```

The retry sequence is now:

```text
Failure
↓
Classify
↓
Log
↓
Should Retry?
↓
Calculate Backoff
↓
Wait
↓
Increase Attempt
↓
Try Again
```

This happens inside one workflow execution.

---

# Step 14 - Handle Final Failure

Connect the FALSE branch of:

```text
Should Retry?
```

to a Code node.

Rename it:

```text
Return Permanent Failure
```

The output should distinguish between:

```text
Non-retryable error
```

and:

```text
Maximum retry attempts reached
```

Example non-retryable result:

```json
{
  "success": false,
  "final_status_code": 400,
  "message": "Request failed with a non-retryable error",
  "attempts_used": 1,
  "failed_attempts": 1,
  "retries_performed": 0
}
```

Example max-attempt result:

```json
{
  "success": false,
  "final_status_code": 503,
  "message": "Request failed after maximum retry attempts",
  "attempts_used": 4,
  "failed_attempts": 4,
  "retries_performed": 3
}
```

---

# Sample Data

The lab includes three main test configurations.

## Eventual Success

File:

```text
sample-data/eventual-success-config.json
```

Configuration:

```json
{
  "scenario": "eventual_success",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

---

## Permanent Failure

File:

```text
sample-data/permanent-failure-config.json
```

Configuration:

```json
{
  "scenario": "permanent_failure",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

---

## Non-Retryable Failure

File:

```text
sample-data/non-retryable-config.json
```

Configuration:

```json
{
  "scenario": "non_retryable_failure",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

---

# Success Test

Use:

```json
{
  "scenario": "eventual_success",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

Expected sequence:

```text
Attempt 1
→ 429 Too Many Requests
→ retry

Attempt 2
→ 503 Service Unavailable
→ retry

Attempt 3
→ 200 Request Successful
→ stop
```

Expected result:

```text
success = true
final_status_code = 200
attempts_used = 3
retries_performed = 2
```

---

# Handling HTTP 429

The first failed request in the default scenario returns:

```text
429 Too Many Requests
```

This usually means the API is rate limiting the caller.

The workflow classifies `429` as retryable.

Instead of immediately sending another request, it waits before retrying.

This reduces pressure on the external service.

---

# Handling Temporary Server Errors

The second failed request returns:

```text
503 Service Unavailable
```

This represents a temporary server failure.

Because `503` is retryable, the workflow waits longer and tries again.

The next attempt succeeds.

---

# Permanent Failure Test

Use:

```json
{
  "scenario": "permanent_failure",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

The simulator returns:

```text
503 Service Unavailable
```

on every attempt.

Expected sequence:

```text
Attempt 1 → fail → retry
Attempt 2 → fail → retry
Attempt 3 → fail → retry
Attempt 4 → fail → STOP
```

Expected output:

```text
success = false
attempts_used = 4
failed_attempts = 4
retries_performed = 3
```

The final attempt is still logged even though no additional retry occurs.

---

# Non-Retryable Failure Test

Use:

```json
{
  "scenario": "non_retryable_failure",
  "max_attempts": 4,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

Expected behavior:

```text
Attempt 1
↓
400 Bad Request
↓
retryable = false
↓
STOP
```

These nodes should not execute:

```text
Calculate Backoff
Wait Before Retry
Increase Retry Counter
```

Expected output:

```text
success = false
final_status_code = 400
attempts_used = 1
failed_attempts = 1
retries_performed = 0
```

---

# Break It

Change the configuration to:

```json
{
  "scenario": "eventual_success",
  "max_attempts": 2,
  "success_on_attempt": 3,
  "base_delay_seconds": 1,
  "attempt": 1
}
```

The simulated API would recover on:

```text
Attempt 3
```

but the maximum attempt limit is:

```text
2
```

Expected sequence:

```text
Attempt 1
→ fail
→ retry

Attempt 2
→ fail
→ STOP
```

The workflow never reaches attempt 3.

Expected:

```text
success = false
attempts_used = 2
failed_attempts = 2
retries_performed = 1
```

---

## Break It Lesson

A retry limit that is too low can cause an automation to give up on a service that would have recovered shortly afterward.

Retry policies require balance.

Too many retries can:

- Waste resources
- Increase load
- Create long-running workflows

Too few retries can:

- Cause avoidable failures
- Drop recoverable requests
- Require manual intervention

---

# Debug It

## Problem

You manually run the workflow several times.

Every time you see:

```text
attempt = 1
```

You expected:

```text
1
2
3
```

across manual executions.

---

## Root Cause

Every new manual execution begins again at:

```text
Set Retry Config
```

That node resets:

```text
attempt = 1
```

A new workflow execution does not automatically continue the state from the previous execution.

---

## Correct Architecture

Retries must happen inside the same execution.

```text
Wait Before Retry
↓
Increase Retry Counter
↓
Simulate API Request
```

This creates an internal retry loop.

---

# Debugging Stale Data

During the lab, a successful request still contained fields such as:

```text
failure.status_code = 503
retry.delay_seconds = 2
```

while the current response was:

```text
response.status_code = 200
```

---

## Why This Happened

Several Code nodes use:

```javascript
...$json
```

This copies existing fields forward.

Previous failure metadata can therefore remain in the workflow state.

---

## Solution

The final output node deliberately creates a clean result object instead of returning every internal field.

---

## Lesson

Internal workflow state and final output are not always the same thing.

Temporary processing data can be useful inside the automation but should not automatically become part of the final data contract.

---

# Challenge

File:

```text
challenge/challenge-config.json
```

Configuration:

```json
{
  "scenario": "eventual_success",
  "max_attempts": 5,
  "success_on_attempt": 4,
  "base_delay_seconds": 2,
  "attempt": 1
}
```

Before running the workflow, predict:

```text
Attempt 1 → status?
Wait → ?

Attempt 2 → status?
Wait → ?

Attempt 3 → status?
Wait → ?

Attempt 4 → status?
```

---

# Challenge Expected Result

The status sequence should be:

```text
Attempt 1 → 429
Attempt 2 → 503
Attempt 3 → 503
Attempt 4 → 200
```

The base exponential backoff values should be:

```text
2
4
8
```

Expected result:

```text
success = true
attempts_used = 4
retries_performed = 3
failed_attempts = 3
```

Because jitter is enabled, the actual delay will be slightly larger than each base value.

Example:

```text
2.32
4.81
8.17
```

The exact jitter values are intentionally unpredictable.

---

# Challenge Verification

The challenge passes when:

```text
status sequence:
429 → 503 → 503 → 200
```

and:

```text
attempts_used = 4
retries_performed = 3
```

The base backoff sequence should be:

```text
2
4
8
```

The final delay may vary because of jitter.

---

# Optional Hints

## Hint 1

If your delays look like:

```text
2
4
6
8
```

you are probably using linear growth.

Exponential backoff should look like:

```text
2
4
8
16
```

---

## Hint 2

If the workflow retries forever, inspect:

```text
attempt
max_attempts
```

Make sure the attempt counter increases before returning to the request.

---

## Hint 3

If a `400` error retries, inspect the retryable status-code list.

---

## Hint 4

If every manual run starts again at attempt 1, remember that each manual execution creates a new workflow execution.

---

## Hint 5

If your successful output still contains old failure information, inspect where `...$json` is carrying previous fields forward.

---

# Make It Your Own

The base workflow originally used deterministic exponential backoff.

For the Make It Your Own exercise, add jitter.

Instead of storing only:

```text
delay_seconds
```

separate the values into:

```text
backoff_seconds
jitter_seconds
delay_seconds
```

Example:

```json
{
  "backoff_seconds": 4,
  "jitter_seconds": 0.42,
  "delay_seconds": 4.42
}
```

This makes the retry behavior closer to a production retry strategy.

---

# Why the Learner Still Uses n8n

The future AEP website will guide and test the learner, but the learner should still build the actual workflow inside their own n8n environment.

The goal is not to hide automation engineering.

The goal is to teach it through hands-on problem solving.

The learner should experience:

```text
Understand
↓
Build
↓
Run
↓
Observe
↓
Break
↓
Debug
↓
Improve
```

---

# Future AEP Website Experience

The future AEP website can support this lab with:

- Business scenario explanation
- Retry-flow visualization
- HTTP status-code explanations
- Retry configuration inputs
- Attempt counters
- Expected attempt sequences
- Success tests
- Permanent-failure tests
- Non-retryable-error tests
- Break It exercises
- Debugging prompts
- Progressive hints
- Exponential backoff visualization
- Jitter visualization
- Retry logs
- Challenge verification
- Learner feedback

The actual workflow should still run inside the learner's own n8n environment.

---

# Real-World Applications

Retry logic can be useful when working with:

- Payment APIs
- CRM APIs
- Email providers
- Booking systems
- AI APIs
- Webhooks
- Databases
- Cloud services
- External automation platforms
- Rate-limited APIs

---

# Important Engineering Principles

## Retry Only When Recovery Is Possible

Do not retry every error blindly.

Some failures require waiting.

Other failures require fixing the request.

---

## Always Have a Maximum Attempt Limit

Retry loops must have a stopping condition.

Never allow uncontrolled infinite retries.

---

## Increase Delay Between Attempts

Temporary failures often need time to recover.

Exponential backoff reduces repeated pressure on the failing service.

---

## Add Jitter When Appropriate

Jitter prevents many clients from retrying at exactly the same moment.

---

## Log What Happened

A reliable automation should make failures observable.

Logs help explain:

```text
What failed?
When did it fail?
Which attempt failed?
What status code was returned?
How many times did the system retry?
Why did it eventually stop?
```

---

## Return Clean Final Outputs

Internal workflow metadata may be messy.

Final outputs should intentionally expose the data required by the next system.

---

# What You Learned

After completing this lab, you should understand:

- What retry logic means
- What problem retry logic solves
- How retry logic helps businesses
- Why temporary failures should sometimes be retried
- Why not every error should be retried
- How to classify retryable and non-retryable HTTP errors
- Why HTTP 429 normally requires waiting
- Why temporary 5xx errors may recover
- Why maximum attempt limits are required
- The difference between attempts and retries
- How retry counters work
- How retry loops happen inside one workflow execution
- How exponential backoff works
- Why exponential backoff multiplies instead of adding
- What jitter means
- Why jitter improves distributed retry behavior
- How to log failed attempts
- How to detect eventual success
- How to stop permanent failures safely
- How poor retry configuration can create failures
- Why final outputs should be intentionally shaped

---

# Completion Checklist

You have completed Lab 06 when you can:

- Detect a failed request
- Classify retryable errors
- Identify non-retryable errors
- Handle HTTP 429
- Handle temporary server errors
- Track the current attempt
- Set a maximum retry limit
- Calculate exponential backoff
- Wait before retrying
- Add jitter
- Increase the retry counter
- Loop back to the request
- Log failed attempts
- Recover from temporary failure
- Stop after permanent failure
- Stop immediately for a non-retryable error
- Explain the difference between attempts and retries
- Explain why a retry happened
- Explain why a retry stopped
- Complete the success test
- Complete the permanent-failure test
- Complete the non-retryable test
- Complete Break It
- Complete the Challenge
- Complete Make It Your Own

---

# Lab Files

```text
06-retry-exponential-backoff/
│
├── README.md
│
├── challenge/
│   ├── challenge-config.json
│   └── expected-result.json
│
├── sample-data/
│   ├── eventual-success-config.json
│   ├── non-retryable-config.json
│   └── permanent-failure-config.json
│
└── workflow/
    └── lab-06-retry-exponential-backoff.json
```

---

# Final Takeaway

Reliable automation is not about assuming every request will succeed.

It is about designing what happens when requests fail.

A strong retry system knows:

```text
WHEN to retry
HOW LONG to wait
HOW MANY times to retry
WHEN to stop
WHAT to log
```

That is the foundation of resilient automation.


---

# What's Next

Temporary failures now recover on their own. Your workflow waits, tries again,
backs off politely, and stops when stopping is the right answer.

Now consider what a retry actually is: doing the same thing a second time.

If the first attempt failed *after* charging the customer — a timeout on the
response, not the request — your retry charges them again. The retry logic you
just built is, from the outside, indistinguishable from a duplicate.

**Lab 07 — Idempotency & Duplicate Protection** makes sure the same event can
only ever act once.
