# Automation Engineer Playground — Claude Instructions

## Project Purpose

Automation Engineer Playground (AEP) is a hands-on learning and portfolio project for Automation Engineering.

The goal is not simply to make workflows work.

The goal is to understand how reliable automation systems are designed, built, tested, debugged, documented, and taught through a focused learner experience.

AEP includes:

- 10 progressive automation engineering labs
- a Capstone project
- a learner-facing AEP website
- inline testing and diagnostics
- Supabase-backed learner state
- Kaz, the AEP AI teacher

The website should make automation engineering easier to understand and should never add more cognitive load than the tools it teaches.

> **AEP should feel easier than n8n.**

---

## Source of Truth

Before working on a feature, inspect the relevant project documents.

Primary project sources:

1. `CLAUDE.md` — project-wide execution and safety rules
2. `AGENTS.md` — five-agent orchestration and handoff rules
3. `FEATURES.md` — approved product/features scope
4. `ROADMAP.md` — implementation phases and current execution status
5. `docs/AEP-WEBSITE-VISION.md` — approved website/product UX decisions
6. `docs/AEP-KAZ-DESIGN.md` — approved Kaz personality, behavior, and architecture
7. active implementation plan under `docs/superpowers/plans/`
8. relevant code, tests, schemas, and local documentation

If filenames differ slightly, locate the current equivalent before proceeding.

### Precedence

When instructions conflict:

1. explicit current user request
2. security/safety rules
3. approved product/design docs
4. active implementation plan
5. roadmap
6. implementation details

Do not silently override an approved product decision.

If a conflict would materially change architecture, security, learner experience, or scope, surface it before implementing.

---

## Working Style

- Keep responses concise and easy to understand.
- Do not over-explain after completing a task.
- Work on one approved task or **Aim Point** at a time.
- Do not implement features that were not requested or approved.
- Do not modify unrelated files.
- Prefer simple solutions over unnecessary complexity.
- Prefer small, testable changes instead of large changes.
- Do not redesign architecture without an approved design decision.
- Inspect existing patterns before creating new ones.
- Use the known stack first.
- Avoid dependency additions unless they solve a real requirement.
- Separate required work from optional suggestions.
- Never let a suggestion quietly become scope.

---

## Aim Point Rule

An **Aim Point** is the smallest meaningful implementation target that can be built, tested, reviewed, and reconciled independently.

For every major phase or website Aim Point:

1. understand the requirement
2. inspect relevant existing files
3. read the approved product/design sources
4. run the five-agent pipeline from `AGENTS.md`
5. follow or create the active implementation plan
6. build the smallest working version
7. test it
8. fix defects related to the Aim Point
9. verify the result
10. document evidence
11. commit cleanly when appropriate
12. move to the next Aim Point only after reconciliation

Do not build an entire roadmap phase as one giant unreviewed change when it can be split into smaller Aim Points.

---

## Required Five-Agent Pipeline

For every major AEP phase or website Aim Point, use these project agents in this order:

1. **AEP Architect**
2. **AEP Developer**
3. **AEP Automation & Integration Specialist**
4. **AEP QA Tester**
5. **AEP Project Manager**

The detailed responsibilities and handoff rules live in `AGENTS.md` and `.claude/agents/`.

### Important

- Do not skip the Architect.
- Developer implementation begins only from approved scope/design.
- Automation Specialist must still be invoked for major Aim Points.
  - If no API, webhook, n8n, Supabase, auth, email, or external integration is involved, it may return:
    - `NOT REQUIRED FOR THIS AIM POINT`
- QA must verify behavior and regressions before the task is called complete.
- Project Manager performs final reconciliation against the docs and evidence.
- A phase/Aim Point is not complete merely because code exists.

---

## AEP System Responsibility Boundaries

Keep system responsibilities clear.

### AEP Website

Owns:

- learner-facing UI
- lesson presentation
- learner progress
- Notes
- settings
- Admin UI
- inline test controls
- expected-vs-actual presentation
- diagnostics presentation
- Kaz UI
- session-aware learner context

### AEP Backend

Owns:

- secure server actions/endpoints
- authorization
- test mediation
- input validation
- timeout/error handling
- secure integration calls
- sanitized diagnostic responses

### Supabase

Owns:

- authentication
- sessions
- roles
- learner state
- progress persistence
- notes
- configuration metadata
- knowledge/vector storage when required
- other persistent records required by the approved design

### n8n

Owns:

- learner-built automation workflows
- smart automation logic
- Kaz agent workflow
- external workflow orchestration where appropriate

Do not move responsibilities into n8n just because n8n is available.

Do not put privileged backend behavior in browser code.

---

## Website Product Rules

When building the website, preserve these approved principles:

