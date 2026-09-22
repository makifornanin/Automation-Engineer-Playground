"use client";

import type { ReactNode } from "react";
import { useIsHydrated } from "@/lib/hydration/use-is-hydrated";
import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

/**
 * Enter-only transition. The App Router unmounts the outgoing page before the
 * incoming one mounts, so an exit animation would need View Transitions or a
 * keying hack — not worth it at Foundation.
 *
 * Motion is gated on hydration. The server must never emit `opacity: 0`
 * around the whole page: that would leave the first paint blank until the
 * bundle loads, and permanently blank without JavaScript — which would defeat
 * the blocking theme script, since a correctly themed but empty page is no
 * better than a flash. The first paint is therefore static, and the enter
 * transition applies only after hydration. CSS waits until the loading
 * boundary is replaced before starting, so a slow server response cannot
 * consume the destination's entrance animation. The transform clears at rest.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const isHydrated = useIsHydrated();
  const animate = isHydrated && !reducedMotion;

  return (
    <div className="page-switch-viewport">
      <div className={animate ? "page-switch page-switch-ready" : "page-switch"}>
        {children}
      </div>
    </div>
  );
}
