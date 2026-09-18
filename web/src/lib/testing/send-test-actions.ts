"use server";

import { revalidatePath } from "next/cache";
import { hasHandsOnAccess, recordVerifiedEvidence } from "@/lib/course/progress-writes";
import { getLessonChunks } from "@/lib/lesson/registry";
import type { ChallengeChunk, TestChunk } from "@/lib/lesson/types";
import { getSession } from "@/lib/session/get-session";
import { getTestCase } from "./cases";
import { evaluateCheckpoints, normaliseSubmittedOutput } from "./evaluate";
import { deliverPayload, type Delivery } from "./send-test";
import { allowSend } from "./send-throttle";
import {
  buildSendTestError,
  WEBHOOK_URL_MESSAGE,
  type JsonValue,
  type SendTechnicalDetails,
  type SendTestState,
  type WebhookSaveState,
} from "./types";
import { validateLearnerWebhookUrl } from "./url-guard";
import { getLabWebhookUrl, storeLabWebhookUrl } from "./webhook-store";

/**
 * Send Test: Browser -> this server action -> the learner's own n8n webhook
 * -> evaluated here -> result back to the browser (Vision §24).
 *
 * The client names a lab and a chunk. It never supplies a URL, a payload, a
 * case or an evidence value:
 *
 * - the URL is read from the learner's own saved row, so this action cannot be
 *   used as a relay to an address typed into the request;
 * - the payload is the chunk's own, from server-side lesson content, so the
 *   learner cannot choose what AEP sends;
 * - the case is the chunk's own configured case, so an easier case cannot
 *   credit a harder chunk;
 * - evidence is derived from the chunk's kind on a genuine pass.
 */

const LAB_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9-]+$/;
const MAX_DELIVERIES = 3;

/**
 * A chunk Send Test may run: a send-test test, or a challenge that opted in.
 * Either way the payload and case come from the chunk's own content, so a
 * challenge is sent exactly the input the lesson shows and judged by its own
 * case, and its pass is evidence for the challenge, not the success test.
 */
function sendTestChunk(
  labSlug: string,
  chunkId: string,
): (TestChunk | (ChallengeChunk & { testCaseId: string })) | null {
  const chunk = getLessonChunks(labSlug)?.find((entry) => entry.id === chunkId);
  if (!chunk || (chunk.kind !== "test" && chunk.kind !== "challenge")) return null;
  if (chunk.mode !== "send-test" || chunk.payload === undefined) return null;
  if (!chunk.testCaseId) return null;
  return chunk as TestChunk | (ChallengeChunk & { testCaseId: string });
}

function labUsesWebhook(labSlug: string): boolean {
  return (getLessonChunks(labSlug) ?? []).some(
    (chunk) => chunk.kind === "test" && chunk.mode === "send-test",
  );
}

/**
 * Saves the webhook URL for one lab.
 *
 * Only the syntactic guard runs here. DNS is resolved at send time instead,
 * because an address that is public when saved can be pointed somewhere else
 * later — checking once on save would be checking the wrong moment.
 */
export async function saveLabWebhook(
  _prevState: WebhookSaveState,
  formData: FormData,
): Promise<WebhookSaveState> {
  const labSlug = formData.get("labSlug");
  const raw = formData.get("webhookUrl");
  if (typeof labSlug !== "string" || typeof raw !== "string") {
    return { status: "error", message: WEBHOOK_URL_MESSAGE.malformed };
  }

  // Vision §25: webhook configuration exists only in labs that need it.
  if (!LAB_SLUG_PATTERN.test(labSlug) || !labUsesWebhook(labSlug)) {
    return { status: "error", message: WEBHOOK_URL_MESSAGE.not_applicable };
  }

  if (!(await hasHandsOnAccess(labSlug))) {
    return { status: "error", message: WEBHOOK_URL_MESSAGE.locked };
  }

  const check = validateLearnerWebhookUrl(raw);
  if (!check.ok) {
    return { status: "error", message: WEBHOOK_URL_MESSAGE[check.reason] };
  }

  const stored = await storeLabWebhookUrl(labSlug, check.url.toString());
  if (stored !== "saved") {
    return { status: "error", message: WEBHOOK_URL_MESSAGE[stored] };
  }

  revalidatePath("/labs/" + labSlug);
  return { status: "saved", host: check.url.hostname };
}

