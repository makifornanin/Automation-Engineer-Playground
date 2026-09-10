import type { Transition } from "motion/react";

/**
 * Motion constants. Vision §11 asks for polished, purposeful movement — spring
 * interactions and smooth page transitions, never constant motion.
 *
 * Every consumer must fall back to `INSTANT` when the learner has asked for
 * reduced motion.
 */
export const SPRING_PRESS: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 26,
  mass: 0.6,
};

export const SPRING_HOVER: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 24,
  mass: 0.5,
};

export const PAGE_ENTER: Transition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1],
};

export const INSTANT: Transition = { duration: 0 };

/** Dock magnification is deliberately small so it stays useful, not showy. */
export const DOCK_MAGNIFY_SCALE = 1.14;
export const DOCK_NEIGHBOUR_SCALE = 1.06;
export const DOCK_PRESS_SCALE = 0.92;

export const PAGE_ENTER_OFFSET_PX = 8;
