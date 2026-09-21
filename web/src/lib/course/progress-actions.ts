"use server";

import { recordLearnerEvidence, recordPosition } from "./progress-writes";

/**
 * The progress writes a browser may trigger, and nothing more.
 *
 * Every export here is a Server Action the browser can call with any
 * arguments, so this file holds only the two writes a learner's own clicks
 * produce. The writers live in `progress-writes.ts`, behind `server-only`,
 * which is what keeps `verified` evidence out of reach: it is written only by
 * the self-check and Send Test actions after a passing evaluation.
 */

/** Records where the learner is in a lab. Fire-and-forget from Focus Mode. */
export async function setCurrentChunk(labSlug: string, chunkId: string): Promise<void> {
  await recordPosition(labSlug, chunkId);
}

/**
 * Records the evidence a build, break, debug or predict step earns. A test or
 * challenge chunk is refused: passing it is the only way to earn `verified`.
 */
export async function recordChunkEvidence(labSlug: string, chunkId: string): Promise<boolean> {
  return recordLearnerEvidence(labSlug, chunkId);
}
