# Lab XX — Lab Title

- **Difficulty:** Beginner / Intermediate / Advanced
- **Main Concept:** The one idea this lab teaches
- **Estimated Time:** XX minutes

---

## The Hook

Two to four sentences. Open with something going wrong, or about to.

> "Your AI says this customer belongs in Sales. Great. One small problem: the
> answer came back as text pretending to be JSON."

Make the learner want the rest of the lab.

---

## The Business Problem

What breaks today, and what it costs. Keep it short and realistic.

Name the problem the lab exists to solve — not the technology that solves it.

---

## What You'll Build

One sentence, then the flow.

```text
Trigger
   ↓
Process
   ↓
Decision
   ↓
Action
   ↓
Result
```

---

## What You Already Know

Connect to earlier labs in a few lines. Name the concept, not just the number.

> "You already know how to route clean data. Now we add the unpredictable
> teammate."

For Lab 01 this is simply: this is where we start.

---

## Prerequisites

- [ ] n8n running
- [ ] Any credential this lab needs
- [ ] A way to send a webhook test request (only if the lab uses one)

Setup steps: [`docs/environment-setup.md`](../../docs/environment-setup.md).

Do not repeat setup instructions here — link to them.

---

## Meet the New Nodes

Only nodes appearing for the **first time in the course**.

### Node Name

**What it does**
One or two sentences.

**Why we're using it here**
Tie it to this lab's business problem.

**Think of it like**
Optional one-line analogy.

### Returning friends

One line for nodes already met:

> "**Webhook** — still the front door. **Edit Fields (Set)** — still shaping
> data."

---

# Guided Build

Create a new workflow. Name it:

```text
AEP Lab XX - Lab Title
```

## Step 1 — Name the outcome, not the node

What to add, what to name it, what to set.

Then say **why** — what problem this step solves, and what the learner should
notice about it.

## Step 2 — Keep steps small

A step should be one logical idea. If a step has three unrelated reasons, it is
probably two steps.

Explain a configuration value only when it is non-obvious or teaches something.

---

# Predict & Test

Give the learner an input:

```text
sample-data/valid-input.json
```

**Ask before revealing.** "What do you expect to come back, and why?"

Then run it, show the result, and explain what it proves — in order:

1. what reached the workflow
2. what the logic decided
3. why that outcome is correct

---

# Break It

Have the learner cause a realistic failure on purpose.

State what to change and ask them to predict the outcome before running.

The failure must teach the concept. Prefer a **silently wrong result** over a red
error — that is the harder and more valuable lesson.

---

# Debug It

**Investigate first.** Ask before answering:

1. What failed?
2. Where did it fail?
3. What does the node actually receive?
4. Which rule or condition decided this?
5. What evidence proves the cause?

### Hint 1 — The symptom
Point at what is observably wrong.

### Hint 2 — The data
Point at the shape or value to inspect.

### Hint 3 — The rule
Point at the concept that was violated.

### Root cause and lesson

Name the cause plainly, then the wider lesson. Tell the learner to restore the
working version if they broke something.

---

# Challenge

What the learner must accomplish with less guidance.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## What you must prove

Describe the evidence, not the answer.

Check results against:

```text
challenge/expected-result.json
```

Open it **after** recording your own predictions.

> Never print the expected answers in this README.

## Progressive Hints

**Hint 1** — point at the symptom or the part that looks unusual.

**Hint 2** — point at the data to inspect.

**Hint 3** — point at the concept or rule involved.

**Hint 4** — where to look. Never the final expression.

---

# Make It Your Own

A task for the learner, in the imperative.

Then say why it matters in a real system — debugging, auditing, traceability.

Keep it small. One extension that proves understanding.

---

# What You Learned

**What we built:** one sentence.

**The business problem it solves:** one sentence.

**The technical lesson that mattered most:** the idea worth remembering in six
months.

**In a real production system**, you would also... (briefly).

---

# What's Next

Name the gap this lab leaves open, and let the next lab fill it.

> "We can now make AI output predictable. But predictable is not the same as
> permitted."

One short paragraph. Make the next lab feel necessary.
