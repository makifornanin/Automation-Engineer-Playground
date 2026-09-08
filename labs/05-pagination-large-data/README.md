# Lab 05 — Pagination & Large Data Processing

## Difficulty

Intermediate

## Main Learning Outcome

Understand how automations handle datasets that are larger than a single API response.

By the end of this lab, you should understand how to:

- connect to a paginated API
- retrieve the first page
- read pagination metadata
- retrieve the next page
- calculate the next `skip` value
- create automated pagination
- stop a pagination loop correctly
- combine records from multiple pages
- process large datasets safely
- distinguish page responses from actual records
- debug pagination logic
- understand why a workflow can run successfully but still return incomplete data

---

# What You Learn

In this lab, you build a **Customer Import Processor**.

The workflow connects to an API containing a large customer dataset.

Instead of receiving every customer in one response, the API returns smaller batches.

You will first learn pagination manually.

Then you will build an automated pagination workflow that:

```text
Fetches page
↓
Checks pagination information
↓
Fetches the next page
↓
Repeats
↓
Stops when all records are retrieved
↓
Combines all customer records
↓
Prepares them for processing
```

---

# Simple Explanation

## What is pagination?

Pagination means:

> Split a large dataset into smaller groups instead of returning everything at once.

Imagine an API has:

```text
208 customers
```

Instead of sending all 208 at once, it might send:

```text
5 customers per request
```

So:

```text
Request 1 → customers 1–5
Request 2 → customers 6–10
Request 3 → customers 11–15
...
```

The automation keeps requesting more pages until there is no more data left.

---

# Why APIs Use Pagination

Large API responses can:

- use more memory
- take longer to send
- slow down applications
- increase network usage
- create timeout problems
- make processing harder

Pagination keeps each response smaller and more predictable.

---

# Business Scenario

A company wants to import customers from an external CRM into its own automation system.

The external API contains many customer records.

However, the API only allows a limited number of customers to be returned per request.

The automation must:

```text
Request customers
↓
Retrieve the first batch
↓
Determine whether more customers exist
↓
Retrieve the next batch
↓
Continue until finished
↓
Combine all customers
↓
Prepare each customer for processing
```

This pattern appears frequently when working with:

- CRMs
- e-commerce platforms
- databases
- contact APIs
- reporting APIs
- analytics tools
- large data exports

---

# API Used

This lab uses:

```text
https://dummyjson.com/users
```

The API supports pagination using:

```text
limit
skip
```

Example:

```text
https://dummyjson.com/users?limit=5&skip=0
```

During this lab build, the API reported:

```text
total = 208
```

Because this is a public external API, the exact total could change in the future if the provider changes its dataset.

The pagination concepts remain the same.

---

# Three Important Pagination Values

The API returns pagination information similar to:

```json
{
  "total": 208,
  "skip": 0,
  "limit": 5
}
```

## `total`

```text
total = 208
```

means:

> There are 208 records available in the full dataset.

It does not mean the current request returned 208 records.

---

## `limit`

```text
limit = 5
```

means:

> Return at most 5 records in this request.

---

## `skip`

```text
skip = 0
```

means:

> Skip zero records before returning the next batch.

So:

```text
skip = 0
limit = 5
```

returns approximately:

```text
records 1–5
```

Then:

```text
skip = 5
limit = 5
```

returns:

```text
records 6–10
```

Then:

```text
skip = 10
limit = 5
```

returns:

```text
records 11–15
```

---

# Important Mental Model

Remember:

```text
total
= how many records exist in the whole dataset

limit
= how many records to return per request

skip
= how many records to ignore before returning the next batch
```

---

# Pagination Is Not Just Page Numbers

A common misunderstanding is thinking:

```text
skip = page number
```

It is not.

Example:

```text
skip = 10
```

does not mean:

```text
Page 10
```

It means:

> Skip the first 10 records.

With:

```text
limit = 5
```

that would return records approximately:

```text
11–15
```

---

# Tools Used

Required:

- n8n
- HTTP Request node
- JavaScript

External API:

- DummyJSON Users API

---

# Prerequisites

