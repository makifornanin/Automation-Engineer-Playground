import { LABS, type Lab } from "./catalog";

export type LabStatus = "completed" | "in-progress" | "not-started" | "locked";

export interface CourseProgress {
  completedLabSlugs: readonly string[];
  inProgressLabSlug: string | null;
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

function statusForLab(lab: Lab, progress: CourseProgress): LabStatus {
  if (progress.completedLabSlugs.includes(lab.slug)) {
    return "completed";
  }
  if (progress.inProgressLabSlug === lab.slug) {
    return "in-progress";
  }
  // Never "locked" here: with no persisted progress, everything after the
  // first lab is simply not-started. Painting nine lock markers would
  // contradict the "lightweight" journey indicator (Vision §10).
  return "not-started";
}

/**
 * Pure mapping from the catalog + learner progress to the exact view model
 * Home renders. The Capstone is deterministically locked until all ten labs
 * are completed (Vision §3); it has no other tracked state yet.
 */
export function deriveCourseState(progress: CourseProgress): CourseState {
  const labs = LABS.map((lab) => ({ lab, status: statusForLab(lab, progress) }));

  // Once every lab is completed there is no "next" lab, so this falls back to
  // the last one and Continue keeps pointing at /labs. Accepted, not designed:
  // the state is unreachable today because progress is never persisted, and
  // deciding that Continue should point at the Capstone instead would mean
  // building Capstone routing before anything can reach it. Revisit when
  // persistence lands — see the Aim Point 1 plan's open notes.
  const currentLab =
    labs.find(({ status }) => status !== "completed") ?? labs[labs.length - 1];

  const allLabsCompleted = labs.every(({ status }) => status === "completed");

  return {
    currentLab,
    labs,
    capstone: { status: allLabsCompleted ? "not-started" : "locked" },
  };
}

/**
 * Async stub — resolves empty progress today. Async now means the persisted
 * version (backed by Supabase learner state) is a body swap later, not a
 * call-site change.
 */
export async function getCourseProgress(): Promise<CourseProgress> {
  return { completedLabSlugs: [], inProgressLabSlug: null };
}

/**
 * Whether a lab's hands-on content — Guided Build, Success Test, Challenge —
 * is open, as opposed to preview-only.
 *
 * **Being the current lab does not make this true**, and that separation is
 * deliberate. When Step 3 lands, hands-on work gates on this predicate and
 * nothing else; "the learner is pointed at this lab" is a different question,
 * answered by {@link isLessonReadable}. Do not merge the two back together to
 * save a line.
 */
export function isHandsOnAvailable(status: LabStatus): boolean {
  return status === "completed" || status === "in-progress";
}

/**
 * Whether the learner may open a lab's lesson *reading* at all.
 *
 * True when hands-on is available, or when this is simply the lab they are
 * currently pointed at — Vision §3 states Lab 01 is available to a
 * first-time learner, and with no persisted progress that lab's status is
 * still `not-started`.
 *
 * This exists so the union is a named concept with a stated meaning rather
 * than an inline `||` at a call site, where it previously read as though
 * being current unlocked the hands-on work. Reading is open; building is a
 * separate question.
 */
export function isLessonReadable(status: LabStatus, isCurrent: boolean): boolean {
  return isCurrent || isHandsOnAvailable(status);
}
