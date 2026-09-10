"use client";

import { useSyncExternalStore } from "react";

/** Nothing external to watch: this only distinguishes server from client. */
const noopSubscribe = () => () => {};

/**
 * `false` during server render and during the hydration render, `true`
 * afterwards.
 *
 * This is the supported way to render differently on server and client:
 * React re-renders after hydration instead of warning about a mismatch.
 * Doing the same thing with `useState` + `useEffect` would trip
 * `react-hooks/set-state-in-effect`.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
