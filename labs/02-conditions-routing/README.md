# Lab 02 — Conditions & Routing

- **Difficulty:** Beginner
- **Main Concept:** Conditions, Routing, AND / OR Logic
- **Estimated Time:** 45–60 minutes

---

## 1. What You Will Learn

By the end of this lab, you should understand how to:

- route records into different paths
- use IF / ELSE logic
- use multiple conditions
- understand AND logic
- understand OR logic
- create fallback routes
- understand why condition order matters
- detect logic bugs that do not produce workflow errors
- test routing rules using multiple cases

---

## 2. Simple Explanation

Conditions allow an automation to make decisions.

Instead of sending every lead through the same path, the workflow can inspect the lead data and decide what should happen next.

### What problem does this solve?

Businesses rarely treat every record the same way.

For example:

- high-value leads may need immediate sales follow-up
- warm leads may need manual review
- lower-priority leads may go into nurture
- everything else may use a fallback route

### How does this help a real business?

Conditions are used in:

- lead routing
- customer support
- approvals
- order processing
- onboarding
- notifications
- risk checks
- AI decision workflows

---

## 3. Guided Business Scenario

A company receives leads with:

- `lead_temperature`
- `budget`
- `contacted_before`

The workflow should route them using these rules.

### Priority Sales

A lead goes to **Priority Sales** only when:

- `lead_temperature = Hot`
- AND `budget >= 3000`
- AND `contacted_before = false`

### Nurture

A lead goes to **Nurture** when:

- `lead_temperature = Warm`

### Low Priority

Everything else goes to:

- **Low Priority**

---

## 4. Guided Automation Flow

```text
Manual Trigger
      ↓
Sample Leads
      ↓
Check Priority Sales
   /             \
TRUE             FALSE
 ↓                 ↓
Priority Sales   Check Warm Lead
                  /          \
                TRUE         FALSE
                 ↓             ↓
              Nurture     Low Priority
```

---

## 5. Tools Used

- n8n
- JavaScript
- JSON sample data

---

## 6. Prerequisites

Before starting this lab, you should already know:

- how to create an n8n workflow
- how to run a workflow manually
- how n8n items work
- basic JSON structure
- how to map values using expressions

If you completed Lab 01, you are ready for this lab.

---

## 7. Guided Build

### Step 1 — Create the Workflow

Create a new workflow in n8n.

Name it:

```text
AEP Lab 02 - Conditions & Routing
```

Add a:

```text
Manual Trigger
```

---

### Step 2 — Add Sample Leads

Add a **Code** node after the Manual Trigger.

Rename it:

```text
Sample Leads
```

Set the Code node to:

```text
Run Once for All Items
```

Use sample lead data similar to:

```javascript
return [
  {
    json: {
      name: "Alex Rivera",
      lead_temperature: "Hot",
      budget: 5000,
      contacted_before: false
    }
  },
  {
    json: {
      name: "Jamie Lee",
      lead_temperature: "Warm",
      budget: 2500,
      contacted_before: false
    }
  },
  {
    json: {
      name: "Taylor Kim",
      lead_temperature: "Cold",
      budget: 800,
      contacted_before: true
    }
  }
];
```

Run the Code node.

You should receive three separate n8n items.

---

### Step 3 — Create the Priority Sales Check

Add an **IF** node after `Sample Leads`.

Rename it:

```text
Check Priority Sales
```

The business rule is:

```text
Hot
AND
budget >= 3000
AND
contacted_before = false
```

Add these three conditions:

#### Condition 1

```text
lead_temperature
is equal to
Hot
```

#### Condition 2

```text
budget
is greater than or equal to
3000
```

#### Condition 3

```text
contacted_before
is equal to
false
```

Set the condition matching mode to:

```text
ALL / AND
```

This means every condition must be true.

---

### Step 4 — Create the Priority Sales Route

From the TRUE output of `Check Priority Sales`, add an **Edit Fields** node.

Rename it:

```text
Priority Sales
```

Add:

```text
route = Priority Sales
```

Keep the original lead fields.

---

### Step 5 — Check for Warm Leads

From the FALSE output of `Check Priority Sales`, add another **IF** node.

Rename it:

```text
Check Warm Lead
```

Add this condition:

```text
lead_temperature
is equal to
Warm
```

---

### Step 6 — Create the Nurture Route

From the TRUE output of `Check Warm Lead`, add an **Edit Fields** node.

Rename it:

```text
Nurture
```

Add:

```text
route = Nurture
```

Keep the original lead fields.

---

### Step 7 — Create the Fallback Route

From the FALSE output of `Check Warm Lead`, add an **Edit Fields** node.

Rename it:

```text
Low Priority
```

Add:

```text
route = Low Priority
```

