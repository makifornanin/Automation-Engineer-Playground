import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.hoisted(() => vi.fn(async () => ({ error: null })));

vi.mock("@/lib/session/get-session", () => ({
  getSession: async () => ({
    status: "authenticated",
    user: { id: "learner-1", displayName: "L", role: "student" },
  }),
}));
vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: async () => ({ from: () => ({ upsert }) }),
}));
vi.mock("./progress-store", () => ({
  getCourseProgress: async () => ({
    completedLabSlugs: ["01-data-mapping-transformation", "02-conditions-routing"],
    inProgressLabSlug: "03-apis-webhooks",
    labs: {},
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { recordChunkEvidence, setCurrentChunk } from "./progress-actions";

const LAB_03 = "03-apis-webhooks";

beforeEach(() => {
  upsert.mockClear();
});

/*
 * Every export of this module is a Server Action a browser can call with any
 * arguments. These tests call them exactly as a hostile browser would — the
 * real actions over the real writers, with only the database mocked.
 */
describe("progress actions — what a browser can reach", () => {
  it("cannot award verified evidence by naming a test or challenge chunk", async () => {
    await recordChunkEvidence(LAB_03, "success-test");
    await recordChunkEvidence(LAB_03, "challenge");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("cannot write to a locked lab", async () => {
    await recordChunkEvidence("07-idempotency-duplicate-protection", "build-memory");
    await setCurrentChunk("07-idempotency-duplicate-protection", "problem");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("still records the evidence a build step earns", async () => {
    await recordChunkEvidence(LAB_03, "build-webhook");

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ chunk_id: "build-webhook", evidence: "acknowledged" }),
      expect.anything(),
    );
  });

  it("exposes only the two learner-triggered writes", async () => {
    const actions = await import("./progress-actions");

    expect(Object.keys(actions).sort()).toEqual(["recordChunkEvidence", "setCurrentChunk"]);
  });
});
