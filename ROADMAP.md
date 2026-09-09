# Automation Engineer Playground — Build Roadmap

## Project Overview

Automation Engineer Playground (AEP) will be built in phases so the project stays easy to understand, test, and improve.

The build order follows this progression:

```text
Foundation
↓
Learning System
↓
Automation Fundamentals
↓
API Engineering
↓
Reliability Engineering
↓
AI Automation
↓
Capstone
↓
AEP Learning Agent
↓
Student / Academy Polish
↓
Portfolio & Release
```

The goal is to finish each phase properly before moving to the next.

---

# PHASE 0 — Project Foundation

## Goal

Create the project repository, rules, documentation, and basic structure before building any automation.

## Build Checklist

* [/] Create GitHub repository
* [/] Create local `AEP Project` folder
* [/] Connect local project to GitHub
* [/] Initialize Git
* [/] Add `.gitignore`
* [/] Create `CLAUDE.md`
* [/] Create `AGENTS.md`
* [/] Create `FEATURES.md`
* [/] Create `ROADMAP.md`
* [/] Create main `README.md`
* [/] Create initial project folder structure
* [/] Create documentation folder
* [/] Create labs folder
* [/] Create capstone folder
* [/] Create sample-data folder
* [/] Create database folder if needed
* [/] Create scripts/helpers folder if needed
* [/] Make initial Git commit

## Expected Structure

```text
AEP Project/
│
├── README.md
├── CLAUDE.md
├── AGENTS.md
├── FEATURES.md
├── ROADMAP.md
├── .gitignore
│
├── docs/
├── labs/
├── capstone/
├── sample-data/
├── database/
└── scripts/
```

## Phase Complete When

* [/] Repository works locally
* [ ] Repository is connected to GitHub
* [ ] Claude Code can read `CLAUDE.md`
* [ ] Codex can read `AGENTS.md`
* [ ] Project scope is documented
* [ ] No automation has been built prematurely

---

# PHASE 1 — AEP Learning System Foundation

## Goal

Create the standard learning format that every lab will follow.

This prevents us from designing each lab differently later.

## Build Checklist

* [/] Define standard lab folder structure
* [/] Create reusable lab README template
* [/] Add difficulty level
* [/] Add learning objectives section
* [/] Add simple explanation section
* [/] Add business problem section
* [/] Add business example section
* [/] Add architecture / workflow section
* [/] Add prerequisites section
* [/] Add guided build section
* [/] Add sample data section
* [/] Add successful test section
* [/] Add failure scenario section
* [/] Add debugging section
* [/] Add independent challenge section
* [/] Add optional hints section
* [/] Add expected result section
* [/] Add "What You Learned" section

## Standard Lab Flow

```text
Understand
↓
See the Business Problem
↓
View the Architecture
↓
Build
↓
Test
↓
Break It
↓
Debug It
↓
Complete Challenge
↓
Review What You Learned
```

## Phase Complete When

* [/] One reusable lab template exists
* [/] Template is simple enough for a beginner
* [/] Template works for both basic and advanced labs
* [/] Every future lab can follow the same structure

---

# PHASE 2 — Development Environment & Core Tools

## Goal

Prepare the tools and services needed throughout AEP.

## Core Tools

* n8n
* JavaScript
* Supabase
* Postman
* Git / GitHub
* VS Code

## Build Checklist

### n8n

* [/] Confirm local n8n is working
* [/] Create AEP workspace/project organization
* [/] Confirm webhooks work locally
* [/] Confirm workflows can receive test data

### Supabase

* [/] Create or choose AEP Supabase project
* [/] Configure connection safely
* [/] Set up environment variables
* [/] Confirm n8n can read from Supabase
* [/] Confirm n8n can write to Supabase

### Postman

* [/] Create AEP Postman collection
* [/] Add sample GET request
* [/] Add sample POST request
* [/] Test n8n webhook from Postman

### JavaScript

* [/] Decide where reusable helper code will live
* [/] Set basic code conventions
* [/] Confirm JavaScript can be tested independently when necessary

### Secrets

* [/] Create `.env.example` if needed
* [/] Keep real secrets outside Git
* [/] Confirm `.env` is ignored
* [/] Confirm no API keys are committed

## Phase Complete When

* [/] n8n works
* [/] Supabase connection works
* [/] Postman works
* [/] Local testing works
* [/] Secrets are protected
* [/] We can safely begin Lab 01

---

# PHASE 3 — Fundamentals

## Goal

Learn the core logic that almost every automation uses.

---

