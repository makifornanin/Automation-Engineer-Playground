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
  /** Pure. No I/O, no network, no clock — a checkpoint must be replayable. */
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

function asArray(value: JsonValue): readonly JsonValue[] | null {
  return Array.isArray(value) ? value : null;
}

/**
 * Walks a dotted path, so a checkpoint can reach into a nested response.
 *
 * Several labs wrap their result: Lab 04 returns the normalised lead under
 * `data`, and asking a learner to paste only the inner object instead would
 * mean asking them to edit their own evidence before submitting it.
 */
function readPath(value: JsonValue, path: string): JsonValue | undefined {
  let current: JsonValue | undefined = value;
  for (const segment of path.split(".")) {
    const object: Record<string, JsonValue> | null =
      current === undefined ? null : asObject(current);
    if (!object) return undefined;
    current = object[segment];
  }
  return current;
}

/** Reads a path as a displayable scalar, treating absent or nested as null. */
function readScalar(value: JsonValue, path: string): string | null {
  const found = readPath(value, path);
  if (found === undefined || found === null) return null;
  if (typeof found === "object") return null;
  return String(found);
}

/**
 * A checkpoint asserting one field equals one value. `key` may be a dotted
 * path such as "data.email".
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
 * A checkpoint asserting a field exists and carries something.
 *
 * For values that are real but unpredictable — a timestamp, a generated id.
 * Asserting the exact value would make the test a clock test.
 */
export function expectPresent(id: string, label: string, key: string): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      const found = readScalar(actual, key);
      if (found !== null && found.trim().length > 0) return { state: "passed" };
      return { state: "failed", expected: key + " to carry a value", actual: key + " is empty" };
    },
  };
}

/**
 * A checkpoint asserting a numeric field reaches at least some floor.
 *
 * Used where the exact number belongs to a system AEP does not control — Lab
 * 05 paginates a public API whose record count can change. Pinning 208 would
 * make a correct workflow fail the day the dataset moves, while "more than one
 * page was fetched" is the thing the lab actually teaches and stays true.
 */
export function expectAtLeast(
  id: string,
  label: string,
  key: string,
  minimum: number,
): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      const found = readScalar(actual, key);
      const value = found === null ? Number.NaN : Number(found);
      if (Number.isFinite(value) && value >= minimum) return { state: "passed" };
      return {
        state: "failed",
        expected: key + " of at least " + String(minimum),
        actual: found === null ? key + " is missing" : key + ": " + JSON.stringify(found),
      };
    },
  };
}

/**
 * A checkpoint asserting the output carries no leftover source fields.
 *
 * Catches "Include Other Input Fields" being left on — a mistake that produces
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

/**
 * A checkpoint asserting a numeric field falls inside a range, inclusive.
 *
 * For evidence that has to tell two correct-looking runs apart without pinning
 * a number AEP does not own. Lab 05's challenge re-paginates the same public
 * dataset with a bigger page size: the request count must drop well below the
 * page-size-5 run, but the exact figure depends on how many records the API
 * holds that day.
 */
export function expectBetween(
  id: string,
  label: string,
  key: string,
  minimum: number,
  maximum: number,
): Checkpoint {
  return {
    id,
    label,
    evaluate: (actual) => {
      const found = readScalar(actual, key);
      const value = found === null ? Number.NaN : Number(found);
      if (Number.isFinite(value) && value >= minimum && value <= maximum) {
        return { state: "passed" };
      }
      return {
        state: "failed",
        expected: key + " between " + String(minimum) + " and " + String(maximum),
        actual: found === null ? key + " is missing" : key + ": " + JSON.stringify(found),
      };
    },
  };
}
