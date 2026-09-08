# Lab 04 — Validation & Normalization

## Difficulty

Beginner → Intermediate

## Main Learning Outcome

Understand why incoming data should never be trusted automatically.

By the end of this lab, you should understand how to:

- define required fields
- validate incoming payloads
- detect missing fields
- validate email format
- normalize email values
- normalize phone numbers
- normalize dates
- trim unwanted spaces
- route invalid data separately
- return clear validation errors
- preserve raw input for debugging
- distinguish required fields from optional fields
- understand the difference between normalization and validation

---

# What You Learn

In this lab, you build a small **Lead Intake Validator**.

The workflow receives lead data from an external request, cleans it, validates it, and decides whether the lead should continue through the automation.

The main idea is:

> Never trust incoming data automatically.

A form, webhook, CRM, API, or another automation can send:

- missing fields
- extra spaces
- inconsistent capitalization
- badly formatted phone numbers
- invalid email addresses
- impossible dates
- unexpected field names

Before using that data, your automation should clean and validate it.

---

# Simple Explanation

## What is normalization?

Normalization means:

> Convert incoming data into one consistent format.

Example:

```text
"   Mark Milca   "
```

becomes:

```text
"Mark Milca"
```

Another example:

```text
"  MARK@GMAIL.COM "
```

becomes:

```text
"mark@gmail.com"
```

Another:

```text
+63 (917) 555-1234
```

becomes:

```text
639175551234
```

Normalization does not decide whether the value is correct.

It only cleans or standardizes it.

---

## What is validation?

Validation means:

> Check whether the data follows the rules your system expects.

Example:

```text
markgmail.com
```

is not a valid-looking email address because it does not contain `@`.

Another example:

```text
123
```

is too short for the phone-number rule used in this lab.

Another:

```text
2026-02-31
```

has the correct format, but February 31 does not exist.

---

# Important Difference

Remember this:

```text
Normalization
= What should this data look like?

Validation
= Is this data acceptable?
```

The workflow first cleans the data.

Then it decides whether the cleaned data is valid.

---

# Business Scenario

A company receives leads from its website.

The form sends:

```json
{
  "name": "   Mark Milca   ",
  "email": "  MARK@GMAIL.COM ",
  "phone": "0917 123 4567",
  "country": " ph ",
  "preferred_contact_date": "08/09/2026"
}
```

The data exists, but it is inconsistent.

If this data is sent directly into a CRM, database, email automation, or external API, it could create problems later.

The automation should first convert it into:

```json
{
  "name": "Mark Milca",
  "email": "mark@gmail.com",
  "phone": "09171234567",
  "country": "PH",
  "preferred_contact_date": "2026-09-08"
}
```

Then the workflow validates the cleaned data.

If everything is acceptable:

```text
VALID
→ continue
```

If something is wrong:

```text
INVALID
→ return validation errors
```

---

# Automation Flow

```text
Postman / Future AEP Website
        ↓
Receive Lead Request
        ↓
Normalize Lead Data
        ↓
Validate Lead Data
        ↓
Is Lead Valid?
      /          \
   TRUE          FALSE
    ↓              ↓
Return Valid    Return Validation
Lead            Errors
200 OK          400 Bad Request
```

---

# Tools Used

## Required

- n8n
- Postman
- JavaScript

## Future AEP Website

Postman is used during development to send requests manually.

Later, the AEP website can become the main learner-facing interface.

A learner could enter a messy payload in the website and see:

```text
Raw Input
↓
Normalized Data
↓
Validation Result
↓
Valid / Invalid Route
```

The learner should still build the workflow inside their own n8n instance.

AEP should guide and test the learner's workflow rather than replacing n8n.

---

# Prerequisites

Before starting this lab, you should already understand:

- n8n Webhook nodes
- HTTP POST requests
- JSON payloads
- basic JavaScript
- expressions
- IF nodes
- Respond to Webhook nodes
- HTTP status codes

These concepts were introduced in earlier labs.

---

# Data Contract

For this lab, the incoming lead payload uses these fields:

```text
name
email
phone
country
preferred_contact_date
company
```

## Required Fields

The following are required:

```text
name
email
phone
preferred_contact_date
```

## Optional Fields

These are optional:

```text
country
company
```

Important:

> A field can exist in the schema without being required.

For example:

```text
company
```

can be normalized if provided.

But if it is missing, the lead can still be valid.