## Lab 01 — Data Mapping & Transformation

### Build

* [/] Create sample incoming JSON
* [/] Read fields from incoming data
* [/] Rename fields
* [/] Remove unnecessary fields
* [/] Combine fields
* [/] Transform values
* [/] Format final output
* [/] Add JavaScript transformation example
* [/] Add guided build
* [/] Add successful test
* [/] Add failure scenario
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how data is transformed as it moves between different systems.

---

## Lab 02 — Conditions & Routing

### Build

* [/] Create sample business scenario
* [/] Add IF / ELSE condition
* [/] Add multiple routing paths
* [/] Add AND condition
* [/] Add OR condition
* [/] Add fallback path
* [/] Test each route
* [/] Add invalid/unexpected input scenario
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how automation makes decisions.

---

## Phase Complete When

* [/] Lab 01 complete
* [/] Lab 02 complete
* [/] Tests pass
* [/] Failure scenarios verified
* [/] Challenges verified
* [/] Documentation complete
* [/] Learner understands data flow and automation logic

---

# PHASE 4 — API & Data Engineering

## Goal

Learn how automation systems communicate with external applications and process real data.

---

## Lab 03 — APIs & Webhooks

### Build

* [/] Create n8n webhook
* [/] Trigger webhook using Postman
* [/] Receive JSON payload
* [/] Send GET request
* [/] Send POST request
* [/] Add request headers
* [/] Add request body
* [/] Add query parameters
* [/] Inspect API response
* [/] Explore common HTTP status codes
* [/] Test successful request
* [/] Test failed request
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how applications communicate with each other.

---

## Lab 04 — Validation & Normalization

### Build

* [/] Define required fields
* [/] Validate incoming payload
* [/] Detect missing fields
* [/] Validate email
* [/] Normalize email
* [/] Normalize phone number
* [/] Normalize dates
* [/] Trim unwanted spaces
* [/] Route invalid data separately
* [/] Test valid data
* [/] Test invalid data
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand why incoming data should never be trusted automatically.

---

## Lab 05 — Pagination & Large Data Processing

### Build

* [/] Connect to paginated API or mock endpoint
* [/] Retrieve first page
* [/] Read pagination information
* [/] Retrieve next page
* [/] Create looping logic
* [/] Stop loop correctly
* [/] Combine results
* [/] Process records safely
* [/] Test small dataset
* [/] Test multiple pages
* [/] Test pagination failure
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete lab documentation

### Main Learning Outcome

Understand how automation handles datasets larger than one API response.

---

## Phase Complete When

* [/] Labs 03–05 complete
* [/] Webhooks work
* [/] API requests work
* [/] Validation works
* [/] Pagination works
* [/] Failure scenarios tested
* [/] Documentation complete

---

# PHASE 5 — Reliability Engineering

## Goal

Move from automations that simply work to automations that can survive real-world failures.

This is one of the most important phases in AEP.

---

## Lab 06 — Retry Logic & Exponential Backoff

### Build

* [/] Create temporary API failure scenario
* [/] Detect failed request
* [/] Add retry logic
* [/] Add retry counter
* [/] Add maximum retry limit
* [/] Add delay
* [/] Implement exponential backoff
* [/] Handle HTTP 429
* [/] Handle temporary server errors
* [/] Stop retries when necessary
* [/] Log attempts
* [/] Test eventual success
* [/] Test permanent failure
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how systems recover from temporary failures automatically.

---

## Lab 07 — Idempotency & Duplicate Protection

### Build

* [/] Create duplicate webhook scenario
* [/] Generate/use unique event ID
* [/] Create processed-events storage
* [/] Store event IDs
* [/] Check event before processing
* [/] Stop duplicate event
* [/] Allow new event
* [/] Test first delivery
* [/] Test duplicate delivery
* [/] Test different event
* [/] Add debugging exercise
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how to stop duplicate events from causing duplicate actions.

---

## Lab 08 — Dead Letter Queue & Failure Recovery

### Build

* [/] Define unrecoverable failure
* [/] Create DLQ storage
* [/] Save original payload
* [/] Save error message
* [/] Save retry count
* [/] Save timestamps
* [/] Save status
* [/] View failed item
* [/] Create manual reprocessing flow
* [/] Mark successful reprocessing
* [/] Test failed item
* [/] Test recovery
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how to prevent failed data from being permanently lost.

---

## Phase Complete When

* [/] Labs 06–08 complete
* [/] Temporary failures recover automatically
* [/] Duplicate events are protected
* [/] Failed jobs can be recovered
* [/] Reliability concepts are documented
* [/] Failure scenarios verified

