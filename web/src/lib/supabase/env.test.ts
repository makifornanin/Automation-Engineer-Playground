import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseConfig", () => {
  it("returns the url and publishable key when both are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key-value");

    expect(getSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key-value",
    });
  });

  it("returns null when the url is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key-value");

    expect(getSupabaseConfig()).toBeNull();
  });

  it("returns null when the publishable key is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

    expect(getSupabaseConfig()).toBeNull();
  });

  it("returns null when both are unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

    expect(getSupabaseConfig()).toBeNull();
  });

  it("treats an empty-string url as missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key-value");

    expect(getSupabaseConfig()).toBeNull();
  });

  it("treats an empty-string publishable key as missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(getSupabaseConfig()).toBeNull();
  });
});

/**
 * Each of these tests uses `vi.resetModules()` + a dynamic `import()` so it
 * gets its own fresh copy of `env.ts`'s module-scope "have I warned yet?"
 * flag, isolated from every other test in this file (several of which above
 * also call `getSupabaseConfig()` with missing config on the statically
 * imported module instance).
 */
describe("missing-config warning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns once per process, not once per call, while config stays missing", async () => {
    vi.resetModules();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

    const { getSupabaseConfig } = await import("./env");
    getSupabaseConfig();
    getSupabaseConfig();
    getSupabaseConfig();

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("does not warn when config is present", async () => {
    vi.resetModules();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key-value");

    const { getSupabaseConfig } = await import("./env");
    getSupabaseConfig();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("never includes a provided value in the warning message", async () => {
    vi.resetModules();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://should-not-appear.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { getSupabaseConfig } = await import("./env");
    getSupabaseConfig();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0]?.[0];
    expect(typeof message).toBe("string");
    expect(message).not.toContain("should-not-appear");
  });

  it("does not throw and does not change the return value", async () => {
    vi.resetModules();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

    const { getSupabaseConfig } = await import("./env");

    expect(() => getSupabaseConfig()).not.toThrow();
    expect(getSupabaseConfig()).toBeNull();
  });
});
