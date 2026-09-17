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
  | "not_signed_in"
  | "locked";

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
  too_large: "That output is larger than AEP accepts. Remove the big lists the lesson says you can leave out, keep the fields this check names, and paste again.",
  unknown_case: "This check is not available.",
  not_signed_in: "Your session has expired. Sign in again to record your progress.",
  locked: "This lab is still locked. Finish the lab before it, and its tests open.",
};

export function buildTestError(code: TestErrorCode): TestState {
  return { status: "error", code, message: TEST_ERROR_MESSAGE[code] };
}

/* ------------------------------------------------------------------ Send Test */

export type SendTestErrorCode =
  | "not_signed_in"
  | "not_configured"
  | "invalid_url"
  | "blocked_address"
  | "throttled"
  | "unreachable"
  | "timeout"
  | "redirected"
  | "webhook_not_active"
  | "workflow_error"
  | "bad_response"
  | "unknown_case"
  | "locked";

/**
 * What the learner may inspect behind "Show technical details". Never the
 * saved URL: the learner already knows it, and not echoing it keeps it out of
 * anything a screenshot or a shared screen might capture.
 */
export interface SendTechnicalDetails {
  status: number | null;
  durationMs: number;
  response: string;
  truncated: boolean;
  deliveries: number;
}

export type SendTestState =
  | { status: "idle" }
  | { status: "complete"; result: TestResult; technical: SendTechnicalDetails }
  | {
      status: "error";
      code: SendTestErrorCode;
      message: string;
      technical: SendTechnicalDetails | null;
    };

export const IDLE_SEND_TEST_STATE: SendTestState = { status: "idle" };

/**
 * Each failure carries the hint that actually fixes it (the directive's "small
 * diagnostic hint when failure is obvious"). The three a learner is most
 * likely to hit are n8n running on their own machine, an inactive workflow,
 * and the Test URL - which only listens for one request after Execute.
 */
const SEND_TEST_MESSAGE: Record<SendTestErrorCode, string> = {
  not_signed_in: "Your session has expired. Sign in again to run tests.",
  not_configured: "Save this lab's webhook URL first.",
  invalid_url: "Your saved webhook URL is no longer accepted. Save it again.",
  blocked_address:
    "That address points at a private or local network, which AEP will not call. Use a public URL such as n8n Cloud or a tunnel.",
  throttled: "Give it a couple of seconds between tests.",
  unreachable:
    "AEP could not reach your webhook. If n8n runs on your own machine, AEP cannot reach it - use n8n Cloud or a tunnel such as ngrok, or paste the response below instead.",
  timeout:
    "Your workflow did not answer within 15 seconds. Check that it ends in a Respond to Webhook node.",
  redirected:
    "Your webhook answered with a redirect, which AEP does not follow. Use the exact webhook URL n8n shows.",
  webhook_not_active:
    "n8n says this webhook is not registered. Publish the workflow (older n8n: switch it to Active) and use its Production URL - the Test URL only listens for one request after you click Execute.",
  workflow_error:
    "Your workflow was reached but failed. Open the latest execution in n8n to see which node errored.",
  bad_response:
    "Your workflow answered, but not with JSON. An empty answer usually means a node failed before Respond to Webhook ran - open the latest execution in n8n to see which one.",
  unknown_case: "This test is not available.",
  locked: "This lab is still locked. Finish the lab before it, and its tests open.",
};

export function buildSendTestError(
  code: SendTestErrorCode,
  technical: SendTechnicalDetails | null = null,
): SendTestState {
  return { status: "error", code, message: SEND_TEST_MESSAGE[code], technical };
}

/* ----------------------------------------------------------- Webhook saving */

export type WebhookSaveState =
  | { status: "idle" }
  | { status: "saved"; host: string }
  | { status: "error"; message: string };

export const IDLE_WEBHOOK_SAVE_STATE: WebhookSaveState = { status: "idle" };

/** Why a URL was refused, phrased as what to do instead. */
export const WEBHOOK_URL_MESSAGE: Record<string, string> = {
  empty: "Paste your webhook URL.",
  too_long: "That URL is too long.",
  malformed: "That does not look like a URL.",
  not_https: "Use an https URL. n8n Cloud and tunnels such as ngrok both provide one.",
  credentials: "Remove the username and password from the URL.",
  port: "Use a URL on the standard https port. AEP cannot reach n8n on port 5678 on your own machine.",
  ip_literal: "Use a hostname rather than an IP address.",
  not_public_hostname:
    "AEP can only reach a public address. localhost and local network names are not reachable from AEP.",
  not_applicable: "This lab does not use a webhook.",
  locked: "This lab is still locked. Finish the lab before it, and its tests open.",
  not_signed_in: "Your session has expired. Sign in again.",
  store_unavailable:
    "AEP cannot save your webhook right now. You can still paste your workflow's response to check it.",
};
