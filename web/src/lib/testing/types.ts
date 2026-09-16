/**
 * Wire types for the AEP test experience.
 *
 * Pure and client-safe: this is what crosses back from a server action into
 * the browser. Note what is deliberately absent — no expected value, no
 * checkpoint predicate, no case definition. Those live in a `server-only`
 * registry, because a learner who can read the expected output in devtools has
 * been handed the answer to the thing being tested.
 *
 * Only the *result* of an evaluation travels, and only after the learner has
 * submitted something.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type CheckpointState = "passed" | "failed" | "skipped";

/**
 * One meaningful stage of the learner's result (Vision §23):
 * "Webhook received ✓ / Validation passed ✓ / Routing mismatch ✕".
 *
 * `expected` and `actual` are only ever populated for a checkpoint that
 * actually failed — revealing the expected value is the feedback the learner
 * has earned at that point, and withholding it for passing checkpoints keeps
 * the rest of the answer unspoiled.
 */
export interface CheckpointResult {
  id: string;
  label: string;
  state: CheckpointState;
  expected?: string;
  actual?: string;
}

export interface TestResult {
  caseName: string;
  passed: boolean;
  checkpoints: readonly CheckpointResult[];
  /** The first checkpoint that failed, which is where the learner should look. */
  firstFailure: CheckpointResult | null;
}

export type TestErrorCode =
  | "empty"
  | "invalid_json"
  | "too_large"
  | "unknown_case"
  | "not_signed_in";

export type TestState =
  | { status: "idle" }
  | { status: "complete"; result: TestResult }
  | { status: "error"; code: TestErrorCode; message: string };

export const IDLE_TEST_STATE: TestState = { status: "idle" };

/**
 * Generous enough for any lab payload, small enough that a paste accident
 * cannot make the server do real work. Lab 01's expected output is ~150 bytes.
 */
export const MAX_SUBMITTED_OUTPUT_BYTES = 16_384;

const TEST_ERROR_MESSAGE: Record<TestErrorCode, string> = {
  empty: "Paste the output from your workflow first.",
  invalid_json:
    "That is not valid JSON. Copy the whole output, including the outer braces.",
  too_large: "That output is larger than this check expects. Paste one item, not the whole run.",
  unknown_case: "This check is not available.",
  not_signed_in: "Your session has expired. Sign in again to record your progress.",
};

export function buildTestError(code: TestErrorCode): TestState {
  return { status: "error", code, message: TEST_ERROR_MESSAGE[code] };
}
