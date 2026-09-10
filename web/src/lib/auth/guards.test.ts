import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSession } from "./guards";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/session/get-session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

beforeEach(() => {
  mockGetSession.mockReset();
  mockRedirect.mockReset();
});

describe("requireSession", () => {
  it("returns the authenticated session without redirecting", async () => {
    const session = {
      status: "authenticated" as const,
      user: { id: "user-1", displayName: "Ada", role: "student" as const },
    };
    mockGetSession.mockResolvedValue(session);

    const result = await requireSession();

    expect(result).toBe(session);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /sign-in when the session is anonymous", async () => {
    mockGetSession.mockResolvedValue({ status: "anonymous" });

    await requireSession();

    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });
});
