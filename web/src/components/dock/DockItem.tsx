"use client";

import Link from "next/link";
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
      className="list-none"
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
        aria-current={active ? "page" : undefined}
        className={clsx(
          "group flex flex-col items-center gap-1 rounded-pill px-2 py-2 text-ink-soft",
          "transition-colors md:flex-row md:gap-0 md:px-2.5",
          "hover:text-ink focus-visible:text-ink",
          // --accent on an --accent-soft tint composites to 4.21:1 and fails
          // AA. --accent-ink is the darker value that clears it (5.46:1).
          active && "bg-accent-soft text-accent-ink hover:text-accent-ink",
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
      </Link>
    </motion.li>
  );
}
