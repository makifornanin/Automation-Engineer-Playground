# AEP Website Vision

> Working product/design source of truth for the Automation Engineer Playground website.
> This document captures decisions already approved during brainstorming. It is not yet the final implementation spec.

## 1. Product Goal

AEP should make automation engineering easier to understand, more hands-on, and more enjoyable.

AEP is **not** a normal course website built around watching videos, reading long lessons, or clicking “Mark complete.”

The core learning loop is:

**Understand → Do → Predict → Test → Observe → Break → Debug → Prove → Reflect**

The website should feel like a real teacher is beside the learner while they build in n8n.

### Core design rule

> **AEP should feel easier than n8n.**

The website should reduce cognitive load, not add to it.

---

## 2. Product Principles

- Teach in short, clear chunks.
- Explain *why* before asking the learner to build.
- Start each lab with a real business problem.
- Keep learners hands-on in n8n.
- Let learners predict outcomes before running tests.
- Give useful feedback instead of only “correct” or “wrong.”
- Make realistic failure and debugging part of the lesson.
- Explain technical concepts without unnecessarily complex language.
- Keep coding understandable even for learners who are not confident developers.
- Use humor and personality carefully so the platform feels human, not noisy.
- Progress should be earned through learning evidence, not scrolling or manual completion.
- Do not overwhelm the learner with unnecessary dashboards, analytics, goals, or widgets.

---

## 3. Student Progression

Labs follow a guided sequential progression.

Future labs may be previewed, but their hands-on sections stay locked until the previous lab is completed.

Example:

- Lab 01 — available/completed
- Lab 02 — available/completed
- Lab 03 — current
- Lab 04 — preview available, build locked
- ...
- Capstone — unlocks after Labs 01–10

A future lab preview may show:

- why the lab matters
- what will be built
- concepts involved
- what prerequisite lab needs to be completed first

Progress is based on meaningful lesson milestones, such as:

- Understand the Problem
- Guided Build
- Success Test
- Break It
- Debug It
- Challenge
- Make It Your Own
- Recap

There is no generic “Mark complete” as the primary completion mechanism.

---

## 4. Lab Teaching Experience

Every lab should feel like a guided conversation with a good teacher.

### At the start of every lab

Explain:

- the real-world/business problem
- why the problem matters
- what the learner will build
- what concepts they will learn
- how the lab connects to previous learning
- where the concept appears in real automation work

### During the lab

Use this rhythm:

1. short explanation
2. learner action
3. prediction
4. run/test
5. observe result
6. explain what the result proves

### New nodes

When a node is introduced, explain it simply:

**What does it do?**  
A simple technical explanation.

**Why are we using it here?**  
Its purpose in the current business problem.

**Think of it like...**  
Optional analogy when helpful.

Example:

**Switch Node**

- What it does: routes data into different paths based on rules.
- Why here: sales, support, and billing requests should not go to the same team.
- Think of it like: a receptionist sending visitors to the correct department.

### Code

Never reduce coding lessons to “copy and paste this.”

Explain:

- what the code is trying to decide
- the important inputs
- the important logic
- the output
- why the logic matters

Learners do not need to memorize JavaScript to understand automation engineering.

### End-of-lab recap

Every lab ends with a simple **What Did We Just Use?** section that explains the nodes and important code used in the lab.

Also recap:

- what was built
- the business problem solved
- concepts learned
- what would go wrong without them
- how this connects to production automation
- what the next lab adds

---

## 5. Testing and Diagnostics

AEP should not only tell the learner whether the final output is correct.

It should help identify **where the workflow started going wrong**.

### Default diagnostics — hybrid checkpoint model

AEP sends known test data and evaluates meaningful checkpoints from the learner result.

Example:

- Input — correct
- Normalization — correct
- Validation — correct
- Routing — incorrect

Kaz can then say:

> “Your webhook and validation look healthy. The issue starts around your routing logic.”

This works without requiring full n8n API access.

### Optional n8n connection

