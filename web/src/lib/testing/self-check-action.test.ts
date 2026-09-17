import { beforeEach, describe, expect, it, vi } from "vitest";

const recordVerifiedEvidence = vi.hoisted(() => vi.fn(async () => {}));
const hasHandsOnAccess = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/lib/course/progress-writes", () => ({ recordVerifiedEvidence, hasHandsOnAccess }));

import { runSelfCheck } from "./self-check-action";
import { IDLE_TEST_STATE } from "./types";

const LAB_01 = "01-data-mapping-transformation";

/** A correct answer to Lab 01's GUIDED success test — the easy case. */
const EASY_CORRECT = JSON.stringify({
  name: "Alex Rivera",
  email: "alex@example.com",
  company: "Northstar Commerce",
  lead_source: "Facebook Lead Form",
});

function submit(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return runSelfCheck(IDLE_TEST_STATE, form);
}

beforeEach(() => {
  recordVerifiedEvidence.mockClear();
  hasHandsOnAccess.mockResolvedValue(true);
});

describe("runSelfCheck", () => {
  /*
   * Found live in the E2E pass: replayed from a fresh learner's browser, a
   * correct paste for locked Lab 05 came back "Pass". No evidence was written,
   * but a locked lab's test must not run at all.
   */
  it("refuses to check a lab the learner has not unlocked", async () => {
    hasHandsOnAccess.mockResolvedValue(false);
    const state = await submit({ labSlug: LAB_01, chunkId: "success-test", output: EASY_CORRECT });

    expect(state.status === "error" && state.code).toBe("locked");
    expect(recordVerifiedEvidence).not.toHaveBeenCalled();
  });

  /*
   * Found in the live E2E pass: text copied from n8n's JSON view can be
   * indented with non-breaking spaces, which JSON.parse rejects.
   */
  it("accepts output indented with non-breaking spaces, as n8n's JSON view can give it", async () => {
    const indented = JSON.stringify(JSON.parse(EASY_CORRECT), null, 2).replace(/ {2}/g, "\u00a0\u00a0");
    const state = await submit({ labSlug: LAB_01, chunkId: "success-test", output: indented });

    expect(state.status === "complete" && state.result.passed).toBe(true);
  });

  it("passes a correct answer for the chunk's own case and records evidence", async () => {
    const state = await submit({ labSlug: LAB_01, chunkId: "success-test", output: EASY_CORRECT });

    expect(state.status).toBe("complete");
    expect(state.status === "complete" && state.result.passed).toBe(true);
    expect(recordVerifiedEvidence).toHaveBeenCalledWith(LAB_01, "success-test");
  });

  /*
   * The QA HIGH this guards. Every lab has an easy guided case and a harder
   * challenge case. The chunk — not the request — decides which case applies,
   * so the easy answer submitted against the Challenge is checked against the
   * Challenge's own case, and fails.
   */
  it("checks a Challenge against its own case, not the lab's easier one", async () => {
    const state = await submit({ labSlug: LAB_01, chunkId: "challenge", output: EASY_CORRECT });

    expect(state.status === "complete" && state.result.passed).toBe(false);
    expect(recordVerifiedEvidence).not.toHaveBeenCalled();
  });

  /* A forged case id field is simply not read any more. */
  it("ignores a case id supplied by the client", async () => {
    const state = await submit({
      labSlug: LAB_01,
      chunkId: "challenge",
      caseId: "lab-01-transform-for-crm",
      output: EASY_CORRECT,
    });

    expect(state.status === "complete" && state.result.passed).toBe(false);
    expect(recordVerifiedEvidence).not.toHaveBeenCalled();
  });

  it("refuses a chunk that is not a test or a challenge", async () => {
    const state = await submit({ labSlug: LAB_01, chunkId: "problem", output: EASY_CORRECT });

    expect(state.status === "error" && state.code).toBe("unknown_case");
    expect(recordVerifiedEvidence).not.toHaveBeenCalled();
  });

  it("refuses a chunk from a different lab", async () => {
    const state = await submit({
      labSlug: "02-conditions-routing",
      chunkId: "does-not-exist",
      output: EASY_CORRECT,
    });

    expect(state.status === "error" && state.code).toBe("unknown_case");
  });

  it("records nothing for a wrong answer", async () => {
    const state = await submit({
      labSlug: LAB_01,
      chunkId: "success-test",
      output: JSON.stringify({ name: "alex rivera" }),
    });

    expect(state.status === "complete" && state.result.passed).toBe(false);
    expect(recordVerifiedEvidence).not.toHaveBeenCalled();
  });

  it("explains empty and malformed submissions", async () => {
    const empty = await submit({ labSlug: LAB_01, chunkId: "success-test", output: "   " });
    expect(empty.status === "error" && empty.code).toBe("empty");

    const broken = await submit({ labSlug: LAB_01, chunkId: "success-test", output: "{ nope" });
    expect(broken.status === "error" && broken.code).toBe("invalid_json");
  });
});
