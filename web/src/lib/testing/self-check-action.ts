"use server";

import { recordChunkEvidence } from "@/lib/course/progress-actions";
import { getTestCase } from "./cases";
import { evaluateCheckpoints, normaliseSubmittedOutput } from "./evaluate";
import {
  buildTestError,
  MAX_SUBMITTED_OUTPUT_BYTES,
  type JsonValue,
  type TestState,
} from "./types";

/**
 * Checks output the learner pasted from their own n8n run.
 *
 * This is how a lab that AEP cannot call gets a real expected-vs-actual test.
 * Labs 01, 02, 05 and 06 run on a Manual Trigger with no webhook, so there is
 * nothing to send a request to — but there is still a correct answer, and the
 * learner still has to produce it.
 *
 * Security shape, which is the same one the webhook-backed Send Test will use:
 * the client names a case, it never supplies expectations. Every expected
 * value and every predicate lives in the `server-only` case registry, so the
 * browser receives the verdict and nothing that would let a learner work
 * backwards to the answer.
 */
export async function runSelfCheck(
  _prevState: TestState,
  formData: FormData,
): Promise<TestState> {
  const caseId = formData.get("caseId");
  const labSlug = formData.get("labSlug");
  const chunkId = formData.get("chunkId");
  const submitted = formData.get("output");

  if (
    typeof caseId !== "string" ||
    typeof labSlug !== "string" ||
    typeof chunkId !== "string" ||
    typeof submitted !== "string"
  ) {
    return buildTestError("unknown_case");
  }

  const output = submitted.trim();
  if (output.length === 0) {
    return buildTestError("empty");
  }

  // Byte length, not character count: a paste of multibyte content should be
  // measured by what it actually costs to handle.
  if (Buffer.byteLength(output, "utf8") > MAX_SUBMITTED_OUTPUT_BYTES) {
    return buildTestError("too_large");
  }

  const testCase = getTestCase(caseId);
  // The case must belong to the lab that claims it. Without this, a learner
  // could point an easier lab's case at a harder lab's chunk and collect its
  // evidence.
  if (!testCase || testCase.labSlug !== labSlug) {
    return buildTestError("unknown_case");
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(output) as JsonValue;
  } catch {
    return buildTestError("invalid_json");
  }

  const result = evaluateCheckpoints(
    testCase.name,
    testCase.checkpoints,
    normaliseSubmittedOutput(parsed),
  );

  /*
   * Evidence is recorded only on a genuine pass, and the action derives the
   * evidence value from the chunk's kind rather than accepting one. A failed
   * check is not a failure of the learner's session — it returns the result
   * and records nothing.
   */
  if (result.passed) {
    await recordChunkEvidence(labSlug, chunkId);
  }

  return { status: "complete", result };
}
