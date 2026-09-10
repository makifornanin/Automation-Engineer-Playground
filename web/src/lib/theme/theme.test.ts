import { describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  isThemePreference,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
} from "./theme";

describe("resolveTheme", () => {
  it.each([
    ["light" as const, false, "light"],
    ["light" as const, true, "light"],
    ["dark" as const, false, "dark"],
    ["dark" as const, true, "dark"],
    ["system" as const, false, "light"],
    ["system" as const, true, "dark"],
  ])(
    "preference %s with systemPrefersDark=%s resolves to %s",
    (preference, systemPrefersDark, expected) => {
      expect(resolveTheme(preference, systemPrefersDark)).toBe(expected);
    },
  );
});

describe("isThemePreference", () => {
  it("accepts the three supported values", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isThemePreference("Dark")).toBe(false);
    expect(isThemePreference("")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
    expect(isThemePreference(1)).toBe(false);
  });
});

describe("readStoredTheme", () => {
  it("returns 'system' when storage is empty", () => {
    expect(readStoredTheme()).toBe("system");
  });

  it("returns the stored value when it is valid", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("returns 'system' when the stored value is corrupt", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "neon-purple");
    expect(readStoredTheme()).toBe("system");
  });

  it("returns 'system' and does not throw when localStorage access throws", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: site data is blocked");
    });
    expect(() => readStoredTheme()).not.toThrow();
    expect(readStoredTheme()).toBe("system");
  });
});

describe("writeStoredTheme", () => {
  it("persists a valid preference", () => {
    writeStoredTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("does not throw when localStorage access throws", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writeStoredTheme("light")).not.toThrow();
  });
});
