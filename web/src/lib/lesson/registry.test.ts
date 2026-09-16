import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { getLessonChunks } from "./registry";
import type { ContentBlock, LessonChunk } from "./types";

/**
 * Labs whose lessons have been authored.
 *
 * Deliberately an explicit list rather than something derived from the
 * registry, which would make every assertion below a tautology. Adding a lab
 * is one intentional line here, and until it is added that lab must return
 * null so its page keeps the honest placeholder.
 */
const AUTHORED = ["01-data-mapping-transformation", "02-conditions-routing"] as const;

/**
 * The arc every lab walks (CLAUDE.md's Learning Experience Rule).
 *
 * Consecutive chunks of the same kind collapse — a lab may need two or three
 * build steps — but the ORDER of distinct kinds has to hold. Understanding
 * before building, prediction before testing, debugging before the challenge
 * that depends on it.
 */
const TEACHING_ARC = [
  "problem",
  "concept",
  "guided-build",
  "predict",
  "test",
  "break-it",
  "debug",
  "challenge",
  "recap",
] as const;

/** Every block a chunk can reach, including the guided-build named slots. */
function allBlocks(chunk: LessonChunk): readonly ContentBlock[] {
  const extra: ContentBlock[] = [];
  if (chunk.kind === "guided-build") {
    extra.push(...chunk.whyThisMatters, ...chunk.whyWereDoingThis);
    if (chunk.visual) extra.push(chunk.visual);
  }
  if (chunk.kind === "predict") extra.push(...chunk.reveal);
  if (chunk.kind === "recap" && chunk.bridge) extra.push(...chunk.bridge);
  return [...chunk.content, ...extra];
}

/** Flattens every learner-visible string in a chunk, for the copy scans. */
function allText(chunk: LessonChunk): string {
  const parts: string[] = [chunk.title];

  for (const block of allBlocks(chunk)) {
    switch (block.type) {
      case "prose":
        parts.push(block.text);
        break;
      case "callout":
        parts.push(block.title ?? "", block.text);
        break;
      case "code":
        parts.push(block.caption ?? "");
        break;
      case "diagram":
        parts.push(block.alt);
        break;
      case "actions":
        for (const action of block.items) parts.push(action.text, action.expect ?? "");
        break;
    }
  }

  if (chunk.kind === "guided-build") {
    for (const action of chunk.actions) parts.push(action.text, action.expect ?? "");
  }
  if (chunk.kind === "predict") parts.push(chunk.prompt);
  if (chunk.kind === "test") parts.push(chunk.caseName);
  if (chunk.kind === "challenge") {
    parts.push(chunk.caseName ?? "", ...(chunk.verification ?? []));
  }

  for (const note of chunk.teaches ?? []) {
    parts.push(note.name);
    if (note.subject === "node") {
      parts.push(note.what, note.whyHere, note.businessReason, note.analogy ?? "");
    } else {
      parts.push(note.intent, note.inputs, note.logic, note.output, note.engineeringReason);
    }
  }

  return parts.join(" ");
}

function chunksFor(slug: string): readonly LessonChunk[] {
  const chunks = getLessonChunks(slug);
  if (!chunks) throw new Error("Expected authored lesson for " + slug);
  return chunks;
}

describe("getLessonChunks", () => {
  it("returns null for every lab that has no lesson yet", () => {
    const authored = new Set<string>(AUTHORED);
    for (const lab of LABS.filter((entry) => !authored.has(entry.slug))) {
      expect(getLessonChunks(lab.slug)).toBeNull();
    }
  });

  it("returns null for an unknown slug", () => {
    expect(getLessonChunks("not-a-lab")).toBeNull();
  });

  it("only claims labs that really exist", () => {
    const slugs = new Set(LABS.map((lab) => lab.slug));
    for (const slug of AUTHORED) {
      expect(slugs.has(slug)).toBe(true);
    }
  });
});

