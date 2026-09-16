import "server-only";

import { expectField, type TestCase } from "./types";

/**
 * Lab 07 — Idempotency & Duplicate Protection.
 *
 * Field names and message text are taken from the exported workflow's two
 * Respond to Webhook nodes, not from the README.
 *
 * The success test is the SECOND delivery of the same event, because that is
 * the only response that proves anything. A first delivery succeeds whether or
 * not duplicate protection exists at all.
 */
export const LAB_07_DUPLICATE_CASE: TestCase = {
  id: "lab-07-duplicate-ignored",
  labSlug: "07-idempotency-duplicate-protection",
  name: "The same event delivered twice performs its business action only once",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The duplicate is handled as success, not an error", "success", "true"),
    expectField("duplicate", "It was recognised as a duplicate", "duplicate", "true"),
    expectField("message", "And deliberately ignored", "message", "Duplicate event ignored"),
    expectField("event", "It is the same event as before", "event_id", "evt_504"),
  ],
};

/**
 * The challenge checks the THIRD delivery: a genuinely new event arriving
 * after a duplicate. A broken workflow that has started treating everything as
 * already-seen passes the duplicate check and fails here, which is exactly the
 * over-eager failure mode duplicate protection is prone to.
 */
export const LAB_07_CHALLENGE_CASE: TestCase = {
  id: "lab-07-new-event-after-duplicate",
  labSlug: "07-idempotency-duplicate-protection",
  name: "A new event after a duplicate is still processed, not wrongly blocked",
  mode: "self-check",
  checkpoints: [
    expectField("duplicate", "It was not mistaken for a duplicate", "duplicate", "false"),
    expectField(
      "message",
      "It was processed",
      "message",
      "Event processed successfully",
    ),
    expectField("event", "It is the second unique event", "event_id", "evt_challenge_002"),
    expectField("status", "Its lifecycle reached processed", "status", "processed"),
  ],
};
