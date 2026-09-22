"use client";

import Link, { useLinkStatus } from "next/link";
import clsx from "clsx";
import { motion } from "motion/react";
import type { NavItem } from "@/lib/nav/nav-items";
import {
  DOCK_PRESS_SCALE,
  INSTANT,
  SPRING_HOVER,
  SPRING_PRESS,
} from "@/lib/motion/motion-tokens";
import { DockIcon } from "./DockIcons";

interface DockItemProps {
  item: NavItem;
  active: boolean;
  /** Magnification target, computed by <AppDock /> from pointer proximity. */
  scale: number;
  reducedMotion: boolean;
  onMagnify: () => void;
  onRelease: () => void;
}

function NavigationFeedback() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span role="status" className="dock-pending">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      Opening…
    </span>
  ) : null;
}

export function DockItem({
  item,
  active,
  scale,
  reducedMotion,
  onMagnify,
  onRelease,
}: DockItemProps) {
  return (
    <motion.li
      className="list-none origin-center md:origin-left md:pointer-events-auto"
      // Motion auto-adds tabindex="0" here because whileTap is set below; the
      // inner <Link> is the real target and already handles Enter natively,
      // so -1 drops this phantom stop from the tab sequence without touching
      // whileTap or the pointer-driven press animation it still needs to run.
      tabIndex={-1}
      animate={{ scale: reducedMotion ? 1 : scale }}
      transition={reducedMotion ? INSTANT : SPRING_HOVER}
      whileTap={
        reducedMotion
          ? undefined
          : { scale: scale * DOCK_PRESS_SCALE, transition: SPRING_PRESS }
      }
      /*
       * Magnification is driven by pointer events and ignores any pointer type
       * other than a mouse, so a touch device never magnifies.
       */
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onMagnify();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") onRelease();
      }}
    >
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        data-active={active ? "true" : undefined}
        className={clsx(
          "group glass-chip relative flex flex-col items-center gap-1 rounded-pill px-2 py-2 text-ink-soft",
          "transition-colors md:flex-row md:gap-0 md:p-3",
          "hover:text-ink focus-visible:text-ink",
          // --accent on an --accent-soft tint composites to 4.21:1 and fails
          // AA. --accent-ink is the darker value that clears it (5.46:1). The
          // tint itself now comes from glass-chip's data-active rule, which
          // layers over the glass fill instead of replacing it.
          active && "text-accent-ink hover:text-accent-ink",
        )}
      >
        <DockIcon name={item.icon} className="size-6 shrink-0 md:size-5" />
        {/*
          The label is always in the DOM. On desktop CSS collapses it at rest
          and reveals it on hover or keyboard focus, so the keyboard path is
          structurally identical to the mouse path rather than a second
          behaviour that can drift. Collapsing with max-width/opacity (not
          `display:none`) keeps it in the accessibility tree, so the link
          keeps its name for screen readers while it reads as icon-only.
        */}
        <span
          className={clsx(
            "whitespace-nowrap text-[10px] leading-none",
            "md:max-w-0 md:overflow-hidden md:text-sm md:opacity-0",
            "md:transition-all md:duration-200 md:ease-out",
            "md:group-hover:ml-2 md:group-hover:max-w-32 md:group-hover:opacity-100",
            "md:group-focus-visible:ml-2 md:group-focus-visible:max-w-32",
            "md:group-focus-visible:opacity-100",
          )}
        >
          {item.label}
        </span>
        <NavigationFeedback />
      </Link>
    </motion.li>
  );
}
