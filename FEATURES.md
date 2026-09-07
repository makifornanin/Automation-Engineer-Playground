# Automation Engineer Playground — Features

## Project Goal

Automation Engineer Playground (AEP) is a hands-on learning system for learning real-world Automation Engineering concepts through actual building, testing, debugging, and problem-solving.

The main goal is to help learners understand not only **how to build automations**, but also:

* what each concept means
* what problem it solves
* why businesses need it
* how to test it
* how it can fail
* how to debug and improve it

AEP will contain **10 progressive labs**, a final **Capstone Project**, and an **AEP Learning Agent** built with n8n.

---

# FEATURE 01 — Standard Lab Learning Structure

Every lab must follow the same learning structure so students know what to expect.

### Required sections

* [ ] Simple explanation of the concept
* [ ] Explain what problem the concept solves
* [ ] Give a real-world business example
* [ ] Show the automation flow before building
* [ ] Provide a guided build
* [ ] Provide sample/mock data
* [ ] Provide a successful test scenario
* [ ] Provide an intentional failure scenario
* [ ] Explain how to debug the failure
* [ ] Provide an independent challenge
* [ ] Show the expected result of the challenge
* [ ] Add a short "What You Learned" recap

### Learning rule

Before building anything, the learner should be able to answer:

* What is this?
* What problem does this solve?
* How can this help a real business?

---

# FEATURE 02 — Lab 01: Data Mapping & Transformation

Teach learners how data moves between systems and how to transform it into the format another system needs.

### Concepts

* [ ] Understand JSON objects
* [ ] Understand fields and values
* [ ] Read incoming data
* [ ] Select specific fields
* [ ] Rename fields
* [ ] Remove unnecessary fields
* [ ] Combine multiple fields
* [ ] Change values into a required format
* [ ] Create a clean output object

### Example

Transform:

```json
{
  "first_name": "Mark",
  "last_name": "Milca",
  "email_address": "MARK@EMAIL.COM"
}
```

Into:

```json
{
  "name": "Mark Milca",
  "email": "mark@email.com"
}
```

### Business problem

Different systems often use different data structures.

Learners should understand how to prepare data before sending it to another CRM, database, API, or automation.

---

# FEATURE 03 — Lab 02: Conditions & Routing

Teach learners how automation decides what action should happen based on data.

### Concepts

* [ ] Understand IF / ELSE logic
* [ ] Compare values
* [ ] Check whether data exists
* [ ] Route records into different paths
* [ ] Handle multiple conditions
* [ ] Understand AND conditions
* [ ] Understand OR conditions
* [ ] Create fallback/default paths

### Example

```text
New Lead
   ↓
Lead Temperature
   ↓
Hot → Sales Team
Warm → Follow-up Workflow
Cold → Nurture Campaign
```

### Business problem

Not every customer, lead, transaction, or request should receive the same action.

---

# FEATURE 04 — Lab 03: APIs & Webhooks

Teach learners how different applications communicate with each other.

### Concepts

* [ ] Understand what an API is
* [ ] Understand what a webhook is
* [ ] Understand API vs webhook
* [ ] Receive webhook data in n8n
* [ ] Send HTTP requests
* [ ] Understand GET requests
* [ ] Understand POST requests
* [ ] Understand request headers
* [ ] Understand request body
* [ ] Understand query parameters
* [ ] Understand API responses
* [ ] Understand HTTP status codes
* [ ] Test endpoints using Postman

### Business problem

Businesses use many different applications that need to exchange information automatically.

---

# FEATURE 05 — Lab 04: Validation & Normalization

Teach learners how to verify and clean incoming data before using it.

### Concepts

* [ ] Check required fields
* [ ] Validate email addresses
* [ ] Validate common data types
* [ ] Detect missing values
* [ ] Trim unnecessary spaces
* [ ] Convert text to lowercase when needed
* [ ] Standardize phone numbers
* [ ] Standardize dates
* [ ] Reject invalid records
* [ ] Route invalid records separately

### Example

Input:

```text
" MARK@GMAIL.COM "
```

Normalized:

```text
mark@gmail.com
```

### Business problem

Bad or inconsistent data can cause:

* duplicate contacts
* failed API requests
* broken reports
* incorrect customer information
* failed automations

