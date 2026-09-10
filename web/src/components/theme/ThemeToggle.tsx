"use client";

import { useId } from "react";
import clsx from "clsx";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme/theme";
import { useIsHydrated } from "@/lib/hydration/use-is-hydrated";
import { useTheme } from "./ThemeProvider";

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/**
 * Native radios inside a fieldset, styled as a segmented control.
 *
 * The browser supplies arrow-key navigation, roving focus and selection
 * semantics for a native radio group, so this control owes no custom keyboard
 * contract. An ARIA `role="radiogroup"` built from buttons would have to
 * implement all of that by hand — the same reasoning that kept the dock on a
 * plain tab order rather than a composite role.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const groupName = useId();

  /*
   * The server cannot know the stored preference, so nothing is marked checked
   * until hydration finishes; otherwise the hydration render would disagree
   * with the server HTML for anyone whose choice is not "system".
   */
  const isHydrated = useIsHydrated();

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 text-sm font-medium text-ink">Appearance</legend>

      <div className="inline-flex w-fit gap-1 rounded-pill border border-line bg-surface-raised p-1">
        {THEME_PREFERENCES.map((option) => {
          const selected = isHydrated && preference === option;
          return (
            <label key={option} className="group cursor-pointer">
              {/* Visually hidden but focusable, so the browser's own radio
                  behaviour drives the control. */}
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={selected}
                onChange={() => setPreference(option)}
                className="peer sr-only"
              />
              <span
                className={clsx(
                  "block rounded-pill px-4 py-1.5 text-sm transition-colors",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                  "peer-focus-visible:outline-accent",
                  selected
                    ? "bg-accent text-on-accent"
                    : "text-ink-soft group-hover:text-ink",
                )}
              >
                {LABELS[option]}
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-ink-muted">
        System follows your device setting and changes with it.
      </p>
    </fieldset>
  );
}
