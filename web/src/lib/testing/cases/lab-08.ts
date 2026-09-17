import "server-only";

import { expectField, type TestCase } from "./types";

/**
 * Lab 08 — Dead Letter Queue & Failure Recovery.
 *
 * Checked against the exported workflow: `Build DLQ Record` sets status to
 * 'pending' and retry_count to the attempt count, and `Return Queued for
 * Recovery` echoes both. With max_attempts 3 that is exactly 3.
 */
export const LAB_08_QUEUED_CASE: TestCase = {
  id: "lab-08-queued-for-recovery",
  labSlug: "08-dead-letter-queue-failure-recovery",
  name: "An event that fails permanently is preserved for recovery instead of being lost",
  mode: "send-test",
  checkpoints: [
    expectField("success", "Processing honestly reports failure", "success", "false"),
    expectField("queued", "But the event was queued for recovery", "queued_for_recovery", "true"),
    expectField(
      "message",
      "It went to the dead letter queue",
      "message",
      "Event moved to dead letter queue",
    ),
    expectField("retries", "Only after every attempt was used", "retry_count", "3"),
    expectField("status", "And it is waiting as pending", "status", "pending"),
  ],
};

/**
 * The challenge checks the replay that FAILS, not the one that succeeds.
 *
 * That is the harder half of the lesson and the one the Break It exercise is
 * about: a failed replay must leave the item pending. The `Keep DLQ Pending`
 * node's output is deterministic, whereas the successful path returns a
 * database row whose shape depends on the learner's table.
 */
export const LAB_08_CHALLENGE_CASE: TestCase = {
  id: "lab-08-failed-replay-stays-pending",
  labSlug: "08-dead-letter-queue-failure-recovery",
  name: "A replay that fails again leaves the event pending rather than falsely recovered",
  mode: "self-check",
  checkpoints: [
    expectField(
      "event",
      "It is the second challenge event",
      "event_id",
      "evt_dlq_challenge_002",
    ),
    expectField("recovery", "The replay was not counted as a success", "recovery_success", "false"),
    expectField("status", "The event is still pending", "status", "pending"),
  ],
};
