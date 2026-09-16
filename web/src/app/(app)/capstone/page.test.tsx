import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { CAPSTONE_REQUIREMENTS, CAPSTONE_SCENARIOS } from "@/lib/course/capstone";
import type { CourseProgress } from "@/lib/course/progress";

const getCourseProgress = vi.hoisted(() => vi.fn<() => Promise<CourseProgress>>());

vi.mock("@/lib/course/progress-store", () => ({ getCourseProgress }));

import CapstonePage from "./page";

const NONE_COMPLETE: CourseProgress = {
  completedLabSlugs: [],
  inProgressLabSlug: LABS[0].slug,
  labs: {},
};

const ALL_COMPLETE: CourseProgress = {
  completedLabSlugs: LABS.map((lab) => lab.slug),
  inProgressLabSlug: null,
  labs: {},
};

beforeEach(() => {
  getCourseProgress.mockReset();
});

describe("<CapstonePage />", () => {
  /*
   * Previewable before it unlocks, like any future lab (Vision §3) — but the
   * requirements and scenarios are the hands-on part, and stay held back.
   */
  it("previews the Capstone without its requirements while labs remain", async () => {
    getCourseProgress.mockResolvedValue(NONE_COMPLETE);
    render(await CapstonePage());

    expect(screen.getByRole("heading", { name: "What you will build" })).toBeInTheDocument();
    expect(screen.getByText(/You have finished 0 of 10/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Requirements" })).not.toBeInTheDocument();
    expect(screen.queryByText(CAPSTONE_SCENARIOS[0].name)).not.toBeInTheDocument();
  });

  it("unlocks the requirements and scenarios once all ten labs are complete", async () => {
    getCourseProgress.mockResolvedValue(ALL_COMPLETE);
    render(await CapstonePage());

    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    for (const scenario of CAPSTONE_SCENARIOS) {
      expect(screen.getByText(scenario.name)).toBeInTheDocument();
    }
  });

  /*
   * AEP holds no Capstone workflow export to evaluate against. A completion
   * button would record nothing real, so there must not be one.
   */
  it("offers no completion button it cannot back with evidence", async () => {
    getCourseProgress.mockResolvedValue(ALL_COMPLETE);
    render(await CapstonePage());

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/cannot check a Capstone for you yet/)).toBeInTheDocument();
  });

  it("describes the system diagram in words", async () => {
    getCourseProgress.mockResolvedValue(NONE_COMPLETE);
    render(await CapstonePage());

    expect(screen.getByRole("img", { name: /dead letter queue/i })).toBeInTheDocument();
  });
});

describe("Capstone requirements", () => {
  /* Every requirement is a skill a lab already taught — that is the point. */
  it("maps every requirement to a real lab", () => {
    const numbers = new Set(LABS.map((lab) => lab.number));
    for (const requirement of CAPSTONE_REQUIREMENTS) {
      expect(numbers.has(requirement.fromLab)).toBe(true);
    }
  });
});
