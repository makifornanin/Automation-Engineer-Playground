"use server";

import { hasHandsOnAccess, recordVerifiedEvidence } from "@/lib/course/progress-writes";
import { getLessonChunks } from "@/lib/lesson/registry";
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
 * The client names a lab and a chunk, and nothing else. It does NOT name the
 * test case. The server resolves the chunk from the lesson content and uses
 * that chunk's own configured case, so the case that decides whether a chunk
 * earns `verified` evidence is fixed by the content, not by the request.
 *
 * That is deliberate, and it was a real defect before it was. When the case id
 * came from a hidden form field and was checked only against the lab, a
 * learner could edit that one field to point a Challenge at the same lab's
 * easier guided case, paste the easy answer, and collect the Challenge's
 * evidence. Removing the field removes the attack rather than validating it.
 *
 * Every expected value and predicate lives in the server-only case registry,
 * so the browser receives a verdict and nothing it could work backwards from.
 */
/**
 * Output copied from n8n's JSON view can carry non-breaking spaces as
 * indentation, and JSON.parse rejects them. They are never meaningful inside a
 * learner's pasted JSON structure, so they become plain spaces rather than a
 * confusing "that is not JSON" for output that looks exactly like JSON. A
 * zero-width character or byte-order mark is dropped for the same reason.
 */
function withPlainSpaces(output: string): string {
  return output.replace(/\u00a0/g, " ").replace(/[\u200b\ufeff]/g, "");
}

export async function runSelfCheck(
  _prevState: TestState,
  formData: FormData,
): Promise<TestState> {
  const labSlug = formData.get("labSlug");
  const chunkId = formData.get("chunkId");
  const submitted = formData.get("output");

  if (
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

  // The chunk decides the case. Only a test or challenge chunk that carries a
  // case can be checked, and that case must belong to the same lab.
  const chunk = getLessonChunks(labSlug)?.find((entry) => entry.id === chunkId);
  const caseId =
    chunk && (chunk.kind === "test" || chunk.kind === "challenge") ? chunk.testCaseId : undefined;
  const testCase = caseId ? getTestCase(caseId) : null;

  if (!testCase || testCase.labSlug !== labSlug) {
    return buildTestError("unknown_case");
  }

  // A locked lab's tests are hands-on content. Refusing to write evidence is
  // not enough: the check must not run, or a learner is told "Pass" for a lab
  // they cannot open.
  if (!(await hasHandsOnAccess(labSlug))) {
    return buildTestError("locked");
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(withPlainSpaces(output)) as JsonValue;
  } catch {
    return buildTestError("invalid_json");
  }

  const result = evaluateCheckpoints(
    testCase.name,
    testCase.checkpoints,
    normaliseSubmittedOutput(parsed, testCase.shape),
  );

  /*
   * Evidence is recorded only on a genuine pass, and the action derives the
   * evidence value from the chunk's kind rather than accepting one. A failed
   * check is not a failure of the learner's session — it returns the result
   * and records nothing.
   */
  const progressSaved = result.passed
    ? await recordVerifiedEvidence(labSlug, chunkId).catch(() => false)
    : undefined;

  return { status: "complete", progressSaved, result };
}