- AEP should feel easier than n8n.
- The product is hands-on, not video-first.
- Explain **why** before asking learners to build.
- Use progressive disclosure.
- Show one meaningful learning chunk at a time.
- Avoid giant scrolling lessons.
- Avoid permanent side panels that create visual overload.
- Avoid unnecessary dashboards, analytics, goals, leaderboards, and gamification.
- Progress should be earned through meaningful learning evidence.
- Future labs may be previewed while hands-on work remains sequentially locked.
- Do not show learner-facing Beginner / Intermediate / Advanced badges.
- Home stays intentionally minimal.
- Notes are a learning notebook, not a productivity system.
- Postman is optional/advanced; normal learner testing should happen inside AEP.
- Supabase appears in the learning flow only when persistence is relevant.
- Use diagrams for **how it works**.
- Use screenshots for **where to find/configure it**.
- Use interaction only when it improves understanding.
- Keep motion subtle and purposeful.
- Respect reduced-motion preferences.

---

## Approved Website Stack

Unless an approved architecture change says otherwise:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Motion
- Supabase
- Vercel-compatible deployment

Prefer the existing project structure and versions once the web app is initialized.

Do not replace the stack casually.

---

## Learning Rule

Before implementing a new engineering concept or major feature, explain briefly:

1. What is it?
2. What problem does it solve?
3. How can it help a real business?

Keep these explanations practical and simple.

For learner-facing content, also explain why the current engineering choice matters before asking the learner to configure it.

---

## Learning Experience Rule

The core AEP learning loop is:

**Understand → Do → Predict → Test → Observe → Break → Debug → Prove → Reflect**

When relevant, lesson content should include:

- real-world/business problem
- short concept explanation
- guided build
- prediction
- successful test
- intentional failure
- debugging
- challenge
- Make It Your Own
- recap
- bridge to the next concept

A learner should understand what they are doing, not simply copy instructions.

---

## Guided Build Rule

When introducing an important node, explain:

### What
What the node does.

### Why here
Why it belongs in the current workflow.

### Business reason
Why a real business would need this behavior.

Optional analogy is allowed when useful.

For code, explain:

- intent
- important inputs
- logic
- output
- engineering reason

Never teach code as “just paste this.”

---

## Kaz Rules

Kaz is the AEP teacher, not merely a generic chatbot.

Her approved identity and behavior live in `docs/AEP-KAZ-DESIGN.md`.

Core rules:

- Kaz is female in personality/identity.
- Her visual representation is a mysterious alien orb.
- Calm by default.
- Jolly/playful when appropriate.
- Occasionally teasing.
- Controlled fake scares are allowed.
- Humor decreases when the learner struggles.
- Motivation should reference real progress.
- Kaz must not invent test results or node execution evidence.
- AEP test evidence is authoritative.
- Kaz should not immediately reveal challenge solutions.
- Progressive hints must be respected.
- Kaz should feel present because of timing and context, not because she constantly talks.

Do not simplify Kaz into a generic FAQ bot.

---

## Feature Suggestions

When a new feature or next step is being discussed:

- You may suggest improvements.
- Clearly separate suggestions from required work.
- Do not implement suggestions without approval.
- Explain why the suggestion would improve the project.
- Prefer YAGNI: if the learner does not need it yet, do not build it yet.

---

## Development Workflow

For each task:

1. Understand the requirement.
2. Inspect the relevant existing files.
3. Check the active roadmap/Aim Point.
4. Read relevant design/spec documents.
5. Explain the intended change briefly.
6. Implement only the approved scope.
7. Test the change.
8. Fix discovered issues related to the task.
9. Verify the final behavior.
10. Summarize what changed concisely.

For multi-step implementation work, use an implementation plan before coding.

---

## Test-Driven Development

For behavioral features and bug fixes:

1. write or update a test that captures required behavior
2. run it and confirm the expected failure when practical
3. implement the smallest correct solution
4. rerun the focused test
5. run broader relevant verification

Do not create meaningless tests merely to satisfy TDD ceremony.

For primarily visual work, test behavior that can be automated and verify the visual/interaction result separately.

---

## Testing

- Never claim something works without testing when testing is possible.
- Test successful and failure scenarios when relevant.
- Prefer reproducible tests.
- Do not ignore errors just to make a test pass.
- Verify the real user-visible behavior, not only internal function output.
- For auth/security work, test unauthorized paths.
- For integrations, test failure/recovery behavior when safe.
- For website work, run relevant:
  - tests
  - lint
  - typecheck
  - production build
- For major UI interactions, check keyboard/focus behavior.
- Do not call a feature “live verified” unless a live path was actually exercised.

Use precise status language:

- implemented
- unit tested
- integration tested
- structurally verified
- live verified
- not tested
- blocked

---

## Verification Before Completion

Before stating that an Aim Point is complete:

- review the active implementation plan
- review the diff
- run relevant tests
- run lint/typecheck/build for the web app when applicable
- run security/secret checks when relevant
- confirm no approved requirement was skipped
- confirm no unapproved scope was added
- confirm QA findings are resolved or explicitly accepted
- complete Project Manager reconciliation

Evidence before assertion.

---

## Code Quality

- Keep code readable and maintainable.
- Use clear names.
- Avoid unnecessary abstractions.
- Avoid duplicate logic when a simple reusable solution makes sense.
- Add comments only when they explain something non-obvious.
- Follow existing project structure and conventions.
- Prefer focused modules/components with one clear responsibility.
- Avoid giant “god” components.
- Keep server-only and client-only responsibilities explicit.
- Do not add speculative frameworks or infrastructure.

---

## Automation Engineering Principles

When applicable, consider:

- input validation
- data normalization
- error handling
- retry behavior
- rate limits
- idempotency
- logging
- observability
- failure recovery
- security
- human approval
- AI output validation

Do not add these automatically.

Apply them only when relevant to the current lab, feature, or system boundary.

---

## Authentication & Authorization Rules

For AEP website access:

- AEP is invite-only for V1.
- Passwordless/magic-link access is preferred.
- Roles are limited to:
  - `student`
  - `admin`
- Invited learners default to `student`.
- Admin permission must be enforced server-side.
- Hiding the Admin navigation item is not sufficient authorization.
- Client input must never be allowed to grant itself admin role.
- Do not expose Supabase service-role/admin credentials to the browser.
- Session handling must fail safely.

---

## Secrets & Environment Variables

- Never commit secrets, API keys, credentials, private tokens, or real `.env` files.
- Keep privileged credentials server-only.
- Never put privileged secrets in `NEXT_PUBLIC_*`.
- `.env.example` may contain variable names and safe placeholders only.
- Do not log secrets.
- Do not expose secrets in screenshots, documentation, browser responses, test fixtures, or build artifacts.
- Run a secret scan before release/major commits when relevant.
- If a secret is discovered in committed history, stop and handle it as a security issue.

---

## Documentation

Each lab should clearly document:

- the problem
- the concept being learned
- architecture / flow
- setup
- how to test it
- expected result
- failure scenario
- debugging
- challenge
- what was learned

Keep documentation concise and practical.

Website design decisions belong in the website vision/design docs.

Kaz-specific decisions belong in the Kaz design doc.

Implementation plans belong under `docs/superpowers/plans/`.

ROADMAP should track execution status, not become a dumping ground for implementation details.

---

## Git Rules

- Keep commits focused on one logical change.
- Use clear and professional commit messages.
- Never include AI attribution.
- Never include “Generated by Claude”, “Generated by AI”, “Generated by Codex”, or similar text.
- Never add AI co-author signatures.
- Do not mention AI assistance in commit messages or source files unless explicitly requested.
- Do not commit secrets, API keys, credentials, or `.env` files containing secrets.
- Do not rewrite history without explicit approval.
- Do not force push.
- Do not push unless the user explicitly asks.
- Preserve existing work.
- Before a risky Git operation, inspect status and understand what will be affected.

For major feature work, prefer an isolated worktree/branch when the active workflow supports it.

---

## Safety

Ask before performing irreversible, destructive, security-sensitive, or shared-branch actions such as:

- deleting important files
- resetting or rewriting Git history
- removing databases or tables
- destructive migrations
- overwriting significant existing work
- force pushing
- pushing to a shared branch
- publishing/deploying when not already approved
- rotating or replacing production credentials

Do not use destructive actions as a shortcut around a problem.

---

## Scope Protection

Do not modify Labs 01–10 or Capstone workflows while building the website unless the active Aim Point explicitly requires it.

Do not rebuild already-verified automation work merely because the website is being added.

Keep Postman/ngrok/developer scaffolding separate from the final learner-facing product unless a lesson intentionally teaches it.

---

## Status & Roadmap Rules

- ROADMAP status must reflect evidence, not intention.
- Do not mark an item complete because code was written.
- Preserve historical completed work.
- If an old roadmap requirement is replaced by an approved newer design, update it explicitly rather than silently ignoring the conflict.
- Use one Aim Point at a time.
- Do not build future phases early unless the current Aim Point truly requires them.

---

## Priority

Correctness, learning quality, and maintainability are more important than speed.

AEP is a learning product and an engineering portfolio project.

Do not hide important engineering decisions behind automation or unnecessary complexity.

Build the smallest thing that teaches and works well, prove it, then continue.
