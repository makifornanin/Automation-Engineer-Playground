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
  "name": "Dana Reyes",
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
" DANA.REYES@EXAMPLE.COM "
```

Normalized:

```text
dana.reyes@example.com
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

# FEATURE 19 — AEP Test Console & Optional Postman

The AEP website should be the **primary learner-facing API/webhook testing tool**.

Learners should not need to keep switching between AEP, n8n, Postman, and Supabase for normal lab work.

### Primary learner flow

```text
AEP Lesson
   ↓
Send Test
   ↓
AEP Backend
   ↓
Learner n8n Webhook
   ↓
AEP Evaluator
   ↓
Expected vs Actual + Diagnostics
```

### Requirements

* [ ] Put the test experience inside the relevant lab/lesson chunk
* [ ] Save the learner's webhook URL once per lab
* [ ] Provide clear predefined business test cases
* [ ] Let learners preview the JSON payload when useful
* [ ] Send tests through the AEP backend instead of relying on direct browser-to-webhook calls
* [ ] Handle timeouts and connection failures clearly
* [ ] Show expected vs actual behavior
* [ ] Show checkpoint-level diagnostics when possible
* [ ] Keep raw request/response details behind progressive disclosure
* [ ] Include execution IDs when available
* [ ] Let Kaz use test evidence as context
* [ ] Never claim a test passed without evidence

### Postman

Postman remains useful as an **optional developer/advanced inspection tool**, not a required learner tab for every lab.

Learners may still practice direct API testing when the lesson specifically teaches it.

### Goal

The normal learner workspace should stay close to:

```text
AEP | n8n | Supabase (only when the lab needs persistence)
```

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

# FEATURE 24 — Lab Documentation & Website Lesson Source

Each lab must contain complete source documentation that can also be transformed into the AEP website learning experience.

### Each lab README/source should contain

* [ ] Lab title
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
* [ ] What You Learned / What Did We Just Use?
* [ ] Important node explanations
* [ ] Important code explanations
* [ ] Bridge to the next lab

### Website rule

The website should turn this material into interactive lesson chunks instead of dumping raw README content onto one page.

Do not show learner-facing difficulty badges. Progression and prerequisites should communicate sequencing without making the learner anxious before starting.

---

# FEATURE 25 — Progressive Learning Journey

The labs should gradually become more capable and more complex without labeling learners with intimidating difficulty badges.

### Website learning groups

#### Foundations

* [ ] Lab 01 — Data Mapping & Transformation
* [ ] Lab 02 — Conditions & Routing
* [ ] Lab 03 — APIs & Webhooks
* [ ] Lab 04 — Validation & Normalization

#### Reliability

* [ ] Lab 05 — Pagination & Large Data Processing
* [ ] Lab 06 — Retry Logic & Exponential Backoff
* [ ] Lab 07 — Idempotency & Duplicate Protection
* [ ] Lab 08 — Dead Letter Queue & Failure Recovery

#### AI Engineering

* [ ] Lab 09 — Structured AI Output
* [ ] Lab 10 — AI Guardrails & Human-in-the-Loop

#### Capstone

* [ ] AI Service Request Agent

### Learner-facing rule

Do not display `Beginner`, `Intermediate`, or `Advanced` badges in the website UI.

Future labs may be previewed, but their hands-on sections remain locked until the required previous lab is completed.

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

# FEATURE 27 — Kaz: AEP AI Teacher

Build **Kaz**, the n8n-powered AI teacher inside AEP.

Kaz is a teacher first and chatbot second. She should help learners understand concepts, interpret evidence, and debug their work without replacing the learning process.

### Identity

* [ ] Kaz is female in personality/identity
* [ ] Kaz is calm by default
* [ ] Kaz is jolly and playful when appropriate
* [ ] Kaz may occasionally tease or use controlled fake scares
* [ ] Kaz becomes quieter, more precise, and more supportive when the learner struggles
* [ ] Kaz motivates using specific learner progress rather than generic praise

### Core abilities

* [ ] Answer questions about AEP concepts
* [ ] Understand the current lab and lesson section
* [ ] Explain concepts in simple language
* [ ] Explain business use cases
* [ ] Interpret AEP test/checkpoint evidence
* [ ] Suggest debugging steps
* [ ] Provide progressive challenge hints
* [ ] Avoid immediately providing challenge solutions
* [ ] Provide deeper explanations when requested
* [ ] Reference relevant AEP documentation
* [ ] Admit when information is unavailable
* [ ] Respect English, Tagalog, or Taglish preference

