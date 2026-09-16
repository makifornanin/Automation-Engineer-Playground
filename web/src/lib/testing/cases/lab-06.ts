import "server-only";

import { expectField, type TestCase } from "./types";

/**
 * Lab 06 — Retry Logic & Exponential Backoff.
 *
 * The lab uses a deterministic simulator rather than a flaky real service, so
 * every number here is exact and stable. That matters for the lesson: the
 * point is the difference between attempts and retries, and a test that
 * tolerated "roughly three" would let exactly that confusion through.
 *
 * Field names are checked against the exported workflow, not the README. The
 * `Return Success` node emits success, final_status_code, message,
 * attempts_used, retries_performed and retry_log. `failed_attempts` exists
 * only on `Return Permanent Failure`.
 */
export const LAB_06_SUCCESS_CASE: TestCase = {
  id: "lab-06-eventual-success",
  labSlug: "06-retry-exponential-backoff",
  name: "A request that fails twice recovers on its own without anyone resubmitting it",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The request eventually succeeded", "success", "true"),
    expectField("status", "The final response was a 200", "final_status_code", "200"),
    expectField("attempts", "It took three attempts", "attempts_used", "3"),
    expectField(
      "retries",
      "Which is two retries, not three",
      "retries_performed",
      "2",
    ),
  ],
};

/**
 * The challenge raises the ceiling and moves the recovery point.
 *
 * Deliberately does NOT check `failed_attempts`, although the lab README's
 * challenge section lists `failed_attempts = 3`. This run recovers, so it
 * exits through `Return Success`, which never emits that field — asserting it
 * would fail every learner whose workflow is correct. The README/workflow
 * mismatch is recorded for the owner rather than papered over here.
 */
export const LAB_06_CHALLENGE_CASE: TestCase = {
  id: "lab-06-challenge-recovery",
  labSlug: "06-retry-exponential-backoff",
  name: "A longer outage still recovers, inside a higher attempt limit",
  mode: "self-check",
  checkpoints: [
    expectField("success", "The request eventually succeeded", "success", "true"),
    expectField("status", "The final response was a 200", "final_status_code", "200"),
    expectField("attempts", "It took four attempts", "attempts_used", "4"),
    expectField("retries", "Three of them were retries", "retries_performed", "3"),
  ],
};
