import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { getLessonChunks } from "@/lib/lesson/registry";
import { CHALLENGE_HINTS, getChallengeHints } from "./hints";

describe("challenge hints", () => {
  /*
   * A challenge chunk tells the learner how many hints exist. If that number
   * drifts from what is actually registered, the lesson either promises help
   * that never arrives or hides help that does.
   */
  it("registers exactly as many hints as each challenge chunk promises", () => {
    for (const lab of LABS) {
      for (const chunk of getLessonChunks(lab.slug) ?? []) {
        if (chunk.kind !== "challenge") continue;
        expect(getChallengeHints(lab.slug)).toHaveLength(chunk.hintCount);
      }
    }
  });

  it("never registers an empty hint", () => {
    for (const hints of Object.values(CHALLENGE_HINTS)) {
      for (const hint of hints) {
        expect(hint.trim()).not.toBe("");
      }
    }
  });

  it("only registers hints for labs that exist", () => {
    const slugs = new Set(LABS.map((lab) => lab.slug));
    for (const slug of Object.keys(CHALLENGE_HINTS)) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("returns nothing for a lab with no hints", () => {
    expect(getChallengeHints("not-a-lab")).toEqual([]);
  });
});
