import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CAPSTONE_SLUG, LABS } from "@/lib/course/catalog";
import { CAPSTONE_REQUIREMENTS, CAPSTONE_SCENARIOS } from "@/lib/course/capstone";
import type { CourseProgress } from "@/lib/course/progress";
import { CAPSTONE_PROOFS } from "@/lib/lesson/content/capstone";

const getCourseProgress = vi.hoisted(() => vi.fn<() => Promise<CourseProgress>>());
const startLab = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/course/progress-store", () => ({ getCourseProgress }));
vi.mock("@/lib/course/progress-writes", () => ({ startLab }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/testing/self-check-action", () => ({
  runSelfCheck: vi.fn(async () => ({ status: "idle" })),
}));

import CapstonePage from "./page";

const NONE_COMPLETE: CourseProgress = {
  completedLabSlugs: [],
  inProgressLabSlug: LABS[0].slug,
  labs: {},
  capstone: { started: false, completed: false },
};

const ALL_COMPLETE: CourseProgress = {
  completedLabSlugs: LABS.map((lab) => lab.slug),
  inProgressLabSlug: null,
  labs: {},
  capstone: { started: false, completed: false },
};

function withProofs(ids: readonly string[], completed: boolean): CourseProgress {
  return {
    ...ALL_COMPLETE,
    labs: {
      [CAPSTONE_SLUG]: {
        currentChunkId: null,
        completedAt: null,
        evidence: Object.fromEntries(ids.map((id) => [id, "verified" as const])),
      },
    },
    capstone: { started: true, completed },
  };
}

beforeEach(() => {
  getCourseProgress.mockReset();
  startLab.mockClear();
});

describe("<CapstonePage />", () => {
  /*
   * Previewable before it unlocks, like any future lab (Vision §3) — but the
   * requirements and proofs are the hands-on part, and stay held back.
   */
  it("previews the Capstone without its requirements or proofs while labs remain", async () => {
    getCourseProgress.mockResolvedValue(NONE_COMPLETE);
    render(await CapstonePage());

    expect(screen.getByRole("heading", { name: "What you will build" })).toBeInTheDocument();
    expect(screen.getByText(/You have finished 0 of 10/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Requirements" })).not.toBeInTheDocument();
    expect(screen.queryByText(`1. ${CAPSTONE_PROOFS[0].title}`)).not.toBeInTheDocument();
    expect(screen.queryByText("Check the response")).not.toBeInTheDocument();
  });

  it("does not start a locked Capstone", async () => {
    getCourseProgress.mockResolvedValue(NONE_COMPLETE);
    await CapstonePage();

    expect(startLab).not.toHaveBeenCalled();
  });

  it("starts the Capstone when an unlocked learner opens it, and shows it in progress at once", async () => {
    getCourseProgress.mockResolvedValue(ALL_COMPLETE);
    render(await CapstonePage());

    expect(startLab).toHaveBeenCalledWith(CAPSTONE_SLUG);
    expect(screen.getByText(/Status: In progress · 0 of 9 scenarios proved/)).toBeInTheDocument();
  });

  it("unlocks the requirements and one proof per scenario once all ten labs are complete", async () => {
    getCourseProgress.mockResolvedValue(ALL_COMPLETE);
    render(await CapstonePage());

    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    CAPSTONE_SCENARIOS.forEach((scenario, index) => {
      expect(screen.getByText(`${index + 1}. ${scenario.name}`)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Not proved yet/)).toHaveLength(9);
  });

  it("marks each proof the learner has verified", async () => {
    getCourseProgress.mockResolvedValue(withProofs([CAPSTONE_PROOFS[0].id], false));
    render(await CapstonePage());

    expect(screen.getByText(/Status: In progress · 1 of 9 scenarios proved/)).toBeInTheDocument();
    expect(screen.getAllByText(/✓ Proved/)).toHaveLength(1);
  });

  it("shows the Capstone complete once every proof is verified", async () => {
    getCourseProgress.mockResolvedValue(
      withProofs(
        CAPSTONE_PROOFS.map((proof) => proof.id),
        true,
      ),
    );
    render(await CapstonePage());

    expect(screen.getByText(/Status: Completed · 9 of 9 scenarios proved/)).toBeInTheDocument();
    expect(screen.getByText(/Capstone complete/)).toBeInTheDocument();
  });

  /* Completion is the evidence. A button that claims it would mean nothing. */
  it("offers no completion button", async () => {
    getCourseProgress.mockResolvedValue(ALL_COMPLETE);
    render(await CapstonePage());

    expect(screen.queryByRole("button", { name: /complete|finish|done/i })).not.toBeInTheDocument();
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
