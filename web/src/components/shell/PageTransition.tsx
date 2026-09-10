"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { INSTANT, PAGE_ENTER, PAGE_ENTER_OFFSET_PX } from "@/lib/motion/motion-tokens";
import { useIsHydrated } from "@/lib/hydration/use-is-hydrated";
import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

/**
 * Enter-only transition. The App Router unmounts the outgoing page before the
 * incoming one mounts, so an exit animation would need View Transitions or a
 * keying hack — not worth it at Foundation.
 *
 * `initial` is gated on hydration. The server must never emit `opacity: 0`
 * around the whole page: that would leave the first paint blank until the
 * bundle loads, and permanently blank without JavaScript — which would defeat
 * the blocking theme script, since a correctly themed but empty page is no
 * better than a flash. The first paint is therefore static, and the enter
 * transition applies only to client-side navigations, where a template
 * remounts with hydration already complete.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const isHydrated = useIsHydrated();
  const animate = isHydrated && !reducedMotion;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: PAGE_ENTER_OFFSET_PX } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={animate ? PAGE_ENTER : INSTANT}
    >
      {children}
    </motion.div>
  );
}