describe.each(AUTHORED)("lesson content for %s", (slug) => {
  it("walks the full teaching arc, in order", () => {
    const arc = chunksFor(slug)
      .map((chunk) => chunk.kind)
      .filter((kind, index, all) => kind !== all[index - 1]);

    expect(arc).toEqual([...TEACHING_ARC]);
  });

  it("gives every chunk a title, a stable id and something to render", () => {
    for (const chunk of chunksFor(slug)) {
      expect(chunk.title.trim()).not.toBe("");
      expect(chunk.id.trim()).not.toBe("");
      expect(allBlocks(chunk).length).toBeGreaterThan(0);
    }
  });

  it("gives every chunk a unique id", () => {
    const ids = chunksFor(slug).map((chunk) => chunk.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
   * A real Vision §16 guard. Each README carries a "Difficulty" line directly
   * above the Hook, which is exactly the region a problem chunk draws from.
   */
  it("never carries a difficulty label into the lesson copy", () => {
    const text = chunksFor(slug).map(allText).join(" ");

    expect(text).not.toMatch(/beginner|intermediate|advanced|difficulty/i);
  });

  /*
   * Vision §19 keeps a normal chunk to roughly 2-4 related actions. Enforced
   * by test rather than by the type: a tuple union of 2-, 3- and 4-length
   * arrays would be unreadable for no safety gain.
   */
  it("keeps every guided build to 2 to 4 actions", () => {
    const builds = chunksFor(slug).filter((chunk) => chunk.kind === "guided-build");

    expect(builds.length).toBeGreaterThan(0);
    for (const chunk of builds) {
      expect(chunk.actions.length).toBeGreaterThanOrEqual(2);
      expect(chunk.actions.length).toBeLessThanOrEqual(4);
      for (const action of chunk.actions) {
        expect(action.text.trim()).not.toBe("");
      }
    }
  });

  /*
   * The reason before AND the reason after. Dropping the second is what turns
   * a build chunk back into copy-paste instructions.
   */
  it("explains why before the actions and why after them", () => {
    for (const chunk of chunksFor(slug)) {
      if (chunk.kind !== "guided-build") continue;
      expect(chunk.whyThisMatters.length).toBeGreaterThan(0);
      expect(chunk.whyWereDoingThis.length).toBeGreaterThan(0);
    }
  });

  /*
   * CLAUDE.md's Guided Build Rule: a node is explained by What / Why here /
   * Business reason, and code by intent / inputs / logic / output /
   * engineering reason. Asserting each field is non-empty is what makes
   * "never teach code as just paste this" mechanical rather than aspirational.
   */
  it("fills every mandated field of every teaching note", () => {
    const notes = chunksFor(slug).flatMap((chunk) => chunk.teaches ?? []);

    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      expect(note.name.trim()).not.toBe("");
      if (note.subject === "node") {
        expect(note.what.trim()).not.toBe("");
        expect(note.whyHere.trim()).not.toBe("");
        expect(note.businessReason.trim()).not.toBe("");
      } else {
        expect(note.code.trim()).not.toBe("");
        expect(note.intent.trim()).not.toBe("");
        expect(note.inputs.trim()).not.toBe("");
        expect(note.logic.trim()).not.toBe("");
        expect(note.output.trim()).not.toBe("");
        expect(note.engineeringReason.trim()).not.toBe("");
      }
    }
  });

  it("always gives a diagram a text alternative", () => {
    const diagrams = chunksFor(slug)
      .flatMap(allBlocks)
      .filter((block) => block.type === "diagram");

    for (const diagram of diagrams) {
      expect(diagram.alt.trim()).not.toBe("");
      expect(diagram.ascii.trim()).not.toBe("");
    }
  });

  /*
   * A lab has to be finishable. Its challenge earns `verified`, which only an
   * evaluator can grant — so a challenge with no case would leave the lab
   * permanently incomplete and the next lab permanently locked.
   */
  it("gives every challenge a way to be verified", () => {
    for (const chunk of chunksFor(slug)) {
      if (chunk.kind !== "challenge") continue;
      expect(chunk.testCaseId).toBeTruthy();
      expect(chunk.caseName).toBeTruthy();
    }
  });
});