Before this lab, you should understand:

- HTTP GET requests
- query parameters
- JSON responses
- arrays
- objects
- basic n8n expressions
- basic JavaScript
- Code nodes
- data transformation

Labs 01–04 introduce many of these concepts.

---

# Workflow Name

Create:

```text
AEP Lab 05 - Pagination and Large Data Processing
```

---

# Final Learning Architecture

This lab keeps two paths intentionally.

## Manual Pagination Learning Path

```text
Start Lab 05
↓
Set Pagination Config
↓
Fetch First Customer Page
↓
Read Pagination Info
↓
Fetch Next Customer Page
```

This path teaches how pagination works internally.

---

## Automated Pagination Path

```text
Start Lab 05
↓
Set Pagination Config
↓
Fetch All Customer Pages
↓
Combine Customer Records
↓
Prepare Customers for Processing
```

This path teaches how to automate the same behavior professionally.

---

# Why Keep Both Paths?

The manual path helps you understand:

```text
What changes between requests?
```

The automated path teaches:

```text
How do I make n8n repeat that process for me?
```

Using only automatic pagination can hide the underlying logic.

Using only manual pagination creates unnecessary work.

The lab teaches both.

---

# Guided Build

# Step 1 — Start Lab 05

Add a **Manual Trigger** node.

Rename it:

```text
Start Lab 05
```

This gives you a simple way to repeatedly test the workflow.

---

# Step 2 — Set Pagination Config

Add an **Edit Fields / Set** node.

Rename it:

```text
Set Pagination Config
```

Create:

```text
limit = 5
skip = 0
```

Both should be numbers.

Meaning:

```text
limit = 5
→ retrieve 5 records per request

skip = 0
→ start at the beginning
```

---

# Step 3 — Fetch the First Page

Add an **HTTP Request** node.

Rename it:

```text
Fetch First Customer Page
```

Use:

```text
Method: GET
URL: https://dummyjson.com/users
```

Enable query parameters.

Add:

```text
limit = {{ $json.limit }}
```

and:

```text
skip = {{ $json.skip }}
```

The request effectively becomes:

```text
GET /users?limit=5&skip=0
```

---

# First Page Test

Execute the workflow.

During the lab build, the response showed:

```text
total = 208
skip = 0
limit = 5
```

The `users` array contained IDs approximately:

```text
1–5
```

Important:

```text
208 users exist
```

but only:

```text
5 users were retrieved
```

because the request used:

```text
limit = 5
```

---

# Step 4 — Read Pagination Information

Add a **Code** node.

Rename it:

```text
Read Pagination Info
```

Use:

```text
Mode: Run Once for Each Item
Language: JavaScript
```

Code:

```javascript
const total = $json.total;
const skip = $json.skip;
const limit = $json.limit;

const nextSkip = skip + limit;
const hasMore = nextSkip < total;

return {
  json: {
    total,
    current_skip: skip,
    limit,
    next_skip: nextSkip,
    has_more: hasMore
  }
};
```

---

# Understanding the Pagination Calculation

Given:

```text
skip = 0
limit = 5
```

calculate:

```text
nextSkip = skip + limit
```

So:

```text
0 + 5 = 5
```

The next request should use:

```text
skip = 5
```

---

# `has_more`

The code also calculates:

```javascript
const hasMore = nextSkip < total;
```

Example:

```text
next_skip = 5
total = 208
```

Check:

```text
5 < 208
```

Result:

```text
true
```

Meaning:

> More records still exist.

---

# Step 5 — Fetch the Next Page

Add another **HTTP Request** node.

Rename it:

```text
Fetch Next Customer Page
```

Use:

```text
Method: GET
URL: https://dummyjson.com/users
```

Query parameters:

```text
limit = {{ $json.limit }}
skip = {{ $json.next_skip }}
```

The second request becomes approximately:

```text
GET /users?limit=5&skip=5
```

---

# Second Page Test

The second request should report:

```text
skip = 5
limit = 5
```

and during the lab produced users approximately:

```text
IDs 6–10
```

This proves:

```text
skip 0
→ users 1–5

skip 5
→ users 6–10
```

