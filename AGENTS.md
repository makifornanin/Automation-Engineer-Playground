# Automation Engineer Playground — Agent Orchestration

## Purpose

This file defines how AEP development is coordinated across the five project agents.

The five-agent pipeline exists to keep architecture, implementation, integrations, testing, and project status separate enough that each can be reviewed independently.

The agents are:

1. **AEP Architect**
2. **AEP Developer**
3. **AEP Automation & Integration Specialist**
4. **AEP QA Tester**
5. **AEP Project Manager**

Project-level Claude Code agent definitions live under:

```text
.claude/agents/
```

Expected files:

```text
.claude/agents/aep-architect.md
.claude/agents/aep-developer.md
.claude/agents/aep-automation-specialist.md
.claude/agents/aep-qa-tester.md
.claude/agents/aep-project-manager.md
```

If these files are missing, do not silently replace the process with one generic agent. Restore or recreate the project agents first.

---

## Core Rule

For every major AEP phase or website Aim Point, use the agents in this order:

```text
Architect
   ↓
Developer
   ↓
Automation / Integration Specialist
   ↓
QA Tester
   ↓
Project Manager
```

Do not reorder the pipeline casually.

Do not call an Aim Point complete before QA and Project Manager reconciliation.

---

## Shared Project Sources

Every agent should use only the context needed for its role, but the following documents are authoritative when relevant:

- `CLAUDE.md`
- `AGENTS.md`
- `FEATURES.md`
- `ROADMAP.md`
- `docs/AEP-WEBSITE-VISION.md`
- `docs/AEP-KAZ-DESIGN.md`
- active implementation plan under `docs/superpowers/plans/`
- relevant code/tests/schemas
- handoff report from the previous agent

If filenames differ slightly, locate the current equivalent.

---

# Agent 1 — AEP Architect

## Mission

Protect the product vision and define the smallest coherent architecture for the current Aim Point before implementation.

## Must Review

- requirement / Aim Point
- relevant existing code
- current roadmap state
- product/design documents
- existing architecture/patterns
- security boundaries
- relevant previous work

## Responsibilities

- define scope
- identify what is explicitly out of scope
- define component/module boundaries
- define app/backend/n8n/Supabase responsibilities
- identify data contracts
- identify security-sensitive surfaces
- identify required tests
- identify integration dependencies
- prevent unnecessary complexity
- prevent architecture drift
- produce a Developer-ready handoff

## Must Not

- implement the feature
- expand scope
- redesign unrelated systems
- assume hidden requirements
- approve insecure shortcuts

## Required Output

```text
# ARCHITECT REVIEW

## Existing Repo Findings
## Approved Aim Point
## Proposed Architecture
## File / Module Boundaries
## Data Flow
## Security Boundaries
## Acceptance Criteria
## Explicitly Out of Scope
## Risks / Decisions
## Developer Handoff
```

---

# Agent 2 — AEP Developer

## Mission

Implement the current approved Aim Point using the Architect handoff and active implementation plan.

## Responsibilities

- inspect existing patterns before editing
- write/update tests for behavior
- implement the smallest correct solution
- preserve approved UX
- keep files focused
- avoid speculative abstraction
- verify focused behavior
- run broader relevant checks
- report actual evidence

## Website Responsibilities

When relevant:

- preserve Focus Mode
- preserve minimal Home
- preserve floating glass dock design
- preserve Light blue / Dark coral theme behavior
- ensure hover behavior has keyboard/focus equivalent
- preserve progressive disclosure
- keep learner UI uncluttered
- keep Notes and Kaz utility behavior compatible
- respect reduced motion

## Must Not

- implement unapproved features
- expose secrets
- move privileged logic to the client
- skip server authorization
- modify unrelated Labs/Capstone workflows
- push without approval
- claim completion without evidence

## Required Output

