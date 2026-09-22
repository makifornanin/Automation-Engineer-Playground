import type { Transition } from "motion/react";

/**
 * Motion constants. Vision §11 asks for polished, purposeful movement — spring
 * interactions, never constant motion. Page and lesson switches are immediate.
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

export const INSTANT: Transition = { duration: 0 };

/**
 * Dock magnification is deliberately small so it stays useful, not showy.
 * Lowered from 1.14 to 1.08 for the per-chip dock revision: the hovered chip
 * now carries emphasis twice (scale AND the label's width growth), so the
 * original scale on top of that reads as double emphasis.
 */
export const DOCK_MAGNIFY_SCALE = 1.08;
export const DOCK_NEIGHBOUR_SCALE = 1.06;
export const DOCK_PRESS_SCALE = 0.92;