---

# First Major Learning Moment

Pagination is simply:

```text
Get a batch
↓
Move the position forward
↓
Get another batch
↓
Repeat
```

For this API:

```text
next skip
=
current skip + limit
```

---

# Automated Pagination

After understanding the first two pages manually, the next goal is:

> Make n8n retrieve every page automatically.

---

# Step 6 — Fetch All Customer Pages

Add another **HTTP Request** node from:

```text
Set Pagination Config
```

Rename it:

```text
Fetch All Customer Pages
```

Use:

```text
Method: GET
URL: https://dummyjson.com/users
```

Add query parameter:

```text
limit = 5
```

Then configure the HTTP Request node's pagination option.

Use pagination mode that updates a parameter for each request.

Pagination parameter:

```text
Type: Query
Name: skip
```

Value:

```javascript
{{ $pageCount * 5 }}
```

---

# Understanding `$pageCount`

For this pagination configuration:

```text
$pageCount = 0
→ skip = 0

$pageCount = 1
→ skip = 5

$pageCount = 2
→ skip = 10

$pageCount = 3
→ skip = 15
```

So the requests become approximately:

```text
/users?limit=5&skip=0

/users?limit=5&skip=5

/users?limit=5&skip=10

/users?limit=5&skip=15
```

and so on.

---

# Step 7 — Define the Stop Condition

Automated pagination needs to know:

> When should I stop requesting more pages?

Use:

```javascript
{{ $response.body.skip + $response.body.limit >= $response.body.total }}
```

---

# Understanding the Stop Condition

Suppose:

```text
skip = 200
limit = 5
total = 208
```

Calculate:

```text
200 + 5 = 205
```

Check:

```text
205 >= 208
```

Result:

```text
false
```

So:

```text
continue
```

Next request:

```text
skip = 205
limit = 5
total = 208
```

Calculate:

```text
205 + 5 = 210
```

Check:

```text
210 >= 208
```

Result:

```text
true
```

So:

```text
STOP
```

---

# Important Engineering Principle

A pagination loop is not safe unless it has a correct stopping condition.

Without one, the workflow might:

- stop too early
- request duplicate data
- miss records
- loop indefinitely
- waste API requests
- hit API rate limits

---

# Automated Pagination Test

During the lab build:

```text
total records = 208
limit = 5
```

The automated HTTP Request produced:

```text
42 items
```

Why 42?

```text
208 ÷ 5 = 41.6
```

You need to round up because the final partial page still requires another request.

So:

```text
42 API responses/pages
```

were required.

---

# Important Distinction

The 42 output items were not 42 customers.

They were:

```text
42 page responses
```

Each page contained a:

```text
users[]
```

array.

So the structure was conceptually:

```text
Page 1
└── users[5]

Page 2
└── users[5]

Page 3
└── users[5]

...

Page 42
└── users[3]
```

---

# Step 8 — Combine Customer Records

Add a **Code** node.

Rename it:

```text
Combine Customer Records
```

Use:

```text
Mode: Run Once for All Items
Language: JavaScript
```

Code:

```javascript
const pages = $input.all();

const customers = pages.flatMap(page => {
  return page.json.users ?? [];
});

return [
  {
    json: {
      pages_fetched: pages.length,
      total_records: customers.length,
      customers
    }
  }
];
```

---

# What `flatMap()` Does Here

Each API page contains its own array:

```text
Page 1 → users[]
Page 2 → users[]
Page 3 → users[]
```

`flatMap()` collects the users from every page and combines them into:

```text
customers[]
```

So:

```text
42 page responses
```

become:

```text
1 combined customer array
```

---

# Combined Result

During the lab:

```text
pages_fetched = 42
total_records = 208
```

The structure becomes approximately:

```json
{
  "pages_fetched": 42,
  "total_records": 208,
  "customers": [
    "...208 customer objects..."
  ]
}
```

---

# Why Large Arrays Can Feel Heavy

Displaying hundreds of nested records can make the n8n interface slower.

For example:

```text
1 item
└── customers[208]
```

