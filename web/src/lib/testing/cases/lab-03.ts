import "server-only";

import { expectField, expectPresent, type TestCase } from "./types";

/**
 * Lab 03 — APIs & Webhooks.
 *
 * The first lab whose workflow AEP could genuinely call, since it starts with
 * a Webhook node. It stays a self-check for now: Send Test needs the learner's
 * webhook URL stored and validated, which is its own piece of work. The
 * evidence is the same either way — the response their workflow produced.
 *
 * user_id 5 on jsonplaceholder is Chelsey Dietrich, which the lab README
 * records as the value a correctly configured Expression field returns. That
 * is the detail worth checking: a field left in Fixed mode returns the literal
 * text of the expression instead, and the response still looks structurally
 * fine.
 */
export const LAB_03_SUCCESS_CASE: TestCase = {
  id: "lab-03-customer-found",
  labSlug: "03-apis-webhooks",
  name: "A known customer is looked up in the external API and returned to the caller",
  mode: "send-test",
  checkpoints: [
    expectField("success", "The workflow reports success", "success", "true"),
    expectField(
      "message",
      "It says the customer was found",
      "message",
      "External customer data found",
    ),
    expectField(
      "name",
      "The real customer name came back, not the expression text",
      "customer_name",
      "Chelsey Dietrich",
    ),
    expectPresent("email", "A customer email came back too", "customer_email"),
  ],
};

/**
 * The not-found path, which is the one that matters.
 *
 * A 404 from the external API must not crash the workflow or leak through as a
 * success. This checks the controlled failure response: Never Error keeps the
 * run alive, the IF sees a non-200, and the caller gets an honest answer.
 */
export const LAB_03_CHALLENGE_CASE: TestCase = {
  id: "lab-03-customer-not-found",
  labSlug: "03-apis-webhooks",
  name: "A customer who does not exist produces an honest not-found answer, not a crash",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The workflow reports failure honestly", "success", "false"),
    expectField(
      "message",
      "It says the customer was not found",
      "message",
      "External customer data not found",
    ),
  ],
};