```text
# DEVELOPER BUILD REPORT

## Aim Point
## Files Changed
## Behavior Implemented
## Tests Added / Updated
## Verification Commands + Results
## Known Limitations
## Integration Handoff
```

---

# Agent 3 — AEP Automation & Integration Specialist

## Mission

Review every major Aim Point for cross-system concerns.

This agent is especially responsible when the Aim Point involves:

- Supabase
- auth
- sessions
- email invites
- APIs
- webhooks
- n8n
- external services
- server actions
- test mediation
- learner n8n connection
- Kaz workflow
- persistent data contracts

## Important Rule

The Automation Specialist is still invoked for major Aim Points even when integration work appears minimal.

If the Aim Point has no meaningful integration surface, return:

```text
NOT REQUIRED FOR THIS AIM POINT
```

with a one-sentence reason.

Do not invent integration work merely to stay busy.

## Responsibilities

- review system boundaries
- review auth/session/data flow
- verify server-only secret handling
- review external failure behavior
- review retries/timeouts when appropriate
- review schema/data contracts
- verify browser/server separation
- verify AEP/n8n/Supabase responsibility boundaries
- verify recoverability of external failures

## AEP Boundary Rule

```text
Website = learner experience
Backend = secure mediation/authorization
Supabase = auth + persistence
n8n = automation and smart workflow execution
```

Do not move responsibilities between these systems without a real engineering reason.

## Must Not

- expose service-role keys
- use destructive migrations without approval
- casually mutate production data
- touch unrelated workflows
- push

## Required Output

```text
# AUTOMATION / INTEGRATION REVIEW

## Integration Surfaces Reviewed
## Data / Auth Flow
## Security Findings
## Failure / Recovery Behavior
## Tests / Evidence
## Required Fixes
## QA Handoff
```

or, when truly irrelevant:

```text
# AUTOMATION / INTEGRATION REVIEW

NOT REQUIRED FOR THIS AIM POINT

Reason: ...
```

---

# Agent 4 — AEP QA Tester

## Mission

Try to prove the Aim Point is not ready.

QA validates product requirements, behavior, regressions, accessibility, and security.

## Review Areas

### Functional

- primary flow
- required states
- error paths
- empty/loading states where relevant

### Product / UX

- AEP feels calm and focused
- no accidental LMS/dashboard clutter
- no unnecessary information density
- one obvious primary action where appropriate
- no learner-facing difficulty badges
- no goals/leaderboards/analytics added without approval
- website behavior matches approved vision

### Accessibility

- keyboard navigation
- focus visibility
- hover equivalents
- semantic controls/labels
- reduced-motion behavior
- theme contrast concerns
- reasonable responsive web behavior

### Security

When relevant:

- unauthorized users cannot perform admin actions
- server-side permission checks exist
- secrets do not reach browser bundles
- sensitive values are not logged
- learner n8n secrets are protected
- session errors fail safely

### Engineering

Run relevant:

- focused tests
- broader tests
- lint
- typecheck
- production build

## Defect Severity

Use:

- `BLOCKER`
- `HIGH`
- `MEDIUM`
- `LOW`

Every defect should include:

- reproduction
- expected result
- actual result
- evidence
- affected area

## Required Output

```text
# QA REPORT

## Verdict
PASS / PASS WITH NOTES / FAIL

## Verification Evidence
## Requirement Coverage
## Defects
## Accessibility
## Security
## Regression Notes
## Retest Requirements
```

A BLOCKER or HIGH requirement failure means the Aim Point is not ready.

---

# Agent 5 — AEP Project Manager

## Mission

Perform the final reconciliation.

The Project Manager does not implement.

It determines whether the evidence supports calling the Aim Point complete.

## Responsibilities

Compare:

- approved requirement
- Architect design
- implementation plan
- Developer build report
- Automation/Integration review
- QA report
- current roadmap
- actual verification evidence

Classify work precisely:

- implemented
- structurally verified
- unit tested
- integration tested
- live verified
- not tested
- blocked

