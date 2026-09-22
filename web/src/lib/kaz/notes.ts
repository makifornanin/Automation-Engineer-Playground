import { LABS, type Lab } from "@/lib/course/catalog";
import type { LessonChunkKind } from "@/lib/lesson/types";

/**
 * Kaz V1: the "when" half of her design, built deterministically.
 *
 * Kaz §12 splits her cleanly: the website controls WHEN she appears, and the AI
 * controls HOW she words it. This module is the first half, complete, with
 * authored wording standing in for the second. When a model-backed teacher
 * arrives it replaces the wording and nothing that decides timing.
 *
 * Pure and client-safe. No I/O, no clock, no randomness — so every rule below
 * is testable, and Kaz can never say something because of a coin flip.
 */

export type KazState = "neutral" | "thinking" | "amused" | "uh-oh" | "celebrating" | "focused";

export interface KazNote {
  text: string;
  state: KazState;
}

/**
 * Which lesson moments Kaz speaks at.
 *
 * Kaz §6 names entering Break It, entering Debug It and completing a Challenge
 * as good moments — but in the teaching arc those three are ADJACENT, and Kaz
 * §7 says she should not appear in consecutive learning chunks. So she speaks
 * at Break It, a good moment for her playful side; stays quiet through Debug,
 * which needs focus; and is present at the Challenge through hints the learner
 * asks for. Guided Build is silent by design (Kaz §6: "stay quiet unless the
 * learner asks").
 *
 * These notes cannot see test evidence, and Next works on a test chunk without
 * a pass, so no note may claim a result. Kaz must not invent test outcomes.
 */
const SPEAKS_AT: Partial<Record<LessonChunkKind, KazNote>> = {
  "break-it": {
    text: "Okay, this is the fun part — break it on purpose.",
    state: "amused",
  },
};

/**
 * Kaz §7's cooldown, as a rule rather than an authoring habit: she never
 * speaks on two consecutive chunks. Passing the previous chunk's kind lets the
 * rule hold even if a future lab places two speaking kinds side by side.
 */
export function chunkNote(
  kind: LessonChunkKind,
  previousKind: LessonChunkKind | null,
): KazNote | null {
  const note = SPEAKS_AT[kind];
  if (!note) return null;
  if (previousKind && SPEAKS_AT[previousKind]) return null;
  return note;
}

/**
 * The short contextual note on Home (Vision §10).
 *
 * Motivation references real progress rather than generic praise (Kaz §4:
 * avoid "You can do it!"). The first-visit line is the owner's own approved
 * copy, carried over unchanged.
 */
export function homeNote(completedLabSlugs: readonly string[], currentLab: Lab): KazNote {
  const completed = LABS.filter((lab) => completedLabSlugs.includes(lab.slug));

  if (completed.length === 0) {
    return {
      text: "Ten labs, then the Capstone. I will be here the whole way through — start with Lab 01 whenever you are ready.",
      state: "neutral",
    };
  }

  if (completed.length === LABS.length) {
    return {
      text: "All ten labs done. Now put the pieces together in the Capstone.",
      state: "celebrating",
    };
  }

  const latest = completed[completed.length - 1];
  const remaining = LABS.length - completed.length;

  return {
    text: "Lab " + latest.number + " done. Next up: " + currentLab.title + ". " + String(remaining) + (remaining === 1 ? " lab to go." : " labs to go."),
    state: "neutral",
  };
}
