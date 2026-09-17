import "server-only";

import { expectField, type TestCase } from "./types";

/**
 * Lab 09 — Structured AI Output.
 *
 * Confidence is deliberately never asserted on the live path: the lab's own
 * README says it "will wobble between runs — that's a language model being a
 * language model." Classification and route are constrained by the schema's
 * enum and should not. `decision_source` is also not asserted, because in the
 * exported workflow only Sales Route carries it — adding it to the others is
 * the lab's Make It Your Own task, so a learner who has done that task must
 * still pass.
 */
export const LAB_09_SALES_CASE: TestCase = {
  id: "lab-09-sales-routed",
  labSlug: "09-structured-ai-output",
  name: "A pricing question is classified as sales and routed only after validation",
  mode: "send-test",
  checkpoints: [
    expectField("success", "The classification was accepted", "success", "true"),
    expectField("classification", "Classified as sales", "classification", "sales"),
    expectField(
      "action",
      "With a recommended action from the allowed list",
      "recommended_action",
      "send_to_sales",
    ),
    expectField("route", "Routed to the sales team", "route", "sales_team"),
  ],
};

/**
 * The challenge checks the safe fallback, which is deterministic because it is
 * driven by the Break It simulator rather than by the model. Every value here
 * is a deliberate refusal to guess: no classification, no trust in the model's
 * confidence, and a human rather than an automatic action.
 */
export const LAB_09_FALLBACK_CASE: TestCase = {
  id: "lab-09-safe-fallback",
  labSlug: "09-structured-ai-output",
  name: "Output that breaks the contract goes to a human, never to an automatic action",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The AI output was rejected", "success", "false"),
    expectField("reason", "And the reason is recorded", "reason", "invalid_ai_output"),
    expectField("classification", "No classification was guessed", "classification", "other"),
    expectField("confidence", "The model's confidence was discarded", "confidence", "0"),
    expectField("route", "A human reviews it", "route", "manual_review"),
    expectField(
      "action",
      "Nothing executes automatically",
      "recommended_action",
      "manual_review",
    ),
  ],
};