Learners may optionally connect their n8n API to AEP.

This enables deeper diagnostics, such as:

- execution inspection
- node-level status
- exact failure location
- richer debugging context for Kaz

The n8n connection is optional so beginners can start without a more sensitive or complex setup.

---

## 6. Kaz — AEP Teacher

The teacher is named **Kaz**.

Kaz is not only a chatbot. Kaz is the teacher personality of the entire AEP experience.

Kaz should feel:

- clear
- clever
- jolly
- encouraging
- occasionally funny
- technically correct
- never condescending
- not overly chatty when the learner needs focus

Humor should appear naturally around discoveries, bugs, and wins—not in every single card.

Example tone:

> “n8n is green. Unfortunately, green only means it ran—not that it made a good decision.”

### Kaz context

Kaz should be able to use:

- learner identity
- selected language
- current lab
- current lesson step
- completed concepts
- current progress
- recent test result
- recent mistakes
- hints already shown
- challenge state

### Challenge behavior

Kaz is a teacher, not a solution vending machine.

During challenges:

1. Hint 1 — point toward the symptom
2. Hint 2 — point toward the relevant data
3. Hint 3 — point toward the relevant rule/concept
4. Stronger guidance only if the learner is still stuck

### Knowledge

Kaz should know the content of:

- Labs 01–10
- Capstone
- relevant AEP documentation
- teaching rules and expected outcomes

Preferred architecture:

**Git repository/course content → indexed knowledge base → Supabase → n8n Kaz agent → AEP chatbot**

The agent should retrieve relevant content instead of rereading the entire repository for every question.

---

## 7. Language Settings

AEP supports:

- English
- Tagalog
- Taglish

The selected language affects both the lesson experience and Kaz.

### English

Simple conversational English. Technical terminology stays precise.

### Tagalog

Use everyday Tagalog, not deep or textbook Filipino.

Keep technical terms in English when that is clearer, including:

- workflow
- node
- webhook
- API
- JSON
- database
- validation
- routing

### Taglish

Natural Filipino developer conversation.

Example:

> “Dito natin gagamitin yung IF node kasi kailangan muna natin malaman kung valid ba talaga yung request bago siya magpatuloy.”

Avoid awkward direct translations.

---

## 8. Access and Accounts

AEP is private and invite-only for now.

The developer/owner invites learners by email.

### Student flow

1. Owner enters the learner email.
2. AEP sends an invite.
3. Learner opens the invite.
4. Email is verified.
5. A secure account/session is created.
6. Learner enters onboarding.
7. Future visits normally restore the existing session.

No password creation is required.

If the session expires, the learner can use another email magic link.

### Roles

Two simple roles:

- `student`
- `admin`

The developer/owner uses the same application and same learning experience as students.

The only extra capability is an **Admin** item in navigation.

There is no separate admin application or admin dashboard.

### Admin section

Keep it intentionally small:

- invite student
- see invited/active users
- resend invite
- revoke access

The owner does **not** need student progress monitoring.

AEP stores learner progress to personalize the learner’s own experience and Kaz—not to micromanage students.

---

## 9. Notes

Notes are a learning notebook, not a productivity/task system.

Users may store:

- notes per lab
- general learning notes
- code snippets
- debugging observations
- concepts they want to remember
- “aha” moments

Useful actions:

- Open Notes from navigation
- Open/collapse Notes while inside a lesson
- **Save to Notes** from useful Kaz explanations or lesson content

Do not add goals, task management, or productivity features to AEP.

---

## 10. Home Screen

Home should stay intentionally minimal.

Suggested content:

### Greeting

**Good morning, [Name].**

### Continue Learning

Show the current lab, progress, and one clear Continue button.

### Your Journey

A lightweight visual progression:

`01 ✓  02 ✓  03 ●  04 ○  05 ○ ...`

### A Note from Kaz

One short contextual teacher message.

### Ask Kaz

A simple entry point to the AI teacher.

### Notes

A small shortcut to the learning notebook.

Do not add:

- goals
- analytics clutter
- giant stat cards
- recent activity feeds unless later proven necessary
- unnecessary quick-action panels

---

## 11. Visual Design System

Overall direction:

**Apple-inspired simplicity + chrome/glass finish + calm premium UI**

### Light mode

- soft white / very light gray background
- clean white or subtle frosted surfaces
- calm blue accent
- near-black text
- light chrome/glass borders

### Dark mode

- near-black / charcoal background
- slightly lighter frosted surfaces
- n8n-inspired coral/red-orange accent
- soft white text
- subtle chrome/glass highlights

Accent colors should be controlled. Most of the interface remains neutral.

Use accent color for:

- active navigation
- buttons
- progress
- important feedback
- Kaz highlights
- unlock/completion moments

### Motion

Animations should feel polished and purposeful.

Use:

- smooth page transitions
- spring interactions
- subtle hover movement
- progress animation
- small unlock celebrations
- Kaz typing/response motion

Avoid distracting constant motion.

---

## 12. Navigation — Floating Glass Dock

Desktop navigation uses a compact floating dock rather than a traditional full-height rectangular sidebar.

Default state:

- icon-only
- small footprint
- each item is its own translucent glass/chrome button, floating independently
  with visible space between items — not one shared capsule behind the group
- the navigation wrapper stays visually transparent on desktop
- floats near the side of the screen

Below the mobile breakpoint the items group into a single shared bottom capsule.
Six separated pills do not fit a 320px viewport, and a grouped bottom strip is
the established mobile convention.

On hover:

- hovered item expands
- label appears
- icon slightly enlarges
- nearby icons may react subtly
- smooth spring animation

On click:

- small compression/release interaction
- polished macOS-style app-opening feel
- smooth page transition

The effect is inspired by:

- macOS Dock magnification
- floating glass sidebar
- fisheye dock navigation
- spring animated navigation

Keep magnification subtle so it remains useful in a learning application.

### Navigation items

- Home
- Labs
- Notes
- Kaz
- Settings
- Admin — only visible to the owner/admin role

Capstone does not need a permanent navigation item. It appears naturally at the end of Labs when unlocked.

---

## 13. Completion Experience

After the learner completes Labs 01–10 and the Capstone, the experience should feel earned.

Do not show only a generic congratulations card.

Kaz hands the moment to the creator:

> **Kaz:** “I think someone else should take this one.”

Then the learner sees a personal completion message from the AEP creator.

This should feel like the final human connection after Kaz has guided the learner through the course.

---

## 14. Initial Product Build Slices

The website should be built in focused slices instead of one giant implementation.

### Slice 1 — Foundation

- invite-only access
- passwordless sessions
- onboarding
- Home
- Settings
- minimal Admin section
- theme system
- floating navigation dock

> Slice 1 spans ROADMAP Phases 10–11. Invite-only access, passwordless
> sessions, onboarding and the Admin section are **Phase 11**; Phase 10 ships
> the app shell, theme system and navigation dock with **no authentication and
> no authorization**.

### Slice 2 — Learning Engine

- Labs 01–10
- Capstone entry
- sequential unlocks
- lesson steps
- progress tracking
- node/code explanations
- Break It
- Debug It
- Challenge
- Make It Your Own
- Notes integration

### Slice 3 — Test + Diagnostics Engine

- Send Test
- expected vs actual
- checkpoint diagnosis
- optional n8n API connection
- deeper node-level debugging

### Slice 4 — Kaz AI Teacher

- course/repository knowledge
- learner context
- progressive hints
- language behavior
- chatbot interface
- Save to Notes

### Slice 5 — Completion Experience

- final completion detection
- Capstone completion moment
- Kaz handoff
- creator message

---

## 15. Current Out-of-Scope / Avoid for MVP

Do not add these unless a real need appears:

- student leaderboards
- owner progress surveillance
- student analytics dashboards
- goals/task management
- social feed/community
- certificates before the core learning engine is proven
- billing/subscriptions
- complicated role systems
- large admin dashboard
- excessive gamification
- video-first course structure

