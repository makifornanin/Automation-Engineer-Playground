import { describe, expect, it, vi } from "vitest";
import { evaluateCheckpoints, normaliseSubmittedOutput } from "../evaluate";
import type { JsonValue } from "../types";
import {
  CAPSTONE_APPROVE_REJECT_CASE,
  CAPSTONE_DECIDE_TWICE_CASE,
  CAPSTONE_DUPLICATE_CASE,
  CAPSTONE_INVALID_CASE,
  CAPSTONE_PERMANENT_FAILURE_CASE,
  CAPSTONE_REPLAY_CASE,
  CAPSTONE_RESTRICTED_CASE,
  CAPSTONE_TEMPORARY_FAILURE_CASE,
  CAPSTONE_VALID_CASE,
} from "./capstone";
import type { TestCase } from "./types";

vi.mock("server-only", () => ({}));

/*
 * Responses in exactly the shape the reference Capstone's Respond to Webhook
 * and Set nodes produce (see the source note in capstone.ts). Ids are made up.
 */
const EXECUTED = {
  success: true,
  status: "action_executed",
  event_id: "req:req_cap_sales_001",
  request_id: "req_cap_sales_001",
  action: "send_to_sales",
  attempts_used: 1,
  decision_source: "ai_guardrail",
  action_note: "send_to_sales would execute here",
};

const QUEUED = {
  success: false,
  status: "queued_for_recovery",
  event_id: "req:req_cap_dlq_001",
  request_id: "req_cap_dlq_001",
  action: "send_to_sales",
  dlq_id: 17,
  attempts_used: 3,
  error_message: "Simulated downstream failure (503)",
};

function check(testCase: TestCase, pasted: JsonValue) {
  return evaluateCheckpoints(
    testCase.name,
    testCase.checkpoints,
    normaliseSubmittedOutput(pasted, testCase.shape),
  );
}

describe("Capstone proofs pass on the reference agent's real responses", () => {
  it.each([
    ["valid, safe request", CAPSTONE_VALID_CASE, EXECUTED],
    [
      "invalid request",
      CAPSTONE_INVALID_CASE,
      {
        success: false,
        status: "validation_failed",
        request_id: "req_cap_invalid_001",
        errors: ["message is too short to classify", "customer_email is not a valid email address"],
      },
    ],
    [
      "same request twice",
      CAPSTONE_DUPLICATE_CASE,
      {
        success: true,
        status: "duplicate_ignored",
        event_id: "req:req_cap_dup_001",
        request_id: "req_cap_dup_001",
        note: "This event was already accepted. No new business action was created.",
      },
    ],
    [
      "restricted action",
      CAPSTONE_RESTRICTED_CASE,
      {
        success: true,
        status: "pending_approval",
        approval_id: 101,
        event_id: "req:req_cap_cancel_001",
        request_id: "req_cap_cancel_001",
        action: "cancel_account",
        confidence: 0.98,
        requires_approval: true,
        guardrail_reason: "restricted_action",
        decision_source: "ai_guardrail",
      },
    ],
    [
      "approval then rejection",
      CAPSTONE_APPROVE_REJECT_CASE,
      [
        {
          success: true,
          status: "approved_and_executed",
          approval_id: 101,
          human_decision: "approved",
          decision_source: "human_approval",
          execution_result: { ...EXECUTED, decision_source: "human_approval" },
        },
        {
          success: true,
          status: "rejected",
          approval_id: 102,
          human_decision: "rejected",
          decision_source: "human_approval",
        },
      ],
    ],
    [
      "deciding twice",
      CAPSTONE_DECIDE_TWICE_CASE,
      { success: false, status: "not_pending", approval_id: "101" },
    ],
    ["temporary failure", CAPSTONE_TEMPORARY_FAILURE_CASE, { ...EXECUTED, attempts_used: 3 }],
    ["permanent failure", CAPSTONE_PERMANENT_FAILURE_CASE, QUEUED],
    [
      "replay",
      CAPSTONE_REPLAY_CASE,
      { success: true, status: "recovered", dlq_id: 17, event_id: QUEUED.event_id, recovery_result: EXECUTED },
    ],
  ] as const)("%s", (_name, testCase, response) => {
    expect(check(testCase, response as JsonValue).passed).toBe(true);
  });
});

describe("Capstone proofs fail when the scenario did not really happen", () => {
  it("a normal success is not proof of recovering from a temporary failure", () => {
    const result = check(CAPSTONE_TEMPORARY_FAILURE_CASE, EXECUTED);

    expect(result.passed).toBe(false);
    expect(result.firstFailure?.id).toBe("attempts");
  });

  it("a request that was retried is not proof of a clean first run", () => {
    expect(check(CAPSTONE_VALID_CASE, { ...EXECUTED, attempts_used: 3 }).passed).toBe(false);
  });

  it("a restricted request that executed is not held", () => {
    const result = check(CAPSTONE_RESTRICTED_CASE, { ...EXECUTED, action: "cancel_account" });

    expect(result.passed).toBe(false);
    expect(result.firstFailure?.id).toBe("status");
  });

  it("a validation failure must say what was wrong", () => {
    const result = check(CAPSTONE_INVALID_CASE, {
      success: false,
      status: "validation_failed",
      errors: [],
    });

    expect(result.passed).toBe(false);
    expect(result.firstFailure?.id).toBe("errors");
  });

  it("one approval alone does not prove approval and rejection", () => {
    const result = check(CAPSTONE_APPROVE_REJECT_CASE, {
      success: true,
      status: "approved_and_executed",
      execution_result: EXECUTED,
    });

    expect(result.passed).toBe(false);
    expect(result.firstFailure?.id).toBe("count");
  });

  it("two approvals in a row do not prove a rejection", () => {
    const approved = { success: true, status: "approved_and_executed", execution_result: EXECUTED };

    expect(check(CAPSTONE_APPROVE_REJECT_CASE, [approved, approved]).passed).toBe(false);
  });

  it("a failed replay that left the record pending is not a recovery", () => {
    const result = check(CAPSTONE_REPLAY_CASE, {
      dlq_id: 17,
      event_id: QUEUED.event_id,
      status: "pending",
      recovered: false,
      error_message: "Recovery replay failed",
    });

    expect(result.passed).toBe(false);
  });
});
