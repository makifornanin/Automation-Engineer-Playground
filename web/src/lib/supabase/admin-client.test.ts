import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getSession = vi.hoisted(() => vi.fn());
const createClient = vi.hoisted(() => vi.fn(() => ({ auth: {} })));

vi.mock("@/lib/session/get-session", () => ({ getSession }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { getAdminClient } from "./admin-client";

// A placeholder, not a key: the real value never appears in tests.
const PLACEHOLDER = "placeholder-not-a-key";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SECRET_KEY", PLACEHOLDER);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAdminClient", () => {
  it("builds nothing for a student", async () => {
    getSession.mockResolvedValue({
      status: "authenticated",
      user: { id: "u", displayName: "L", role: "student" },
    });

    expect(await getAdminClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("builds nothing for a signed-out caller", async () => {
    getSession.mockResolvedValue({ status: "anonymous" });

    expect(await getAdminClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns null for an admin when the key is not configured", async () => {
    getSession.mockResolvedValue({
      status: "authenticated",
      user: { id: "a", displayName: "O", role: "admin" },
    });
    vi.stubEnv("SUPABASE_SECRET_KEY", "");

    expect(await getAdminClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("builds a client that never stores or refreshes a session for an admin", async () => {
    getSession.mockResolvedValue({
      status: "authenticated",
      user: { id: "a", displayName: "O", role: "admin" },
    });

    expect(await getAdminClient()).not.toBeNull();
    expect(createClient).toHaveBeenCalledWith("https://project.supabase.co", PLACEHOLDER, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  });
});
