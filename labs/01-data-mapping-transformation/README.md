# Lab 01 — Data Mapping & Transformation

- **Difficulty:** Beginner
- **Main Concept:** Data Mapping & Transformation
- **Estimated Time:** 30–45 minutes

---

## 1. What You Will Learn

By the end of this lab, you should understand how to:

- read incoming JSON data
- select the fields you need
- rename fields
- combine multiple fields
- clean and transform values
- remove unnecessary data
- work with nested objects
- work with arrays
- create a clean output structure for another system

---

## 2. Simple Explanation

### What is it?

Data mapping means taking information from one system and matching it to the fields another system expects.

Data transformation means changing or cleaning that data before sending it to another system.

### What problem does it solve?

Different apps often use different field names and data formats.

For example, a lead form may send:

- `first_name`
- `last_name`
- `email_address`

But a CRM may expect:

- `name`
- `email`

Without proper mapping and transformation, integrations may fail or store messy data.

### How does this help a real business?

Businesses connect forms, CRMs, databases, email platforms, payment systems, and many other applications.

Data mapping makes sure information moves between those systems correctly without requiring manual cleanup.

---

## 3. Business Scenario

A company receives leads from a Facebook Lead Form.

The form sends:

```json
{
  "first_name": "Alex",
  "last_name": "Rivera",
  "email_address": " ALEX@EXAMPLE.COM ",
  "company": "Northstar Commerce",
  "source": "Facebook Lead Form"
}
```

The CRM expects:

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "company": "Northstar Commerce",
  "lead_source": "Facebook Lead Form"
}
```

### Goal

Create an automation that:

- combines `first_name` and `last_name`
- renames `email_address` to `email`
- removes unnecessary spaces from the email
- converts the email to lowercase
- renames `source` to `lead_source`
- keeps the company name
- outputs only the fields required by the CRM

---

## 4. Automation Flow

```text
Manual Trigger
      ↓
Sample Lead Input
      ↓
Transform for CRM
      ↓
Final Clean JSON
```

The workflow receives sample lead data, transforms it into the structure required by the CRM, and returns a clean final object.

---

## 5. Tools Used

- n8n
- JavaScript expressions
- JSON sample data

This lab does not require Supabase, Postman, or an external API.

---

## 6. Prerequisites

Before starting:

- [ ] n8n is running
- [ ] Basic understanding of fields and values
- [ ] Lab sample data is available
- [ ] No external credentials are required

---

## 7. Guided Build

### Step 1 — Manual Trigger

Add a **Manual Trigger** node.

#### What

Starts the workflow manually.

#### Purpose

Allows you to test the transformation without needing an external application.

#### Business Reason

Automation engineers often test logic independently before connecting a real form, CRM, webhook, or API.

---

### Step 2 — Sample Lead Input

Add an **Edit Fields (Set)** node.

Rename it:

```text
Sample Lead Input
```

Use this JSON:

```json
{
  "first_name": "Alex",
  "last_name": "Rivera",
  "email_address": " ALEX@EXAMPLE.COM ",
  "company": "Northstar Commerce",
  "source": "Facebook Lead Form"
}
```

#### What

Simulates data coming from an external lead form.

#### Purpose

Provides predictable test data.

#### Business Reason

Using mock data allows engineers to safely test automation logic before connecting real customer data.

---

### Step 3 — Transform for CRM

Add another **Edit Fields (Set)** node.

Rename it:

```text
Transform for CRM
```

Connect:

```text
Manual Trigger
      ↓
Sample Lead Input
      ↓
Transform for CRM
```

Create these fields.

### `name`

Combine the first and last name:

```javascript
{{ $json.first_name + ' ' + $json.last_name }}
```

Expected:

```text
Alex Rivera
```

### `email`

Remove extra spaces and convert the email to lowercase:

```javascript
{{ $json.email_address.trim().toLowerCase() }}
```

Expected:

```text
alex@example.com
```

### `company`

Keep the company:

```javascript
{{ $json.company }}
```

### `lead_source`

Map the original `source` field:

```javascript
{{ $json.source }}
```

Turn **Include Other Input Fields** OFF so the final result contains only the CRM-ready fields.

---

## 8. Expected Output

The final output should be:

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "company": "Northstar Commerce",
  "lead_source": "Facebook Lead Form"
}
```

