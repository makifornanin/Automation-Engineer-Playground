"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DARK_MEDIA_QUERY,
  applyResolvedTheme,
  getSystemPrefersDark,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  /*
   * The initial value is read lazily so the very first client render already
   * holds the learner's real preference. If this were seeded with "system" and
   * corrected in an effect, a stored "dark" on a light OS would repaint after
   * hydration — exactly the flash the inline script exists to prevent.
   */
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredTheme(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredTheme(), getSystemPrefersDark()),
  );

  useEffect(() => {
    const apply = () => {
      const next = resolveTheme(preference, getSystemPrefersDark());
      setResolvedTheme(next);
      applyResolvedTheme(next);
    };

    apply();

    // Only "system" needs to track the OS. An explicit choice must not move.
    if (preference !== "system") return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(DARK_MEDIA_QUERY);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeStoredTheme(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return context;
}
