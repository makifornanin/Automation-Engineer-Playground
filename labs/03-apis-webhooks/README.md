# Lab 03 — APIs & Webhooks

## What You Learn

In this lab, you will learn how different systems communicate using APIs and webhooks.

By the end of the lab, you should understand:

- What an API is
- What a webhook is
- The difference between POST and GET
- How request bodies work
- How headers work
- How webhook authentication works
- How HTTP status codes communicate results
- How to dynamically build an API URL
- How query parameters filter API results
- The difference between inbound and outbound API requests
- How to send GET and POST requests from n8n
- How to route successful and unsuccessful API responses
- How n8n can return a response to the system that called it
- The difference between Fixed values and Expressions in n8n

---

## Before You Build

### What does this mean?

An API allows two systems to communicate with each other.

A webhook is an endpoint that waits for another system to send it data.

A simple flow can look like this:

```text
Website
↓
POST Request
↓
n8n Webhook
↓
External API
↓
n8n processes the response
↓
Response returned to Website
```

---

### What problem does this solve?

Businesses usually use multiple systems.

For example:

- Website
- CRM
- Booking software
- Payment platform
- Database
- Email platform

These systems need a reliable way to exchange information.

Without APIs and webhooks, staff may need to manually move information between systems.

---

### How can this help a business?

APIs and webhooks can automate processes such as:

- Sending website leads into a CRM
- Creating bookings
- Looking up customer information
- Updating databases
- Triggering follow-ups
- Sending information to external services
- Connecting different business platforms

---

# Business Scenario

A website sends a customer request containing a `user_id`.

n8n receives the request through a webhook.

The workflow then demonstrates several API concepts.

The core flow:

1. Receives the customer request
2. Calls an external API
3. Looks up the customer dynamically
4. Checks the HTTP status code
5. Returns either a success or not-found response

The lab also includes additional API exercises for:

- Query parameters
- Outbound POST requests

---

# Automation Flow

## Core API Flow

```text
Receive Lead API Request
        ↓
Fetch External Customer Data
        ↓
Check API Success
       / \
    TRUE FALSE
     ↓     ↓
Return   Return
API      API
Success  Not Found
```

## Additional API Exercises

The same webhook also feeds two additional learning exercises:

```text
Receive Lead API Request
        │
        ├── Test Query Parameters
        │
        └── Test Outbound POST
```

These additional branches demonstrate:

- Query parameters
- Outbound POST requests
- Dynamic request values
- `200 OK`
- `201 Created`

---

# Tools

## Required

- n8n

## Current Developer Testing Tool

- Postman

## Planned AEP Learning Experience

The future AEP website/app will become the primary interactive learning experience.

Learners will still build and run the actual automation inside their own n8n environment.

The AEP website will help learners:

- Generate test requests
- Send test payloads
- Inspect request data
- Inspect status codes
- Inspect API responses
- Trigger success cases
- Trigger failure cases
- Complete challenges
- Use progressive hints
- Understand what happened during the workflow

Postman will remain available as an optional **Developer Mode** tool for learners who want to practice manual API testing.

---

# Request Anatomy

An HTTP request can contain several important pieces.

## URL

The URL tells the request where to go.

Example:

```text
https://example.com/users/5
```

Think of the URL as the destination address.

---

## HTTP Method

The HTTP method describes what action the request wants to perform.

### POST

POST is commonly used to send data to another system.

Example:

```text
Website
↓ POST
n8n
```

### GET

GET is commonly used to retrieve data.

Example:

```text
n8n
↓ GET
External API
```

---

## Body

The body contains the main data being sent.

Example:

```json
{
  "user_id": 5
}
```

Think of the body as the package being delivered.

---

## Headers

Headers contain additional information about the request.

Example:

```text
x-aep-source: website
```

Headers can contain information such as:

- Content type
- Authentication
- API keys
- Source system
- Request IDs
- Other metadata

Think of headers as labels attached to the package.

---

## Authentication

Authentication proves that the caller is allowed to access an endpoint.

During this lab, Header Authentication was tested using a temporary test credential.

The following behaviors were observed:

```text
Missing authentication
→ request rejected

Wrong authentication
→ request rejected

Correct authentication
→ webhook accepted
```