function technicalFrom(delivery: Delivery | null, deliveries: number): SendTechnicalDetails {
  if (!delivery) {
    return { status: null, durationMs: 0, response: "", truncated: false, deliveries };
  }
  return delivery.ok
    ? {
        status: delivery.status,
        durationMs: delivery.durationMs,
        response: delivery.text,
        truncated: delivery.truncated,
        deliveries,
      }
    : { status: null, durationMs: delivery.durationMs, response: "", truncated: false, deliveries };
}

export async function sendTest(
  _prevState: SendTestState,
  formData: FormData,
): Promise<SendTestState> {
  const labSlug = formData.get("labSlug");
  const chunkId = formData.get("chunkId");
  if (typeof labSlug !== "string" || typeof chunkId !== "string") {
    return buildSendTestError("unknown_case");
  }

  const session = await getSession();
  if (session.status !== "authenticated") {
    return buildSendTestError("not_signed_in");
  }

  const chunk = sendTestChunk(labSlug, chunkId);
  const testCase = chunk ? getTestCase(chunk.testCaseId) : null;
  if (!chunk || !testCase || testCase.labSlug !== labSlug || testCase.mode !== "send-test") {
    return buildSendTestError("unknown_case");
  }

  // Checked before any URL is read or any request leaves AEP: a locked lab
  // sends nothing, rather than sending and then declining to record the pass.
  if (!(await hasHandsOnAccess(labSlug))) {
    return buildSendTestError("locked");
  }

  const saved = await getLabWebhookUrl(labSlug);
  if (!saved) {
    return buildSendTestError("not_configured");
  }

  // Re-checked at send time, not trusted from the save: a row written before a
  // guard change must not be sent to on the strength of the old rules.
  const check = validateLearnerWebhookUrl(saved);
  if (!check.ok) {
    return buildSendTestError("invalid_url");
  }

  if (!allowSend(session.user.id + ":" + labSlug, Date.now())) {
    return buildSendTestError("throttled");
  }

  // Some tests only prove anything on a repeat — Lab 07's second delivery of
  // the same event is the one that shows duplicate protection. The response to
  // the LAST delivery is the one evaluated.
  const requested = chunk.kind === "test" ? chunk.deliveries : undefined;
  const deliveries = Math.min(Math.max(requested ?? 1, 1), MAX_DELIVERIES);
  let last: Delivery | null = null;
  for (let attempt = 0; attempt < deliveries; attempt += 1) {
    last = await deliverPayload(check.url, chunk.payload as JsonValue);
    if (!last.ok) break;
  }

  const technical = technicalFrom(last, deliveries);

  if (!last || !last.ok) {
    const failure = last && !last.ok ? last.failure : "unreachable";
    return buildSendTestError(failure, technical);
  }

  // Log the outcome shape only — never the URL, never the response body.
  if (last.status === 404 && /not registered/i.test(last.text)) {
    return buildSendTestError("webhook_not_active", technical);
  }
  if (last.status >= 500) {
    return buildSendTestError("workflow_error", technical);
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(last.text) as JsonValue;
  } catch {
    return buildSendTestError("bad_response", technical);
  }

  const result = evaluateCheckpoints(
    testCase.name,
    testCase.checkpoints,
    normaliseSubmittedOutput(parsed, testCase.shape),
  );

  if (result.passed) {
    await recordVerifiedEvidence(labSlug, chunkId);
  }

  return { status: "complete", result, technical };
}
