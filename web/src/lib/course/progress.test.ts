import { describe, expect, it } from "vitest";
import type { LessonChunk } from "@/lib/lesson/types";
import { LABS } from "./catalog";
import {
  deriveCourseState,
  EVIDENCING_KINDS,
  HANDS_ON_KINDS,
  isHandsOnAvailable,
  isLabComplete,
  isLessonReadable,
  labCompletionPercent,
  openMilestones,
  requiredMilestones,
  visibleChunks,
  type CourseProgress,
  type MilestoneEvidence,
} from "./progress";

const EMPTY: CourseProgress = {
  completedLabSlugs: [],
  inProgressLabSlug: null,
  labs: {},
};

function completedThrough(count: number): CourseProgress {
  return {
    completedLabSlugs: LABS.slice(0, count).map((lab) => lab.slug),
    inProgressLabSlug: null,
    labs: {},
  };
}

function chunk(kind: LessonChunk["kind"], id: string): LessonChunk {
  const base = { id, title: id, content: [] as const };
  switch (kind) {
    case "guided-build":
      return { ...base, kind, whyThisMatters: [], actions: [], whyWereDoingThis: [] };
    case "predict":
      return { ...base, kind, prompt: "?", reveal: [] };
    case "test":
      return {
        ...base,
        kind,
        testCaseId: `case-${id}`,
        caseName: id,
        mode: "self-check",
      };
    case "challenge":
      return { ...base, kind, hintCount: 0 };
    default:
      return { ...base, kind } as LessonChunk;
  }
}

describe("deriveCourseState", () => {
  it("with empty progress, starts the learner at lab 01", () => {
    const state = deriveCourseState(EMPTY);

    expect(state.currentLab.lab.slug).toBe(LABS[0].slug);
    expect(state.currentLab.status).toBe("not-started");
  });

  /*
   * Rewritten deliberately. This previously asserted every lab was
   * not-started, and a sibling test asserted no lab was ever locked — both
   * correct only while there was no unlock engine. Sequential unlocking makes
   * `locked` reachable, and Lab 01 is the only lab without a prerequisite.
   */
  it("locks every lab whose prerequisite is not complete, and never lab 01", () => {
    const state = deriveCourseState(EMPTY);

    expect(state.labs[0].status).toBe("not-started");
    expect(state.labs.slice(1).every(({ status }) => status === "locked")).toBe(true);
  });

  it("unlocks the next lab when its prerequisite completes", () => {
    const state = deriveCourseState(completedThrough(1));

    expect(state.labs[0].status).toBe("completed");
    expect(state.labs[1].status).toBe("not-started");
    expect(state.labs[2].status).toBe("locked");
    expect(state.currentLab.lab.slug).toBe(LABS[1].slug);
  });

  it("prefers the lab the learner actually opened over the first incomplete one", () => {
    const progress: CourseProgress = {
      completedLabSlugs: [LABS[0].slug],
      inProgressLabSlug: LABS[1].slug,
      labs: {},
    };
    const state = deriveCourseState(progress);

    expect(state.currentLab.lab.slug).toBe(LABS[1].slug);
    expect(state.currentLab.status).toBe("in-progress");
  });

  it("locks the Capstone until all ten labs are completed", () => {
    expect(deriveCourseState(EMPTY).capstone.status).toBe("locked");
  });

  it("unlocks the Capstone once all ten labs are completed", () => {
    const state = deriveCourseState(completedThrough(LABS.length));

    expect(state.labs.every(({ status }) => status === "completed")).toBe(true);
    expect(state.capstone.status).not.toBe("locked");
  });
});

describe("openMilestones", () => {
  const LESSON: readonly LessonChunk[] = [
    { kind: "problem", id: "problem", title: "Problem", content: [] },
    {
      kind: "guided-build",
      id: "build",
      title: "Build",
      content: [],
      whyThisMatters: [],
      actions: [{ text: "a" }, { text: "b" }],
      whyWereDoingThis: [],
    },
    { kind: "predict", id: "predict", title: "Predict", content: [], prompt: "?", reveal: [] },
    {
      kind: "test",
      id: "test",
      title: "Test",
      content: [],
      testCaseId: "case",
      caseName: "Case",
      mode: "self-check",
    },
  ];

  /* The recap names exactly these, in lesson order, so a learner can go straight to them. */
  it("lists only the milestones not yet earned, in lesson order", () => {
    expect(openMilestones(LESSON, { predict: "predicted" })).toEqual([
      { chunkId: "build", evidence: "acknowledged" },
      { chunkId: "test", evidence: "verified" },
    ]);
  });

  it("is empty once every milestone is earned", () => {
    expect(
      openMilestones(LESSON, { build: "acknowledged", predict: "predicted", test: "verified" }),
    ).toEqual([]);
  });
});

describe("isHandsOnAvailable", () => {
  it("is true for completed and in-progress labs", () => {
    expect(isHandsOnAvailable("completed")).toBe(true);
    expect(isHandsOnAvailable("in-progress")).toBe(true);
  });

  it("is false for not-started and locked labs", () => {
    expect(isHandsOnAvailable("not-started")).toBe(false);
    expect(isHandsOnAvailable("locked")).toBe(false);
  });
});

