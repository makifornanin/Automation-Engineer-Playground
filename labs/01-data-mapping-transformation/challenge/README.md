# Lab 01 Challenge — Nested Lead Payload to CRM

## Challenge

Transform a nested lead payload into a clean, flat CRM-ready object.

Do not change the original input to make the challenge easier.

## Requirements

- Extract values from nested objects
- Combine first and last name
- Remove unnecessary whitespace
- Lowercase the email
- Rename fields for the CRM
- Convert `interests` into a readable comma-separated string
- Convert `location` into `City, Country`
- Convert `tags` into a pipe-separated string
- Output only the CRM-ready fields

## Rules

Try to solve the challenge without looking at the guided solution.

If stuck, use the hints one at a time.

---

## Hint 1 — Data Types

Look carefully at the data types.

An object and an array are handled differently.

Think about:

- object property access
- array methods
- string methods

---

## Hint 2 — Cleaning Data

Some strings contain spaces that should not be stored in the CRM.

Think about the string method used to remove whitespace from the beginning and end of a value.

---

## Hint 3 — Arrays

Do not manually reference:

`tags[0]`, `tags[1]`, `tags[2]`

Find an array method that combines all values into one string using a separator.

Examples of separators:

- `, `
- ` | `

---

## Make It Your Own

After completing the challenge:

- change the business scenario
- add another nested object
- add another array
- create new sample data
- change the CRM output requirements
- create your own failure case

The goal is to prove that you understand the concept, not just the original workflow.