can be expensive to render visually, especially in Table View.

For inspection, JSON View can sometimes be easier.

The bigger engineering lesson is:

> Large datasets should be processed deliberately instead of blindly passing giant objects between systems.

---

# Step 9 — Prepare Customers for Processing

Add another **Code** node.

Rename it:

```text
Prepare Customers for Processing
```

Use:

```text
Mode: Run Once for All Items
Language: JavaScript
```

Code:

```javascript
const customers = $json.customers ?? [];

return customers.map(customer => ({
  json: {
    customer_id: customer.id,
    full_name: `${customer.firstName} ${customer.lastName}`,
    email: customer.email,
    phone: customer.phone,
    company: customer.company?.name ?? ''
  }
}));
```

---

# What This Node Does

Before:

```text
1 workflow item
└── customers[208]
```

After:

```text
Item 1 → Customer 1
Item 2 → Customer 2
Item 3 → Customer 3
...
Item 208 → Customer 208
```

This makes each customer independently processable.

---

# Why Individual Items Are Useful

Later you could send each item to:

```text
CRM
database
email system
API
validation process
AI classifier
```

Instead of passing one giant array to another system.

---

# Data Transformation

The raw API user contains many fields.

For this lab, the final import schema keeps only:

```json
{
  "customer_id": 1,
  "full_name": "First Last",
  "email": "example@email.com",
  "phone": "123456789",
  "company": "Example Company"
}
```

This connects directly to the transformation concepts from Lab 01.

---

# Small Dataset Test

The manual learning path retrieves:

```text
First page
→ IDs 1–5
```

Then:

```text
Second page
→ IDs 6–10
```

This confirms that pagination works on a small dataset before automating all pages.

---

# Multiple Pages Test

The automated path retrieves all available pages.

During this lab:

```text
limit = 5
total = 208
```

Result:

```text
pages_fetched = 42
total_records = 208
```

---

# Break It

Now intentionally create a bad stop condition.

Temporarily replace:

```javascript
{{ $response.body.skip + $response.body.limit >= $response.body.total }}
```

with:

```javascript
{{ $response.body.skip + $response.body.limit >= 10 }}
```

---

# Predict the Failure

With:

```text
limit = 5
```

Request 1:

```text
skip = 0

0 + 5 >= 10?
false
```

Continue.

Request 2:

```text
skip = 5

5 + 5 >= 10?
true
```

Stop.

So instead of:

```text
42 pages
208 records
```

the workflow returns:

```text
2 pages
10 records
```

---

# Important Debugging Lesson

The workflow does not necessarily throw an error.

It can complete successfully.

But the result is still wrong.

This teaches:

> No error does not mean correct.

There are two broad categories of workflow failure:

```text
Technical failure
→ node errors
→ API errors
→ exceptions
```

and:

```text
Logic failure
→ workflow runs
→ output is wrong
```

Logic failures can be especially dangerous because they may look successful.

---

# Debugging Exercise

Expected:

```text
208 records
```

Actual:

```text
10 records
```

Workflow error:

```text
none
```

Debug systematically.

Check:

```text
1. What output did we expect?
2. What output did we actually get?
3. Did the API fail?
4. Did the workflow throw an error?
5. What changed recently?
6. Is the pagination stop rule correct?
```

The root cause is:

```text
The stop condition uses 10 instead of the API's total.
```

---

# Restore the Correct Stop Condition

Change it back to:

```javascript
{{ $response.body.skip + $response.body.limit >= $response.body.total }}
```

Run again.

Expected during the original lab dataset:

```text
pages_fetched = 42
total_records = 208
```

---

# Challenge

Change the page size from:

```text
5
```

to:

```text
7
```

Update the pagination expression:

```javascript
{{ $pageCount * 7 }}
```

Keep the correct stop condition:

```javascript
{{ $response.body.skip + $response.body.limit >= $response.body.total }}
```

Before executing, predict:

1. How many API requests will be required?
2. What will the first few `skip` values be?
3. How many total records should still be returned?

---

# Optional Hints

## Hint 1

Changing `limit` changes how many records are retrieved per request.

