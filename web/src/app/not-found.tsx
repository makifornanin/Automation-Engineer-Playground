import Link from "next/link";

/**
 * Lives outside the (app) group, so it renders without the dock. It still uses
 * the shell tokens, and the blocking theme script has already set data-theme,
 * so it paints in the correct theme.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start justify-center gap-4 px-5">
      <p className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        That page does not exist.
      </h1>
      <p className="max-w-prose text-ink-soft">
        The link may be old, or the section may not be built yet.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Back to Home
      </Link>
    </main>
  );
}
