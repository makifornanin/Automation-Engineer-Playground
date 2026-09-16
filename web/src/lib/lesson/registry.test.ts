import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { getLessonChunks } from "./registry";
import type { ContentBlock, LessonChunk } from "./types";

const LAB_01 = "01-data-mapping-transformation";

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

describe("getLessonChunks", () => {
  /*
   * Asserts the teaching arc rather than an exact chunk list: the arc is the
   * thing CLAUDE.md's Learning Experience Rule actually requires, and pinning
   * the literal sequence would break every time a lab gains a chunk.
   *
   * Consecutive chunks of the same kind collapse — a lab may need two build
   * steps — but the ORDER of distinct kinds must hold. Understanding comes
   * before building, prediction before testing, and debugging before the
   * challenge that depends on it.
   */
  it("walks Lab 01 through the full teaching arc, in order", () => {
    const chunks = getLessonChunks(LAB_01);
    expect(chunks).not.toBeNull();

    const arc = (chunks ?? [])
      .map((chunk) => chunk.kind)
      .filter((kind, index, all) => kind !== all[index - 1]);

    expect(arc).toEqual([
      "problem",
      "concept",
      "guided-build",
      "predict",
      "test",
      "break-it",
      "debug",
      "challenge",
      "recap",
    ]);
  });

  it("gives every chunk a title, a stable id and something to render", () => {
    const chunks = getLessonChunks(LAB_01) ?? [];

    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.title.trim()).not.toBe("");
      expect(chunk.id.trim()).not.toBe("");
      expect(allBlocks(chunk).length).toBeGreaterThan(0);
    }
  });

  it("gives every chunk in a lab a unique id", () => {
    const ids = (getLessonChunks(LAB_01) ?? []).map((chunk) => chunk.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
   * Only Lab 01 has content. The other nine must return null so their pages
   * keep the honest placeholder rather than rendering an empty lesson.
   */
  it("returns null for every lab that has no lesson yet", () => {
    for (const lab of LABS.filter((entry) => entry.slug !== LAB_01)) {
      expect(getLessonChunks(lab.slug)).toBeNull();
    }
  });

  it("returns null for an unknown slug", () => {
    expect(getLessonChunks("not-a-lab")).toBeNull();
  });

  /*
   * A real Vision §16 guard. The README this copy is condensed from carries a
   * "Difficulty: Beginner" line directly above the Hook, which is exactly the
   * region the problem chunk draws from.
   */
  it("never carries a difficulty label into the lesson copy", () => {
    const text = (getLessonChunks(LAB_01) ?? []).map(allText).join(" ");

    expect(text).not.toMatch(/beginner|intermediate|advanced|difficulty/i);
  });
});

describe("guided-build chunks — Vision §19", () => {
  const builds = (getLessonChunks(LAB_01) ?? []).filter(
    (chunk) => chunk.kind === "guided-build",
  );

  it("has at least one to check", () => {
    expect(builds.length).toBeGreaterThan(0);
  });

  /*
   * "Keep a normal chunk to roughly 2-4 related actions." Enforced by test
   * rather than by the type: a tuple union of 2-, 3- and 4-length arrays would
   * be unreadable for no safety gain.
   */
  it("carries 2 to 4 actions — not one click per sentence, not a wall", () => {
    for (const chunk of builds) {
      expect(chunk.actions.length).toBeGreaterThanOrEqual(2);
      expect(chunk.actions.length).toBeLessThanOrEqual(4);
    }
  });

  /*
   * The reason before AND the reason after. Dropping the second is what turns
   * a build chunk back into copy-paste instructions, so an empty one fails.
   */
  it("explains why before the actions and why after them", () => {
    for (const chunk of builds) {
      expect(chunk.whyThisMatters.length).toBeGreaterThan(0);
      expect(chunk.whyWereDoingThis.length).toBeGreaterThan(0);
    }
  });

  it("gives every action something for the learner to actually do", () => {
    for (const chunk of builds) {
      for (const action of chunk.actions) {
        expect(action.text.trim()).not.toBe("");
      }
    }
  });
});

/*
 * CLAUDE.md's Guided Build Rule: a node is explained by What / Why here /
 * Business reason, and code by intent / inputs / logic / output / engineering
 * reason. Asserting each field is non-empty is what makes "never teach code as
 * just paste this" mechanical rather than aspirational.
 */
describe("teaching notes — CLAUDE.md Guided Build Rule", () => {
  const notes = (getLessonChunks(LAB_01) ?? []).flatMap((chunk) => chunk.teaches ?? []);

  it("has at least one to check", () => {
    expect(notes.length).toBeGreaterThan(0);
  });

  it("fills every mandated field", () => {
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
});

describe("diagrams", () => {
  it("always carries a text alternative — ASCII alone is unreadable aloud", () => {
    const diagrams = (getLessonChunks(LAB_01) ?? [])
      .flatMap(allBlocks)
      .filter((block) => block.type === "diagram");

    expect(diagrams.length).toBeGreaterThan(0);
    for (const diagram of diagrams) {
      expect(diagram.alt.trim()).not.toBe("");
      expect(diagram.ascii.trim()).not.toBe("");
    }
  });
});
