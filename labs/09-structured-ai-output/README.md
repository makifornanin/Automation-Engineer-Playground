# Lab 09 - Structured AI Output

## Goal

Learn how to use AI inside automation without trusting unpredictable free-form responses.

In this lab, Gemini classifies a customer inquiry and returns structured data that n8n can validate and safely route.

---

## Business Scenario

A business receives customer inquiries such as:

```text
"I want to know your pricing."
"I can't log into my account."
"I was charged twice."
```

Instead of asking a person to manually sort every message, Gemini classifies the inquiry.

Allowed classifications:

```text
sales
support
billing
other
```

The AI also returns:

```text
confidence
recommended_action
```

Example:

```json
{
  "classification": "sales",
  "confidence": 0.95,
  "recommended_action": "send_to_sales"
}
```

---

# Main Learning Outcome

Understand how AI can produce predictable information that automation systems can safely use.

The important principle is:

```text
AI suggests
↓
Structure constrains
↓
Validation checks
↓
Automation decides
```

AI does not directly control the workflow.

---

# Workflow Architecture

```text
Receive Customer Inquiry
↓
Prepare AI Input
↓
Gemini Classifier
   ↳ Google Gemini Chat Model
   ↳ Structured Output Parser
↓
Validate AI Output
↓
AI Output Valid?
│
├── TRUE
│   ↓
│   Route by Classification
│   ├── sales   → Sales Route
│   ├── support → Support Route
│   ├── billing → Billing Route
│   └── other   → Manual Review Route
│
└── FALSE
    ↓
    Build Safe Fallback
    ↓
    Respond to Webhook
```

---

# Step 1 - Receive Customer Inquiry

The workflow starts with a webhook.

Example request:

```json
{
  "request_id": "req_ai_001",
  "message": "Hi, I'm interested in your service and would like to know your pricing."
}
```

Webhook path:

```text
aep-lab-09-ai-classification
```

---

# Step 2 - Prepare AI Input

Before sending data to Gemini, the workflow prepares a controlled input.

Fields include:

```text
request_id
message
allowed_classifications
allowed_actions
```

Allowed classifications:

```text
sales
support
billing
other
```

Allowed actions:

```text
send_to_sales
create_support_ticket
send_to_billing
manual_review
```

This prevents unnecessary webhook data from being sent to the AI.

---

# Step 3 - Gemini Classifier

Gemini receives the customer message and classification rules.

The prompt instructs Gemini to return:

```json
{
  "classification": "sales",
  "confidence": 0.95,
  "recommended_action": "send_to_sales"
}
```

---

# Raw AI Output Lesson

Before using structured parsing, Gemini returned something similar to:

```json
{
  "text": "{ \"classification\": \"sales\", \"confidence\": 1, \"recommended_action\": \"send_to_sales\" }"
}
```

The value inside `text` looked like JSON, but it was still a string.

That means this would not yet work:

```text
$json.classification
```

because `classification` was still inside the text value.

Important:

```text
JSON-looking text
≠
structured JSON object
```

---

# Step 4 - Structured Output Parser

A Structured Output Parser defines the exact format Gemini must produce.

Schema:

```json
{
  "type": "object",
  "properties": {
    "classification": {
      "type": "string",
      "enum": ["sales", "support", "billing", "other"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "recommended_action": {
      "type": "string",
      "enum": [
        "send_to_sales",
        "create_support_ticket",
        "send_to_billing",
        "manual_review"
      ]
    }
  },
  "required": [
    "classification",
    "confidence",
    "recommended_action"
  ],
  "additionalProperties": false
}
```

After structured parsing, Gemini output becomes usable as an actual object:

```json
{
  "output": {
    "classification": "sales",
    "confidence": 1,
    "recommended_action": "send_to_sales"
  }
}
```

Now n8n can access values directly.

---

# Why Structured Output Matters

A prompt can ask:

```text
Please return JSON.
```

But AI output is probabilistic.

A structured schema creates a contract describing:

```text
which fields must exist
what type each field must use
which values are allowed
```

This makes AI much safer to integrate into automation.

---

# Step 5 - Validate AI Output

Even structured output should be validated before automation acts on it.

The validator checks:

```text
classification is allowed
confidence is a number
confidence is between 0 and 1
recommended_action is allowed
```

Example valid result:

```json
{
  "classification": "sales",
  "confidence": 1,
  "recommended_action": "send_to_sales",
  "valid": true
}
```

---

# Why Validate After Structured Parsing?

Structured parsing controls the expected shape.

Validation adds business rules.

Together:

```text
Structured Parser
→ Is the data shaped correctly?

Validator
→ Is the data acceptable for our automation?
```

---

# Step 6 - AI Output Valid?

An IF node checks:

```text
valid = true
```

If valid:

```text
continue to routing
```

If invalid:

```text
use safe fallback
```

---

# Step 7 - Route by Classification

A Switch node routes based on:

```text
classification
```

Routes:

```text
sales
→ sales_team

support
→ support_team

billing
→ billing_team

other
→ manual_review
```

The key principle is:

> Gemini chooses the classification, but n8n controls what happens with it.