It does not change how many records exist in the API.

---

## Hint 2

Calculate:

```text
208 ÷ 7
```

Then round up.

---

## Hint 3

The `skip` sequence increases by the page size.

---

# Challenge Prediction

For:

```text
limit = 7
```

the first few skip values are:

```text
0
7
14
21
28
```

---

# Challenge Verification

During the lab dataset:

```text
208 ÷ 7 = 29.71...
```

Round up:

```text
30 pages
```

Expected:

```text
pages_fetched = 30
total_records = 208
```

Important:

```text
limit 5
→ 42 requests

limit 7
→ 30 requests
```

but both retrieve:

```text
208 records
```

---

# Make It Your Own

Modify:

```text
Prepare Customers for Processing
```

Add another useful field from the API.

In this lab, `company` was added:

```javascript
company: customer.company?.name ?? ''
```

The final schema becomes:

```json
{
  "customer_id": 1,
  "full_name": "First Last",
  "email": "example@email.com",
  "phone": "123456789",
  "company": "Example Company"
}
```

---

# Optional Chaining Lesson

This code:

```javascript
customer.company?.name
```

means:

> Try to read `company.name`, but do not crash if `company` is missing.

And:

```javascript
?? ''
```

means:

> If the value does not exist, use an empty string.

This creates safer transformation logic.

---

# Final Teaching Configuration

Before exporting the final workflow, restore:

```text
limit = 5
```

Automated pagination:

```javascript
{{ $pageCount * 5 }}
```

Stop condition:

```javascript
{{ $response.body.skip + $response.body.limit >= $response.body.total }}
```

During the original test dataset, this produced:

```text
42 pages
208 records
```

---

# Final Workflow

```text
Start Lab 05
        ↓
Set Pagination Config
        │
        ├─────────────────────────────────┐
        │                                 │
        ↓                                 ↓
Fetch First Customer Page        Fetch All Customer Pages
        ↓                                 ↓
Read Pagination Info             Combine Customer Records
        ↓                                 ↓
Fetch Next Customer Page         Prepare Customers for Processing
```

The left side teaches pagination manually.

The right side performs automated large-data processing.

---

# Files Included

```text
05-pagination-large-data/
│
├── README.md
│
├── workflow/
│   └── lab-05-pagination-large-data.json
│
├── sample-data/
│   ├── pagination-config.json
│   └── expected-summary.json
│
└── challenge/
    ├── challenge-config.json
    └── expected-result.json
```

---

# Sample Data

## Pagination Config

File:

```text
sample-data/pagination-config.json
```

Contains:

```json
{
  "limit": 5,
  "skip": 0
}
```

---

## Expected Summary

File:

```text
sample-data/expected-summary.json
```

During the original dataset:

```json
{
  "pages_fetched": 42,
  "total_records": 208
}
```

---

# Challenge Files

## Challenge Config

```text
challenge/challenge-config.json
```

Contains:

```json
{
  "limit": 7,
  "total_records": 208
}
```

---

## Expected Challenge Result

```text
challenge/expected-result.json
```

Contains:

```json
{
  "expected_pages_fetched": 30,
  "expected_total_records": 208,
  "expected_skip_sequence_start": [
    0,
    7,
    14,
    21,
    28
  ]
}
```

---

# Important Engineering Lessons

## 1. Large datasets often require multiple API requests

One API response may represent only part of the available data.

---

## 2. Pagination metadata tells you where you are

Values such as:

```text
total
limit
skip
```

help the automation understand:

```text
How much data exists?
How much did I request?
Where am I in the dataset?
```

---

## 3. Pagination needs a stop condition

Repeating requests without knowing when to stop is unsafe.

---

## 4. Correct-looking execution can still contain bad logic

A workflow can report:

```text
success
```

while silently returning incomplete data.

Always validate important assumptions.

---

## 5. Pages and records are different things

This:

```text
42 items
```

can mean:

```text
42 API page responses
```

not:

```text
42 customer records
```

Always inspect the data structure.

---

## 6. Large arrays sometimes need restructuring

This:

```text
1 item
└── customers[208]
```