Keep the original lead fields.

---

## 8. Guided Success Test

Run the complete workflow.

Use:

```text
sample-data/valid-leads.json
```

Expected routing:

```text
Alex Rivera  → Priority Sales
Jamie Lee    → Nurture
Taylor Kim   → Low Priority
```

Verify:

- [ ] Alex reaches Priority Sales
- [ ] Jamie reaches Nurture
- [ ] Taylor reaches Low Priority
- [ ] no lead reaches the wrong final route
- [ ] route values are correct

If the routing is correct, continue to the failure exercise.

---

## 9. Break It — Intentional Logic Failure

Now intentionally introduce a logic bug.

Inside:

```text
Check Priority Sales
```

change the condition matching mode from:

```text
ALL / AND
```

to:

```text
ANY / OR
```

Run the workflow again.

---

## 10. What Went Wrong?

With OR logic, only one condition needs to be true.

That means a lead may enter Priority Sales even when the full business rule is not satisfied.

For example:

```text
Jamie Lee

lead_temperature = Warm       ❌
budget >= 3000                ❌
contacted_before = false      ✅
```

With OR logic:

```text
FALSE OR FALSE OR TRUE
```

becomes:

```text
TRUE
```

So Jamie can incorrectly enter Priority Sales.

The workflow may still execute successfully.

There may be:

- no red error
- no failed node
- no technical exception

But the business result is wrong.

---

## 11. Debug It

Before fixing the workflow, answer these questions:

1. Which lead was routed incorrectly?
2. Which condition allowed that lead through?
3. Did the business rule require one condition or every condition?
4. Was the node using AND or OR?
5. Did n8n show a technical error?

### Root Cause

Priority Sales requires all three conditions to be true.

The workflow used:

```text
OR
```

instead of:

```text
AND
```

### Fix

Restore:

```text
ALL / AND
```

Run the workflow again.

Expected result:

```text
Alex Rivera  → Priority Sales
Jamie Lee    → Nurture
Taylor Kim   → Low Priority
```

---

## 12. Important Discovery

A workflow can be technically successful but logically wrong.

This is one of the most important lessons in automation engineering.

A green execution does not automatically mean:

```text
correct automation
```

You must also verify:

```text
correct business behavior
```

---

## Unexpected Input Test

Test the workflow with:

```json
{
  "name": "Broken Lead",
  "lead_temperature": "",
  "budget": null,
  "contacted_before": false,
  "country": "AU"
}
```

Expected routing:

```text
Priority Sales → false
Warm Lead → false
Low Priority → true
```

---

# Challenge — Smart Lead Routing

Now build a more advanced routing system.

Do not immediately look for the final solution.

Try to reason through the routing order yourself.

Use:

```text
challenge/challenge-input.json
```

The available routes are:

```text
Priority Sales
Manual Review
Nurture
Low Priority
```

---

## 13. Challenge Data

The challenge includes leads such as:

```text
Alex Rivera
Dana Reyes
Jamie Lee
Jordan Patel
Casey Wong
Taylor Kim
Morgan Cruz
```

Each lead contains:

```text
name
lead_temperature
budget
contacted_before
country
```

---

## 14. Challenge Business Rules

### Rule 1 — Priority Sales

Route to:

```text
Priority Sales
```

when:

```text
lead_temperature = Hot
AND
budget >= 3000
AND
contacted_before = false
```

---

### Rule 2 — Manual Review

Warm leads may require manual review.

Route a Warm lead to:

```text
Manual Review
```

when:

```text
budget >= 4000
OR
country = AU
```

---

### Rule 3 — Nurture

If the lead is Warm but does not qualify for Manual Review:

```text
Nurture
```

---

### Rule 4 — Low Priority

Everything else goes to:

```text
Low Priority
```

---

## 15. Think Before Building

Before adding nodes, think about the order.

Ask:

```text
Which rules are more specific?
Which rules are more general?
Which leads could accidentally get caught too early?
```

For example:

If every Warm lead is immediately routed to Nurture, then a Warm lead that should have gone to Manual Review may never reach the Manual Review condition.

This means:

```text
condition order matters
```

---

## 16. Challenge Architecture

A valid architecture can look like:

```text
Sample Leads
      ↓
Check Priority Sales
      ↓ FALSE
Check Warm Lead
   /          \
FALSE         TRUE
  ↓             ↓
Low       Check Manual Review
Priority      /          \
            TRUE         FALSE
             ↓             ↓
        Manual Review    Nurture
```

The exact visual layout may vary.

The important part is that the business result is correct.

---

## 17. Manual Review Logic

By the time a lead reaches:

```text
Check Manual Review
```

the workflow already knows that the lead is Warm.

