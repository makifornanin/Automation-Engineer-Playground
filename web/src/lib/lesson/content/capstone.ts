import type { TestChunk } from "../types";

/**
 * The Capstone's proofs: one paste-checked test per scenario, in the order of
 * `CAPSTONE_SCENARIOS`, and nothing else. All nine verified is what completes
 * the Capstone.
 *
 * Every proof is a `test` with `self-check`. That is deliberate: `verified` is
 * only granted by a passing evaluation, so no step here can be completed by
 * pressing Next. Send Test is not used — several proofs need an id from an
 * earlier run (an approval, a dead letter record), which a fixed payload
 * cannot carry.
 *
 * Each proof states the request to send and the response it checks. The
 * learner builds their own agent, so the response shape is the contract they
 * build to; the scenario still has to really happen for the check to pass.
 */

const SERVICE_WEBHOOK =
  "Send it to your agent's service request webhook, the way you called a webhook in Lab 03.";

export const CAPSTONE_PROOFS: readonly TestChunk[] = [
  {
    kind: "test",
    id: "valid-safe-request",
    title: "A valid, safe request",
    mode: "self-check",
    testCaseId: "capstone-valid-safe-request",
    caseName: "A valid, safe request runs end to end and acts automatically",
    expected:
      "success true, status action_executed, the action, decision_source ai_guardrail and attempts_used 1.",
    content: [
      {
        type: "prose",
        text:
          SERVICE_WEBHOOK +
          " Your agent remembers request ids, so give every run a request_id it has not seen before.",
      },
      {
        type: "code",
        language: "json",
        caption: "Request",
        code: '{\n  "request_id": "req_cap_sales_001",\n  "customer_email": "Maria.Santos@Example.com",\n  "message": "Hi, we would like pricing for the team plan for 40 people."\n}',
      },
      {
        type: "prose",
        text: "A pricing question is safe to route automatically, so nothing should wait for a human. Paste the response your webhook returns.",
      },
    ],
  },
  {
    kind: "test",
    id: "invalid-request",
    title: "An invalid request",
    mode: "self-check",
    testCaseId: "capstone-invalid-request",
    caseName: "An invalid request is refused before AI or any action",
    expected: "success false, status validation_failed, and an errors list saying what was wrong.",
    content: [
      { type: "prose", text: SERVICE_WEBHOOK },
      {
        type: "code",
        language: "json",
        caption: "Request",
        code: '{\n  "request_id": "req_cap_invalid_001",\n  "customer_email": "not-an-email",\n  "message": "hi"\n}',
      },
      {
        type: "prose",
        text: "The email is broken and the message is too short to classify. Your agent should refuse it before the AI is ever called, which is why this run costs nothing. Paste the response.",
      },
    ],
  },
  {
    kind: "test",
    id: "duplicate-request",
    title: "The same request twice",
    mode: "self-check",
    testCaseId: "capstone-duplicate-request",
    caseName: "The second delivery of the same request performs no second action",
    expected: "The second response: success true, status duplicate_ignored, with the event_id.",
    content: [
      {
        type: "prose",
        text: "Send one valid request with a new request_id, then send exactly the same body again. Paste the response to the second one.",
      },
      {
        type: "code",
        language: "json",
        caption: "Request (send twice)",
        code: '{\n  "request_id": "req_cap_dup_001",\n  "customer_email": "maria.santos@example.com",\n  "message": "Can someone from sales call me about the team plan?"\n}',
      },
    ],
  },
  {
    kind: "test",
    id: "restricted-action",
    title: "A restricted action",
    mode: "self-check",
    testCaseId: "capstone-restricted-held",
    caseName: "A restricted action is held for a human, however confident the AI is",
    expected: "success true, status pending_approval, requires_approval true and an approval_id.",
    content: [
      { type: "prose", text: SERVICE_WEBHOOK },
      {
        type: "code",
        language: "json",
        caption: "Request",
        code: '{\n  "request_id": "req_cap_cancel_001",\n  "customer_email": "maria.santos@example.com",\n  "message": "Please cancel my account today. I no longer need the service."\n}',
      },
      {
        type: "prose",
        text: "The AI will be sure this customer wants to cancel. Being sure is not permission. Paste the response, and keep its approval_id: the next two proofs use approvals.",
      },
    ],
  },
  {
    kind: "test",
    id: "approve-then-reject",
    title: "A human approval, then a rejection",
    mode: "self-check",
    testCaseId: "capstone-approve-then-reject",
    caseName: "Only approved work executes, and each decision is recorded",
    expected:
      "A list of two responses: first status approved_and_executed with execution_result.status action_executed; then status rejected with human_decision rejected.",
    content: [
      {
        type: "prose",
        text: "Create two pending approvals by sending two restricted requests with new request_ids. Then send a decision for each to your agent's approval webhook: approve the first, reject the second.",
      },
      {
        type: "code",
        language: "json",
        caption: "Decisions (use your own approval ids)",
        code: '{ "approval_id": 101, "decision": "approve", "decided_by": "you" }\n\n{ "approval_id": 102, "decision": "reject", "decided_by": "you" }',
      },
      {
        type: "prose",
        text: "Paste both responses as one list, approval first: [ first response, second response ].",
      },
    ],
  },
  {
    kind: "test",
    id: "decide-twice",
    title: "Deciding the same request twice",
    mode: "self-check",
    testCaseId: "capstone-decide-twice",
    caseName: "An already-decided request cannot be decided again",
    expected: "success false, status not_pending.",
    content: [
      {
        type: "prose",
        text: "Send the approval decision for your first approval again, exactly as before. A reviewer double-clicking must not run the action twice. Paste the response.",
      },
    ],
  },
  {
    kind: "test",
    id: "temporary-failure",
    title: "A temporary external failure",
    mode: "self-check",
    testCaseId: "capstone-temporary-failure",
    caseName: "A temporary failure recovers through retries without resubmission",
    expected: "success true, status action_executed, attempts_used 2 or more.",
    content: [
      {
        type: "prose",
        text:
          SERVICE_WEBHOOK +
          " scenario and success_on_attempt tell your agent's simulated external call to fail until the third attempt.",
      },
      {
        type: "code",
        language: "json",
        caption: "Request",
        code: '{\n  "request_id": "req_cap_retry_001",\n  "customer_email": "maria.santos@example.com",\n  "message": "Hi, we would like pricing for the team plan for 40 people.",\n  "scenario": "eventual_success",\n  "success_on_attempt": 3\n}',
      },
      {
        type: "prose",
        text: "It takes a few seconds longer: that is the backoff waiting between attempts. Paste the response.",
      },
    ],
  },
  {
    kind: "test",
    id: "permanent-failure",
    title: "A permanent external failure",
    mode: "self-check",
    testCaseId: "capstone-permanent-failure",
    caseName: "A permanent failure lands in the dead letter queue instead of vanishing",
    expected: "success false, status queued_for_recovery, a dlq_id and attempts_used 2 or more.",
    content: [
      { type: "prose", text: SERVICE_WEBHOOK },
      {
        type: "code",
        language: "json",
        caption: "Request",
        code: '{\n  "request_id": "req_cap_dlq_001",\n  "customer_email": "maria.santos@example.com",\n  "message": "Hi, we would like pricing for the team plan for 40 people.",\n  "scenario": "permanent_failure"\n}',
      },
      {
        type: "prose",
        text: "Paste the response, and keep its dlq_id for the last proof.",
      },
    ],
  },
  {
    kind: "test",
    id: "replay-dead-letter",
    title: "Replaying a dead-lettered request",
    mode: "self-check",
    testCaseId: "capstone-replay-dead-letter",
    caseName: "A dead-lettered request is recovered once the cause is fixed",
    expected:
      "success true, status recovered, the dlq_id, and recovery_result.status action_executed.",
    content: [
      {
        type: "prose",
        text: "The external service is back. Send the dead letter record to your agent's recovery webhook, using the dlq_id from the previous proof.",
      },
      {
        type: "code",
        language: "json",
        caption: "Request (use your own dlq_id)",
        code: '{ "dlq_id": 42, "recovery_scenario": "success" }',
      },
      { type: "prose", text: "Paste the response." },
    ],
  },
];