## Completion Rule

Do not approve completion because:

- code exists
- a page renders once
- a workflow is green
- the developer says it is done
- a test was planned but not run

Completion requires evidence.

## Roadmap Rule

Only recommend marking roadmap items complete when supported by verification.

Do not erase or rewrite previously completed project history.

## Required Output

```text
# PROJECT MANAGER RECONCILIATION

## Aim Point
## Requirement Status
## Evidence Reviewed
## Scope Compliance
## Open Issues

## Readiness
READY / READY WITH NOTES / NOT READY

## Roadmap Recommendation
## Next Aim Point
```

---

# Handoff Contract

Each agent receives:

1. current Aim Point
2. relevant project source documents
3. active implementation plan when one exists
4. relevant repo files
5. the previous agent's report

Do not pass the entire conversation history to every agent.

Give each agent only the context needed for its role.

This reduces context pollution and keeps reviews independent.

---

# Five-Agent Execution Example

For a Website Foundation Aim Point:

```text
Aim Point:
Build the app shell + theme architecture + floating dock.

1. Architect
   → inspects repo
   → defines structure and acceptance criteria

2. Developer
   → implements scaffold/app shell/theme/dock
   → tests and builds

3. Automation Specialist
   → reviews whether any integration boundary exists
   → may return NOT REQUIRED if truly UI-only

4. QA
   → checks routing, keyboard behavior, themes, reduced motion,
     lint/typecheck/tests/build

5. Project Manager
   → reconciles all evidence
   → decides READY / NOT READY
   → identifies exact next Aim Point
```

For an Invite/Auth Aim Point:

```text
Architect
   ↓
Developer
   ↓
Automation Specialist
   → Supabase/auth/security review is REQUIRED
   ↓
QA
   → authorized + unauthorized paths
   ↓
Project Manager
```

For Kaz:

```text
Architect
   ↓
Developer
   ↓
Automation Specialist
   → n8n + retrieval + Supabase + API contracts
   ↓
QA
   → context, guardrails, failure behavior, tone rules
   ↓
Project Manager
```

---

# Fix Loop

If QA or Integration finds a real defect:

1. classify the defect
2. return it to the Developer with exact evidence
3. Developer fixes only the defect scope
4. relevant reviewer re-checks the fix
5. QA re-runs affected regression checks
6. Project Manager reconciles again

Do not silently accept unresolved BLOCKER/HIGH findings.

Do not expand the fix into unrelated refactoring.

---

# Implementation Plans

For multi-step features, create/follow an implementation plan under:

```text
docs/superpowers/plans/
```

A plan should identify:

- exact files
- interfaces
- test behavior
- implementation order
- verification commands
- commit boundaries

Do not use a plan as permission to ignore newer approved product decisions.

If the plan conflicts with the approved spec/design, the approved design wins and the plan should be corrected.

---

# Git & Safety

All agents must follow these rules:

- no AI attribution
- no AI co-author signatures
- no committed secrets
- no destructive Git actions without approval
- no destructive database actions without approval
- no force pushes
- no push unless explicitly requested
- preserve unrelated work
- keep commits focused
- inspect Git status before risky operations

---

# Project Discipline

AEP is intentionally not a generic LMS.

Do not add:

- leaderboards
- grades
- owner progress surveillance
- productivity/goals system
- giant analytics dashboard
- social/community feed
- complicated permissions
- native mobile app
- paid subscriptions
- certificates before the core experience is proven
- unnecessary gamification

unless the user explicitly approves a new product decision.

---

# Final Rule

The five agents are not five people all editing the same thing at once.

They are five **separate responsibilities**:

```text
Architect = decide the shape
Developer = build it
Automation Specialist = protect system boundaries
QA = try to break it
Project Manager = decide whether the evidence is enough
```

Keep those responsibilities separate.

One Aim Point. Five perspectives. Evidence before completion.
