import "server-only";

import type { Checkpoint } from "./cases/types";
import type { CheckpointResult, JsonValue, TestResult } from "./types";

/**
 * Runs a case's checkpoints against the learner's actual output.
 *
 * **Stops at the first failure.** Every later checkpoint is reported as
 * `skipped`, not `failed`, and that is the whole diagnostic value: it is what
 * produces "name ✓ / email ✓ / company ✕ / (skipped)" instead of a wall of
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

/**
 * Parses what the learner pasted.
 *
 * n8n shows a node's output as an array of items, and learners copy whatever
 * the panel gave them — sometimes `[{...}]`, sometimes `{...}`, sometimes
 * n8n's `[{ "json": {...} }]` wrapper. All three mean the same thing to the
 * learner, so all three are accepted. Rejecting a correct answer because of
 * how the tool formatted it would teach nothing except that AEP is fussy.
 */
export function normaliseSubmittedOutput(parsed: JsonValue): JsonValue {
  const first = Array.isArray(parsed) ? (parsed[0] ?? null) : parsed;

  if (
    typeof first === "object" &&
    first !== null &&
    !Array.isArray(first) &&
    "json" in (first as Record<string, JsonValue>)
  ) {
    return (first as Record<string, JsonValue>).json;
  }

  return first;
}
