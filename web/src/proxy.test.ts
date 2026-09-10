import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mockUpdateSession = vi.fn();

vi.mock("@/lib/supabase/middleware-client", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

import { config, proxy } from "./proxy";

function buildRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "https://aep.example"));
}

/**
 * `config.matcher` and `isProtectedPath()` are two independently evaluated
 * layers — Next requires the matcher to be statically analysable, so it
 * cannot call the shared function. This compares them behaviourally instead
 * of trusting a hand edit kept them in sync.
 */
function proxyRunsOn(pathname: string): boolean {
  const pattern = config.matcher[0];
  return new RegExp(`^${pattern}$`).test(pathname);
}

describe("proxy matcher", () => {
  it.each([
    ["/", true],
    ["/admin", true],
    ["/sign-in", false],
    ["/sign-in/callback", false],
    // Regression: a route that merely shares the "sign-in" text prefix must
    // still be matched (protected), not silently bypass the matcher.
    ["/sign-in-help", true],
    ["/_next/static/x.js", false],
    ["/_next/image", false],
    ["/favicon.ico", false],
  ])("proxy runs on %s: %s", (pathname, expected) => {
    expect(proxyRunsOn(pathname)).toBe(expected);
  });
});

describe("proxy redirect", () => {
  it("copies cookies from the refreshed response onto the redirect response", async () => {
    const refreshedResponse = NextResponse.next();
    refreshedResponse.cookies.set("sb-access-token", "refreshed-value", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    mockUpdateSession.mockResolvedValue({ response: refreshedResponse, user: null });

    const result = await proxy(buildRequest("/admin"));

    expect(result.headers.get("location")).toContain("/sign-in");
    const cookie = result.cookies.get("sb-access-token");
    expect(cookie?.value).toBe("refreshed-value");
    expect(cookie?.httpOnly).toBe(true);
  });

  it("passes the refreshed response straight through when the path is public", async () => {
    const passthroughResponse = NextResponse.next();
    mockUpdateSession.mockResolvedValue({ response: passthroughResponse, user: null });

    const result = await proxy(buildRequest("/sign-in"));

    expect(result).toBe(passthroughResponse);
  });

  it("passes the response straight through when a user is signed in", async () => {
    const authenticatedResponse = NextResponse.next();
    mockUpdateSession.mockResolvedValue({
      response: authenticatedResponse,
      user: { id: "user-1" },
    });

    const result = await proxy(buildRequest("/admin"));

    expect(result).toBe(authenticatedResponse);
  });
});