---

# PHASE 6 — Logging & Observability Layer

## Goal

Make the system easier to understand and debug by recording important events.

## Build Checklist

* [/] Define standard execution log structure
* [/] Log workflow name
* [/] Log execution ID
* [/] Log event/request ID
* [/] Log timestamps
* [/] Log success/failure status
* [/] Log error messages
* [/] Log retry count when relevant
* [/] Avoid logging secrets
* [/] Add logs to relevant labs
* [/] Confirm failed executions can be traced
* [/] Document how to inspect logs

## Phase Complete When

Given an event ID or execution ID, we can understand:

* [/] What happened
* [/] When it happened
* [/] Where it failed
* [/] Why it failed
* [/] Whether it recovered

---

# PHASE 7 — AI Automation Engineering

## Goal

Learn how to use AI inside automation without relying on unpredictable free-form responses.

---

## Lab 09 — Structured AI Output

### Build

* [/] Create business classification scenario
* [/] Send input to AI
* [/] Define required JSON structure
* [/] Receive structured output
* [/] Validate required AI fields
* [/] Validate values
* [/] Add confidence score
* [/] Add recommended action
* [/] Route based on AI output
* [/] Test valid AI response
* [/] Test malformed AI response
* [/] Add fallback behavior
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand how AI can produce predictable information that automation systems can safely use.

---

## Lab 10 — AI Guardrails & Human-in-the-Loop

### Build

* [/] Define allowed automatic actions
* [/] Define restricted actions
* [/] Create confidence threshold
* [/] Route high-confidence decisions
* [/] Route low-confidence decisions
* [/] Create pending approval record
* [/] Create approval flow
* [/] Create rejection flow
* [/] Resume workflow after approval
* [/] Log human decision
* [/] Test automatic path
* [/] Test approval path
* [/] Test rejection path
* [/] Add challenge
* [/] Complete documentation

### Main Learning Outcome

Understand when AI should act automatically and when a human should take control.

---

## Phase Complete When

* [/] Lab 09 complete
* [/] Lab 10 complete
* [/] AI output is structured
* [/] AI responses are validated
* [/] Guardrails work
* [/] Human approval works
* [/] Failure scenarios tested

---

# PHASE 8 — Lab Quality Review

## Goal

Review all 10 labs as one complete learning experience before building the capstone.

## Build Checklist

### Consistency

* [ ] All labs follow standard structure
* [ ] All labs use clear naming
* [ ] Difficulty progression makes sense
* [ ] Explanations stay beginner-friendly
* [ ] Business examples are realistic

### Testing

* [ ] Every guided build works
* [ ] Every successful test passes
* [ ] Every failure scenario works
* [ ] Every debugging guide is accurate
* [ ] Every challenge can be completed

### Student Experience

* [ ] Instructions are understandable without instructor help
* [ ] Required accounts/tools are clearly explained
* [ ] Sample data is provided
* [ ] Expected results are clear
* [ ] No private credentials are required

### Security

* [ ] No secrets committed
* [ ] No real customer information
* [ ] No exposed API credentials

## Phase Complete When

Someone other than the creator could reasonably complete the labs using the documentation.

---

# PHASE 9 — Capstone: AI Service Request Agent

## Goal

Combine the important concepts from the labs into one realistic Automation Engineering system.

## Step 1 — Capstone Design

* [ ] Define business problem
* [ ] Define actors/systems
* [ ] Define incoming request format
* [ ] Define architecture
* [ ] Define database requirements
* [ ] Define AI responsibilities
* [ ] Define human responsibilities
* [ ] Define failure paths
* [ ] Define test scenarios

---

## Step 2 — Request Intake

* [ ] Receive request
* [ ] Assign request/event ID
* [ ] Validate request
* [ ] Normalize request
* [ ] Reject invalid requests safely

---

## Step 3 — Duplicate Protection

* [ ] Check idempotency key
* [ ] Stop duplicate request
* [ ] Store new event

---

## Step 4 — AI Classification

* [ ] Send request to AI
* [ ] Produce structured response
* [ ] Validate AI output
* [ ] Determine category
* [ ] Determine priority
* [ ] Generate confidence score
* [ ] Recommend action

---

## Step 5 — Decision & Routing

* [ ] Route request based on classification
* [ ] Check confidence threshold
* [ ] Allow safe automatic action
* [ ] Route uncertain decision to human

---

## Step 6 — Human Approval