Authentication happens before the workflow is allowed to process the request.

Do not store real API keys, passwords, or secrets in this repository.

The exported learning workflow should not contain a real authentication secret.

---

# Guided Build

## Step 1 — Receive the Request

Create a Webhook node named:

```text
Receive Lead API Request
```

Configure:

```text
HTTP Method: POST
Path: aep-lab-03-lead
```

For the exported learning workflow:

```text
Authentication: None
```

The Webhook acts as the entry point into the workflow.

---

## Step 2 — Send Test Data

Example request:

```json
{
  "user_id": 5,
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "company": "Northstar Commerce",
  "interest": "Automation Services",
  "source": "website"
}
```

For current local development, Postman can be used to send this request.

In the future AEP website, the same type of payload will be generated and sent through the interactive learning interface.

---

## Step 3 — Call an External API

Add an HTTP Request node named:

```text
Fetch External Customer Data
```

Configure:

```text
Method: GET
```

Use:

```text
https://jsonplaceholder.typicode.com/users/{{ $json.body.user_id }}
```

This makes the URL dynamic.

If:

```text
user_id = 5
```

the request becomes:

```text
/users/5
```

If:

```text
user_id = 7
```

the request becomes:

```text
/users/7
```

---

# Hardcoded vs Dynamic Values

A hardcoded URL:

```text
/users/1
```

always requests the same customer.

A dynamic URL:

```text
/users/{{ $json.body.user_id }}
```

uses information from the incoming request.

This allows one workflow to work with many different inputs.

Mental model:

```text
Hardcoded
= always use the same value

Dynamic
= use data from the current workflow execution
```

---

# Query Parameters

Query parameters are extra values added to a URL to filter or modify a request.

Example:

```text
/posts?userId=5
```

This means:

> Give me posts where `userId` equals `5`.

This is different from:

```text
/users/5
```

which requests one specific resource.

Mental model:

```text
/users/5
= request one specific resource

/posts?userId=5
= filter a collection
```

---

## Hands-On Query Parameter Exercise

The workflow includes a node named:

```text
Test Query Parameters
```

It sends a GET request to:

```text
https://jsonplaceholder.typicode.com/posts
```

with this query parameter:

```text
userId = {{ $json.body.user_id }}
```

If the incoming request contains:

```json
{
  "user_id": 5
}
```

n8n effectively sends:

```text
GET /posts?userId=5
```

The API then returns posts where:

```text
userId = 5
```

This demonstrates how query parameters can dynamically filter API results.

---

# Inbound vs Outbound POST

POST requests can happen in different directions.

## Inbound POST

```text
Client
↓ POST
n8n Webhook
```

The client sends data into n8n.

During current development:

```text
Postman
↓ POST
n8n Webhook
```

In the future AEP learning experience:

```text
AEP Website
↓ POST
Learner's n8n Webhook
```

---

## Outbound POST

n8n can also become the client.

```text
n8n
↓ POST
External API
```

The workflow includes a node named:

```text
Test Outbound POST
```

It sends data such as:

```json
{
  "title": "AEP Lab 03 Outbound POST",
  "body": "Created from n8n",
  "userId": 5
}
```

to:

```text
POST https://jsonplaceholder.typicode.com/posts
```

During testing, the API returned:

```text
201 Created
```

Mental model:

```text
Postman → POST → n8n
= inbound POST

n8n → POST → External API
= outbound POST
```

---

# GET vs POST

A simple way to remember them:

```text
GET
= retrieve data

POST
= send data
```

Examples from this lab:

```text
GET /users/5
→ retrieve user 5
```

```text
GET /posts?userId=5
→ retrieve posts filtered by userId
```

```text
POST /posts
→ send data to create/process a resource
```

---

# Include Response Information

Enable:

```text
Include Response Headers and Status
```

The HTTP Request output can now contain:

```text
body
headers
statusCode
statusMessage
```

Example:

```text
statusCode: 200
statusMessage: OK
```

This makes it easier to inspect how the external API responded.

---

# HTTP Status Codes

HTTP status codes provide a quick description of what happened.

Common examples:

```text
200 = OK
201 = Created
400 = Bad Request
401 = Unauthorized
403 = Forbidden
404 = Not Found
500 = Server Error
```

During this lab, several status codes were observed.

### 200 OK

The request succeeded.

Example:

```text
GET /users/5
→ 200 OK
```

### 201 Created

The POST request was accepted as creating a resource.

Example:

```text
POST /posts
→ 201 Created
```

### 403 Forbidden

The webhook authentication test rejected a missing or incorrect authentication value.

### 404 Not Found

The requested resource could not be found.

Example:

```text
GET /users/999
→ 404 Not Found
```

---

# Response Body vs HTTP Status

The JSON response body and the HTTP status code are separate things.

For example, this body:

```json
{
  "success": false
}
```

does not automatically create an HTTP `404`.

You could accidentally return:

```text
HTTP Status: 200

Body:
{
  "success": false
}
```

That would be confusing for another application calling the API.

The response body and HTTP status should communicate the same result.

---

# Never Error

Normally, if an HTTP Request receives an unsuccessful response such as:

```text
404 Not Found
```

the node may fail and stop the workflow.

For this lab, enable:

```text
Never Error
```

This allows the workflow to inspect unsuccessful HTTP responses as data.

Instead of:

```text
404
↓
HTTP Request node fails
↓
workflow stops
```

we can do:

```text
404
↓
statusCode = 404
↓
Check API Success
↓
FALSE
↓
controlled failure response
```

This gives the workflow control over how failures are handled.

---

# Route the Response

Add an IF node named:

```text
Check API Success
```

Condition:

```text
statusCode equals 200
```

Flow:

```text
200
→ TRUE
→ Return API Success
```

Anything that does not satisfy the condition:

```text
Not 200
→ FALSE
→ Return API Not Found
```

The IF node does not create the API error.

It only decides what to do after receiving the API response.

---

# Return a Success Response

Create a Respond to Webhook node named:

```text
Return API Success
```

The response can include:

```json
{
  "success": true,
  "message": "External customer data found",
  "customer_name": "dynamic customer name",
  "customer_email": "dynamic customer email"
}
```

HTTP Response Code:

```text
200
```

The customer values should use n8n Expressions so the actual API data is returned.

---

# Return a Not Found Response

Create another Respond to Webhook node named:

```text
Return API Not Found
```

Return:

```json
{
  "success": false,
  "message": "External customer data not found"
}
```

HTTP Response Code:

```text
404
```

---

# Fixed vs Expression

One important debugging discovery in this lab was the difference between Fixed and Expression values.

If this is entered while the field is in Fixed mode:

```text
{{ $json.body.name }}
```

n8n may return the literal text:

```text
{{ $json.body.name }}
```

It does not automatically evaluate the expression.

If the field is configured as an Expression, n8n evaluates it and returns the actual value.

Example:

```text
Expression
↓
Chelsey Dietrich
```

Mental model:

```text
Fixed
= use exactly what I typed

Expression
= calculate or retrieve the value dynamically
```

---

# Success Test

Send:

```json
{
  "user_id": 5
}
```

Expected core flow:

```text
Webhook receives request
↓
External API requests /users/5
↓
statusCode = 200
↓
TRUE route
↓
Return API Success
```

The response should contain actual customer information.

---

# Not Found Test

Send:

```json
{
  "user_id": 999
}
```

Expected:

```text
Webhook receives request
↓
External API requests /users/999
↓
statusCode = 404
↓
Never Error keeps workflow running
↓
Check API Success
↓
FALSE
↓
Return API Not Found
```

---

# Break It — Incorrect Endpoint

Change the external endpoint from:

```text
/users/5
```

to an incorrect path such as:

```text
/userz/5
```

Observe what happens.

Questions:

1. Which node failed?
2. Did the Webhook itself fail?
3. What HTTP status was returned?
4. Was the problem caused by the input or by the endpoint?

Fix the URL after completing the exercise.

---

# Break It — Missing Customer

Use:

```json
{
  "user_id": 999
}
```

Observe how the workflow handles the `404`.

Questions:

1. Did the HTTP Request node stop?
2. What did `Never Error` change?
3. Which IF branch executed?
4. What response was returned to the caller?

