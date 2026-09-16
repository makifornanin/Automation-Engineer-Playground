import "server-only";

import type { Checkpoint, TestCase } from "./cases/types";
import type { CheckpointResult, JsonValue, TestResult } from "./types";

/**
 * Runs a case's checkpoints against the learner's actual output.
 *
 * Stops at the first failure. Every later checkpoint is reported as skipped
 * rather than failed, and that is the whole diagnostic value: it produces
 * "name ok / email ok / company wrong / (not checked)" instead of a wall of
 * red, and it is what lets Kaz later say "everything up to the company field
 * is healthy" without guessing which failure is the root cause.
 *
 * Cascading failures teach nothing. One first failure points at one mistake.
 */
export function evaluateCheckpoints(
  caseName: string,
  checkpoints: readonly Checkpoint[],
  actual: JsonValue,
): TestResult {
  const results: CheckpointResult[] = [];
  let firstFailure: CheckpointResult | null = null;

  for (const checkpoint of checkpoints) {
    if (firstFailure) {
      results.push({ id: checkpoint.id, label: checkpoint.label, state: "skipped" });
      continue;
    }

    const verdict = checkpoint.evaluate(actual);
    if (verdict.state === "passed") {
      results.push({ id: checkpoint.id, label: checkpoint.label, state: "passed" });
      continue;
    }

    const failure: CheckpointResult = {
      id: checkpoint.id,
      label: checkpoint.label,
      state: "failed",
      expected: verdict.expected,
      actual: verdict.actual,
    };
    results.push(failure);
    firstFailure = failure;
  }

  return {
    caseName,
    passed: firstFailure === null && results.length > 0,
    checkpoints: results,
    firstFailure,
  };
}

/** Strips n8n's per-item json envelope, if present. */
function unwrapItem(value: JsonValue): JsonValue {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "json" in (value as Record<string, JsonValue>)
  ) {
    return (value as Record<string, JsonValue>).json;
  }
  return value;
}

/**
 * Parses what the learner pasted into the shape a case expects.
 *
 * n8n shows a node's output as a list of items, and learners copy whatever the
 * panel gave them - sometimes a bare object, sometimes an array, sometimes
 * n8n's json envelope around each item. All of those mean the same thing to
 * the learner, so all of them are accepted. Rejecting a correct answer because
 * of how the tool formatted it teaches only that AEP is fussy.
 *
 * An "items" case keeps the whole list, because for those labs the number of
 * items IS the evidence.
 */
export function normaliseSubmittedOutput(
  parsed: JsonValue,
  shape: TestCase["shape"] = "item",
): JsonValue {
  if (shape === "items") {
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map(unwrapItem);
  }

  const first = Array.isArray(parsed) ? (parsed[0] ?? null) : parsed;
  return unwrapItem(first);
}
