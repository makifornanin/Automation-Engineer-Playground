import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * jsdom does not implement `window.matchMedia`. The theme resolver and the
 * reduced-motion hook both depend on it, so tests install a controllable stub
 * here. `setMatchMedia(...)` lets a test decide which queries match and
 * `fireMediaChange(...)` replays a `change` event to registered listeners.
 */
type MediaListener = (event: MediaQueryListEvent) => void;

const listeners = new Map<string, Set<MediaListener>>();
let matches: (query: string) => boolean = () => false;

export function setMatchMedia(resolver: (query: string) => boolean): void {
  matches = resolver;
}

export function fireMediaChange(query: string, nextMatches: boolean): void {
  const event = { matches: nextMatches, media: query } as MediaQueryListEvent;
  listeners.get(query)?.forEach((listener) => listener(event));
}

/** Removes `window.matchMedia` entirely, for the "unsupported browser" path. */
export function removeMatchMedia(): void {
  Reflect.deleteProperty(window, "matchMedia");
}

function installMatchMedia(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => {
      const register = (listener: MediaListener) => {
        const set = listeners.get(query) ?? new Set<MediaListener>();
        set.add(listener);
        listeners.set(query, set);
      };
      const unregister = (listener: MediaListener) => {
        listeners.get(query)?.delete(listener);
      };

      return {
        get matches() {
          return matches(query);
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: MediaListener) =>
          register(listener),
        removeEventListener: (_type: string, listener: MediaListener) =>
          unregister(listener),
        addListener: register,
        removeListener: unregister,
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
    },
  });
}

beforeEach(() => {
  listeners.clear();
  matches = () => false;
  installMatchMedia();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
