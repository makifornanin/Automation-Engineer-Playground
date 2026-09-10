import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveSession } from "./get-session";

// `server-only`'s default export throws outside a `react-server` condition,
// which is exactly the condition Vitest runs under. `vi.mock` is hoisted, so
// the throwing module is replaced before get-session.ts ever evaluates it.
vi.mock("server-only", () => ({}));

// Names must start with "mock" so Vitest's hoisting transform lifts these
// declarations above the `vi.mock` factory below, which references them.
const mockGetUser = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: (...args: unknown[]) =>
    mockCreateSupabaseServerClient(...args),
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  mockGetUser.mockReset();
  mockCreateSupabaseServerClient.mockReset();
  mockCreateSupabaseServerClient.mockResolvedValue({ auth: { getUser: mockGetUser } });
});

describe("resolveSession", () => {
  it("is anonymous when Supabase config is missing (client is null)", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(null);

    const session = await resolveSession();

    expect(session).toEqual({ status: "anonymous" });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("is anonymous when auth.getUser() resolves with no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const session = await resolveSession();

    expect(session).toEqual({ status: "anonymous" });
  });

  it("is authenticated with a mapped session user when a user is signed in", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: buildUser({
          id: "user-456",
          app_metadata: { role: "admin" },
          user_metadata: { full_name: "Ada Lovelace" },
        }),
      },
      error: null,
    });

    const session = await resolveSession();

    expect(session).toEqual({
      status: "authenticated",
      user: { id: "user-456", role: "admin", displayName: "Ada Lovelace" },
    });
  });

  it("is anonymous when createSupabaseServerClient rejects", async () => {
    mockCreateSupabaseServerClient.mockRejectedValue(new Error("network down"));

    const session = await resolveSession();

    expect(session).toEqual({ status: "anonymous" });
  });

  it("is anonymous when auth.getUser() rejects", async () => {
    mockGetUser.mockRejectedValue(new Error("Supabase 500"));

    const session = await resolveSession();

    expect(session).toEqual({ status: "anonymous" });
  });

  it("calls auth.getUser(), never Supabase's own client-side getSession()", async () => {
    const getSessionSpy = vi.fn();
    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: { getUser: mockGetUser, getSession: getSessionSpy },
    });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await resolveSession();

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(getSessionSpy).not.toHaveBeenCalled();
  });
});