That means you do not necessarily need to check:

```text
lead_temperature = Warm
```

again.

The Manual Review node can focus on:

```text
budget >= 4000
OR
country = AU
```

Set this condition group to:

```text
ANY / OR
```

---

## 18. Expected Challenge Routing

Expected results:

```text
Alex Rivera   → Priority Sales
Dana Reyes    → Priority Sales
Jamie Lee     → Manual Review
Jordan Patel  → Manual Review
Casey Wong    → Manual Review
Taylor Kim    → Nurture
Morgan Cruz   → Low Priority
```

The same expected results are stored in:

```text
challenge/expected-routing.json
```

---

# Progressive Hints

Try solving the challenge before using these.

---

## Hint 1 — Start With the Most Specific Rule

Priority Sales has several requirements.

Check it before broader routing rules.

---

## Hint 2 — Warm Leads Need Another Decision

Do not immediately send every Warm lead to Nurture.

Some Warm leads require:

```text
Manual Review
```

---

## Hint 3 — Think About AND vs OR

Ask:

> Must every condition be true?

Use:

```text
AND
```

Ask:

> Is either condition enough?

Use:

```text
OR
```

---

## Hint 4 — Manual Review

For a Warm lead:

```text
budget >= 4000
OR
country = AU
```

means either condition can qualify the lead.

---

## Hint 5 — Test the Logic, Not Just the Output

If one test lead has:

```text
budget >= 4000 = TRUE
country = AU   = TRUE
```

then both AND and OR would return TRUE.

That test alone cannot prove that OR is configured correctly.

You need better test cases.

---

# Testing OR Properly

## 19. Jamie Test

Jamie has:

```text
budget = 4200
country = AU
```

Therefore:

```text
budget >= 4000 → TRUE
country = AU   → TRUE
```

Result:

```text
TRUE OR TRUE
→ TRUE
```

Expected:

```text
Manual Review
```

However, this does not prove whether the node is using AND or OR because both conditions are true.

---

## 20. Casey Test

Casey was added to isolate the country condition.

Example:

```text
lead_temperature = Warm
budget = 2000
country = AU
```

Evaluation:

```text
budget >= 4000 → FALSE
country = AU   → TRUE
```

Result:

```text
FALSE OR TRUE
→ TRUE
```

Expected route:

```text
Manual Review
```

If Casey reaches Manual Review, the country side of the OR logic works.

---

## 21. Jordan Test

Jordan was added to isolate the budget condition.

Example:

```text
lead_temperature = Warm
budget = 4500
country = US
```

Evaluation:

```text
budget >= 4000 → TRUE
country = AU   → FALSE
```

Result:

```text
TRUE OR FALSE
→ TRUE
```

Expected route:

```text
Manual Review
```

If Jordan reaches Manual Review, the budget side of the OR logic works.

---

## 22. Taylor Test

Taylor tests the case where neither Manual Review condition is true.

Example:

```text
lead_temperature = Warm
budget = 1500
country = US
```

Evaluation:

```text
budget >= 4000 → FALSE
country = AU   → FALSE
```

Result:

```text
FALSE OR FALSE
→ FALSE
```

Expected route:

```text
Nurture
```

---

## 23. OR Test Matrix

The challenge now tests:

```text
TRUE  OR TRUE   → TRUE
FALSE OR TRUE   → TRUE
TRUE  OR FALSE  → TRUE
FALSE OR FALSE  → FALSE
```

This is stronger than testing only one happy path.

---

## 24. Challenge Verification

The challenge passes when:

- [ ] Alex reaches Priority Sales
- [ ] Mark reaches Priority Sales
- [ ] Jamie reaches Manual Review
- [ ] Casey reaches Manual Review because country is AU
- [ ] Jordan reaches Manual Review because budget is high
- [ ] Taylor reaches Nurture
- [ ] Morgan reaches Low Priority
- [ ] Priority Sales uses AND correctly
- [ ] Manual Review uses OR correctly
- [ ] fallback routing works
- [ ] routing order does not create accidental matches
- [ ] each important logical case has been tested

---

# Make It Your Own

## 25. Create Your Own Routing Behavior

Now modify the workflow in a way that makes sense to you.

Examples:

- create a VIP route
- add a referral route
- route a specific country differently
- notify someone when a high-value lead appears
- trigger Slack
- trigger email
- create an approval step
- add a new fallback condition

Do not simply copy the guided workflow.

Experiment.

---

## 26. Real Action Experiment

During development of this lab, an additional personal experiment was created.

A specific lead:

```text
Dana Reyes
```

was checked using an IF condition.

When the condition matched, the workflow triggered a real email action.

Conceptually:

