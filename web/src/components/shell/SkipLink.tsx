/**
 * First tab stop on every page. Visually hidden until focused, then moves
 * focus to <main>, which carries tabIndex={-1} so it can receive it.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={[
        "sr-only rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent",
        "focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4",
        "focus-visible:top-4 focus-visible:z-[60]",
      ].join(" ")}
    >
      Skip to content
    </a>
  );
}
