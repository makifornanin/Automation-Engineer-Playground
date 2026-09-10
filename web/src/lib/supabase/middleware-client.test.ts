import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSession } from "./middleware-client";

/**
 * The no-config live path short-circuits before ever writing a cookie, so
 * nothing exercises this file's `setAll` adapter without these tests. No
 * Supabase project is needed: `createServerClient` is stubbed so the test
 * can invoke the exact `cookies.setAll` callback this module hands it, the
 * same way the real library would when it refreshes a token.
 */

let capturedCookiesAdapter: {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: { name: string; value: string; options: Record<string, unknown> }[],
    headers: Record<string, string>,
  ) => void;
};

const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("./env", () => ({
  getSupabaseConfig: () => ({ url: "https://example.supabase.co", anonKey: "anon-key" }),
}));

function buildRequest(pathname = "/labs"): NextRequest {
  return new NextRequest(new URL(pathname, "https://aep.example"));
}

beforeEach(() => {
  mockCreateServerClient.mockReset();
});

/**
 * Simulates the library refreshing a token: `createServerClient` captures
 * the adapter this module built, and `auth.getUser()` (the only method
 * `updateSession` calls) invokes `setAll` with fake refreshed-cookie data
 * before resolving, exactly as `@supabase/ssr` would on a real refresh.
 */
function stubClientThatRefreshesOneCookie(): void {
  mockCreateServerClient.mockImplementation((_url, _key, options) => {
    capturedCookiesAdapter = options.cookies;
    return {
      auth: {
        getUser: async () => {
          capturedCookiesAdapter.setAll(
            [
              {
                name: "sb-access-token",
                value: "refreshed-value",
                options: { httpOnly: true, sameSite: "lax", secure: true, path: "/" },
              },
            ],
            { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" },
          );
          return { data: { user: null }, error: null };
        },
      },
    };
  });
}

describe("updateSession cookie forwarding", () => {
  it("writes a refreshed cookie to BOTH the mutable request cookies and the response", async () => {
    stubClientThatRefreshesOneCookie();
    const request = buildRequest();

    const { response } = await updateSession(request);

    expect(request.cookies.get("sb-access-token")?.value).toBe("refreshed-value");
    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed-value");
  });

  it("forwards the options argument to the response write, not just name/value", async () => {
    stubClientThatRefreshesOneCookie();
    const request = buildRequest();

    const { response } = await updateSession(request);

    const cookie = response.cookies.get("sb-access-token");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.secure).toBe(true);
    expect(cookie?.path).toBe("/");
  });

  it("forwards the headers argument onto the response", async () => {
    stubClientThatRefreshesOneCookie();
    const request = buildRequest();

    const { response } = await updateSession(request);

    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
  });

  it("passes the resolved user straight through", async () => {
    const fakeUser = { id: "user-1" };
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookiesAdapter = options.cookies;
      return {
        auth: {
          getUser: async () => ({ data: { user: fakeUser }, error: null }),
        },
      };
    });

    const { user } = await updateSession(buildRequest());

    expect(user).toBe(fakeUser);
  });

  it("is anonymous and never throws when the client rejects", async () => {
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookiesAdapter = options.cookies;
      return {
        auth: {
          getUser: async () => {
            throw new Error("network down");
          },
        },
      };
    });

    const { user } = await updateSession(buildRequest());

    expect(user).toBeNull();
  });
});