```text
Lead enters workflow
      ↓
Check condition
      ↓
Condition matches
      ↓
Send Email
      ↓
Real notification received
```

This demonstrates an important idea:

Conditions do not only decide between labels.

They can control real business actions.

For example:

```text
VIP lead
→ notify sales manager

Urgent support request
→ alert support team

Large purchase
→ request approval

High-risk record
→ manual review
```

---

## 27. Security Reminder

When experimenting with real integrations:

Do not commit:

- passwords
- personal access tokens
- API keys
- secret keys
- private credentials
- sensitive email configuration

Workflow examples should remain safe for a public repository.

---

# Important Engineering Concepts

## 28. AND Logic

Use AND when every required condition must pass.

Example:

```text
Hot
AND
budget >= 3000
AND
contacted_before = false
```

All must be true.

Example:

```text
TRUE AND TRUE AND TRUE
→ TRUE
```

But:

```text
TRUE AND FALSE AND TRUE
→ FALSE
```

---

## 29. OR Logic

Use OR when any qualifying condition is enough.

Example:

```text
budget >= 4000
OR
country = AU
```

Examples:

```text
TRUE OR FALSE
→ TRUE
```

```text
FALSE OR TRUE
→ TRUE
```

```text
FALSE OR FALSE
→ FALSE
```

---

## 30. Fallback Routing

Fallback routes catch records that did not qualify for previous routes.

Example:

```text
if not Priority Sales
and not Manual Review
and not Nurture
→ Low Priority
```

Without fallback behavior, records may be left unhandled.

---

## 31. Condition Order

Condition order can affect business results.

Specific rules should usually happen before broad rules.

For example:

Incorrect:

```text
Warm
→ Nurture
```

before checking:

```text
Warm AND high budget
→ Manual Review
```

The high-budget Warm lead may get caught by Nurture first.

Better:

```text
specific rule
↓
general rule
↓
fallback
```

---

## 32. Logic Bugs vs Technical Errors

### Technical Error

Something fails technically.

Examples:

```text
API request fails
invalid expression
missing credential
bad JSON
```

n8n may show a red error.

### Logic Bug

The workflow runs successfully but makes the wrong decision.

Example:

```text
OR used instead of AND
```

The workflow may stay green.

This makes logic bugs especially dangerous.

---

## 33. Testing Business Logic

Do not only ask:

```text
Did the workflow run?
```

Also ask:

```text
Did the correct record reach the correct destination?
```

Good test data should include:

- expected success cases
- expected failure cases
- edge cases
- conditions where only one OR branch is true
- fallback cases

---

# What You Learned

## 34. After This Lab You Should Be Able To Explain

- what conditional routing means
- how IF / ELSE logic works
- how n8n routes items
- the difference between AND and OR
- how multiple conditions affect routing
- how fallback routes work
- why rule order matters
- why green executions can still contain business bugs
- how to intentionally reproduce a logic failure
- how to debug an incorrect route
- how to design better test cases
- how to verify both sides of an OR condition
- how conditions can trigger real business actions

---

# Files

## Guided Sample Data

```text
sample-data/valid-leads.json
sample-data/expected-routing.json
```

---

## Challenge Files

```text
challenge/challenge-input.json
challenge/expected-routing.json
```

---

## Completed n8n Workflow

```text
workflow/lab-02-conditions-routing.json
```

Try building and debugging the workflow yourself before importing the completed workflow.

---

# Lab Completion Checklist

- [ ] Read the simple explanation
- [ ] Understand the business problem
- [ ] Created the Manual Trigger
- [ ] Created multiple sample leads
- [ ] Built Priority Sales routing
- [ ] Built Warm Lead routing
- [ ] Built Low Priority fallback
- [ ] Verified the guided success test
- [ ] Changed AND to OR intentionally
- [ ] Reproduced the incorrect routing behavior
- [ ] Identified the root cause
- [ ] Restored the correct AND logic
- [ ] Started the Smart Lead Routing challenge
- [ ] Built Manual Review routing
- [ ] Used OR correctly
- [ ] Tested Jamie
- [ ] Tested Casey
- [ ] Tested Jordan
- [ ] Tested Taylor
- [ ] Verified Low Priority fallback
- [ ] Completed the challenge
- [ ] Completed a Make It Your Own experiment
- [ ] Triggered or experimented with a real action
- [ ] Exported the workflow
- [ ] Stored challenge data
- [ ] Stored expected results
- [ ] Checked the exported workflow for secrets

---

# Lab 02 Complete

If you can explain why:

```text
Correct execution ≠ correct business logic
```

and you can confidently choose between:

```text
AND
```

and:

```text
OR
```

based on a business requirement, you have completed the core objective of this lab.

Next:

```text
Lab 03 — APIs & Webhooks
```