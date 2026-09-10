"use client";

import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function matchMediaAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function subscribe(onStoreChange: () => void): () => void {
  if (!matchMediaAvailable()) return () => {};
  const list = window.matchMedia(REDUCED_MOTION_QUERY);
  list.addEventListener("change", onStoreChange);
  return () => list.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  if (!matchMediaAvailable()) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Server render always reports `false` because the OS preference is unknown
 * until hydration. Motion is therefore opt-in on the client, never a
 * server/client mismatch.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
