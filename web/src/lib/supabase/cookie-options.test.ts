import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `SUPABASE_COOKIE_OPTIONS` is read once at module-init time (its `secure`
 * value depends on `NEXT_PUBLIC_SITE_URL`), so each test that varies that
 * env var needs a fresh module instance: `vi.resetModules()` + a dynamic
 * `import()`, the same isolation pattern `env.test.ts` uses for
 * `NEXT_PUBLIC_SUPABASE_URL`.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadCookieOptions() {
  const mod = await import("./cookie-options");
  return mod.SUPABASE_COOKIE_OPTIONS;
}

describe("SUPABASE_COOKIE_OPTIONS", () => {
  it("is always httpOnly, sameSite=lax, path=/", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.resetModules();

    const options = await loadCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("sets secure=true when NEXT_PUBLIC_SITE_URL starts with https://", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://aep.example.com");
    vi.resetModules();

    const options = await loadCookieOptions();

    expect(options.secure).toBe(true);
  });

  it("sets secure=false when NEXT_PUBLIC_SITE_URL is http://", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.resetModules();

    const options = await loadCookieOptions();

    expect(options.secure).toBe(false);
  });

  it("sets secure=false when NEXT_PUBLIC_SITE_URL is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.resetModules();

    const options = await loadCookieOptions();

    expect(options.secure).toBe(false);
  });
});

describe("cookieOptions wiring", () => {
  /**
   * The security-critical regression this whole file exists for: applying
   * `SUPABASE_COOKIE_OPTIONS` to only one of the two `createServerClient`
   * factories silently downgrades auth cookies (drops HttpOnly) the next
   * time the other factory refreshes a token. Both factories must forward
   * the exact same constant.
   */
  it("server-client.ts passes SUPABASE_COOKIE_OPTIONS as cookieOptions to createServerClient", async () => {
    vi.resetModules();
    const mockCreateServerClient = vi.fn().mockReturnValue({});

    // `server-only`'s default export throws outside a `react-server`
    // condition; see `get-session.test.ts` for the same pattern.
    vi.doMock("server-only", () => ({}));
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: mockCreateServerClient,
    }));
    vi.doMock("next/headers", () => ({
      cookies: async () => ({ getAll: () => [], set: () => {} }),
    }));
    vi.doMock("./env", () => ({
      getSupabaseConfig: () => ({
        url: "https://example.supabase.co",
        publishableKey: "publishable-key",
      }),
    }));

    const { createSupabaseServerClient } = await import("./server-client");
    const { SUPABASE_COOKIE_OPTIONS } = await import("./cookie-options");

    await createSupabaseServerClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ cookieOptions: SUPABASE_COOKIE_OPTIONS }),
    );
  });

  it("middleware-client.ts passes SUPABASE_COOKIE_OPTIONS as cookieOptions to createServerClient", async () => {
    vi.resetModules();
    const { NextRequest } = await import("next/server");
    const mockCreateServerClient = vi.fn().mockReturnValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });

    vi.doMock("@supabase/ssr", () => ({
      createServerClient: mockCreateServerClient,
    }));
    vi.doMock("./env", () => ({
      getSupabaseConfig: () => ({
        url: "https://example.supabase.co",
        publishableKey: "publishable-key",
      }),
    }));

    const { updateSession } = await import("./middleware-client");
    const { SUPABASE_COOKIE_OPTIONS } = await import("./cookie-options");

    const request = new NextRequest(new URL("/labs", "https://aep.example"));
    await updateSession(request);

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ cookieOptions: SUPABASE_COOKIE_OPTIONS }),
    );
  });
});