---

## 9. Success Test

Run the entire workflow.

Check that:

- [ ] `first_name` and `last_name` became one `name`
- [ ] email spaces were removed
- [ ] email became lowercase
- [ ] `source` became `lead_source`
- [ ] unnecessary original fields were removed
- [ ] actual output matches the expected output

### Pass Condition

The test passes when the final JSON matches the expected CRM structure.

---

## 10. Break It — Failure Scenario

Now intentionally break the automation.

Inside `Sample Lead Input`, rename:

```text
email_address
```

to:

```text
email
```

Do not change the `Transform for CRM` expression.

The transformation still expects:

```javascript
{{ $json.email_address.trim().toLowerCase() }}
```

Run the workflow again.

### What happened?

The source object no longer contains:

```text
email_address
```

but the transformation still expects it.

The email value may become:

```text
undefined
```

or:

```json
null
```

depending on the configuration.

---

## 11. Debug It

Before fixing the problem, investigate it.

### What failed?

The email transformation.

### Where did it fail?

Inside:

```text
Transform for CRM
```

### Why did it fail?

The incoming data structure changed.

The workflow expects:

```text
email_address
```

but the actual input contains:

```text
email
```

### What is the root cause?

A **schema mismatch**.

The structure of the source data no longer matches what the transformation expects.

### Fix

Restore:

```text
email_address
```

Then run the workflow again.

Verify:

- [ ] email is no longer null
- [ ] email is trimmed
- [ ] email is lowercase
- [ ] the original successful output returns
- [ ] no other fields were affected

### Engineering Lesson

Never assume the incoming data structure has stayed the same.

When a workflow suddenly breaks, inspect the actual input before changing the automation logic.

---

## 12. Challenge — Nested Lead Payload to CRM

Now solve a more realistic transformation problem with less guidance.

Use this input:

```json
{
  "contact": {
    "first": "  jamie ",
    "last": "LEE  ",
    "email": " JAMIE.LEE@EMAIL.COM "
  },
  "company": {
    "name": " Northstar Commerce ",
    "role": "operations manager"
  },
  "marketing": {
    "source": "facebook",
    "campaign": "AEP September Campaign"
  },
  "interests": [
    "Automation",
    "CRM",
    "AI"
  ],
  "location": {
    "city": "  Perth ",
    "country": "AU"
  },
  "tags": [
    "Hot Lead",
    "Facebook",
    "Automation"
  ]
}
```

### Requirements

Transform the payload into one clean, flat CRM object.

Your workflow must:

- [ ] extract data from nested objects
- [ ] combine first and last name
- [ ] remove unnecessary whitespace
- [ ] lowercase the email
- [ ] rename company fields
- [ ] rename marketing fields
- [ ] convert `interests` into one comma-separated string
- [ ] convert `location` into `City, Country`
- [ ] convert `tags` into one pipe-separated string
- [ ] output only CRM-ready fields

Do not modify the original input just to make the challenge easier.

---

## 13. Expected Challenge Output

Your result should eventually become:

```json
{
  "full_name": "jamie LEE",
  "email": "jamie.lee@email.com",
  "company_name": "Northstar Commerce",
  "job_title": "operations manager",
  "lead_source": "facebook",
  "campaign_name": "AEP September Campaign",
  "interests": "Automation, CRM, AI",
  "location": "Perth, AU",
  "tags": "Hot Lead | Facebook | Automation"
}
```

Try solving the challenge before reading the hints below.

---

## 14. Progressive Hints

### Hint 1 — Nested Objects

Look at the path of the value you need.

For example:

```text
contact
   ↓
first
```

The expression pattern looks like:

```javascript
{{ $json.contact.first }}
```

---

### Hint 2 — Cleaning Strings

Some values contain unnecessary spaces.

Think about:

```javascript
.trim()
```

Use it only where necessary.

---

### Hint 3 — Objects vs Arrays

This:

```json
{
  "city": "Perth",
  "country": "AU"
}
```