may be useful for aggregation.

But this:

```text
208 individual items
```

is often easier for downstream automation processing.

---

## 7. Page size affects request count

Smaller page sizes:

```text
more API requests
```

Larger page sizes:

```text
fewer API requests
```

But the final total dataset should remain the same.

---

## 8. API limits still matter

Real APIs may impose:

- maximum page sizes
- rate limits
- timeouts
- authentication requirements
- request quotas

Pagination logic should respect the external system's rules.

---

# Future AEP Website Integration

Lab 05 can become highly visual in the AEP website.

A learner could choose:

```text
Page Size: 5
```

and the website could visualize:

```text
Request 1
skip 0
→ records 1–5

Request 2
skip 5
→ records 6–10

Request 3
skip 10
→ records 11–15
```

The website could then display:

```text
Pages Fetched: 42
Records Retrieved: 208
```

---

# Interactive Pagination Visualizer

A future AEP interface could show:

```text
TOTAL DATASET
208 records

PAGE SIZE
5 records

REQUESTS
42

CURRENT SKIP
0 → 5 → 10 → 15 → ...
```

This would make the looping behavior easier to understand visually.

---

# Break It in the Website

AEP could intentionally give the learner a wrong stop condition:

```text
Stop at 10 records
```

Then show:

```text
Workflow status:
SUCCESS

Expected records:
208

Actual records:
10

Result:
LOGIC FAILURE
```

This would reinforce:

> Successful execution is not the same as correct behavior.

---

# Why the Learner Still Uses n8n

The AEP website should not replace the actual workflow build.

The learner should still:

- create HTTP Request nodes
- configure query parameters
- inspect pagination metadata
- build pagination rules
- define the stop condition
- combine records
- process individual items
- debug failures

AEP can act as:

```text
teacher
visualizer
test runner
challenge system
debugging assistant
```

while n8n remains the actual automation environment.

---

# What You Learned

After completing this lab, you should understand:

- what pagination means
- why APIs paginate data
- what `total` means
- what `limit` means
- what `skip` means
- how to retrieve the first page
- how to calculate the next page
- how automated pagination works
- how `$pageCount` can generate skip values
- why pagination requires a correct stop condition
- how to combine multiple page responses
- how to flatten arrays
- how to convert one large array into individual n8n items
- how to process customer records safely
- how page size changes request count
- why no-error does not guarantee correct logic
- how to debug an incomplete pagination result
- how to reuse transformation skills from earlier labs

---

# Completion Checklist

You have completed the lab when you have:

- [ ] connected to a paginated API
- [ ] retrieved the first page
- [ ] inspected `total`
- [ ] inspected `limit`
- [ ] inspected `skip`
- [ ] calculated the next `skip`
- [ ] retrieved the next page
- [ ] confirmed IDs 1–5 and 6–10 across the first two pages
- [ ] created automated pagination
- [ ] created a correct stop condition
- [ ] retrieved all available pages
- [ ] combined all page records
- [ ] converted the combined dataset into individual items
- [ ] transformed raw users into a clean customer schema
- [ ] tested a small dataset
- [ ] tested multiple pages
- [ ] intentionally broke the stop condition
- [ ] observed a logic failure without a node error
- [ ] debugged the pagination failure
- [ ] restored the correct stop condition
- [ ] completed the page-size challenge
- [ ] changed the page size from 5 to 7
- [ ] predicted the new skip sequence
- [ ] predicted the number of requests
- [ ] completed Make It Your Own
- [ ] added `company` to the final schema
- [ ] restored the final teaching configuration
- [ ] exported the final workflow
- [ ] reviewed what you learned

---

# Main Takeaway

The most important lesson from this lab is:

> Pagination is not just repeating requests. It is repeating requests while correctly tracking progress and knowing exactly when to stop.

The full pattern is:

```text
Request batch
↓
Read pagination information
↓
Calculate next position
↓
Request next batch
↓
Repeat safely
↓
Stop correctly
↓
Combine results
↓
Process records
```

This pattern becomes essential when working with real CRMs, databases, reporting APIs, and large production datasets.