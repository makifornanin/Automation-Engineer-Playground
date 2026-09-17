"use client";

import Link from "next/link";

/**
 * What a signed-in page shows when it throws, instead of Next's raw error
 * screen. It renders inside the app shell, so the dock stays and the learner
 * is never stranded.
 *
 * Most reads already fail safe — progress falls back rather than throwing — so
 * reaching this means something unexpected. The message stays plain and never
 * shows the error itself: a Server Component error arrives with its details
 * stripped, and a learner cannot act on a stack trace anyway. `retry` re-fetches
 * the segment, which is what recovers a transient network or database failure.
 */
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Something went wrong on our side.
      </h1>
      <p className="max-w-prose text-ink-soft">
        Your saved progress and notes are safe. Try again, and if it keeps happening, head back
        Home and come back to this page in a minute.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="w-fit rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link href="/" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
