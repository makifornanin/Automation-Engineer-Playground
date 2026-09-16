import { LAB_01_CHUNKS } from "./content/lab-01";
import { LAB_02_CHUNKS } from "./content/lab-02";
import type { LessonChunk } from "./types";

/**
 * Lesson chunks by lab slug. A lab with no entry returns null and its page
 * keeps the honest placeholder rather than pretending a lesson exists.
 */
const LESSONS: Readonly<Record<string, readonly LessonChunk[]>> = {
  "01-data-mapping-transformation": LAB_01_CHUNKS,
  "02-conditions-routing": LAB_02_CHUNKS,
};

export function getLessonChunks(slug: string): readonly LessonChunk[] | null {
  return LESSONS[slug] ?? null;
}