### Teaching modes

* [ ] Intro Mode
* [ ] Teach Mode
* [ ] Build Mode
* [ ] Test Mode
* [ ] Debug Mode
* [ ] Challenge Mode
* [ ] Celebration Mode
* [ ] Chat Mode

### Proactive behavior

Kaz may proactively appear at meaningful events:

* [ ] New lab start
* [ ] Important concept introduction
* [ ] Test success
* [ ] Test failure
* [ ] Repeated failure
* [ ] Break It
* [ ] Debug It
* [ ] Challenge completion
* [ ] Lab completion
* [ ] Next-lab unlock
* [ ] Return after being away

Kaz may make rare one-line side comments with a cooldown. She should not interrupt important explanations or learners who are already struggling.

### Visual identity

* [ ] Small mysterious alien orb
* [ ] Chrome/glass surface
* [ ] Subtle blue glow in Light mode
* [ ] Subtle coral/red glow in Dark mode
* [ ] Neutral, Thinking, Amused, Uh-oh, Celebrating, and Focused visual states
* [ ] Small speech bubble for proactive comments
* [ ] Clicking the orb opens Ask Kaz
* [ ] No large mascot animation or intrusive modal

### Architecture

```text
AEP Website
   ↓
AEP Backend
   ↓
n8n Kaz Workflow
   ↓
Learner Context + Teaching Rules + Knowledge Retrieval
   ↓
LLM
   ↓
Validated Kaz Response
   ↓
AEP
```

### Knowledge source

Preferred approach:

```text
AEP Git Repository / Course Content
   ↓
Chunk + Index
   ↓
Embeddings
   ↓
Supabase Vector Knowledge Base
   ↓
Kaz Retrieval
```

### Guardrails

* [ ] Do not invent project requirements
* [ ] Do not claim a workflow works without evidence
* [ ] Do not contradict AEP test results
* [ ] Do not invent node execution results
* [ ] Do not immediately reveal challenge answers
* [ ] Increase hint strength based on `hints_used`
* [ ] Keep answers relevant to the learner's current lab
* [ ] Treat learner test evidence as authoritative

### Memory

Persistent learner context:

* [ ] selected language
* [ ] completed labs
* [ ] current lab
* [ ] current section
* [ ] concepts already encountered
* [ ] important progress state

Short-term Kaz context:

* [ ] recent questions
* [ ] recent test results
* [ ] current debugging issue
* [ ] recent mistakes
* [ ] hints already shown

### Goal

Kaz should feel human because of **timing and context**, not because she talks constantly.

---

# FEATURE 28 — Student-Friendly Website Experience

The project should be usable by people other than the original developer through a focused AEP web application.

### Requirements

* [ ] Clear prerequisites
* [ ] Clear required accounts/tools
* [ ] Invite-only passwordless access
* [ ] Easy navigation between Home, Labs, Notes, Kaz, and Settings
* [ ] Consistent lab structure
* [ ] Clear progression and prerequisites without difficulty badges
* [ ] Sequential hands-on unlocking with future-lab preview
* [ ] Clear testing instructions
* [ ] No dependency on the creator's private credentials
* [ ] Use mock/simulated data where possible
* [ ] Keep setup complexity reasonable
* [ ] Keep the normal learner workspace centered on AEP + n8n + Supabase when needed
* [ ] Support English, Tagalog, and Taglish
* [ ] Preserve progress across sessions
* [ ] Avoid unnecessary analytics, goals, leaderboards, and LMS clutter

### Core UX rule

> **AEP should feel easier than n8n.**

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

# FEATURE 32 — AEP Website Foundation & Visual System

Build the learner-facing AEP web application.

### Stack

* [ ] Next.js App Router
* [ ] TypeScript
* [ ] Tailwind CSS
* [ ] Motion for polished interaction
* [ ] Supabase for authentication and persistence — *first used in Phase 11; Phase 10 installs no Supabase package, client or environment variable*
* [ ] Vercel-compatible deployment

### Visual direction

* [ ] Apple-inspired simplicity
* [ ] Chrome/glass finish
* [ ] Calm premium UI
* [ ] Generous whitespace
* [ ] Controlled accent color
* [ ] Progressive disclosure instead of dense screens
* [ ] No giant dashboard or full-height rectangular sidebar