---

# FEATURE 06 — Lab 05: Pagination & Large Data Processing

Teach learners how to process more records than an API allows in one request.

### Concepts

* [ ] Understand API pagination
* [ ] Understand page limits
* [ ] Read pagination metadata
* [ ] Request the next page
* [ ] Loop until all pages are processed
* [ ] Stop the loop correctly
* [ ] Combine results
* [ ] Process large datasets safely

### Example

```text
10,000 Contacts

API limit:
100 contacts per request

Page 1
↓
Page 2
↓
Page 3
↓
...
↓
Finished
```

### Business problem

Real businesses can have thousands or millions of records that cannot be retrieved in one API request.

---

# FEATURE 07 — Lab 06: Retry Logic & Exponential Backoff

Teach learners how automations recover from temporary failures.

### Concepts

* [ ] Understand temporary vs permanent errors
* [ ] Detect failed API requests
* [ ] Retry failed requests
* [ ] Set a maximum retry count
* [ ] Add delays between retries
* [ ] Understand exponential backoff
* [ ] Handle HTTP 429 rate limits
* [ ] Handle temporary server errors
* [ ] Stop retrying when appropriate
* [ ] Record retry attempts

### Example

```text
Request
↓
Failed
↓
Wait 2 seconds
↓
Retry
↓
Failed
↓
Wait 4 seconds
↓
Retry
```

### Business problem

External APIs and services can temporarily fail even when the automation itself is correct.

---

# FEATURE 08 — Lab 07: Idempotency & Duplicate Protection

Teach learners how to prevent the same event from being processed multiple times.

### Concepts

* [ ] Understand duplicate events
* [ ] Understand idempotency
* [ ] Identify unique event IDs
* [ ] Store processed IDs
* [ ] Check whether an event was already processed
* [ ] Stop duplicate processing
* [ ] Allow new events to continue
* [ ] Test duplicate webhook delivery

### Example

```text
Webhook
↓
Check Event ID
↓
Already processed?

YES → Stop
NO → Process
```

### Business problem

Duplicate processing can create:

* duplicate orders
* duplicate contacts
* duplicate invoices
* repeated messages
* incorrect payments
* duplicated database records

---

# FEATURE 09 — Lab 08: Dead Letter Queue & Failure Recovery

Teach learners how to safely store automation failures that could not be fixed automatically.

### Concepts

* [ ] Understand Dead Letter Queue
* [ ] Detect unrecoverable failures
* [ ] Store failed payloads
* [ ] Store error messages
* [ ] Store retry count
* [ ] Store failure timestamps
* [ ] Store failure status
* [ ] Review failed jobs
* [ ] Reprocess failed jobs manually
* [ ] Mark resolved failures

### Example stored failure

```text
event_id
payload
error_message
retry_count
failed_at
status
```

### Business problem

Important customer or transaction data should not disappear simply because an automation failed.

---

# FEATURE 10 — Lab 09: Structured AI Output

Teach learners how to use AI safely inside deterministic automation workflows.

### Concepts

* [ ] Send structured information to an AI model
* [ ] Request JSON output
* [ ] Define expected fields
* [ ] Validate AI responses
* [ ] Handle malformed AI output
* [ ] Use AI classification
* [ ] Use AI confidence scoring
* [ ] Use AI recommendations
* [ ] Route automation based on structured AI output

### Example

```json
{
  "intent": "pricing",
  "priority": "high",
  "confidence": 0.94,
  "recommended_action": "contact_sales"
}
```

### Business problem

Normal AI responses are unpredictable text.

Automation systems need predictable data that other workflows can understand.

---

# FEATURE 11 — Lab 10: AI Guardrails & Human-in-the-Loop

Teach learners when AI should act automatically and when a human should review the decision.

### Concepts

* [ ] Understand AI guardrails
* [ ] Define actions AI is allowed to perform
* [ ] Define actions requiring human approval
* [ ] Use confidence thresholds
* [ ] Create approval requests
* [ ] Store pending approvals
* [ ] Approve an AI recommendation
* [ ] Reject an AI recommendation
* [ ] Continue workflow after approval
* [ ] Log human decisions

### Example