describe("isLessonReadable — reading is open, building is a separate question", () => {
  /*
   * The seam the owner asked for. Being the lab the learner is pointed at
   * makes the lesson readable; it must NOT make the hands-on work available.
   * If someone ever merges these two predicates back together to save a line,
   * this test is what fails.
   */
  it("is true for the current lab even though hands-on is not available", () => {
    expect(isLessonReadable("not-started", true)).toBe(true);
    expect(isHandsOnAvailable("not-started")).toBe(false);
  });

  it("is true for a lab whose hands-on work is already open", () => {
    expect(isLessonReadable("completed", false)).toBe(true);
    expect(isLessonReadable("in-progress", false)).toBe(true);
  });

  it("is false for a future lab that is not the current one", () => {
    expect(isLessonReadable("not-started", false)).toBe(false);
    expect(isLessonReadable("locked", false)).toBe(false);
  });
});

describe("visibleChunks — locked content never reaches the browser", () => {
  const LESSON: readonly LessonChunk[] = [
    chunk("problem", "problem"),
    chunk("concept", "concept"),
    chunk("guided-build", "build"),
    chunk("test", "test"),
    chunk("challenge", "challenge"),
  ];

  it("serves every chunk when hands-on is available", () => {
    expect(visibleChunks(LESSON, "in-progress")).toHaveLength(LESSON.length);
  });

  it("strips every hands-on chunk when it is not", () => {
    const visible = visibleChunks(LESSON, "not-started");

    expect(visible.map((entry) => entry.id)).toEqual(["problem", "concept"]);
    for (const entry of visible) {
      expect(HANDS_ON_KINDS).not.toContain(entry.kind);
    }
  });

  it("leaves a reading-only lesson untouched", () => {
    const reading = [chunk("problem", "problem"), chunk("concept", "concept")];

    expect(visibleChunks(reading, "locked")).toHaveLength(2);
  });
});

describe("requiredMilestones — reading is not evidence", () => {
  it("ignores prose kinds entirely", () => {
    const milestones = requiredMilestones([
      chunk("problem", "problem"),
      chunk("concept", "concept"),
      chunk("recap", "recap"),
    ]);

    expect(milestones).toEqual([]);
  });

  it("derives one milestone per evidencing chunk, with the kind's own evidence", () => {
    const milestones = requiredMilestones([
      chunk("problem", "problem"),
      chunk("guided-build", "build"),
      chunk("predict", "predict"),
      chunk("test", "test"),
    ]);

    expect(milestones).toEqual([
      { chunkId: "build", evidence: "acknowledged" },
      { chunkId: "predict", evidence: "predicted" },
      { chunkId: "test", evidence: "verified" },
    ]);
  });

  it("never treats a prose kind as evidencing", () => {
    for (const kind of ["problem", "concept", "recap"] as const) {
      expect(kind in EVIDENCING_KINDS).toBe(false);
    }
  });
});

describe("isLabComplete", () => {
  const LESSON = [chunk("concept", "concept"), chunk("guided-build", "build")];

  it("is false with no evidence", () => {
    expect(isLabComplete(LESSON, {})).toBe(false);
  });

  it("is true once every milestone is earned", () => {
    expect(isLabComplete(LESSON, { build: "acknowledged" })).toBe(true);
  });

  it("rejects evidence weaker than the chunk demands", () => {
    const withTest = [chunk("test", "test")];

    expect(isLabComplete(withTest, { test: "acknowledged" })).toBe(false);
    expect(isLabComplete(withTest, { test: "verified" })).toBe(true);
  });

  /*
   * "Nothing to prove" is not "proven". Returning true for an all-prose lab
   * would silently unlock the next one before any work existed.
   */
  it("is false for a lab with no milestones at all", () => {
    expect(isLabComplete([chunk("concept", "concept")], {})).toBe(false);
  });
});

describe("labCompletionPercent", () => {
  const LESSON = [
    chunk("guided-build", "a"),
    chunk("guided-build", "b"),
    chunk("predict", "c"),
    chunk("challenge", "d"),
  ];

  it("is null when there is nothing to measure", () => {
    expect(labCompletionPercent([chunk("concept", "concept")], {})).toBeNull();
  });

  it("is 0 before anything is earned", () => {
    expect(labCompletionPercent(LESSON, {})).toBe(0);
  });

  it("counts only milestones matching the required evidence", () => {
    const earned: Record<string, MilestoneEvidence> = { a: "acknowledged", c: "predicted" };

    expect(labCompletionPercent(LESSON, earned)).toBe(50);
  });

  it("reaches 100 only when every milestone is earned", () => {
    const earned: Record<string, MilestoneEvidence> = {
      a: "acknowledged",
      b: "acknowledged",
      c: "predicted",
      d: "verified",
    };

    expect(labCompletionPercent(LESSON, earned)).toBe(100);
  });
});