* [ ] Create approval request
* [ ] Approve decision
* [ ] Reject decision
* [ ] Record decision
* [ ] Continue workflow appropriately

---

## Step 7 — External Action

* [ ] Call external API/service
* [ ] Validate response
* [ ] Record result

---

## Step 8 — Reliability

* [ ] Retry temporary failures
* [ ] Use backoff
* [ ] Respect retry limit
* [ ] Send unrecoverable item to DLQ
* [ ] Allow reprocessing

---

## Step 9 — Logging

* [ ] Log request
* [ ] Log AI decision
* [ ] Log routing
* [ ] Log API action
* [ ] Log approval
* [ ] Log failures
* [ ] Log final status

---

## Step 10 — Capstone Testing

Test:

* [ ] Normal successful request
* [ ] Invalid request
* [ ] Duplicate request
* [ ] High-confidence AI decision
* [ ] Low-confidence AI decision
* [ ] Human approval
* [ ] Human rejection
* [ ] Temporary API failure
* [ ] Permanent API failure
* [ ] Retry recovery
* [ ] DLQ flow
* [ ] AI malformed response

---

## Phase Complete When

The capstone demonstrates multiple Automation Engineering concepts working together as one reliable system.

---

# PHASE 10 — AEP Learning Agent

## Goal

Build an n8n-powered AI tutor that helps learners understand AEP and debug their labs.

This feature is intentionally built near the end so the agent has complete AEP documentation to learn from.

---

## Step 1 — Knowledge Source

* [ ] Prepare AEP documentation for retrieval
* [ ] Include lab explanations
* [ ] Include business examples
* [ ] Include debugging information
* [ ] Include challenge hints
* [ ] Keep answer sources organized

---

## Step 2 — Agent Foundation

* [ ] Create n8n AI workflow
* [ ] Receive student question
* [ ] Detect relevant lab
* [ ] Retrieve relevant AEP information
* [ ] Send context to AI
* [ ] Return student-friendly response

---

## Step 3 — Tutor Behavior

* [ ] Explain concepts simply
* [ ] Explain business purpose
* [ ] Help understand errors
* [ ] Suggest debugging steps
* [ ] Give challenge hints
* [ ] Avoid immediately revealing solution
* [ ] Give deeper explanation when requested
* [ ] Admit when answer is unknown

---

## Step 4 — Agent Guardrails

* [ ] Prevent invented project requirements
* [ ] Prevent unsupported claims
* [ ] Prevent immediate challenge answer dumping
* [ ] Keep answers relevant to AEP
* [ ] Validate important responses where possible

---

## Step 5 — Agent Testing

Test questions such as:

* [ ] Concept question
* [ ] Business-use question
* [ ] Debugging question
* [ ] Challenge hint request
* [ ] Full solution request
* [ ] Question from wrong lab
* [ ] Unknown question
* [ ] Ambiguous question

---

## Phase Complete When

A learner can use the agent to understand and debug AEP without the agent replacing the learning process.

---

# PHASE 11 — Student & Academy Experience

## Goal

Prepare AEP so it can be shared with learners or offered to an academy.

## Student Setup

* [ ] Create clear prerequisites
* [ ] Create installation/setup guide
* [ ] Explain required tools
* [ ] Explain required accounts
* [ ] Explain how to start Lab 01
* [ ] Explain lab progression
* [ ] Explain challenge system
* [ ] Explain Learning Agent usage

## Instructor / Academy Use

* [ ] Create instructor overview
* [ ] Explain learning objectives
* [ ] Explain difficulty progression
* [ ] Explain how labs can be assigned
* [ ] Explain challenge expectations
* [ ] Explain expected outputs
* [ ] Make labs independently assignable
* [ ] Keep student requirements reasonable

## Pilot Testing

If possible:

* [ ] Have another learner try setup
* [ ] Have learner attempt one basic lab
* [ ] Have learner attempt one advanced lab
* [ ] Collect confusion points
* [ ] Improve unclear instructions
* [ ] Collect feedback

## Phase Complete When

AEP can be given to another person without requiring the creator to personally explain every step.

---

# PHASE 12 — Portfolio & Project Presentation

## Goal

Turn the completed system into a strong Automation Engineering portfolio project.

## Main README

* [ ] Create strong project introduction
* [ ] Explain problem
* [ ] Explain why AEP exists
* [ ] Show technology stack
* [ ] Show architecture
* [ ] Show all 10 labs
* [ ] Show engineering concepts
* [ ] Show capstone
* [ ] Show Learning Agent
* [ ] Explain testing approach
* [ ] Explain reliability engineering
* [ ] Include screenshots
* [ ] Include workflow diagrams
* [ ] Include limitations
* [ ] Include future improvements

