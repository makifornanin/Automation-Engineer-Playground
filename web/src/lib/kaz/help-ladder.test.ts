import { describe, expect, it } from "vitest";
import {
  asksForTheAnswer,
  canonicalAllowance,
  levelAfterProgress,
  nextHelpLevel,
  soundsStillStuck,
} from "./help-ladder";

describe("asking outright", () => {
  it.each([
    "just show me the fix",
    "give me the answer",
    "what's the answer",
    "sagot na please",
    "pakita mo yung code",
    "tell me the exact fix",
  ])("treats %j as an explicit ask", (message) => {
    expect(asksForTheAnswer(message)).toBe(true);
  });

  it.each(["why is this failing?", "what does the IF node do?", "ano ibig sabihin ng idempotency"])(
    "does not treat %j as an explicit ask",
    (message) => {
      expect(asksForTheAnswer(message)).toBe(false);
    },
  );
});

describe("still stuck", () => {
  it.each(["still not working", "same error", "wala pa rin", "ayaw pa rin gumana", "I'm stuck"])(
    "recognises %j",
    (message) => {
      expect(soundsStillStuck(message)).toBe(true);
    },
  );
});

describe("nextHelpLevel", () => {
  it("holds where it is for a new question", () => {
    expect(nextHelpLevel(2, "what does the Set node do?")).toBe(2);
  });

  it("climbs one rung when the learner is still stuck", () => {
    expect(nextHelpLevel(1, "still not working")).toBe(2);
    expect(nextHelpLevel(2, "same error")).toBe(3);
    expect(nextHelpLevel(3, "wala pa rin")).toBe(4);
  });

  it("never climbs past the top", () => {
    expect(nextHelpLevel(4, "still not working")).toBe(4);
  });

  /* A learner who asks outright gets the answer; hiding it would be a puzzle. */
  it("jumps straight to the fix when asked outright", () => {
    expect(nextHelpLevel(1, "just show me the fix")).toBe(4);
  });
});

describe("levelAfterProgress", () => {
  it("drops back to a nudge once the learner proves something new", () => {
    expect(levelAfterProgress(4, 3, 4)).toBe(1);
  });

  it("holds the level while nothing has been proved", () => {
    expect(levelAfterProgress(3, 3, 3)).toBe(3);
  });
});

describe("canonicalAllowance", () => {
  /*
   * This is the ladder's real enforcement: at a nudge or a hint the canonical
   * workflow is not withheld by instruction, it is never sent at all.
   */
  it("sends no canonical material at levels 1 and 2", () => {
    for (const level of [1, 2] as const) {
      expect(canonicalAllowance(level)).toEqual({ structure: false, configuration: false });
    }
  });

  it("sends structure at level 3 and configuration only at level 4", () => {
    expect(canonicalAllowance(3)).toEqual({ structure: true, configuration: false });
    expect(canonicalAllowance(4)).toEqual({ structure: true, configuration: true });
  });
});