```text
AI Recommendation
       ↓
Confidence Check
      / \
     /   \
  High    Low
   ↓       ↓
Action   Human Review
```

### Business problem

Businesses should not allow AI to automatically perform every action, especially actions involving customers, money, or sensitive decisions.

---

# FEATURE 12 — Business-Based Lab Scenarios

Each lab should use realistic business problems instead of random examples.

### Possible scenarios

* [ ] Lead management
* [ ] CRM automation
* [ ] Customer support requests
* [ ] Appointment workflows
* [ ] Sales follow-ups
* [ ] Form submissions
* [ ] Order processing
* [ ] Data synchronization
* [ ] Customer onboarding
* [ ] AI classification

### Requirement

Every lab must explain why the automation would matter to a real business.

---

# FEATURE 13 — Guided Build Mode

Students should be able to follow each lab step-by-step.

### Requirements

* [ ] Explain the workflow before building
* [ ] Show the expected automation flow
* [ ] Build one logical step at a time
* [ ] Explain why each important node exists
* [ ] Use clear custom node names
* [ ] Provide configuration guidance
* [ ] Explain important field mappings
* [ ] Explain important JavaScript when used
* [ ] Avoid unnecessary complexity

### Node explanation format

For important nodes:

```text
Node Name

What:
What the node does.

Purpose:
Why it exists in this workflow.

Business Reason:
Why a real business would need it.
```

---

# FEATURE 14 — Test Scenarios

Every lab must include testing.

### Required tests

* [ ] Create a successful test
* [ ] Define test input
* [ ] Define expected output
* [ ] Run the automation
* [ ] Compare actual vs expected result
* [ ] Confirm important database changes
* [ ] Confirm important API responses

### Goal

Learners should not assume an automation works just because the workflow finished without errors.

---

# FEATURE 15 — Failure Scenarios

Every lab should intentionally demonstrate how the automation can fail.

### Requirements

* [ ] Create at least one intentional failure
* [ ] Explain why the failure happened
* [ ] Show where to inspect the error
* [ ] Identify the root cause
* [ ] Fix the problem
* [ ] Run the test again
* [ ] Confirm the fix

### Goal

Teach debugging instead of teaching only the happy path.

---

# FEATURE 16 — Independent Challenges

After every guided lab, learners should solve a related problem with less guidance.

### Requirements

* [ ] Provide a clear problem statement
* [ ] Provide required input
* [ ] Provide expected result
* [ ] Define important requirements
* [ ] Avoid immediately showing the full solution
* [ ] Provide optional hints
* [ ] Provide a way to verify the final result

### Challenge difficulty

Challenges should increase gradually as learners progress through the labs.

---

# FEATURE 17 — Supabase Integration

Supabase will be used when persistent data is needed.

### Possible uses

* [ ] Store execution logs
* [ ] Store processed event IDs
* [ ] Store failed jobs
* [ ] Store retry information
* [ ] Store human approval requests
* [ ] Store AI results
* [ ] Store test data

### Requirement

Do not use Supabase when simple in-memory data is enough for the lesson.

The database should support the engineering concept, not add unnecessary complexity.

---

# FEATURE 18 — JavaScript Engineering Practice

Some labs should include small JavaScript exercises where code is better than using only n8n nodes.

### Possible uses

* [ ] Data transformation
* [ ] Validation
* [ ] Custom calculations
* [ ] JSON manipulation
* [ ] Retry calculations
* [ ] Utility functions
* [ ] Response parsing

### Goal

Help learners become comfortable with automation engineering beyond drag-and-drop workflow building.

---

# FEATURE 19 — API Testing with Postman

Use Postman when API behavior needs to be inspected directly.

### Learners should practice

* [ ] Sending GET requests
* [ ] Sending POST requests
* [ ] Adding headers
* [ ] Adding JSON request bodies
* [ ] Reading responses
* [ ] Reading HTTP status codes
* [ ] Triggering n8n webhooks manually
* [ ] Testing invalid payloads

---

# FEATURE 20 — Logging & Observability

Teach learners how to understand what happened inside an automation.

### Requirements

* [ ] Record important execution information
* [ ] Record success status
* [ ] Record failure status
* [ ] Record timestamps
* [ ] Record important IDs
* [ ] Record error messages
* [ ] Avoid logging passwords or secrets
* [ ] Make failures traceable