---

---

## 16. Labs Screen

The Labs screen should communicate the complete learning journey without overwhelming the learner.

Use a **hybrid journey layout**:

1. one featured card for the current lab
2. the full curriculum below as a clean grouped journey

### Current Lab

At the top of the page, show only the most useful information:

- current lab number and title
- one short description
- current completion percentage
- one clear **Continue** action

Avoid unnecessary metadata.

### Learning Journey Groups

Group the labs lightly so the learner can understand how the curriculum evolves.

#### Foundations

- Labs 01–04
- Core request flow, data handling, conditional logic, and API/system communication

Kaz-style group framing may be used sparingly, for example:

> “First, we make data move correctly. Fancy automation means nothing if the basics are shaky.”

#### Reliability

- Labs 05–08
- Pagination/data handling, retries/backoff, idempotency, DLQ/recovery

Example framing:

> “Now we make your workflows survive the real world. APIs fail. Events repeat. Systems get weird.”

#### AI Engineering

- Labs 09–10
- Structured AI output, validation, guardrails, and human approval

Example framing:

> “Time to let AI make recommendations without letting it run the company unsupervised.”

#### Capstone

- Final AI Service Request Agent
- Unlocks after Labs 01–10

Keep group labels subtle. Use whitespace and small dividers rather than large banners.

### Lab Rows

Each lab row should show only:

- lab number
- title
- one short human/Kaz-style description
- status: completed / current / preview locked
- progress only when the lab is currently in progress
- Preview action when the hands-on content is locked

Do **not** show difficulty labels such as Beginner, Intermediate, or Advanced. These add anxiety without helping the learner.

### Previewing Future Labs

Future labs are previewable but their hands-on sections remain locked.

A preview may show:

- why the lab matters
- what the learner will eventually build
- concepts they will learn
- prerequisite lab that must be completed first

Locked labs should not look disabled or discouraging. They should create curiosity without allowing the learner to skip the intended sequence.

---

## 17. Lesson Screen — Focus Mode

The Lesson screen is the heart of AEP.

Its primary UX goal is:

> **Do not make the learner hold too much information in their head at once.**

Avoid:

- one giant scrolling lesson
- a permanent table of contents
- a permanent Notes sidebar
- a permanent Kaz panel
- lesson + test console + notes + chat + progress all visible at once

Use a **Focus Mode** layout with one meaningful learning chunk at a time.

### Core Layout

The normal lesson view should contain:

- a thin lab header/progress indicator
- one central learning column
- generous whitespace
- floating/collapsible access to Notes
- floating/collapsible access to Kaz
- the main AEP navigation dock remains available

The page should visually emphasize only the current learning task.

### Chunked Focus, Not Micro-Pages

Do not create one click for every sentence or tiny instruction.

A single lesson chunk should contain one complete thought or task, typically:

- one concept
- one explanation
- 2–4 related learner actions
- one meaningful transition to the next chunk

Target roughly **6–10 meaningful interactions per normal lab**, not dozens of unnecessary clicks.

Core rule:

> **One click should move the learner to a new thought, not merely reveal the next sentence.**

Progress and notes should autosave. Do not add separate Save Progress buttons.

### Lesson Rhythm

A lab may move through:

1. Problem
2. Concept
3. Guided Build
4. Predict
5. Test
6. Understand Result
7. Break It
8. Debug It
9. Challenge
10. Make It Your Own
11. Recap

These do not need to map one-to-one to separate screens. Related content should be grouped into meaningful chunks.

---

## 18. In-Lab Progress Navigation

Default progress navigation should remain very light.

Example:

**Lab 03 — Conditional Logic**  
`━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━`  
`38%`

The detailed section navigator remains hidden by default.

When the learner expands the progress area, show a compact roadmap such as:

- Problem
- Concept
- Build
- Test
- Break It
- Debug It
- Challenge
- Recap

Use states such as:

- completed
- current
- not yet completed

Learners may revisit completed sections for review.

The section navigator should provide orientation without becoming a permanent table of contents.

---

## 19. Guided Build Chunks

Use a **hybrid Build structure**: short explanation + useful visual + concrete actions + short concept reminder.

Recommended pattern:

### BUILD — [What We Are Doing]

**Why this matters**  
Short explanation tied to the business problem.

**Visual**  
A small workflow diagram only when it makes the relationship clearer.

**Your turn**

1. concrete action
2. concrete action
3. concrete action

Keep a normal chunk to roughly 2–4 related actions.

**Why we're doing this**  
A short concept explanation so the learner understands the engineering decision rather than merely copying instructions.

**Done — Next**

This is preferred over both:

- large walls of instructions
- tiny one-action-per-page interactions

---

## 20. Lesson Visuals

Visuals are support tools, not the lesson itself.

### Mini Workflow Diagrams

Use mini diagrams to explain:

- architecture
- workflow flow
- relationships between nodes
- system-to-system communication
- data movement

Rule:

> **Diagram = how it works.**

### Screenshots

Use actual screenshots only when a learner may genuinely struggle to find a UI setting or configuration.

Examples:

- a specific n8n response mode
- a hard-to-find Supabase menu
- an important configuration field

Screenshots should:

- be cropped to the relevant area
- highlight the exact control
- avoid showing unnecessary surrounding UI
- remain optional support; the written instruction should still be understandable

Rule:

> **Screenshot = where to find or configure it.**

Do not fill lessons with screenshots because n8n/Supabase interfaces may change and full screenshots add visual noise.

---

## 21. Interactive Diagrams

When relationships are easier to understand visually, AEP should support **small interactive diagrams**.

Example:

`Webhook → Validate → Switch → Sales / Support / Billing`

Hovering or clicking a component may reveal:

- what it does
- why it exists here
- its input
- its output
- common mistake, when useful

For a database example, a learner may inspect:

`n8n → processed_events → "Have I seen this event before?"`

Interaction rules:

- hover = quick explanation
- click = slightly deeper explanation
- motion should be subtle
- the diagram must still make sense without interaction
- do not use interactive diagrams when a static representation is already clear

Interactive diagrams are for understanding relationships, not decoration.

---

## 22. Kaz and Notes Inside Lessons

Kaz and Notes should be easy to reach without permanently taking screen space.

Use two subtle floating utility controls:

- **Ask Kaz**
- **Notes**

Only one utility panel should be open at a time.

### Notes Panel

Opening Notes reveals a right-side drawer or equivalent focused panel.

Notes:

- autosave
- may be tied to the current lab
- may include snippets, observations, and learner reflections
- can receive content through **Save to Notes**

Closing Notes returns to the uncluttered lesson.

### Kaz Panel

Opening Kaz uses the same utility area for chat.

Kaz should understand the learner's current lesson context without requiring them to re-explain where they are.

The detailed proactive behavior of Kaz will be designed separately.

---

## 23. Inline Test Experience

When a lab needs API/webhook testing, the Test experience should live **inside the relevant lesson chunk**.

Do not make the learner open a separate Test page or Postman for the normal course flow.

Preferred working environment:

- **AEP** — lesson, test controls, diagnostics, Kaz
- **n8n** — workflow building
- **Supabase** — only when persistence/database work is required

This minimizes constant tab switching.

### Default Test UI

Keep the default view simple.

Example:

**TEST IT**

Webhook connected ✓

**Test case**  
Billing inquiry

**Send Test**

The learner should first understand what business behavior is being tested.

Raw technical data may sit behind progressive disclosure:

- View payload
- Show response
- Show technical details

### Result UI

Show useful interpretation before raw developer output.

Example:

- Webhook received ✓
- Validation passed ✓
- Routing mismatch ✕

Expected: Billing  
Received: Support

Kaz may explain:

> “Everything before routing looks healthy. Check your Switch conditions.”

Actions may include:

- Try Again
- Ask Kaz
- Show Technical Details

### Technical Details

Only on demand, show:

- raw request
- raw response
- checkpoint data
- execution ID
- optional n8n execution details when connected

Core rule:

> **Simple first, depth on demand.**

---

## 24. Test Architecture

The browser should not directly call learner webhooks when AEP can safely mediate the request.

Preferred architecture:

**Learner → AEP Website → AEP Backend → learner n8n webhook → AEP evaluator → Website**

This allows AEP to handle:

- CORS/browser limitations
- timeouts
- connection failures
- sanitized diagnostics
- expected-vs-actual evaluation
- checkpoint evaluation
- future Kaz context
- optional deeper n8n execution inspection

The learner experiences one simple **Send Test** action while AEP handles the engineering complexity underneath.

---

## 25. Per-Lab Webhook Configuration

For labs that need a learner webhook, the learner should configure it **once per lab**.

Flow:

1. learner opens the lab's Connect/Test Setup
2. learner pastes the webhook URL
3. AEP stores that URL for that learner + lab
4. future tests in the lab reuse it automatically

The learner can edit it later through a small lab-specific setting.

Do not ask them to paste the same URL for every test.

Only show webhook configuration in labs where it is needed.

---

## 26. Supabase Guidance Inside Labs

When a lab requires Supabase, AEP itself should guide the learner through the database setup inside that lab.

Do not make learners leave the learning flow to search through separate setup documentation unless they deliberately want deeper reference material.

### Teaching Order

Never introduce Supabase as an arbitrary requirement.

First establish the problem.

Example:

> “Our workflow can handle the current request, but after the execution ends it forgets what happened. We need somewhere to remember it.”

Then introduce Supabase as the solution.

### Database Setup Chunk

A database setup chunk may contain:

1. why persistence is needed
2. where to go in Supabase
3. SQL to run
4. Copy SQL action
5. screenshot only if the SQL Editor/location is hard to find
6. a simple explanation of the important table/columns

### Explain SQL Without Turning It Into a SQL Course

For example:

**processed_events**  
The table that remembers events the workflow has already seen.

**event_id**  
The unique identity of an event.

**status**  
Tracks whether handling is reserved or completed.

**processed_at**  
Records when processing finished.

Provide deeper SQL explanation behind progressive disclosure if the learner wants it.

### Verification

Do not treat “I pasted the SQL” as proof of learning.

Where possible, AEP's later workflow tests should prove the persistence behavior itself.

Example:

First request:

- event stored
- business action executed

Same event again:

- duplicate detected
- no second business action

This connects setup directly to the business concept.

### Credentials

For the MVP, do not require learners to give AEP full Supabase admin/service credentials solely to verify their tables.

AEP guides the setup; n8n + AEP tests prove the integration behavior.

---

## 27. UX Rules Locked So Far

These rules apply across Labs and Lessons:

1. **AEP should feel easier than n8n.**
2. Show only what the learner needs for the current decision.
3. Use progressive disclosure for technical depth.
4. Avoid unnecessary tab switching.
5. Tools appear only when the learner needs them.
6. One meaningful learning chunk at a time.
7. One click should move the learner to a new thought.
8. Explain why before asking the learner to build.
9. Use diagrams for how things work.
10. Use screenshots for where things are.
11. Use interaction only when it improves understanding.
12. Test inside the lesson when the lab requires testing.
13. Store lab-specific connection setup so learners do not repeat configuration.
14. Guide Supabase setup inside the lesson when persistence becomes necessary.
15. Keep Kaz and Notes accessible but visually out of the way until needed.

---

## 28. Next Design Area

**Kaz inside the learning experience.**

Next, define:

- when Kaz should proactively speak
- when Kaz should stay quiet
- how Kaz reacts to success/failure
- how Kaz behaves during Guided Build vs Debug It vs Challenge
- how much humor/personality is appropriate
- how proactive messages differ from Ask Kaz chat
- how Kaz uses learner context without becoming distracting

