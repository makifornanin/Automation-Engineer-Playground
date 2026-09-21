import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { CourseProgress } from "@/lib/course/progress";
import { getLessonChunks } from "@/lib/lesson/registry";
import {
  buildCanonicalContext,
  buildLessonContext,
  buildProgressContext,
  flattenChunk,
  recentTurns,
} from "./context";
import type { KazMessage } from "./types";

const LAB_03 = "03-apis-webhooks";
const LAB_01 = "01-data-mapping-transformation";

function progressWith(overrides: Partial<CourseProgress> = {}): CourseProgress {
  return {
    completedLabSlugs: [LAB_01],
    inProgressLabSlug: LAB_03,
    labs: {},
    capstone: { started: false, completed: false },
    ...overrides,
  };
}

describe("buildLessonContext", () => {
  it("names the lab and the step, with the lesson's outline", () => {
    const context = buildLessonContext(LAB_03, "problem", false);

    expect(context?.labTitle).toContain("Lab 03");
    expect(context?.chunkTitle.length).toBeGreaterThan(0);
    expect(context?.outline.length).toBeGreaterThan(3);
    expect(context?.chunkText.length).toBeGreaterThan(20);
  });

  it("returns nothing for a lab or chunk that does not exist", () => {
    expect(buildLessonContext("99-nope", "problem", false)).toBeNull();
    expect(buildLessonContext(LAB_03, "not-a-chunk", false)).toBeNull();
  });

  it("keeps the slice bounded", () => {
    const context = buildLessonContext(LAB_03, "build-webhook", false);
    expect((context?.chunkText.length ?? 0)).toBeLessThanOrEqual(4_001);
  });
});

describe("flattenChunk", () => {
  /*
   * A Predict chunk's reveal is the answer to the question the chunk asks.
   * Kaz reading it out before the learner has predicted would delete the step.
   */
  it("withholds a prediction's reveal until the learner has predicted", () => {
    const predict = getLessonChunks(LAB_03)?.find((chunk) => chunk.kind === "predict");
    expect(predict).toBeDefined();
    if (!predict || predict.kind !== "predict") return;

    const revealText = predict.reveal
      .map((block) => (block.type === "prose" ? block.text : ""))
      .filter(Boolean)[0];
    expect(revealText).toBeTruthy();

    expect(flattenChunk(predict, false)).not.toContain(revealText);
    expect(flattenChunk(predict, true)).toContain(revealText);
  });
});

describe("buildProgressContext", () => {
  it("passes on only the hints the lesson has already given", () => {
    const progress = progressWith({
      labs: {
        [LAB_03]: {
          currentChunkId: "challenge",
          completedAt: null,
          evidence: {},
          hintsUsed: { challenge: 2 },
        },
      },
    });

    const context = buildProgressContext(progress, LAB_03, "challenge");

    expect(context.hintsRevealed).toHaveLength(2);
    expect(context.hintsRemaining).toBeGreaterThanOrEqual(0);
  });

  it("gives Kaz no hints at all when the learner has asked for none", () => {
    expect(buildProgressContext(progressWith(), LAB_03, "challenge").hintsRevealed).toEqual([]);
  });
});

describe("buildCanonicalContext", () => {
  it("gives nothing at a nudge or a hint", () => {
    expect(buildCanonicalContext(LAB_03, "debug", 1)).toBeNull();
    expect(buildCanonicalContext(LAB_03, "debug", 2)).toBeNull();
  });

  it("gives structure at explain and configuration at show me", () => {
    expect(buildCanonicalContext(LAB_03, "debug", 3)?.nodes[0]).not.toHaveProperty("parameters");
    expect(
      buildCanonicalContext(LAB_03, "debug", 4)?.nodes.some((node) => node.parameters !== undefined),
    ).toBe(true);
  });

  /* The challenge override: no canonical material at any level. */
  it.each([1, 2, 3, 4] as const)("gives nothing on a challenge chunk at level %i", (level) => {
    expect(buildCanonicalContext(LAB_03, "challenge", level)).toBeNull();
  });
});

describe("recentTurns", () => {
  const message = (index: number, content = "turn " + index): KazMessage => ({
    id: String(index),
    role: index % 2 === 0 ? "learner" : "kaz",
    content,
    createdAt: "now",
  });

  it("keeps only the last few turns", () => {
    const history = Array.from({ length: 40 }, (_, index) => message(index));

    expect(recentTurns(history, 3)).toHaveLength(6);
    expect(recentTurns(history, 3)[0].content).toBe("turn 34");
  });

  it("trims a very long message rather than sending all of it", () => {
    const trimmed = recentTurns([message(0, "x".repeat(5_000))], 2)[0];

    expect(trimmed.content.length).toBeLessThanOrEqual(1_201);
  });
});

it("includes single and multiple guided-build action code values within the context cap", () => {
  const base = getLessonChunks(LAB_03)?.find(chunk => chunk.kind === "guided-build");
  if (!base || base.kind !== "guided-build") throw new Error("Missing guided build fixture");
  const chunk = { ...base, whyThisMatters: [], whyWereDoingThis: [], content: [], actions: [
    { text: "Set expression", code: { language: "text" as const, code: "={{ $json.email }}" }, expect: "email" },
    { text: "Configure two nodes", code: [{ language: "text" as const, code: "FIRST_VALUE" }, { language: "text" as const, code: "SECOND_VALUE" }] },
  ] };
  const text = flattenChunk(chunk, false);
  expect(text).toContain("={{ $json.email }}");
  expect(text).toContain("FIRST_VALUE");
  expect(text).toContain("SECOND_VALUE");
  expect(text).toContain("email");
  expect(flattenChunk({ ...chunk, actions: [{ text: "Large", code: { language: "text", code: "x".repeat(8000) } }] }, false).length).toBeLessThanOrEqual(4001);
});
