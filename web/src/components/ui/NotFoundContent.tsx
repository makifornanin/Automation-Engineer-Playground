import Link from "next/link";

export function NotFoundContent() {
  return (
    <>
      <p className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">That page does not exist.</h1>
      <p className="max-w-prose text-ink-soft">
        The link may be old, or the section may not be built yet.
      </p>
      <Link href="/" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
        Back to Home
      </Link>
    </>
  );
}
