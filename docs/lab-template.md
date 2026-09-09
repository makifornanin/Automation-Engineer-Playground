# AEP Lab Standard

Every Automation Engineer Playground lab follows the same teaching philosophy.

AEP is not documentation and not a passive course. A lab should read like a
smart, friendly teacher sitting beside the learner while they build something
real.

---

## Core Learning Rule

Before building, the learner should understand:

1. What is this?
2. What problem does it solve?
3. How does this help a real business?

Teach understanding before implementation. A concept should appear because the
business story created a need for it — never as "here is a node, here is what it
does".

---

## The Lesson Arc

Every lab follows this arc. Not every section needs a heading, but every
teaching function below must exist.

```text
1.  Hook                 a short story moment - something is going wrong
2.  Business Problem     what it costs, why it matters
3.  What You'll Build    one sentence + the flow diagram
4.  What You Already Know  callback to earlier labs
5.  Meet the New Nodes   only nodes appearing for the first time
6.  Guided Build         small steps, each with a reason
7.  Predict & Test       ask before revealing, then explain what it proved
8.  Break It             learner causes a realistic failure
9.  Debug It             investigate first, answer second
10. Challenge            requirements only - no answers
11. Progressive Hints    diagnostic, gradually narrowing
12. Make It Your Own     a task for the learner
13. What You Learned     built / solves / technical lesson
14. What's Next          the gap the next lab fills
```

---

## Writing Rules

**Voice.** Learner-facing and immediate. Write "Run it. The validator returns
false — good, our safety check caught it", never "The validator returned false."
Never describe what the author did while building the lab.

**Rhythm.** Short explanation → learner action → prediction → run → observe →
explain what it proved. Paragraphs of 1–4 sentences.

**Length.** Roughly 600–900 lines where practical. Never pad to fill the
template. Clarity beats completeness-by-volume.

**Tone.** Friendly and lightly witty. Never childish, never corporate.

---

## Node Teaching

Explain a node **the first time it appears in the course**, near its first use:

```text
### Node Name

**What it does**        1-2 sentences.
**Why we're using it here**   tied to this lab's business problem.
**Think of it like**    optional one-line analogy.
```

For a node the learner has already met, use a one-line callback instead:

> "You've met the Webhook node before. Same job here: it's the front door."

Do not re-teach familiar nodes. Continuity is what makes ten labs feel like one
course.

---

## Testing Rules

Every lab needs:

- one successful test, with a prediction asked **before** the result
- one intentional failure the learner causes on purpose
- one debugging exercise that reasons from symptom to root cause

Prefer failures that produce a *wrong result* over failures that throw an error.
A green execution that is quietly incorrect is the most valuable lesson in
automation engineering.

```text
Input → Predict → Run → Observe → What did that prove?
```

---

## Challenge Rules

The README shows **requirements, inputs, and what must be proven**.

It never shows the answers. Expected results live in
`challenge/expected-result.json` (or equivalent), and the learner opens that file
only after recording their own predictions.

Hints are progressive and diagnostic:

```text
Hint 1   point at the symptom
Hint 2   point at the data or its shape
Hint 3   point at the rule or concept
Hint 4   where to inspect - never the final expression
```

A hint that contains the finished expression is not a hint.

---

## Make It Your Own

A task addressed to the learner, not a description of what already exists.
Keep it small — one meaningful extension that proves they understood the design.

---

## Tools

The final learner experience uses three tools:

```text
AEP Website   lessons, Send Test, expected vs actual, hints, approvals
n8n           the learner builds the automation
Supabase      persistence, where a lab genuinely teaches it
```

While the website is being built, labs may use **Postman or curl** to send
webhook test requests, and **ngrok** only if a learner's local setup requires a
public URL. Both are temporary scaffolding — document them as options, never as
AEP tools the learner must adopt.

Link setup steps to [`environment-setup.md`](environment-setup.md) rather than
repeating them in each lab.
