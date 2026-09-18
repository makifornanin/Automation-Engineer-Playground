import "server-only";

import { CAPSTONE_SLUG } from "@/lib/course/catalog";
import {
  expectAtLeast,
  expectCount,
  expectField,
  expectFieldAt,
  expectNonEmptyList,
  expectPresent,
  type TestCase,
} from "./types";

/**
 * The Capstone's nine proofs, one per scenario in `CAPSTONE_SCENARIOS`.
 *
 * Every field and value below was read from the owner's reference Capstone in
 * n8n, not guessed. The repo holds no exports, so this is the source:
 *
 * - "AEP Capstone - AI Service Request Agent" (webhook
 *   `aep-capstone-service-request`): Return Validation Error, Return Duplicate
 *   Response, Build Pending Response, and Return Final Result (which returns
 *   the executor's output);
 * - "AEP Capstone - Reliable Action Executor": Return Action Success, Return
 *   Queued for Recovery; `scenario` values `eventual_success` and
 *   `permanent_failure` in Perform Business Action;
 * - "AEP Capstone - Human Approval Handler" (webhook
 *   `aep-capstone-approval-decision`): Return Approved Result, Return Rejected
 *   Result, Return Already Decided;
 * - "AEP Capstone - DLQ Recovery Handler" (webhook
 *   `aep-capstone-dlq-recovery`): Return Recovered.
 *
 * The lesson states each response shape to the learner, because a learner
 * builds their own agent and needs the contract. That is a spec, not an
 * answer: what earns the proof is an agent that actually behaves that way.
 *
 * What the AI recommends is never asserted. It comes from Gemini, and the
 * proofs are about what the system does with a recommendation.
 */

export const CAPSTONE_VALID_CASE: TestCase = {
  id: "capstone-valid-safe-request",
  labSlug: CAPSTONE_SLUG,
  name: "A valid, safe request runs end to end and acts automatically",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The request succeeded", "success", "true"),
    expectField("status", "The action executed", "status", "action_executed"),
    expectPresent("action", "The AI's action is recorded", "action"),
    expectField("source", "The guardrail let it run on its own", "decision_source", "ai_guardrail"),
    expectField("attempts", "It worked first time, with no retries", "attempts_used", "1"),
  ],
};

export const CAPSTONE_INVALID_CASE: TestCase = {
  id: "capstone-invalid-request",
  labSlug: CAPSTONE_SLUG,
  name: "An invalid request is refused before AI or any action",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The request was refused", "success", "false"),
    expectField("status", "Refused at validation", "status", "validation_failed"),
    expectNonEmptyList("errors", "The refusal says what was wrong", "errors"),
  ],
};

export const CAPSTONE_DUPLICATE_CASE: TestCase = {
  id: "capstone-duplicate-request",
  labSlug: CAPSTONE_SLUG,
  name: "The second delivery of the same request performs no second action",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The repeat is handled, not an error", "success", "true"),
    expectField("status", "The repeat was ignored", "status", "duplicate_ignored"),
    expectPresent("event", "It names the event it recognised", "event_id"),
  ],
};

export const CAPSTONE_RESTRICTED_CASE: TestCase = {
  id: "capstone-restricted-held",
  labSlug: CAPSTONE_SLUG,
  name: "A restricted action is held for a human, however confident the AI is",
  mode: "self-check",
  checkpoints: [
    expectField("success", "Holding it counts as working", "success", "true"),
    expectField("status", "It is pending approval, not executed", "status", "pending_approval"),
    expectField("approval", "A human is required", "requires_approval", "true"),
    expectPresent("approval-id", "The approval can be found again", "approval_id"),
  ],
};

export const CAPSTONE_APPROVE_REJECT_CASE: TestCase = {
  id: "capstone-approve-then-reject",
  labSlug: CAPSTONE_SLUG,
  name: "Only approved work executes, and each decision is recorded",
  mode: "self-check",
  shape: "items",
  checkpoints: [
    expectCount("count", "Both decisions were pasted", 2),
    expectFieldAt("approved", "The approved request executed", 0, "status", "approved_and_executed"),
    expectFieldAt(
      "approved-ran",
      "Approval ran the action for real",
      0,
      "execution_result.status",
      "action_executed",
    ),
    expectFieldAt("rejected", "The rejected request did not", 1, "status", "rejected"),
    expectFieldAt("recorded", "The rejection is recorded as a human's", 1, "human_decision", "rejected"),
  ],
};

export const CAPSTONE_DECIDE_TWICE_CASE: TestCase = {
  id: "capstone-decide-twice",
  labSlug: CAPSTONE_SLUG,
  name: "An already-decided request cannot be decided again",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The second decision was refused", "success", "false"),
    expectField("status", "Nothing was pending any more", "status", "not_pending"),
  ],
};

export const CAPSTONE_TEMPORARY_FAILURE_CASE: TestCase = {
  id: "capstone-temporary-failure",
  labSlug: CAPSTONE_SLUG,
  name: "A temporary failure recovers through retries without resubmission",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The request succeeded in the end", "success", "true"),
    expectField("status", "The action executed", "status", "action_executed"),
    expectAtLeast("attempts", "It took more than one attempt", "attempts_used", 2),
  ],
};

export const CAPSTONE_PERMANENT_FAILURE_CASE: TestCase = {
  id: "capstone-permanent-failure",
  labSlug: CAPSTONE_SLUG,
  name: "A permanent failure lands in the dead letter queue instead of vanishing",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The failure is reported honestly", "success", "false"),
    expectField("status", "It was queued for recovery", "status", "queued_for_recovery"),
    expectPresent("dlq", "It has a dead letter record", "dlq_id"),
    expectAtLeast("attempts", "It retried before giving up", "attempts_used", 2),
  ],
};

export const CAPSTONE_REPLAY_CASE: TestCase = {
  id: "capstone-replay-dead-letter",
  labSlug: CAPSTONE_SLUG,
  name: "A dead-lettered request is recovered once the cause is fixed",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The replay succeeded", "success", "true"),
    expectField("status", "The record is recovered", "status", "recovered"),
    expectPresent("dlq", "It names the record it recovered", "dlq_id"),
    expectField(
      "ran",
      "The replay ran the action for real",
      "recovery_result.status",
      "action_executed",
    ),
  ],
};

export const CAPSTONE_CASES: readonly TestCase[] = [
  CAPSTONE_VALID_CASE,
  CAPSTONE_INVALID_CASE,
  CAPSTONE_DUPLICATE_CASE,
  CAPSTONE_RESTRICTED_CASE,
  CAPSTONE_APPROVE_REJECT_CASE,
  CAPSTONE_DECIDE_TWICE_CASE,
  CAPSTONE_TEMPORARY_FAILURE_CASE,
  CAPSTONE_PERMANENT_FAILURE_CASE,
  CAPSTONE_REPLAY_CASE,
];