---

# Guided Build

## Step 1 — Create the Workflow

Create a new workflow in n8n.

Name it:

```text
AEP Lab 04 - Validation and Normalization
```

---

# Step 2 — Receive the Lead

Add a **Webhook** node.

Rename it:

```text
Receive Lead Request
```

Use:

```text
HTTP Method: POST
Path: aep-lab-04-lead
Authentication: None
Respond: Using "Respond to Webhook" Node
```

The webhook receives the raw lead payload.

---

# Step 3 — Normalize the Lead

Add a **Code** node after the webhook.

Rename it:

```text
Normalize Lead Data
```

Use:

```text
Mode: Run Once for Each Item
Language: JavaScript
```

Code:

```javascript
const input = $json.body ?? {};

function normalizeDate(value) {
  const date = String(value ?? '').trim();

  // Already in our standard format
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // For this lab, incoming dates may use DD/MM/YYYY
  const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (match) {
    const [, day, month, year] = match;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Do not invent a value if the format is unknown
  return date;
}

return {
  json: {
    raw_input: input,

    normalized: {
      name: String(input.name ?? '').trim(),

      company: String(input.company ?? '').trim(),

      email: String(input.email ?? '')
        .trim()
        .toLowerCase(),

      phone: String(input.phone ?? '')
        .replace(/\D/g, ''),

      country: String(input.country ?? '')
        .trim()
        .toUpperCase(),

      preferred_contact_date: normalizeDate(
        input.preferred_contact_date
      )
    }
  }
};
```

---

# What the Normalization Node Does

## Name

Input:

```text
"   Mark Milca   "
```

Output:

```text
"Mark Milca"
```

Using:

```javascript
.trim()
```

---

## Email

Input:

```text
"  MARK@GMAIL.COM "
```

Output:

```text
"mark@gmail.com"
```

Using:

```javascript
.trim().toLowerCase()
```

---

## Phone Number

Input:

```text
+63 (917) 555-1234
```

Output:

```text
639175551234
```

Using:

```javascript
.replace(/\D/g, '')
```

`\D` means:

```text
anything that is NOT a digit
```

So the normalizer removes:

```text
+
spaces
(
)
-
```

and keeps only the numbers.

---

## Country

Input:

```text
" ph "
```

Output:

```text
"PH"
```

Using:

```javascript
.trim().toUpperCase()
```

---

## Date

Input:

```text
9/9/2026
```

Output:

```text
2026-09-09
```

The lab uses:

```text
DD/MM/YYYY
```

as an accepted incoming format.

The normalized output uses:

```text
YYYY-MM-DD
```

---

# Why Preserve `raw_input`?

The workflow keeps:

```json
{
  "raw_input": {},
  "normalized": {}
}
```

instead of throwing away the original data.

This is useful for debugging.

You can compare:

```text
What arrived?
```

against:

```text
What did the workflow turn it into?
```

This becomes especially valuable in larger systems.

---

# Step 4 — Test Normalization

Send this payload:

```json
{
  "name": "   Mark Milca   ",
  "email": "  MARK@GMAIL.COM ",
  "phone": "0917 123 4567",
  "country": " ph ",
  "preferred_contact_date": "08/09/2026"
}
```

Expected normalized output:

```json
{
  "name": "Mark Milca",
  "email": "mark@gmail.com",
  "phone": "09171234567",
  "country": "PH",
  "preferred_contact_date": "2026-09-08"
}
```

---

# Step 5 — Validate the Lead

Add another **Code** node.

Rename it:

```text
Validate Lead Data
```

Use:

```text
Mode: Run Once for Each Item
Language: JavaScript
```

Code:

```javascript
const data = $json.normalized;
const errors = [];

// Required fields
if (!data.name) {
  errors.push('name is required');
}

if (!data.email) {
  errors.push('email is required');
}

if (!data.phone) {
  errors.push('phone is required');
}

if (!data.preferred_contact_date) {
  errors.push('preferred_contact_date is required');
}

// Email validation
if (
  data.email &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
) {
  errors.push('email is invalid');
}

// Phone validation
if (
  data.phone &&
  !/^\d{10,15}$/.test(data.phone)
) {
  errors.push('phone must contain 10 to 15 digits');
}

// Date validation
if (data.preferred_contact_date) {
  const match = data.preferred_contact_date.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  let validDate = false;

  if (match) {
    const [, year, month, day] = match;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    validDate =
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day);
  }

  if (!validDate) {
    errors.push('preferred_contact_date is invalid');
  }
}

return {
  json: {
    ...$json,

    validation: {
      is_valid: errors.length === 0,
      errors
    }
  }
};
```

