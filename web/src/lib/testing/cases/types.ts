import "server-only";

import type { JsonValue } from "../types";

/**
 * Test-case definitions. `server-only` because these carry the expected
 * values: the whole point of a self-check is that the learner produces the
 * answer, so shipping it to the browser would defeat the exercise.
 */

export type CheckpointVerdict =
  | { state: "passed" }
  | { state: "failed"; expected: string; actual: string };

export interface Checkpoint {
  id: string;
  /** Learner-facing, business-shaped: "Email cleaned", not "assert eq". */
  label: string;
  /** Pure. No I/O, no network, no clock — a checkpoint must be replayable. */
  evaluate: (actual: JsonValue) => CheckpointVerdict;
}

export interface TestCase {
  id: string;
  labSlug: string;
  /** What business behaviour this proves, shown before any raw data. */
  name: string;
  /**
   * `self-check` compares output the learner pastes; `send-test` posts a
   * payload to their webhook. Labs 01, 02, 05 and 06 run on a Manual Trigger
   * and can only ever be self-check.
   */
  mode: "self-check" | "send-test";
  checkpoints: readonly Checkpoint[];
}

/** Reads a string field, treating a missing or non-string value as absent. */
export function readString(value: JsonValue, key: string): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const field = (value as Record<string, JsonValue>)[key];
  return typeof field === "string" ? field : null;
}

/**
 * A checkpoint asserting one field equals one value.
 *
 * `describe` renders what was actually found, including the difference between
 * "absent" and "present but wrong" — which for Lab 01 is exactly the
 * distinction between forgetting a field and mistyping an expression.
 */
export function expectField(
  id: string,
  label: string,
  key: string,
  expected: string,
): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      const found = readString(actual, key);
      if (found === expected) {
        return { state: "passed" };
      }
      return {
        state: "failed",
        expected: `${key}: ${JSON.stringify(expected)}`,
        actual: found === null ? `${key} is missing` : `${key}: ${JSON.stringify(found)}`,
      };
    },
  };
}

/**
 * A checkpoint asserting the output carries no leftover source fields.
 *
 * This is the one that catches "Include Other Input Fields" being left on —
 * a mistake that produces a result which looks correct until something
 * downstream reads the wrong email.
 */
export function expectNoFields(
  id: string,
  label: string,
  forbidden: readonly string[],
): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
        return { state: "failed", expected: "a JSON object", actual: "something else" };
      }
      const present = forbidden.filter((key) => key in (actual as Record<string, JsonValue>));
      if (present.length === 0) {
        return { state: "passed" };
      }
      return {
        state: "failed",
        expected: "only the fields the CRM asked for",
        actual: `still carrying ${present.join(", ")}`,
      };
    },
  };
}
