import "server-only";

import { expectField, expectPresent, type TestCase } from "./types";

/**
 * Lab 03 — APIs & Webhooks.
 *
 * The first lab whose workflow AEP calls, since it starts with a Webhook node.
 * The success case runs through Send Test; a learner whose n8n AEP cannot
 * reach pastes the response instead, and the evidence is the same either way.
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
 *
 * Run through Send Test with user_id 999. The check reads the response body;
 * the 404 status the lesson asks for is shown in technical details, not
 * asserted, the same as every other Send Test.
 */
export const LAB_03_CHALLENGE_CASE: TestCase = {
  id: "lab-03-customer-not-found",
  labSlug: "03-apis-webhooks",
  name: "A customer who does not exist produces an honest not-found answer, not a crash",
  mode: "send-test",
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
