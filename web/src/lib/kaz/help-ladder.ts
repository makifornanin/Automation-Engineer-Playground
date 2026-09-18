import type { HelpLevel } from "./types";

/**
 * The help ladder's policy, as pure functions (Kaz V2 design §6).
 *
 * Kaz climbs: nudge, hint, explain, then the exact fix. The level is not a
 * suggestion to the model — it decides how much canonical material is allowed
 * into the model's context at all, so a learner cannot talk their way up it and
 * the model cannot hand over an answer it was never given.
 */

/**
 * Asking outright is allowed. A learner who says "just show me the fix" gets
 * the fix: hiding it then would be a puzzle, not teaching.
 *
 * Taglish included, because that is how this learner actually asks.
 */
const EXPLICIT_ASK = [
  /\b(just|please)?\s*(show|give|tell)\s+(me\s+)?(the\s+)?(exact\s+)?(fix|answer|solution|code)\b/i,
  /\bexact fix\b/i,
  /\bwhat('?s| is) the answer\b/i,
  /\bsagot\b/i,
  /\bpakita\b/i,
  /\bibigay mo na\b/i,
  /\bspoil(er)?\b/i,
];

/** Still stuck after a previous answer: climb one rung. */
const STILL_STUCK = [
  /\bstill (not|isn'?t|doesn'?t|won'?t|failing|stuck|broken)\b/i,
  /\bnot working\b/i,
  /\bsame (error|problem|issue|result)\b/i,
  /\bwala pa rin\b/i,
  /\bayaw pa rin\b/i,
  /\bhindi pa rin\b/i,
  /\bi('?m| am) stuck\b/i,
  /\bstuck pa rin\b/i,
];

export function asksForTheAnswer(message: string): boolean {
  return EXPLICIT_ASK.some((pattern) => pattern.test(message));
}

export function soundsStillStuck(message: string): boolean {
  return STILL_STUCK.some((pattern) => pattern.test(message));
}

/**
 * The level this question should be answered at.
 *
 * An explicit ask goes straight to 4. Otherwise the level climbs one rung when
 * the learner says they are still stuck, and holds where it is when they are
 * simply asking something new — a second question is not evidence of being
 * more stuck than the first.
 */
export function nextHelpLevel(current: HelpLevel, message: string): HelpLevel {
  if (asksForTheAnswer(message)) return 4;
  if (soundsStillStuck(message)) return Math.min(current + 1, 4) as HelpLevel;
  return current;
}

/**
 * Back to a nudge once the learner proves the thing they were stuck on.
 *
 * Evidence count is the signal: it only ever rises as milestones are earned,
 * so a rise means they got past it. Without this, one "show me" would leave
 * Kaz handing out answers for the rest of the lab.
 */
export function levelAfterProgress(
  current: HelpLevel,
  evidenceCountWhenRaised: number,
  evidenceCountNow: number,
): HelpLevel {
  return evidenceCountNow > evidenceCountWhenRaised ? 1 : current;
}

/** What each level is allowed to put in front of the model. */
export interface CanonicalAllowance {
  /** Node names, types and order — the shape of the intended workflow. */
  structure: boolean;
  /** The actual node configuration: expressions, code, field values. */
  configuration: boolean;
}

export function canonicalAllowance(level: HelpLevel): CanonicalAllowance {
  return { structure: level >= 3, configuration: level >= 4 };
}
