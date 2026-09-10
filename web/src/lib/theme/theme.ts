/**
 * Theme model for AEP.
 *
 * The learner picks one of three preferences. `system` follows the OS. Only the
 * two resolved values ever reach the DOM, as `data-theme` on <html>, which is
 * what the token layer in `globals.css` switches on.
 */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "aep-theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  "light",
  "dark",
  "system",
];

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}

/**
 * Every storage read is wrapped: private windows and blocked site data throw on
 * access rather than returning null, and the app must still render.
 */
export function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeStoredTheme(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* Preference simply does not persist. Not worth interrupting the learner. */
  }
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

/**
 * `colorScheme` is set alongside `data-theme` so native scrollbars, form
 * controls and focus rings paint from the correct palette on the first frame.
 */
export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}
