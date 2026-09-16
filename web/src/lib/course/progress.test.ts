import { describe, expect, it } from "vitest";
import { LABS } from "./catalog";
import {
  deriveCourseState,
  getCourseProgress,
  isHandsOnAvailable,
  type CourseProgress,
} from "./progress";

const EMPTY: CourseProgress = { completedLabSlugs: [], inProgressLabSlug: null };

describe("deriveCourseState", () => {
  it("with empty progress, starts the learner at lab 01", () => {
    const state = deriveCourseState(EMPTY);

    expect(state.currentLab.lab.slug).toBe(LABS[0].slug);
    expect(state.currentLab.status).toBe("not-started");
  });

  it("with empty progress, marks every lab not-started", () => {
    const state = deriveCourseState(EMPTY);

    expect(state.labs).toHaveLength(10);
    expect(state.labs.every(({ status }) => status === "not-started")).toBe(true);
  });

  it("never marks a lab locked — Aim Point 1 has no unlock engine", () => {
    const state = deriveCourseState(EMPTY);

    expect(state.labs.some(({ status }) => status === "locked")).toBe(false);
  });

  it("locks the Capstone until all ten labs are completed", () => {
    const state = deriveCourseState(EMPTY);

    expect(state.capstone.status).toBe("locked");
  });

  it("with two completed labs and one in progress, resolves the correct current lab and statuses", () => {
    const progress: CourseProgress = {
      completedLabSlugs: [LABS[0].slug, LABS[1].slug],
      inProgressLabSlug: LABS[2].slug,
    };
    const state = deriveCourseState(progress);

    expect(state.currentLab.lab.slug).toBe(LABS[2].slug);
    expect(state.currentLab.status).toBe("in-progress");

    expect(state.labs[0].status).toBe("completed");
    expect(state.labs[1].status).toBe("completed");
    expect(state.labs[2].status).toBe("in-progress");
    expect(state.labs[3].status).toBe("not-started");
    expect(state.labs[9].status).toBe("not-started");

    expect(state.capstone.status).toBe("locked");
  });

  it("unlocks the Capstone once all ten labs are completed", () => {
    const progress: CourseProgress = {
      completedLabSlugs: LABS.map((lab) => lab.slug),
      inProgressLabSlug: null,
    };
    const state = deriveCourseState(progress);

    expect(state.labs.every(({ status }) => status === "completed")).toBe(true);
    expect(state.capstone.status).not.toBe("locked");
  });
});

describe("getCourseProgress", () => {
  it("resolves empty progress — there is no persistence yet", async () => {
    await expect(getCourseProgress()).resolves.toEqual(EMPTY);
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