---

# How Validation Works

The validator creates:

```json
{
  "validation": {
    "is_valid": true,
    "errors": []
  }
}
```

or:

```json
{
  "validation": {
    "is_valid": false,
    "errors": [
      "email is invalid"
    ]
  }
}
```

This is better than returning only:

```text
false
```

because the workflow also explains why validation failed.

---

# Required Fields

The validator checks:

```text
name
email
phone
preferred_contact_date
```

If one is missing:

```text
email is required
```

If the field exists but has the wrong format:

```text
email is invalid
```

These are different problems.

---

# Missing vs Invalid

Example 1:

```json
{
  "email": ""
}
```

Result:

```text
email is required
```

Example 2:

```json
{
  "email": "markgmail.com"
}
```

Result:

```text
email is invalid
```

Important:

> Missing data and malformed data should not always be treated as the same problem.

---

# Email Validation

This lab uses a simple structural email check.

A value such as:

```text
alex@example.com
```

passes.

A value such as:

```text
alexexample.com
```

fails.

This does not prove that the email address exists.

It only checks whether the value looks structurally acceptable.

---

# Phone Validation

After normalization, phone numbers must contain:

```text
10 to 15 digits
```

Example:

```text
+63 (917) 555-1234
```

normalizes into:

```text
639175551234
```

This passes because it contains 12 digits.

Important:

> Passing validation does not prove that the phone number is real.

It only means it satisfies the rule defined in this lab.

---

# Date Validation

Normalization can convert:

```text
31/02/2026
```

into:

```text
2026-02-31
```

The format looks correct.

But February 31 does not exist.

This is why normalization alone is not enough.

The validation node checks whether the calendar date actually exists.

---

# Step 6 — Route Valid and Invalid Data

Add an **IF** node after:

```text
Validate Lead Data
```

Rename it:

```text
Is Lead Valid?
```

Condition:

```text
{{ $json.validation.is_valid }}
```

Operator:

```text
is true
```

The flow now becomes:

```text
Validate Lead Data
        ↓
Is Lead Valid?
     /       \
 TRUE       FALSE
```

---

# Step 7 — Return Invalid Data

From the FALSE branch, add a **Respond to Webhook** node.

Rename it:

```text
Return Validation Errors
```

Use:

```text
Respond With: JSON
Response Code: 400
```

Response Body:

```javascript
{{
  {
    success: false,
    message: "Lead validation failed",
    errors: $json.validation.errors,
    data: $json.normalized
  }
}}
```

---

# Why HTTP 400?

HTTP:

```text
400 Bad Request
```

means the client sent data that does not satisfy the expected request rules.

Example:

```text
invalid email
missing phone
invalid date
```

The automation itself is not necessarily broken.

The incoming request is the problem.

---

# Step 8 — Return Valid Data

From the TRUE branch, add another **Respond to Webhook** node.

Rename it:

```text
Return Valid Lead
```

Use:

```text
Respond With: JSON
Response Code: 200
```

Response Body:

```javascript
{{
  {
    success: true,
    message: "Lead accepted",
    data: $json.normalized
  }
}}
```

---

# Final Workflow

```text
Receive Lead Request
        ↓
Normalize Lead Data
        ↓
Validate Lead Data
        ↓
Is Lead Valid?
      /          \
   TRUE          FALSE
    ↓              ↓
Return Valid    Return Validation
Lead            Errors
```

---

# Success Test

Send:

```json
{
  "name": "   Mark Milca   ",
  "email": "  MARK@GMAIL.COM ",
  "phone": "0917 123 4567",
  "country": " ph ",
  "preferred_contact_date": "08/09/2026"
}
```

Expected HTTP status:

```text
200 OK
```

Expected response:

```json
{
  "success": true,
  "message": "Lead accepted",
  "data": {
    "name": "Mark Milca",
    "company": "",
    "email": "mark@gmail.com",
    "phone": "09171234567",
    "country": "PH",
    "preferred_contact_date": "2026-09-08"
  }
}
```

---

# Invalid Data Test

Send:

