import { LAB_01_CHUNKS } from "./content/lab-01";
import { LAB_02_CHUNKS } from "./content/lab-02";
import { LAB_03_CHUNKS } from "./content/lab-03";
import { LAB_04_CHUNKS } from "./content/lab-04";
import { LAB_05_CHUNKS } from "./content/lab-05";
import { LAB_06_CHUNKS } from "./content/lab-06";
import { LAB_07_CHUNKS } from "./content/lab-07";
import { LAB_08_CHUNKS } from "./content/lab-08";
import { LAB_09_CHUNKS } from "./content/lab-09";
import { LAB_10_CHUNKS } from "./content/lab-10";
import type { LessonChunk } from "./types";

/**
 * Lesson chunks by lab slug. A lab with no entry returns null and its page
 * keeps the honest placeholder rather than pretending a lesson exists.
 */
const LESSONS: Readonly<Record<string, readonly LessonChunk[]>> = {
  "01-data-mapping-transformation": LAB_01_CHUNKS,
  "02-conditions-routing": LAB_02_CHUNKS,
  "03-apis-webhooks": LAB_03_CHUNKS,
  "04-validation-normalization": LAB_04_CHUNKS,
  "05-pagination-large-data": LAB_05_CHUNKS,
  "06-retry-exponential-backoff": LAB_06_CHUNKS,
  "07-idempotency-duplicate-protection": LAB_07_CHUNKS,
  "08-dead-letter-queue-failure-recovery": LAB_08_CHUNKS,
  "09-structured-ai-output": LAB_09_CHUNKS,
  "10-ai-guardrails-human-in-the-loop": LAB_10_CHUNKS,
};

export function getLessonChunks(slug: string): readonly LessonChunk[] | null {
  return LESSONS[slug] ?? null;
}