---

# Sales Route Example

Input:

```text
"I want to know your pricing."
```

AI output:

```json
{
  "classification": "sales",
  "confidence": 1,
  "recommended_action": "send_to_sales"
}
```

Final response:

```json
{
  "success": true,
  "classification": "sales",
  "confidence": 1,
  "recommended_action": "send_to_sales",
  "route": "sales_team",
  "decision_source": "ai_classification"
}
```

---

# Safe Fallback

If the output is invalid, the workflow does not trust it.

Fallback:

```json
{
  "success": false,
  "classification": "other",
  "confidence": 0,
  "recommended_action": "manual_review",
  "route": "manual_review",
  "reason": "invalid_ai_output"
}
```

This prevents unexpected AI output from directly triggering unsafe workflow actions.

---

# Break It

The lab intentionally simulated an invalid AI result:

```json
{
  "output": {
    "classification": "marketing",
    "confidence": 1.4,
    "recommended_action": "auto_delete"
  }
}
```

All three values violate the automation contract:

```text
marketing
→ unsupported classification

1.4
→ confidence outside 0–1

auto_delete
→ unsupported action
```

The validator returned:

```text
valid = false
```

and the workflow routed to:

```text
Build Safe Fallback
```

---

# Break It Lesson

Without validation:

```text
AI output
→ workflow action
```

With validation:

```text
AI output
→ validation
→ allowed?
   ├── yes → continue
   └── no  → safe fallback
```

This is much safer.

---

# Challenge

Test multiple business inquiries.

## Sales

```json
{
  "request_id": "req_ai_challenge_001",
  "message": "Can someone explain your plans and help me choose which one to buy?"
}
```

Expected:

```text
sales
→ sales_team
```

## Support

```json
{
  "request_id": "req_ai_challenge_002",
  "message": "My dashboard keeps showing an error whenever I upload a file."
}
```

Expected:

```text
support
→ support_team
```

## Billing

```json
{
  "request_id": "req_ai_challenge_003",
  "message": "My invoice amount doesn't match what I expected."
}
```

Expected:

```text
billing
→ billing_team
```

Confidence values can vary because the classifier is AI-powered.

The important behavior is:

```text
structured output
→ valid
→ correct route
```

---

# Make It Your Own

The Sales Route was extended with:

```json
{
  "decision_source": "ai_classification"
}
```

This makes it clear that the route was created from an AI classification decision.

This can later help with:

```text
logging
debugging
analytics
AEP website execution history
```

---

# Lab 09 vs Lab 10

Lab 09 asks:

> Can AI return structured, validated information that automation can use?

Lab 10 will ask:

> When should AI be allowed to act automatically, and when should a human approve the action?

So:

```text
Lab 09
Structured AI Output

↓ builds foundation for ↓

Lab 10
Guardrails + Human Approval
```

---

# Sample Data

```text
sample-data/
├── sales-inquiry.json
├── support-inquiry.json
├── billing-inquiry.json
└── other-inquiry.json
```

---

# Challenge Files

```text
challenge/
├── challenge-input.json
└── expected-result.json
```

---

# Important Engineering Principles

## Do Not Trust Free-Form AI Output

AI responses should not be directly connected to sensitive automation actions.

---

## Prefer Structured Outputs

Use explicit schemas when downstream automation expects specific data.

---

## Validate Before Routing

Even structured AI data should pass business-rule validation.

---

## Restrict Allowed Values

Avoid letting AI invent workflow actions.

Use controlled lists such as:

```text
send_to_sales
create_support_ticket
send_to_billing
manual_review
```

---

## Safe Defaults Matter

Unexpected AI output should fail safely.

For this lab:

```text
invalid output
→ manual review
```

not:

```text
invalid output
→ automatic action
```

---

# Future AEP Website Experience

The future AEP website can show:

```text
Customer Message
↓
Gemini Classification
↓
Structured Output
↓
Validation Result
↓
Selected Route
```

Learners should be able to see:

- AI input
- AI structured output
- validation result
- classification
- confidence
- recommended action
- selected route
- fallback result

The website should explain these visually while n8n remains the hands-on automation environment.

---

# Completion Checklist

You have completed Lab 09 when you can:

- Create a business classification scenario
- Send input to Gemini
- Define required JSON structure
- Receive structured AI output
- Explain string JSON vs actual structured JSON
- Validate required fields
- Validate allowed values
- Use a confidence score
- Use a recommended action
- Route based on AI classification
- Test valid AI output
- Simulate invalid AI output
- Route invalid output to a safe fallback
- Complete the challenge
- Complete Make It Your Own
- Explain why automation should validate AI before acting

---

# Final Takeaway

AI becomes much more useful in automation when its output becomes predictable.

The pattern is:

```text
INPUT
↓
AI
↓
STRUCTURE
↓
VALIDATE
↓
ROUTE
↓
SAFE AUTOMATION
```

Do not build:

```text
AI said something
↓
blindly do it
```

Build:

```text
AI produced a controlled suggestion
↓
automation verified it
↓
automation decided what was allowed
```

That is structured AI automation.