```json
{
  "name": "   ",
  "email": "markgmail.com",
  "phone": "123",
  "country": "ph",
  "preferred_contact_date": "31/02/2026"
}
```

Expected:

```text
400 Bad Request
```

Expected validation errors:

```text
name is required
email is invalid
phone must contain 10 to 15 digits
preferred_contact_date is invalid
```

---

# Missing Fields Test

Send:

```json
{
  "name": "Jamie Cruz",
  "country": "PH"
}
```

Expected errors:

```text
email is required
phone is required
preferred_contact_date is required
```

This demonstrates missing-field detection.

---

# Break It

## Scenario 1 — Wrong Email Format

Send:

```json
{
  "name": "Alex Rivera",
  "email": "alexexample.com",
  "phone": "09171234567",
  "country": "PH",
  "preferred_contact_date": "09/09/2026"
}
```

Expected:

```text
email is invalid
```

---

## Scenario 2 — Impossible Date

Send:

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "phone": "09171234567",
  "country": "PH",
  "preferred_contact_date": "31/02/2026"
}
```

Expected:

```text
preferred_contact_date is invalid
```

---

## Scenario 3 — Too Short Phone Number

Send:

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "phone": "123",
  "country": "PH",
  "preferred_contact_date": "09/09/2026"
}
```

Expected:

```text
phone must contain 10 to 15 digits
```

---

# Debugging Exercise

Send:

```json
{
  "name": "Jamie Cruz",
  "email_address": "jamie@example.com",
  "phone": "09171234567",
  "country": "PH",
  "preferred_contact_date": "08/09/2026"
}
```

The payload contains an email value.

But the workflow returns:

```text
email is required
```

Why?

Because the normalization node expects:

```javascript
input.email
```

but the incoming payload uses:

```text
email_address
```

The workflow does not automatically understand that these fields mean the same thing.

---

# Debugging Process

When validation behaves unexpectedly, check in this order:

```text
1. Inspect the raw incoming payload
2. Check the exact field names
3. Inspect normalized output
4. Inspect validation errors
5. Find where the expected and actual data stopped matching
```

This is more reliable than randomly changing nodes.

---

# Data Contract Lesson

The workflow expects:

```text
email
```

not:

```text
email_address
```

This expectation is part of the system's **data contract**.

A data contract defines:

```text
What fields exist?
What are they called?
Which are required?
What format should they use?
```

Systems communicating with each other should agree on this contract.

---

# Challenge

Use this input:

```json
{
  "name": "   Alex Rivera   ",
  "company": "   Northstar Commerce   ",
  "email": "  ALEX.RIVERA@EXAMPLE.COM ",
  "phone": "+63 (917) 555-1234",
  "country": " au ",
  "preferred_contact_date": "9/9/2026"
}
```

Before running it, predict:

1. Will `is_valid` be true or false?
2. What will the normalized name be?
3. What will the normalized email be?
4. What will the normalized phone number be?
5. What will the normalized country be?
6. What will the normalized date be?
7. Will the final HTTP status be `200` or `400`?

---

# Optional Hints

## Hint 1

Look carefully at what each normalization rule does.

## Hint 2

Remember:

```text
trim
lowercase
digits only
uppercase
YYYY-MM-DD
```

## Hint 3

The phone normalizer removes non-digit characters before validation.

---

# Challenge Verification

Expected response:

```json
{
  "success": true,
  "message": "Lead accepted",
  "data": {
    "name": "Alex Rivera",
    "company": "Northstar Commerce",
    "email": "alex.rivera@example.com",
    "phone": "639175551234",
    "country": "AU",
    "preferred_contact_date": "2026-09-09"
  }
}
```

Expected HTTP status:

```text
200 OK
```

---

# Make It Your Own

Add:

```text
company
```

to the normalization schema.

Use:

```javascript
company: String(input.company ?? '').trim(),
```

Do not make it required.

This teaches the difference between:

```text
field exists in schema
```

and:

```text
field is required
```

Test once with:

```json
{
  "company": "   Northstar Commerce   "
}
```

The normalized result should be:

```text
Northstar Commerce
```

Then test again without `company`.

The workflow should still accept the lead if all required fields are valid.

---

# Important Engineering Lessons

## 1. Incoming data is untrusted

Never assume another system sends perfect data.

---

## 2. Normalize before validating

Cleaning first helps create predictable validation rules.

---

## 3. Normalized does not mean valid

Example:

