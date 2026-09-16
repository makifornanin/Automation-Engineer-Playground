import "server-only";

import type { JsonValue } from "../types";

/**
 * Test-case definitions. server-only because these carry the expected values:
 * the whole point of a self-check is that the learner produces the answer, so
 * shipping it to the browser would defeat the exercise.
 */

export type CheckpointVerdict =
  | { state: "passed" }
  | { state: "failed"; expected: string; actual: string };

export interface Checkpoint {
  id: string;
  /** Learner-facing and business-shaped: "Email cleaned", not "assert eq". */
  label: string;
  /** Pure. No I/O, no network, no clock - a checkpoint must be replayable. */
  evaluate: (actual: JsonValue) => CheckpointVerdict;
}

export interface TestCase {
  id: string;
  labSlug: string;
  /** What business behaviour this proves, shown before any raw data. */
  name: string;
  /**
   * self-check compares output the learner pastes; send-test posts a payload
   * to their webhook. Labs 01, 02, 05 and 06 run on a Manual Trigger and can
   * only ever be self-check.
   */
  mode: "self-check" | "send-test";
  /**
   * Whether the checkpoints expect one object or the whole list of items.
   *
   * "items" exists because several labs prove themselves by HOW MANY records
   * reached a branch, not by one record's fields. Lab 02 is the clearest case:
   * with correct AND logic exactly one lead reaches Priority Sales, and with
   * the OR bug the lab teaches, a second one does. Collapsing that to the first
   * item would throw away the evidence.
   */
  shape?: "item" | "items";
  checkpoints: readonly Checkpoint[];
}

function asObject(value: JsonValue): Record<string, JsonValue> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, JsonValue>;
}

/** Reads a field as a displayable scalar, treating absent as null. */
function readScalar(value: JsonValue, key: string): string | null {
  const object = asObject(value);
  if (!object) return null;
  const field = object[key];
  if (field === undefined || field === null) return null;
  if (typeof field === "object") return null;
  return String(field);
}

function asArray(value: JsonValue): readonly JsonValue[] | null {
  return Array.isArray(value) ? value : null;
}

/**
 * A checkpoint asserting one field equals one value.
 *
 * The failure text separates "absent" from "present but wrong", which for a
 * mapping lab is exactly the difference between forgetting a field and
 * mistyping the expression that fills it.
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
      const found = readScalar(actual, key);
      if (found === expected) return { state: "passed" };
      return {
        state: "failed",
        expected: key + ": " + JSON.stringify(expected),
        actual: found === null ? key + " is missing" : key + ": " + JSON.stringify(found),
      };
    },
  };
}

/**
 * A checkpoint asserting the output carries no leftover source fields.
 *
 * Catches "Include Other Input Fields" being left on - a mistake that produces
 * a result which looks correct until something downstream reads the wrong one.
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
      const object = asObject(actual);
      if (!object) {
        return { state: "failed", expected: "a JSON object", actual: "something else" };
      }
      const present = forbidden.filter((key) => key in object);
      if (present.length === 0) return { state: "passed" };
      return {
        state: "failed",
        expected: "only the fields the destination asked for",
        actual: "still carrying " + present.join(", "),
      };
    },
  };
}

/**
 * A checkpoint asserting how many items reached this branch.
 *
 * Often the strongest evidence a lab can offer: the count is what separates
 * correct routing from routing that merely ran.
 */
export function expectCount(id: string, label: string, expected: number): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      const items = asArray(actual);
      if (!items) {
        return { state: "failed", expected: "a list of items", actual: "not a list" };
      }
      if (items.length === expected) return { state: "passed" };
      return {
        state: "failed",
        expected: String(expected) + " item(s)",
        actual: String(items.length) + " item(s)",
      };
    },
  };
}

/** A checkpoint asserting one field of the item at a given position. */
export function expectFieldAt(
  id: string,
  label: string,
  index: number,
  key: string,
  expected: string,
): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      const items = asArray(actual);
      if (!items || items.length <= index) {
        return {
          state: "failed",
          expected: "at least " + String(index + 1) + " item(s)",
          actual: items ? String(items.length) + " item(s)" : "not a list",
        };
      }
      const found = readScalar(items[index], key);
      if (found === expected) return { state: "passed" };
      return {
        state: "failed",
        expected: key + ": " + JSON.stringify(expected),
        actual: found === null ? key + " is missing" : key + ": " + JSON.stringify(found),
      };
    },
  };
}

/**
 * A checkpoint asserting which values reached this branch, regardless of order.
 *
 * Order is an implementation detail of how the learner wired their nodes;
 * membership is the business outcome. Comparing sets rather than sequences
 * keeps the test about the lesson.
 */
export function expectFieldSet(
  id: string,
  label: string,
  key: string,
  expected: readonly string[],
): Checkpoint {
  const wanted = [...expected].sort().join(", ");
  return {
    id,
    label,
    evaluate: (actual) => {
      const items = asArray(actual);
      if (!items) {
        return { state: "failed", expected: wanted, actual: "not a list" };
      }
      const found = items
        .map((item) => readScalar(item, key))
        .filter((value): value is string => value !== null)
        .sort()
        .join(", ");
      if (found === wanted) return { state: "passed" };
      return { state: "failed", expected: wanted, actual: found.length > 0 ? found : "nothing" };
    },
  };
}
