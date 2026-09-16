import "server-only";

import { expectField, type TestCase } from "./types";

/**
 * Lab 10 — AI Guardrails & Human-in-the-Loop.
 *
 * Checked against the exported workflow, which differs from the README in one
 * place that matters: the README shows `guardrail_reason: restricted_action`
 * on the pending response, but `Return Pending Approval` never emits it — that
 * field exists only on `Apply Guardrails`, upstream. Asserting it would fail
 * every correct workflow, so it is not asserted. The mismatch is recorded for
 * the owner.
 *
 * The recommended ACTION is not asserted either. It comes from Gemini, and a
 * correct guardrail stops a restricted request whatever the model happened to
 * call it. What this checks is the thing the lab teaches: the request was held
 * for a human rather than executed.
 */
export const LAB_10_HELD_CASE: TestCase = {
  id: "lab-10-restricted-held",
  labSlug: "10-ai-guardrails-human-in-the-loop",
  name: "A confident request to cancel an account waits for a human instead of executing",
  mode: "self-check",
  checkpoints: [
    expectField("success", "Holding it counts as the system working", "success", "true"),
    expectField("status", "It is pending approval, not executed", "status", "pending_approval"),
    expectField("approval", "A human is required", "requires_approval", "true"),
    expectField("source", "The guardrail made that call", "decision_source", "ai_guardrail"),
  ],
};

/**
 * The challenge checks the human approval path, which involves no model at all
 * and is fully deterministic.
 *
 * `human_decision` is asserted as "approve", exactly as `Execute Approved
 * Action` sets it — the rejection node uses "rejected", so the workflow's own
 * tense is inconsistent, and the check follows what it actually emits.
 * `decision_source` is left alone because changing it to human_approval is the
 * lab's Make It Your Own task.
 */
export const LAB_10_APPROVED_CASE: TestCase = {
  id: "lab-10-human-approved",
  labSlug: "10-ai-guardrails-human-in-the-loop",
  name: "A held request runs only after a person approves it",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The decision was recorded", "success", "true"),
    expectField(
      "status",
      "The action executed after approval",
      "status",
      "approved_and_executed",
    ),
    expectField("human", "A human made the decision", "human_decision", "approve"),
  ],
};
