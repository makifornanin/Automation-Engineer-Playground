import { describe, expect, it, vi } from "vitest";
import { CAPSTONE_PROOFS } from "@/lib/lesson/content/capstone";
import { CAPSTONE_SLUG, LABS } from "./catalog";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session/get-session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/supabase/server-client", () => ({ createSupabaseServerClient: vi.fn() }));

import { assembleProgress, fallbackProgress } from "./progress-store";

const CAPSTONE_ROW = { lab_slug: CAPSTONE_SLUG, current_chunk_id: null, completed_at: null };

function verified(chunkId: string) {
  return { lab_slug: CAPSTONE_SLUG, chunk_id: chunkId, evidence: "verified" as const };
}

describe("assembleProgress — the Capstone", () => {
  it("is neither started nor completed without a row", () => {
    expect(assembleProgress([], []).capstone).toEqual({ started: false, completed: false });
    expect(fallbackProgress().capstone).toEqual({ started: false, completed: false });
  });

  it("is started once it has a row", () => {
    expect(assembleProgress([CAPSTONE_ROW], []).capstone).toEqual({
      started: true,
      completed: false,
    });
  });

  it("is completed only when every current proof is verified", () => {
    const allButOne = CAPSTONE_PROOFS.slice(0, -1).map((proof) => verified(proof.id));
    const all = CAPSTONE_PROOFS.map((proof) => verified(proof.id));

    expect(assembleProgress([CAPSTONE_ROW], allButOne).capstone.completed).toBe(false);
    expect(assembleProgress([CAPSTONE_ROW], all).capstone.completed).toBe(true);
  });

  /* One progression system: Capstone rows never count as a lab. */
  it("leaves lab completion and the current lab untouched", () => {
    const progress = assembleProgress(
      [CAPSTONE_ROW],
      CAPSTONE_PROOFS.map((proof) => verified(proof.id)),
    );

    expect(progress.completedLabSlugs).toEqual([]);
    expect(progress.inProgressLabSlug).toBeNull();
    expect(LABS.some((lab) => lab.slug === CAPSTONE_SLUG)).toBe(false);
  });
});
