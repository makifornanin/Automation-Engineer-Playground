import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getAdminClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin-client", () => ({ getAdminClient }));

import { listLearners } from "./learner-store";

const listUsers = vi.fn();

function user(email: string, overrides: Partial<User> = {}): User {
  return {
    id: email,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getAdminClient.mockResolvedValue({ auth: { admin: { listUsers } } });
});

describe("listLearners", () => {
  it("reads nothing when the caller is not an admin or the key is missing", async () => {
    getAdminClient.mockResolvedValue(null);

    expect(await listLearners()).toEqual({ status: "unavailable" });
    expect(listUsers).not.toHaveBeenCalled();
  });

  /* Invited first: the people waiting are the ones an admin can act on. */
  it("orders invited, then active, then revoked, and by email inside each", async () => {
    listUsers.mockResolvedValue({
      data: {
        users: [
          user("zoe@example.com", { email_confirmed_at: "2026-09-02T00:00:00.000Z" }),
          user("gone@example.com", { banned_until: "2126-01-01T00:00:00.000Z" }),
          user("new@example.com"),
          user("ada@example.com", { email_confirmed_at: "2026-09-02T00:00:00.000Z" }),
        ],
        nextPage: null,
      },
      error: null,
    });

    const list = await listLearners();

    expect(list.status === "ok" && list.learners.map((row) => [row.email, row.status])).toEqual([
      ["new@example.com", "invited"],
      ["ada@example.com", "active"],
      ["zoe@example.com", "active"],
      ["gone@example.com", "revoked"],
    ]);
    expect(list.status === "ok" && list.truncated).toBe(false);
  });

  it("reports a truncated list only when Supabase says another page exists", async () => {
    listUsers.mockResolvedValue({ data: { users: [user("a@example.com")], nextPage: 2 }, error: null });

    const list = await listLearners();

    expect(list.status === "ok" && list.truncated).toBe(true);
  });

  it("says unavailable instead of showing an incomplete list when the read fails", async () => {
    listUsers.mockResolvedValue({ data: { users: [] }, error: { code: "unexpected_failure" } });

    expect(await listLearners()).toEqual({ status: "unavailable" });
  });

  it("says unavailable when the call throws", async () => {
    listUsers.mockRejectedValue(new Error("network down"));

    expect(await listLearners()).toEqual({ status: "unavailable" });
  });
});
