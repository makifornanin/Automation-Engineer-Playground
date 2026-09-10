"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` makes every motion component in the tree honour the
 * OS preference automatically, so a component that forgets to check the hook
 * still cannot animate against the learner's wishes.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