```text
31/02/2026
```

can become:

```text
2026-02-31
```

but the date still does not exist.

---

## 4. Missing and invalid are different

```text
email missing
```

is different from:

```text
email malformed
```

Useful validators explain the difference.

---

## 5. Validation should explain failure

Avoid returning only:

```text
false
```

Prefer:

```json
{
  "is_valid": false,
  "errors": [
    "email is invalid",
    "phone must contain 10 to 15 digits"
  ]
}
```

---

## 6. Field names matter

```text
email
```

and:

```text
email_address
```

are different keys unless the workflow explicitly maps them together.

---

## 7. Optional does not mean ignored

An optional field can still be:

```text
read
normalized
stored
used
```

without being required.

---

# Files Included

```text
04-validation-normalization/
│
├── README.md
│
├── workflow/
│   └── lab-04-validation-normalization.json
│
├── sample-data/
│   ├── valid-lead.json
│   ├── invalid-lead.json
│   └── missing-fields.json
│
└── challenge/
    ├── challenge-input.json
    └── expected-response.json
```

---

# Sample Data

## Valid Lead

File:

```text
sample-data/valid-lead.json
```

Used to verify successful normalization and validation.

---

## Invalid Lead

File:

```text
sample-data/invalid-lead.json
```

Used to verify malformed fields and validation errors.

---

## Missing Fields

File:

```text
sample-data/missing-fields.json
```

Used to verify required-field detection.

---

# Future AEP Website Integration

This lab is well suited for an interactive website experience.

The learner could enter:

```json
{
  "name": "   Mark   ",
  "email": " MARK@EMAIL.COM ",
  "phone": "+63 917 123 4567"
}
```

The AEP interface could display:

```text
RAW INPUT
↓
NORMALIZED DATA
↓
VALIDATION RESULT
↓
ROUTING RESULT
```

For example:

```text
Raw Email:
" MARK@EMAIL.COM "

Normalized Email:
"mark@email.com"

Validation:
Valid
```

For an invalid example:

```text
Raw Email:
"markemail.com"

Normalized Email:
"markemail.com"

Validation:
Invalid

Reason:
email is invalid
```

This would make the concept visible without replacing the learner's own n8n workflow.

---

# Why the Learner Still Uses n8n

AEP should not execute the entire lesson instead of the learner.

The learner should still:

- create the webhook
- write normalization logic
- write validation rules
- configure IF routing
- test valid and invalid requests
- debug schema mismatches
- inspect executions

The website should act as:

```text
teacher
test client
challenge runner
visual feedback layer
debugging assistant
```

not as a replacement for n8n.

---

# What You Learned

After completing this lab, you should understand:

- why incoming data should not be trusted automatically
- the difference between normalization and validation
- how to define required fields
- how to detect missing fields
- how to validate basic email structure
- how to normalize emails
- how to normalize phone numbers
- how to validate phone length
- how to normalize dates
- how to detect impossible dates
- how to trim unnecessary spaces
- how to route valid and invalid data separately
- why validation errors should explain the problem
- how field-name mismatches cause automation bugs
- why data contracts matter
- the difference between optional and required fields
- why preserving raw input helps debugging

---

# Completion Checklist

You have completed the lab when you have:

- [ ] created the webhook
- [ ] defined required fields
- [ ] normalized incoming lead data
- [ ] trimmed unwanted spaces
- [ ] normalized email values
- [ ] normalized phone numbers
- [ ] normalized dates
- [ ] validated incoming payloads
- [ ] detected missing fields
- [ ] validated email format
- [ ] validated phone length
- [ ] validated real calendar dates
- [ ] routed invalid data separately
- [ ] returned `200 OK` for valid data
- [ ] returned `400 Bad Request` for invalid data
- [ ] tested valid data
- [ ] tested invalid data
- [ ] completed the missing-fields test
- [ ] completed the debugging exercise
- [ ] completed the challenge
- [ ] completed Make It Your Own
- [ ] exported the final workflow
- [ ] reviewed what you learned

---

# Main Takeaway

The most important lesson from this lab is:

> Clean the data first, then judge it.

A reliable automation should not blindly trust whatever another system sends.

It should:

```text
Receive
↓
Normalize
↓
Validate
↓
Route
↓
Continue or Reject
```

That pattern becomes much more important as automations grow and start connecting CRMs, databases, APIs, AI systems, and external services.