## Portfolio Assets

* [ ] Capture clean n8n workflow screenshots
* [ ] Capture Supabase examples
* [ ] Capture test scenarios
* [ ] Create architecture diagram
* [ ] Create capstone flow diagram
* [ ] Record short demo if useful
* [ ] Prepare short portfolio description
* [ ] Prepare interview explanation

## GitHub Cleanup

* [ ] Remove temporary files
* [ ] Remove unused experiments
* [ ] Verify `.gitignore`
* [ ] Check repository for secrets
* [ ] Verify documentation links
* [ ] Verify setup instructions
* [ ] Check commit history
* [ ] Create release/tag if appropriate

## Phase Complete When

A recruiter, client, automation engineer, instructor, or academy can understand:

* what AEP is
* what problem it solves
* what was built
* what engineering concepts it demonstrates
* how it works
* why the project is valuable

---

# PHASE 13 — External Pilot / Academy Adoption

## Goal

Offer the completed AEP to the academy or other learners and determine whether it provides real educational value.

This phase happens only after the system is stable.

## Build Checklist

* [ ] Prepare short AEP introduction
* [ ] Prepare demo
* [ ] Explain how it complements existing n8n training
* [ ] Demonstrate one beginner lab
* [ ] Demonstrate one reliability lab
* [ ] Demonstrate Learning Agent
* [ ] Explain student challenges
* [ ] Share pilot instructions
* [ ] Collect instructor feedback
* [ ] Collect student feedback
* [ ] Record improvement requests
* [ ] Fix important usability issues

## Adoption Evidence

If the academy chooses to use AEP:

* [ ] Confirm how it is being used
* [ ] Record number/type of labs used
* [ ] Collect approved testimonial if available
* [ ] Document real usage accurately
* [ ] Update portfolio wording based on actual adoption

## Important Rule

Do not claim that AEP is used by an academy until it is actually adopted or actively used.

---

# Final AEP V1 Completion Checklist

AEP V1 is considered complete when:

## Foundation

* [ ] Repository complete
* [ ] Project rules complete
* [ ] Documentation structure complete

## Learning System

* [ ] Standard lab system complete
* [ ] All 10 labs complete
* [ ] All guided builds verified
* [ ] All successful tests verified
* [ ] All failure scenarios verified
* [ ] All challenges verified

## Engineering

* [ ] API integration demonstrated
* [ ] Validation demonstrated
* [ ] Pagination demonstrated
* [ ] Retry/backoff demonstrated
* [ ] Idempotency demonstrated
* [ ] DLQ demonstrated
* [ ] Logging demonstrated

## AI

* [ ] Structured AI demonstrated
* [ ] AI guardrails demonstrated
* [ ] Human-in-the-loop demonstrated

## Capstone

* [ ] Capstone working
* [ ] Capstone success paths tested
* [ ] Capstone failure paths tested

## Learning Agent

* [ ] AEP Learning Agent working
* [ ] Tutor behavior tested
* [ ] Challenge guardrails tested

## Sharing

* [ ] Student setup guide complete
* [ ] Academy/instructor overview complete
* [ ] Portfolio README complete
* [ ] Repository ready to share
* [ ] No secrets exposed

---

# Build Rule

We will work on **one phase at a time**.

Before starting a phase:

1. Understand what we are building.
2. Understand what problem it solves.
3. Understand how it helps the project or business.
4. Create a detailed implementation plan for that phase.
5. Build the smallest working version.
6. Test it.
7. Fix issues.
8. Document it.
9. Commit it.
10. Move to the next phase.

Do not build future phases early unless they are required by the current phase.

---

# Roadmap Summary

```text
Phase 0
Project Foundation
        ↓
Phase 1
Learning System Foundation
        ↓
Phase 2
Development Environment
        ↓
Phase 3
Labs 01–02 — Fundamentals
        ↓
Phase 4
Labs 03–05 — APIs & Data
        ↓
Phase 5
Labs 06–08 — Reliability
        ↓
Phase 6
Logging & Observability
        ↓
Phase 7
Labs 09–10 — AI Engineering
        ↓
Phase 8
Lab Quality Review
        ↓
Phase 9
Capstone
        ↓
Phase 10
AEP Learning Agent
        ↓
Phase 11
Student / Academy Experience
        ↓
Phase 12
Portfolio & Presentation
        ↓
Phase 13
External Pilot / Academy Adoption
```