### Goal

A developer should be able to investigate why something happened without guessing.

---

# FEATURE 21 — Environment & Secret Management

Teach safe handling of API credentials and configuration.

### Requirements

* [ ] Use environment variables where appropriate
* [ ] Keep API keys out of source code
* [ ] Do not commit `.env` secrets
* [ ] Provide `.env.example` when needed
* [ ] Explain which credentials students need
* [ ] Avoid exposing secrets in screenshots
* [ ] Avoid logging sensitive credentials

---

# FEATURE 22 — Reusable Sample Data

Labs should include test data students can use immediately.

### Requirements

* [ ] Include valid sample data
* [ ] Include invalid sample data
* [ ] Include edge-case data when relevant
* [ ] Keep examples easy to understand
* [ ] Avoid real personal/customer information
* [ ] Use consistent fake companies and contacts when possible

---

# FEATURE 23 — Workflow Diagrams

Every major lab should include a simple visual representation of the automation.

### Requirements

* [ ] Show trigger
* [ ] Show processing steps
* [ ] Show decisions
* [ ] Show external systems
* [ ] Show final result
* [ ] Show important failure paths

### Example

```text
Webhook
   ↓
Validate
   ↓
Normalize
   ↓
API Request
   ↓
Success?
 /       \
Yes       No
 ↓         ↓
Done     Retry
```

---

# FEATURE 24 — Lab Documentation

Each lab must contain its own documentation.

### Each lab README should contain

* [ ] Lab title
* [ ] Difficulty
* [ ] Concept
* [ ] What the learner will build
* [ ] Simple explanation
* [ ] Business problem
* [ ] Architecture
* [ ] Requirements
* [ ] Setup
* [ ] Guided build
* [ ] Successful test
* [ ] Failure test
* [ ] Debugging section
* [ ] Challenge
* [ ] Expected result
* [ ] What You Learned

---

# FEATURE 25 — Progressive Difficulty

The labs should gradually become harder.

### Beginner

* [ ] Lab 01 — Data Mapping & Transformation
* [ ] Lab 02 — Conditions & Routing

### Intermediate

* [ ] Lab 03 — APIs & Webhooks
* [ ] Lab 04 — Validation & Normalization
* [ ] Lab 05 — Pagination & Large Data

### Reliability Engineering

* [ ] Lab 06 — Retry Logic & Exponential Backoff
* [ ] Lab 07 — Idempotency
* [ ] Lab 08 — Dead Letter Queue

### AI Automation Engineering

* [ ] Lab 09 — Structured AI Output
* [ ] Lab 10 — AI Guardrails & Human-in-the-Loop

---

# FEATURE 26 — Capstone: AI Service Request Agent

After completing the labs, learners will combine multiple concepts into one larger automation.

### Core flow

```text
Incoming Request
       ↓
Validation
       ↓
Normalization
       ↓
Duplicate Check
       ↓
AI Classification
       ↓
Decision / Routing
       ↓
Confidence Check
      / \
     /   \
Automatic Human
 Action   Review
    ↓
External API
    ↓
Success?
 /       \
Yes       No
 ↓         ↓
Log       Retry
            ↓
           DLQ
```

### Capstone requirements

* [ ] Receive a service request
* [ ] Validate incoming data
* [ ] Normalize data
* [ ] Prevent duplicate processing
* [ ] Classify request using AI
* [ ] Produce structured AI output
* [ ] Calculate/use confidence score
* [ ] Route request
* [ ] Require human approval when needed
* [ ] Call an external service/API
* [ ] Handle temporary failures
* [ ] Retry failed requests
* [ ] Send unrecoverable failures to DLQ
* [ ] Log important execution information
* [ ] Test successful scenario
* [ ] Test duplicate scenario
* [ ] Test API failure
* [ ] Test AI failure
* [ ] Test human approval path

---

# FEATURE 27 — AEP Learning Agent

Build an AI tutor using n8n after the main learning system and capstone are complete.

The agent should help learners understand and debug labs without immediately solving everything for them.

### Core abilities

