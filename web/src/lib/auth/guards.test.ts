import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin, requireSession } from "./guards";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("@/lib/session/get-session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

beforeEach(() => {
  mockGetSession.mockReset();
  mockRedirect.mockClear();
  mockNotFound.mockClear();
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

    await expect(requireSession()).rejects.toThrow("REDIRECT:/sign-in");
  });
});

describe("requireAdmin", () => {
  it("returns an admin session", async () => {
    const session = {
      status: "authenticated" as const,
      user: { id: "admin-1", displayName: "Owner", role: "admin" as const },
    };
    mockGetSession.mockResolvedValue(session);

    await expect(requireAdmin()).resolves.toBe(session);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("answers a signed-in student with not found", async () => {
    mockGetSession.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1", displayName: "Ada", role: "student" },
    });

    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });

  it("sends a signed-out visitor to sign in before any role check", async () => {
    mockGetSession.mockResolvedValue({ status: "anonymous" });

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/sign-in");
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