### Themes

#### Light

* [ ] Soft white/light gray background
* [ ] White/frosted surfaces
* [ ] Restrained blue accent
* [ ] Near-black text

#### Dark

* [ ] Near-black/charcoal background
* [ ] Frosted dark surfaces
* [ ] Restrained n8n-inspired coral/red-orange accent
* [ ] Soft white text

### Floating navigation dock

* [ ] Icon-first floating glass dock
* [ ] Hover/focus expands the active item and reveals its label
* [ ] Nearby icons may subtly magnify
* [ ] Click uses a small compression/spring release
* [ ] Smooth page transitions
* [ ] Home, Labs, Notes, Kaz, Settings
* [ ] Admin item only for the owner/admin role — *presentation only until Phase 11 adds server-side enforcement; the /admin route itself is unprotected in Phase 10*
* [ ] Keyboard/focus behavior must match hover behavior

---

# FEATURE 33 — Invite-Only Passwordless Access

AEP is private and invite-only for the first version.

### Student access flow

```text
Owner enters email
   ↓
AEP sends invite
   ↓
Learner opens invite
   ↓
Email verified
   ↓
Secure account/session created
   ↓
Onboarding
   ↓
AEP
```

### Requirements

* [ ] No password creation required
* [ ] Use secure magic-link/passwordless sessions
* [ ] Restore active sessions on future visits
* [ ] Provide a recoverable magic-link flow when the session expires
* [ ] Student role is the safe default
* [ ] Never expose service-role/admin credentials to browser code
* [ ] Invite actions must be enforced server-side

---

# FEATURE 34 — Owner Role & Minimal Admin Section

The creator uses the same AEP application and learning experience as every student.

The only extra capability is an **Admin** navigation item.

### Admin capabilities

* [ ] Invite a student by email
* [ ] See invited/active/revoked users
* [ ] Resend an invite
* [ ] Revoke access

### Explicitly not required

* Student progress surveillance
* Grades
* Leaderboards
* Large admin analytics
* Separate admin application

Admin authorization must be enforced server-side, not only by hiding the navigation item.

---

# FEATURE 35 — Home & Labs Journey

## Home

Keep Home intentionally minimal.

### Content

* [ ] Greeting
* [ ] Continue Learning
* [ ] Current lab progress
* [ ] Lightweight Your Journey indicator
* [ ] Short contextual note from Kaz
* [ ] Ask Kaz entry
* [ ] Notes shortcut

Do not add goals, giant stat cards, analytics clutter, or unnecessary activity feeds.

## Labs

Use a hybrid journey layout:

1. one featured current-lab card
2. grouped curriculum below

### Groups

* [ ] Foundations — Labs 01–04
* [ ] Reliability — Labs 05–08
* [ ] AI Engineering — Labs 09–10
* [ ] Capstone

### Lab row

Show only:

* [ ] lab number
* [ ] title
* [ ] short human/Kaz-style description
* [ ] completed/current/preview-locked status
* [ ] progress when currently in progress
* [ ] Preview action for future labs

---

# FEATURE 36 — Focus Mode Lesson Engine

The Lesson screen should reduce cognitive load while still teaching deeply.

### Core behavior

* [ ] One meaningful learning chunk at a time
* [ ] Thin lab progress/header
* [ ] One central learning column
* [ ] Generous whitespace
* [ ] Kaz and Notes remain collapsible
* [ ] Avoid one giant scrolling lesson
* [ ] Avoid a permanent table of contents
* [ ] Avoid one click per sentence

### Chunk rule

A normal chunk may contain:

* [ ] one concept
* [ ] one short explanation
* [ ] 2–4 related learner actions
* [ ] one meaningful transition

Target roughly **6–10 meaningful interactions per normal lab**.

> One click should move the learner to a new thought, not merely reveal the next sentence.

### Build chunk structure

* [ ] Why this matters
* [ ] Small visual when useful
* [ ] Your turn — 2–4 concrete actions
* [ ] Why we're doing this
* [ ] Done — Next

### In-lab progress

* [ ] Default thin progress indicator
* [ ] Expandable section roadmap
* [ ] Completed/current/not-yet-completed states
* [ ] Allow revisiting completed sections

---

# FEATURE 37 — Learner Progress & Sequential Unlocking

