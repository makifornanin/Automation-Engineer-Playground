import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fireMediaChange, removeMatchMedia, setMatchMedia } from "../../../vitest.setup";
import {
  REDUCED_MOTION_QUERY,
  usePrefersReducedMotion,
} from "./use-prefers-reduced-motion";

describe("usePrefersReducedMotion", () => {
  it("reports false when the OS does not request reduced motion", () => {
    setMatchMedia(() => false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reports true when the OS requests reduced motion", () => {
    setMatchMedia((query) => query === REDUCED_MOTION_QUERY);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the preference changes while mounted", () => {
    setMatchMedia(() => false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      setMatchMedia((query) => query === REDUCED_MOTION_QUERY);
      fireMediaChange(REDUCED_MOTION_QUERY, true);
    });

    expect(result.current).toBe(true);
  });

  it("returns false and does not throw when matchMedia is unavailable", () => {
    removeMatchMedia();
    expect(() => renderHook(() => usePrefersReducedMotion())).not.toThrow();
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
