"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getVisibleNavItems, isNavItemActive } from "@/lib/nav/nav";
import type { UserRole } from "@/lib/session/types";
import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import {
  DOCK_MAGNIFY_SCALE,
  DOCK_NEIGHBOUR_SCALE,
} from "@/lib/motion/motion-tokens";
import { DockItem } from "./DockItem";

/**
 * Floating glass dock (Vision §12).
 *
 * Deliberately not a full-height rectangular sidebar: a small translucent
 * capsule that floats at the left edge on desktop and along the bottom on
 * small screens.
 *
 * Keyboard: plain tab order. Six links inside a nav landmark are not a
 * composite widget, so roving tabindex would remove five of six from the tab
 * sequence and invent an arrow-key contract the learner has to discover.
 */
export function AppDock({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [magnifiedIndex, setMagnifiedIndex] = useState<number | null>(null);
  const items = getVisibleNavItems(role);

  const scaleFor = (index: number): number => {
    if (magnifiedIndex === null) return 1;
    const distance = Math.abs(index - magnifiedIndex);
    if (distance === 0) return DOCK_MAGNIFY_SCALE;
    if (distance === 1) return DOCK_NEIGHBOUR_SCALE;
    return 1;
  };

  return (
    <nav
      aria-label="Primary"
      className={[
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "md:inset-x-auto md:bottom-auto md:left-4 md:top-1/2 md:block",
        "md:-translate-y-1/2 md:pb-0",
      ].join(" ")}
    >
      <ul
        className={[
          "pointer-events-auto flex items-center gap-1 max-md:glass-surface max-md:rounded-dock max-md:p-1.5",
          "md:pointer-events-none md:flex-col md:items-start md:gap-2",
        ].join(" ")}
      >
        {items.map((item, index) => (
          <DockItem
            key={item.href}
            item={item}
            active={isNavItemActive(item.href, pathname)}
            scale={scaleFor(index)}
            reducedMotion={reducedMotion}
            onMagnify={() => setMagnifiedIndex(index)}
            onRelease={() => setMagnifiedIndex(null)}
          />
        ))}
      </ul>
    </nav>
  );
}