* [ ] Answer questions about AEP concepts
* [ ] Understand which lab the student is working on
* [ ] Explain concepts in simple language
* [ ] Explain business use cases
* [ ] Help interpret errors
* [ ] Suggest debugging steps
* [ ] Provide hints for challenges
* [ ] Avoid immediately providing challenge solutions
* [ ] Provide full explanations when appropriate
* [ ] Reference relevant AEP documentation
* [ ] Admit when information is not available

### Tutor behavior

Preferred behavior:

```text
Student Question
       ↓
Understand Lab Context
       ↓
Explain Concept
       ↓
Ask/identify what failed
       ↓
Give Hint
       ↓
Help Debug
       ↓
Explain Why the Fix Works
```

### Guardrails

* [ ] Do not invent project requirements
* [ ] Do not claim a workflow works without evidence
* [ ] Do not immediately give complete challenge answers
* [ ] Encourage learners to investigate first
* [ ] Keep explanations beginner-friendly
* [ ] Provide deeper technical explanation when requested

---

# FEATURE 28 — Student-Friendly Usage

The project should be usable by people other than the original developer.

### Requirements

* [ ] Clear project setup instructions
* [ ] Clear prerequisites
* [ ] Easy navigation between labs
* [ ] Consistent lab structure
* [ ] Clear difficulty labels
* [ ] Clear testing instructions
* [ ] No dependency on private credentials
* [ ] Use mock data where possible
* [ ] Explain required external accounts/tools
* [ ] Keep setup complexity reasonable

---

# FEATURE 29 — Instructor / Academy Friendly Structure

AEP should be easy to share with an instructor or academy as supplementary learning material.

### Requirements

* [ ] Labs can be completed independently
* [ ] Instructor can assign a specific lab
* [ ] Challenges have clear requirements
* [ ] Expected outcomes are documented
* [ ] Labs do not require access to the creator's private systems
* [ ] Concepts follow a logical learning progression
* [ ] Documentation can be understood without watching a video
* [ ] The system can be demonstrated easily

---

# FEATURE 30 — Portfolio Presentation

The completed project should clearly demonstrate Automation Engineering ability.

### Main README should eventually include

* [ ] Project overview
* [ ] Problem being solved
* [ ] Why the project was created
* [ ] Technologies used
* [ ] Lab overview
* [ ] Architecture overview
* [ ] Capstone overview
* [ ] AEP Learning Agent overview
* [ ] Screenshots
* [ ] Workflow diagrams
* [ ] Engineering concepts demonstrated
* [ ] Testing approach
* [ ] Reliability features
* [ ] Project limitations
* [ ] Future improvements

### Portfolio positioning

Until used externally:

> Designed and built a reusable hands-on Automation Engineering learning system focused on real-world workflows, reliability, debugging, and AI automation.

If officially adopted by an academy, the portfolio description can later mention its real-world use.

---

# FEATURE 31 — Completion Tracking

Use the repository itself to track development progress.

### Status labels

Each feature or lab may use:

```text
⬜ Not Started
🟡 In Progress
🧪 Testing
✅ Completed
```

### Completion rule

A lab should only be considered completed when:

* [ ] Guided build works
* [ ] Successful test passes
* [ ] Failure scenario has been tested
* [ ] Debugging instructions are verified
* [ ] Challenge is complete
* [ ] Documentation is complete
* [ ] No secrets are committed

---

# Out of Scope for V1

To keep AEP focused, the following are not required for the first version:

* Student login system
* Full Learning Management System
* Certificates
* Student grades
* Paid subscriptions
* Course payments
* Notifications
* Complex frontend dashboard
* Mobile application
* Multi-agent AI system
* Production-scale hosting infrastructure

These may be considered later only if they solve a real need.

---

# Definition of Done

AEP V1 is complete when:

* [ ] All 10 labs are built
* [ ] All labs contain the standard learning structure
* [ ] All labs have successful test scenarios
* [ ] All labs have failure scenarios
* [ ] All labs include challenges
* [ ] All lab documentation is complete
* [ ] Capstone project is working
* [ ] Capstone failure paths are tested
* [ ] AEP Learning Agent is working
* [ ] Main project README is complete
* [ ] Repository contains no exposed secrets
* [ ] Project is understandable by someone who did not build it
* [ ] Project is ready to demonstrate or share with students
