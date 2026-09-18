"use client";

/**
 * A one-line client signal: a test in this lesson just passed or failed.
 *
 * Kaz's proactive affordance needs to know that the learner has failed the
 * same step twice. The test panels already know; the launcher needs to hear
 * it. A custom event on `window` is the whole mechanism — no store, no
 * provider, no polling, and above all no background call to Gemini to decide
 * whether someone is struggling.
 */

export interface TestOutcome {
  labSlug: string;
  chunkId: string;
  passed: boolean;
}

const EVENT = "aep:test-outcome";

export function notifyTestOutcome(outcome: TestOutcome): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TestOutcome>(EVENT, { detail: outcome }));
}

export function subscribeTestOutcome(listener: (outcome: TestOutcome) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<TestOutcome>).detail;
    if (detail) listener(detail);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
