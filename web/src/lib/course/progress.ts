import { LABS, type Lab } from "./catalog";
import type { LessonChunk, LessonChunkKind } from "@/lib/lesson/types";

/**
 * Pure course-state derivation. Deliberately NOT `server-only`: this module
 * also exports the predicates and view-model types that `LabGroupSection` (a
 * client-reachable component) imports, and the derivation must stay unit
 * testable without mocking Supabase.
 *
 * The privileged half — reading a learner's rows under RLS — lives in
 * `progress-store.ts`, which carries `import "server-only"`. That split is the
 * boundary; this file deliberately touches no I/O.
 */

export type LabStatus = "completed" | "in-progress" | "not-started" | "locked";

/** Evidence strong enough to count as a Vision §3 milestone. */
export type MilestoneEvidence = "acknowledged" | "predicted" | "verified";

export interface LabProgress {
  currentChunkId: string | null;
  completedAt: string | null;
  /** chunk id -> the evidence that chunk has earned. */
  evidence: Readonly<Record<string, MilestoneEvidence>>;
  /** challenge chunk id -> how many Kaz hints the learner has already seen. */
  hintsUsed?: Readonly<Record<string, number>>;
}

export interface CourseProgress {
  completedLabSlugs: readonly string[];
  inProgressLabSlug: string | null;
  labs: Readonly<Record<string, LabProgress>>;
}

export interface LabWithStatus {
  lab: Lab;
  status: LabStatus;
}

export interface CourseState {
  /** The lab Continue Learning should point at. */
  currentLab: LabWithStatus;
  labs: readonly LabWithStatus[];
  capstone: { status: LabStatus };
}

export const EMPTY_LAB_PROGRESS: LabProgress = {
  currentChunkId: null,
  completedAt: null,
  evidence: {},
};

/**
 * Which chunk kinds produce evidence, and what kind.
 *
 * Reading is not evidence. `problem`, `concept` and `recap` are absent on
 * purpose — counting them would be the "scrolling equals progress" model
 * Vision §3 explicitly rejects.
 */
export const EVIDENCING_KINDS = {
  "guided-build": "acknowledged",
  "break-it": "acknowledged",
  debug: "acknowledged",
  predict: "predicted",
  test: "verified",
  challenge: "verified",
} as const satisfies Partial<Record<LessonChunkKind, MilestoneEvidence>>;

/**
 * Chunk kinds that constitute hands-on work, gated by
 * {@link isHandsOnAvailable} and nothing else. A lab whose hands-on work is
 * not open is served its reading chunks only; these never reach the browser.
 */
export const HANDS_ON_KINDS: readonly LessonChunkKind[] = [
  "guided-build",
  "test",
  "break-it",
  "debug",
  "challenge",
];

export function isEvidencingKind(
  kind: LessonChunkKind,
): kind is keyof typeof EVIDENCING_KINDS {
  return kind in EVIDENCING_KINDS;
}

/**
 * The milestones a lab demands, derived from its own content. Adding a test
 * chunk to a lab therefore raises that lab's completion bar automatically,
 * rather than requiring someone to remember to update a list somewhere else.
 */
export function requiredMilestones(
  chunks: readonly LessonChunk[],
): readonly { chunkId: string; evidence: MilestoneEvidence }[] {
  return chunks
    .filter((chunk) => isEvidencingKind(chunk.kind))
    .map((chunk) => ({
      chunkId: chunk.id,
      evidence: EVIDENCING_KINDS[chunk.kind as keyof typeof EVIDENCING_KINDS],
    }));
}

/**
 * The milestones still open, in lesson order. This is what the recap names
 * when a lab is not yet complete, so a learner never has to page back through
 * every step to find the one they skipped.
 */
export function openMilestones(
  chunks: readonly LessonChunk[],
  earned: Readonly<Record<string, MilestoneEvidence>>,
): readonly { chunkId: string; evidence: MilestoneEvidence }[] {
  return requiredMilestones(chunks).filter(({ chunkId, evidence }) => earned[chunkId] !== evidence);
}

/**
 * A lab is complete when every milestone it asks for has been earned.
 *
 * A lab with no evidencing chunks — all prose — can never be completed, and
 * that returns `false` rather than `true`. Treating "nothing to prove" as
 * "proven" would let an unfinished lab silently unlock the next one.
 */
