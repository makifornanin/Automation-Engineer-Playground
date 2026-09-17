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
vi.mock("@/lib/course/progress-store", () => ({
  getCourseProgress: async () => ({
    completedLabSlugs: ["01-data-mapping-transformation", "02-conditions-routing"],
    inProgressLabSlug: "03-apis-webhooks",
    labs: {},
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revealNextHint } from "./hint-actions";

beforeEach(() => {
  upsert.mockClear();
});

/*
 * A browser can call this action with any arguments, so the lock has to hold
 * here too: a locked lab's challenge hints are hands-on content.
 */
describe("revealNextHint", () => {
  it("serves the next hint for a lab the learner has open", async () => {
    const hint = await revealNextHint("03-apis-webhooks", "challenge", 0);

    expect(hint).toMatchObject({ index: 0 });
    expect(hint?.text.length).toBeGreaterThan(0);
  });

  it("serves nothing, and records nothing, for a locked lab", async () => {
    const hint = await revealNextHint("07-idempotency-duplicate-protection", "challenge", 0);

    expect(hint).toBeNull();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("serves nothing for a chunk that is not a challenge", async () => {
    expect(await revealNextHint("03-apis-webhooks", "success-test", 0)).toBeNull();
  });
});
