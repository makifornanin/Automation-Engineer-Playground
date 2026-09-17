import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseProgress } from "./progress";

const getSession = vi.hoisted(() => vi.fn());
const getCourseProgress = vi.hoisted(() => vi.fn());
const upsert = vi.hoisted(() => vi.fn(async () => ({ error: null })));
const from = vi.hoisted(() => vi.fn(() => ({ upsert })));

vi.mock("@/lib/session/get-session", () => ({ getSession }));
vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: async () => ({ from }),
}));
vi.mock("./progress-store", () => ({ getCourseProgress }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  recordLearnerEvidence,
  recordPosition,
  recordVerifiedEvidence,
  startLab,
} from "./progress-writes";

const LAB_01 = "01-data-mapping-transformation";
const LAB_02 = "02-conditions-routing";
const LAB_03 = "03-apis-webhooks";
const LAB_07 = "07-idempotency-duplicate-protection";

/** Labs 01–02 done and Lab 03 opened: 03 is hands-on, 04 onwards locked. */
const IN_LAB_03: CourseProgress = {
  completedLabSlugs: [LAB_01, LAB_02],
  inProgressLabSlug: LAB_03,
  labs: {},
};

/** Labs 01–02 done, Lab 03 not yet opened: 03 is readable but not hands-on. */
const BEFORE_LAB_03: CourseProgress = {
  completedLabSlugs: [LAB_01, LAB_02],
  inProgressLabSlug: null,
  labs: {},
};

function writtenEvidence() {
  return upsert.mock.calls.map((call) => (call as unknown[])[0] as { evidence?: string });
}

beforeEach(() => {
  upsert.mockClear();
  from.mockClear();
  getSession.mockResolvedValue({
    status: "authenticated",
    user: { id: "learner-1", displayName: "L", role: "student" },
  });
  getCourseProgress.mockResolvedValue(IN_LAB_03);
});

describe("recordVerifiedEvidence — only after a passing evaluation", () => {
  it("writes verified for a test chunk in an open lab", async () => {
    await recordVerifiedEvidence(LAB_03, "success-test");

    expect(writtenEvidence()).toEqual([expect.objectContaining({ evidence: "verified" })]);
  });

  it("refuses a chunk whose kind does not earn verified", async () => {
    await recordVerifiedEvidence(LAB_03, "build-webhook");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("refuses a locked lab, even for a genuine pass", async () => {
    await recordVerifiedEvidence(LAB_07, "success-test");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("refuses a lab that is readable but not started", async () => {
    getCourseProgress.mockResolvedValue(BEFORE_LAB_03);

    await recordVerifiedEvidence(LAB_03, "success-test");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("writes nothing when signed out", async () => {
    getSession.mockResolvedValue({ status: "anonymous" });

    await recordVerifiedEvidence(LAB_03, "success-test");

    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("recordLearnerEvidence — the tiers a learner earns by doing the step", () => {
  it("writes acknowledged for a build step and predicted for a prediction", async () => {
    await recordLearnerEvidence(LAB_03, "build-webhook");
    await recordLearnerEvidence(LAB_03, "predict");

    expect(writtenEvidence()).toEqual([
      expect.objectContaining({ evidence: "acknowledged" }),
      expect.objectContaining({ evidence: "predicted" }),
    ]);
  });

  /*
   * The QA BLOCKER. This writer backs a browser-callable action, so naming a
   * test or challenge chunk must not earn verified without a test run.
   */
  it.each(["success-test", "challenge"])("refuses %s, which only a passing test may verify", async (chunkId) => {
    await recordLearnerEvidence(LAB_03, chunkId);

    expect(upsert).not.toHaveBeenCalled();
  });

  /*
   * Any row marks a lab started, and started beats locked. A write here would
   * unlock the lab it was written to.
   */
  it("refuses a locked lab", async () => {
    await recordLearnerEvidence(LAB_07, "build-memory");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("ignores a chunk that does not exist", async () => {
    await recordLearnerEvidence(LAB_03, "no-such-chunk");

    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("recordPosition and startLab — no row for a lab the learner cannot open", () => {
  it("records position in a readable lab", async () => {
    await recordPosition(LAB_03, "concept");

    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("refuses to record position in a locked lab", async () => {
    await recordPosition(LAB_07, "problem");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("starts the current lab when it is opened", async () => {
    getCourseProgress.mockResolvedValue(BEFORE_LAB_03);

    await startLab(LAB_03);

    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("refuses to start a locked lab", async () => {
    await startLab(LAB_07);

    expect(upsert).not.toHaveBeenCalled();
  });
});
