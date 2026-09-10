import type { ReactNode } from "react";

/**
 * Shared frame for the Foundation placeholder screens. These pages are
 * deliberately thin: Vision §15 rules out padding a screen with cards to make
 * it feel finished, and there is no data source behind any of them yet.
 */
export function PagePlaceholder({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {intro ? <p className="max-w-prose text-ink-soft">{intro}</p> : null}
      </header>
      {children}
    </div>
  );
}