---

# Break It — Authentication

Temporarily change the Webhook authentication to Header Auth.

Test three requests.

```text
No authentication key
→ rejected

Wrong authentication key
→ rejected

Correct authentication key
→ accepted
```

This demonstrates that authentication protects the endpoint before the workflow logic executes.

After completing the exercise, restore:

```text
Authentication: None
```

Never commit a real credential.

---

# Debug It

When an API workflow behaves unexpectedly, inspect the data flow in order.

```text
1. Did the request reach the Webhook?

2. What data did the Webhook receive?

3. What method was used?

4. What URL did the HTTP Request actually call?

5. Were query parameters included correctly?

6. What body was sent?

7. What headers were sent?

8. What status code did the API return?

9. What response body did the API return?

10. Which IF branch executed?

11. What did Respond to Webhook return?
```

Debug the data flow instead of randomly changing nodes.

---

# Challenge

Use:

```text
challenge/challenge-input.json
```

Test each supplied `user_id`.

Your workflow should correctly distinguish between customers that exist and customers that do not exist.

Do not hardcode individual customer IDs into IF conditions.

The incoming:

```text
user_id
```

should dynamically control the API request.

---

# Optional Hints

## Hint 1 — Concept

Ask yourself:

```text
What value determines which API resource should be requested?
```

---

## Hint 2 — Direction

Look at the incoming Webhook body.

---

## Hint 3 — Stronger Hint

Use the incoming:

```text
user_id
```

inside the HTTP Request URL.

---

# Challenge Verification

Compare your behavior against:

```text
challenge/expected-responses.json
```

The important result is:

- Correct API request
- Correct status code
- Correct workflow route
- Correct response behavior

Do not focus on memorizing customer data.

---

# Make It Your Own

Try changing one part of the workflow.

Examples:

- Send a different `user_id`
- Change the query parameter value
- Add another request header
- Return additional customer information
- Return the external API status code
- Add a custom source field
- Change the outbound POST body
- Add another query parameter
- Test another harmless public API

Do not add real credentials or customer data.

---

# Future AEP Website Integration

The long-term AEP learning experience should not require learners to begin with Postman.

The AEP website/app will become the primary interactive course layer.

The learner will still use their own n8n environment.

Example:

```text
AEP Website
↓
Learner selects Lab 03
↓
AEP explains the concept
↓
Learner builds workflow in their own n8n
↓
AEP generates test request
↓
Request sent to learner's n8n Webhook
↓
Learner's workflow executes
↓
Response returns
↓
AEP displays status + response + learning feedback
```

The website should help learners:

- Understand the concept before building
- Run test cases
- Inspect requests and responses
- Intentionally break workflows
- Debug failures
- Complete challenges
- Request progressive hints
- Learn through hands-on discovery

Postman remains an optional **Developer Mode** for learners who want additional API testing practice.

---

# Why the Learner Still Uses n8n

The AEP website is not intended to replace n8n.

The goal is for the learner to build the automation themselves.

AEP provides:

```text
Guidance
+
Interactive testing
+
Challenges
+
Debugging
+
Hints
+
Learning feedback
```

The learner provides:

```text
Their own n8n environment
+
Their own workflow build
+
Their own debugging decisions
```

This keeps the experience practical and hands-on instead of becoming a passive course.

---

# What You Learned

After completing this lab, you should be able to explain:

- What an API does
- What a webhook does
- POST vs GET
- Inbound vs outbound requests
- URL vs body vs headers
- What query parameters do
- Path values vs query parameters
- Why authentication exists
- What HTTP status codes mean
- `200 OK` vs `201 Created`
- How dynamic API requests work
- Why `Never Error` can be useful
- How to route API responses
- How to return correct HTTP responses
- Fixed vs Expression values in n8n
- How to debug an API workflow step by step

Most importantly, you should understand the complete flow:

```text
Client
↓
Request
↓
Webhook
↓
Automation
↓
External API
↓
Response Data
↓
Decision
↓
Response
```

And you should understand that n8n can operate in both directions:

```text
External System
↓
n8n receives data
```

and:

```text
n8n
↓
External System receives data
```