export function isLabComplete(
  chunks: readonly LessonChunk[],
  earned: Readonly<Record<string, MilestoneEvidence>>,
): boolean {
  const required = requiredMilestones(chunks);
  if (required.length === 0) {
    return false;
  }
  return required.every(({ chunkId, evidence }) => earned[chunkId] === evidence);
}

/**
 * How far through a lab's milestones the learner is, 0–100 (Vision §16 asks
 * the featured card for a completion percentage).
 *
 * Returns `null` when the lab has no milestones to measure, so a caller shows
 * position instead of a meaningless "0%".
 */
export function labCompletionPercent(
  chunks: readonly LessonChunk[],
  earned: Readonly<Record<string, MilestoneEvidence>>,
): number | null {
  const required = requiredMilestones(chunks);
  if (required.length === 0) {
    return null;
  }
  const done = required.filter(({ chunkId, evidence }) => earned[chunkId] === evidence).length;
  return Math.round((done / required.length) * 100);
}

function statusForLab(lab: Lab, index: number, progress: CourseProgress): LabStatus {
  if (progress.completedLabSlugs.includes(lab.slug)) {
    return "completed";
  }
  if (progress.inProgressLabSlug === lab.slug) {
    return "in-progress";
  }
  // Lab 01 has no prerequisite, so it is never locked (Vision §3: "Lab 01 —
  // available" to a first-time learner).
  if (index === 0) {
    return "not-started";
  }
  const prerequisite = LABS[index - 1];
  return progress.completedLabSlugs.includes(prerequisite.slug) ? "not-started" : "locked";
}

/**
 * Pure mapping from the catalog + learner progress to the view model Home and
 * Labs render. The Capstone is deterministically locked until all ten labs are
 * completed (Vision §3).
 */
export function deriveCourseState(progress: CourseProgress): CourseState {
  const labs = LABS.map((lab, index) => ({ lab, status: statusForLab(lab, index, progress) }));

  // Once every lab is completed there is no "next" lab, so this falls back to
  // the last one. Accepted, not designed: pointing Continue at the Capstone
  // would mean building Capstone routing before anything can reach it.
  const currentLab =
    labs.find(({ status }) => status === "in-progress") ??
    labs.find(({ status }) => status !== "completed") ??
    labs[labs.length - 1];

  const allLabsCompleted = labs.every(({ status }) => status === "completed");

  return {
    currentLab,
    labs,
    capstone: { status: allLabsCompleted ? "not-started" : "locked" },
  };
}

/**
 * Whether a lab's hands-on content — Guided Build, Success Test, Break It,
 * Debug It, Challenge — is open, as opposed to preview-only.
 *
 * **Being the current lab does not make this true**, and that separation is
 * deliberate. A lab becomes `in-progress` because the learner opened it, not
 * because it happens to be the one they are pointed at. Hands-on work gates on
 * this predicate and nothing else; "the learner is pointed at this lab" is a
 * different question, answered by {@link isLessonReadable}. Do not merge the
 * two back together to save a line.
 */
export function isHandsOnAvailable(status: LabStatus): boolean {
  return status === "completed" || status === "in-progress";
}

/**
 * Whether the learner may open a lab's lesson *reading* at all.
 *
 * True when hands-on is available, or when this is simply the lab they are
 * currently pointed at — Vision §3 states Lab 01 is available to a first-time
 * learner, and before they open it that lab's status is still `not-started`.
 *
 * This exists so the union is a named concept with a stated meaning rather
 * than an inline `||` at a call site, where it previously read as though being
 * current unlocked the hands-on work. Reading is open; building is a separate
 * question.
 */
export function isLessonReadable(status: LabStatus, isCurrent: boolean): boolean {
  return isCurrent || isHandsOnAvailable(status);
}

/**
 * Serves a lab only the chunks its hands-on state permits.
 *
 * Filtering happens on the server, before serialisation: a locked chunk must
 * not reach the RSC payload at all. Lesson prose is not secret, but build
 * steps and challenge criteria are exactly the "do not let the learner skip
 * the sequence" material Vision §16 protects, and a locked-but-present chunk
 * is one devtools panel away from being read.
 */
export function visibleChunks(
  chunks: readonly LessonChunk[],
  status: LabStatus,
): readonly LessonChunk[] {
  if (isHandsOnAvailable(status)) {
    return chunks;
  }
  return chunks.filter((chunk) => !HANDS_ON_KINDS.includes(chunk.kind));
}