is an **object**.

This:

```json
[
  "Automation",
  "CRM",
  "AI"
]
```

is an **array**.

Objects are accessed using their properties.

Arrays provide methods for working with multiple values.

---

### Hint 4 — Arrays

Avoid manually referencing:

```text
tags[0]
tags[1]
tags[2]
```

That breaks as soon as the array has a different number of values.

Think about:

```javascript
.join()
```

`.join()` turns every value in an array into one string, and you choose the text placed between the values.

An unrelated example:

```javascript
{{ $json.colours.join(' / ') }}
```

If `colours` is:

```json
["red", "green", "blue"]
```

the result is:

```text
red / green / blue
```

Now look closely at the expected output for `interests` and `tags`.

They do **not** use the same separator.

Read the expected values character by character, including the spaces, and give each field the separator it actually needs.

---

### Hint 5 — Apply Each Rule Only Where It Belongs

Re-read the requirements list.

Some rules apply to one field only.

For example, the requirements ask you to lowercase the **email**.

They do not ask you to change the casing of any other field.

If a value in your output looks cleaner than the expected result, you have probably applied a transformation somewhere it was not requested.

---

## 15. Challenge Verification

The challenge passes when:

- [ ] `full_name` is correct
- [ ] email is trimmed and lowercase
- [ ] company name contains no unnecessary spaces
- [ ] nested fields are extracted correctly
- [ ] `interests` is a string instead of an array
- [ ] `location` equals `Perth, AU`
- [ ] `tags` equals `Hot Lead | Facebook | Automation`
- [ ] only CRM-ready fields remain

---

## 16. Make It Your Own

Now modify the workflow yourself.

Try one or more:

- [ ] change the business scenario
- [ ] create different sample data
- [ ] add another nested object
- [ ] add another array
- [ ] add or remove CRM fields
- [ ] use different array separators
- [ ] add another intentionally messy value
- [ ] create your own failure scenario
- [ ] verify your modified workflow still works

The goal is to prove that you understand the concept well enough to apply it to a different situation.

---

## 17. Important Discoveries

### Strings

Remove unnecessary whitespace:

```javascript
.trim()
```

Convert text to lowercase:

```javascript
.toLowerCase()
```

---

### Nested Objects

Access nested values through their property path:

```javascript
{{ $json.company.name }}
```

---

### Arrays

Arrays contain multiple values:

```json
[
  "Automation",
  "CRM",
  "AI"
]
```

Arrays are different from objects.

---

### Joining Arrays

Convert an array into one readable string:

```javascript
{{ $json.interests.join(', ') }}
```

Result:

```text
Automation, CRM, AI
```

Or use a different separator:

```javascript
{{ $json.tags.join(' | ') }}
```

Result:

```text
Hot Lead | Facebook | Automation
```

---

## 18. What You Learned

After completing this lab, you should be able to explain:

- what data mapping means
- what data transformation means
- why different systems require different data structures
- how to rename fields
- how to combine fields
- how to clean string values
- how to access nested objects
- the difference between objects and arrays
- how to join array values
- how a schema mismatch can break an automation
- how to inspect and debug mapping failures
- why clean output structures matter in real integrations

---

## Workflow File

The completed n8n workflow for the **guided build** is available here:

```text
workflow/lab-01-data-mapping-transformation.json
```

Try building the lab yourself before importing it.

The export also includes `Challenge | Sample Data`, which gives you the challenge
payload ready to work with.

The challenge **solution** is intentionally not included. Building that
transformation yourself is the point of the challenge.

To check your answer, compare your output against:

```text
challenge/expected-output.json
```

---

## Lab Completion Checklist

- [ ] Simple explanation understood
- [ ] Business problem understood
- [ ] Guided build completed
- [ ] Successful test passed
- [ ] Failure scenario reproduced
- [ ] Root cause identified
- [ ] Failure fixed
- [ ] Successful test passed again
- [ ] Challenge completed
- [ ] Challenge output verified
- [ ] Make It Your Own attempted
- [ ] Important discoveries understood
- [ ] Workflow export available
- [ ] No secrets are exposed