AEP tracks progress for the learner's own experience and for Kaz context.

### Requirements

* [ ] Persist current lab
* [ ] Persist current section/chunk
* [ ] Persist milestone completion
* [ ] Persist lab completion
* [ ] Unlock the next lab after required proof is complete
* [ ] Allow future-lab preview without hands-on access
* [ ] Restore the learner to the right place on return
* [ ] Use progress for contextual Kaz messages
* [ ] Do not expose learner progress to the owner as a monitoring dashboard

### Meaningful milestones

Examples:

* Understand the Problem
* Guided Build
* Success Test
* Break It
* Debug It
* Challenge
* Make It Your Own
* Recap

---

# FEATURE 38 — Learning Notes

Notes are a learning notebook, not a productivity system.

### Requirements

* [ ] General notes
* [ ] Lab-linked notes
* [ ] Code snippets
* [ ] Debugging observations
* [ ] "Aha" moments
* [ ] Autosave
* [ ] Open Notes from navigation
* [ ] Open Notes as a lesson-side utility
* [ ] Save to Notes from useful Kaz/lesson content
* [ ] Notes and Kaz do not occupy the side utility area at the same time

Do not add task management or goals.

---

# FEATURE 39 — Inline Test Runner & Smart Diagnostics

Testing belongs inside the relevant lab.

### Default experience

* [ ] Show business test case first
* [ ] One clear Send Test action
* [ ] Save webhook URL per learner + lab
* [ ] Show simple checkpoint result
* [ ] Show expected vs actual
* [ ] Let learner Try Again
* [ ] Let learner Ask Kaz
* [ ] Hide raw technical data by default

### Technical details on demand

* [ ] Raw request
* [ ] Raw response
* [ ] Checkpoint data
* [ ] Execution ID
* [ ] Deeper n8n details when connected

### Diagnostic goal

AEP should be able to say things like:

> “Your webhook and validation are healthy. The issue starts around routing.”

---

# FEATURE 40 — Optional Learner n8n API Connection

AEP diagnostics must work without requiring n8n API access.

Learners may optionally connect their n8n instance for deeper diagnostics.

### Optional capabilities

* [ ] Inspect relevant execution details
* [ ] See node-level status
* [ ] Identify a more exact failure location
* [ ] Provide richer Kaz debugging context

### Security

* [ ] Store connection secrets securely
* [ ] Never expose connection secrets in client output or logs
* [ ] Provide disconnect/revoke behavior
* [ ] Treat this as optional advanced setup

---

# FEATURE 41 — Supabase Guidance Inside Labs

When a lab needs persistence, AEP itself guides the learner through setup.

### Teaching order

* [ ] Explain the problem that requires persistence first
* [ ] Explain why Supabase solves that problem
* [ ] Give SQL/setup instructions
* [ ] Provide Copy SQL
* [ ] Use a cropped screenshot only when the UI location is genuinely hard to find
* [ ] Explain important tables/columns in simple language
* [ ] Put deeper SQL explanation behind progressive disclosure
* [ ] Verify persistence later through actual workflow behavior

Do not require learners to hand AEP full Supabase admin/service credentials solely for setup verification.

---

# FEATURE 42 — Interactive Diagrams & Learning Visuals

Use visuals only when they improve understanding.

### Diagram rule

> Diagram = how it works.

### Screenshot rule

> Screenshot = where to find/configure it.

### Interactive diagrams

* [ ] Hover reveals quick explanation
* [ ] Click reveals slightly deeper explanation
* [ ] Explain component purpose
* [ ] Explain input/output when useful
* [ ] Show common mistake when useful
* [ ] Keep motion subtle
* [ ] Diagram remains understandable without interaction

Avoid decorative diagrams that add no teaching value.

---

# FEATURE 43 — Language, Theme & Learner Settings

### Language

AEP supports:

* [ ] English
* [ ] Tagalog
* [ ] Taglish

Tagalog and Taglish must remain conversational and avoid unnecessarily deep Filipino words.

Keep technical terms in English when clearer.

### Settings

* [ ] Language
* [ ] Light/Dark theme
* [ ] Optional n8n connection
* [ ] Profile/session basics

Lesson content and Kaz should both respect the selected language.

---

# FEATURE 44 — Kaz On-Screen Companion

Kaz's AI capability is defined in Feature 27. This feature defines how she appears inside the website.

### Requirements

