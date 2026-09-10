import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Frosted chrome surface used for cards and the dock capsule. The visual
 * definition lives in the `.glass-surface` utility in globals.css so both
 * themes stay in one place.
 */
export function GlassSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx("glass-surface rounded-card", className)}>{children}</div>
  );
}
