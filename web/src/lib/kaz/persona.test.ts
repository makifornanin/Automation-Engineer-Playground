import { describe, expect, it } from "vitest";
import { helpLevelInstruction, KAZ_PERSONA, KAZ_RULES } from "./persona";

/**
 * Deterministic checks on the instructions AEP sends, not on what Gemini
 * writes back. Wording from a model is not something to assert on; the policy
 * we hand it is.
 */

describe("Kaz's personality", () => {
  it("describes a mentor-companion rather than a formal instructor", () => {
    expect(KAZ_PERSONA).toMatch(/mentor-companion, not a formal instructor/i);
  });

  /*
   * The rules this replaced — never greet, never introduce yourself, short
   * plain paragraphs, always end on a technical instruction — each read fine
   * alone and together made a debugging bot.
   */
  it("lets Kaz greet when it fits, without greeting every message", () => {
    expect(KAZ_PERSONA).toMatch(/Greet naturally when it fits/i);
    expect(KAZ_PERSONA).toMatch(/Do not greet every message/i);
    expect(KAZ_PERSONA).not.toMatch(/never greet/i);
    expect(KAZ_PERSONA).not.toMatch(/Never introduce yourself/i);
  });

  it("allows a conversational shape instead of a fixed diagnostic one", () => {
    expect(KAZ_PERSONA).toMatch(/Two to four short conversational paragraphs/i);
    expect(KAZ_PERSONA).toMatch(/Do not force every answer into issue, diagnosis, next step/i);
  });

  it("keeps humour subordinate to accuracy", () => {
    expect(KAZ_PERSONA).toMatch(/never replaces accuracy/i);
  });

  it("tells Kaz to read the room, including wins and frustration", () => {
    expect(KAZ_PERSONA).toMatch(/Frustrated or down on themselves/i);
    expect(KAZ_PERSONA).toMatch(/never agree that they are stupid/i);
    expect(KAZ_PERSONA).toMatch(/A win: react like you mean it/i);
    // Friend mode, not therapy or a motivational feed.
    expect(KAZ_PERSONA).toMatch(/never give a speech/i);
    expect(KAZ_PERSONA).toMatch(/not a therapist, not a motivational feed/i);
  });

  it("keeps the language rules, and rules out forced slang", () => {
    /*
     * Found in the live check: after a Taglish turn she kept answering in
     * Taglish even when the next question was English. The thread's language
     * is not the learner's current one.
     */
    expect(KAZ_PERSONA).toMatch(/Match the language of their LATEST/);
    expect(KAZ_PERSONA).toMatch(/an English question\s+after a Taglish one gets an English answer/i);
    expect(KAZ_PERSONA).toMatch(/natural Taglish/i);
    expect(KAZ_PERSONA).toMatch(/no forced slang/i);
  });
});

describe("Kaz's hard rules survive the personality patch", () => {
  it.each([
    ["evidence is authoritative", /AEP's own evidence is authoritative/i],
    ["never invents a run", /never invent a node, a run, an error or an output/i],
    ["admits when she cannot see", /say plainly that you cannot see it/i],
    ["stays read-only", /You are read-only/i],
    ["never hands over a challenge answer", /On a Challenge, never hand over the answer/i],
    ["still leaves the learner with a next step", /knowing what to look at next/i],
  ])("still states that Kaz %s", (_name, pattern) => {
    expect(KAZ_RULES).toMatch(pattern);
  });
});

describe("the help ladder's instructions", () => {
  it("forbids a fix at a nudge and a hint", () => {
    expect(helpLevelInstruction(1)).toMatch(/no fix/i);
    expect(helpLevelInstruction(2)).toMatch(/no finished\s+expression, no code, no exact value/i);
  });

  it("describes the fix without writing it at explain, and gives it at show me", () => {
    expect(helpLevelInstruction(3)).toMatch(/without writing it/i);
    expect(helpLevelInstruction(4)).toMatch(/Give the exact fix/i);
  });

  /*
   * Found live: on a Challenge the canonical workflow was already withheld, but
   * the SHOW ME instruction still asked for the exact fix, so Kaz rebuilt one
   * from the learner's own run. A challenge never gets that instruction.
   */
  it.each([1, 2, 3, 4] as const)("never asks for the fix on a challenge, at level %i", (level) => {
    const instruction = helpLevelInstruction(level, "challenge");

    expect(instruction).not.toMatch(/Give the exact fix/i);
    expect(instruction).toMatch(/do not give\s+the fix/i);
    expect(instruction).toMatch(/hint button/i);
  });

  it("leaves every other kind of step on the normal ladder", () => {
    expect(helpLevelInstruction(4, "debug")).toMatch(/Give the exact fix/i);
  });
});
