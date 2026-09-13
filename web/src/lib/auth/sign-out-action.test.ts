import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignOut = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockRedirect = vi.fn((url: string) => {
  // Mirrors real Next.js behaviour: redirect() throws, it never returns.
  throw new Error(`REDIRECT:${url}`);
});

/** Minimal fake cookie jar: enough of Next's `ReadonlyRequestCookies` /
 * mutable cookie-store surface for `getAll()` and `delete()`. */
function buildCookieStore(initial: { name: string; value: string }[]) {
  const cookies = new Map(initial.map((cookie) => [cookie.name, cookie]));
  return {
    getAll: () => Array.from(cookies.values()),
    delete: (name: string) => {
      cookies.delete(name);
    },
  };
}

let cookieStore = buildCookieStore([]);

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

function buildClient() {
  return { auth: { signOut: mockSignOut } };
}

beforeEach(() => {
  mockSignOut.mockReset();
  mockCreateSupabaseServerClient.mockReset();
  mockRedirect.mockClear();
  cookieStore = buildCookieStore([
    { name: "sb-access-token", value: "at" },
    { name: "sb-refresh-token", value: "rt" },
    { name: "theme", value: "dark" },
  ]);
});

describe("signOutAction", () => {
  it("REGRESSION: calls signOut with scope: 'local', never the global default", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignOut.mockResolvedValue({ error: null });

    const { signOutAction } = await import("./sign-out-action");
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/sign-in");

    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("clears every sb-* cookie and leaves unrelated cookies alone", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignOut.mockResolvedValue({ error: null });

    const { signOutAction } = await import("./sign-out-action");
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/sign-in");

    const remaining = cookieStore.getAll().map((cookie) => cookie.name);
    expect(remaining).toEqual(["theme"]);
  });

  it("redirects to /sign-in on success", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignOut.mockResolvedValue({ error: null });

    const { signOutAction } = await import("./sign-out-action");
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/sign-in");

    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });

  it("FAIL-SAFE: still clears cookies and redirects when signOut() throws", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignOut.mockRejectedValue(new Error("network down"));

    const { signOutAction } = await import("./sign-out-action");
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/sign-in");

    expect(cookieStore.getAll().map((cookie) => cookie.name)).toEqual(["theme"]);
    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });

  it("FAIL-SAFE: still clears cookies and redirects when Supabase is unconfigured (null client)", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(null);

    const { signOutAction } = await import("./sign-out-action");
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/sign-in");

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(cookieStore.getAll().map((cookie) => cookie.name)).toEqual(["theme"]);
    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });
});