* [ ] Small mysterious alien orb near the lesson utility area
* [ ] Visible but unobtrusive
* [ ] Small speech bubble for proactive comments
* [ ] Bubble fades quietly if ignored
* [ ] Click orb to open Ask Kaz
* [ ] Reuse the side utility panel used by Notes
* [ ] Rare side comments with cooldown
* [ ] No repeated interruption
* [ ] No teasing while learner is clearly struggling
* [ ] Subtle visual states for neutral/thinking/amused/uh-oh/celebrating/focused

---

# FEATURE 45 — Completion Experience

Finishing AEP should feel earned.

### Completion condition

* [ ] Labs 01–10 complete
* [ ] Capstone complete

### Experience

Kaz hands the moment to the creator:

> “I think someone else should take this one.”

Then the learner sees a personal completion message from the AEP creator.

Do not reduce completion to a generic congratulations card.

---

# FEATURE 46 — Website Security, Accessibility & Quality

### Security

* [ ] Keep server-only credentials server-side
* [ ] Enforce Admin authorization server-side
* [ ] Validate server actions/API inputs
* [ ] Do not expose secrets in client bundles
* [ ] Do not log sensitive credentials
* [ ] Protect optional n8n connection secrets
* [ ] Maintain safe session handling

### Accessibility

* [ ] Keyboard navigation
* [ ] Visible focus states
* [ ] Hover interactions also work through keyboard/focus
* [ ] Semantic controls and labels
* [ ] Reduced-motion support
* [ ] Theme contrast checks

### Quality

* [ ] Typecheck
* [ ] Lint
* [ ] Automated tests
* [ ] Production build
* [ ] Error/loading/empty states
* [ ] Reasonable desktop and responsive web behavior
* [ ] No native mobile app required for V1


---

# Out of Scope for V1

AEP V1 is a focused learning web application, **not a general-purpose LMS**.

The following remain out of scope unless a real learner need appears:

* Paid subscriptions
* Course payments
* Student grades
* Leaderboards
* Owner/instructor progress surveillance
* Social feed/community
* Complex analytics dashboards
* Complex role/permission systems beyond `student` and `admin`
* Native mobile application
* Voice/video tutoring
* Production-scale enterprise/multi-tenant infrastructure
* Unnecessary gamification
* Large standalone admin product

Certificates may be considered later, but only after the core learning experience is proven.

The website, invite-only access, learner progress, Notes, Kaz, and smart diagnostics are now **in scope** for AEP V1.

---

# Definition of Done

AEP V1 is complete when:

## Learning Content

* [ ] All 10 labs are built and verified
* [ ] All labs follow the approved learning structure
* [ ] All labs have success tests
* [ ] All labs have intentional failure/debugging experiences
* [ ] All labs include challenges
* [ ] All lab documentation/source content is complete
* [ ] Capstone is working and packaged
* [ ] Capstone success and failure paths are verified

## Website

* [ ] Invite-only passwordless access works
* [ ] Owner/Admin invite and access controls work
* [ ] Light and Dark themes work
* [ ] Floating glass dock works accessibly
* [ ] Home is complete
* [ ] Labs grouped journey is complete
* [ ] Focus Mode lesson engine is complete
* [ ] Sequential unlocking and progress persistence work
* [ ] Notes work
* [ ] Inline Send Test works for applicable labs
* [ ] Expected-vs-actual and checkpoint diagnostics work
* [ ] Optional n8n connection is secure and usable
* [ ] Supabase setup guidance appears inside applicable labs
* [ ] Interactive diagrams work where useful
* [ ] English, Tagalog, and Taglish settings work

## Kaz

* [ ] Kaz n8n teacher workflow is working
* [ ] Knowledge retrieval is working
* [ ] Kaz receives learner/lab/test context
* [ ] Teaching modes behave correctly
* [ ] Challenge hint guardrails work
* [ ] Kaz does not invent test evidence
* [ ] Kaz's orb/on-screen behavior is complete
* [ ] Kaz tone adapts when learners struggle

## Completion & Release

* [ ] Completion handoff from Kaz to creator message works
* [ ] Main project README is complete
* [ ] Student setup/onboarding is understandable
* [ ] Repository contains no exposed secrets
* [ ] Website passes lint/typecheck/tests/build
* [ ] Core flows have been tested by someone other than the creator when possible
* [ ] Project is ready to demonstrate or share with students
