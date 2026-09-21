"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeTestOutcome } from "@/lib/kaz/test-signal";
import type { KazMessage, KazWorkflowVisibility } from "@/lib/kaz/types";
import { KazOrb } from "./KazOrb";
import { KazPanel } from "./KazPanel";

export interface KazLauncherProps {
  labSlug: string;
  /** The chunk the learner is on now; Kaz answers about this step. */
  chunkId: string;
  contextLabel: string;
  initialMessages: readonly KazMessage[];
  visibility: KazWorkflowVisibility;
}

/** Two failures on the same step is a pattern; one is just a test. */
const OFFER_AFTER_FAILURES = 2;

/**
 * Kaz's floating presence: a small orb the learner can ignore.
 *
 * She never opens herself. After the same step fails twice the orb offers one
 * quiet line — "Want another set of eyes on that?" — and the learner decides.
 * That offer is computed from test results the page already produced; nothing
 * is sent anywhere, and no model is called, until they ask.
 */
export function KazLauncher({
  labSlug,
  chunkId,
  contextLabel,
  initialMessages,
  visibility,
}: KazLauncherProps) {
  const [open, setOpen] = useState(false);
  const restoreFocus = useRef(false);
  /*
   * The thread lives here, not in the panel: the launcher stays mounted while
   * the panel comes and goes, so closing Kaz and opening her again keeps the
   * conversation on screen instead of falling back to what the page was
   * rendered with.
   */
  const [messages, setMessages] = useState<readonly KazMessage[]>(initialMessages);
  /*
   * The count is stored with the step it belongs to rather than reset when the
   * step changes: struggling with Break It says nothing about the challenge
   * after it, and a count keyed by chunk needs no effect to clear it.
   */
  const [failures, setFailures] = useState({ chunkId, count: 0 });

  useEffect(() => {
    return subscribeTestOutcome((outcome) => {
      if (outcome.labSlug !== labSlug || outcome.chunkId !== chunkId) return;
      setFailures((current) => {
        const count = current.chunkId === outcome.chunkId ? current.count : 0;
        return { chunkId: outcome.chunkId, count: outcome.passed ? 0 : count + 1 };
      });
    });
  }, [labSlug, chunkId]);

  const failuresHere = failures.chunkId === chunkId ? failures.count : 0;
  const offering = failuresHere >= OFFER_AFTER_FAILURES && !open;

  if (open) {
    return (
      <KazPanel
        labSlug={labSlug}
        chunkId={chunkId}
        contextLabel={contextLabel}
        messages={messages}
        onTurn={(question, answer) => setMessages((current) => [...current, question, answer])}
        visibility={visibility}
        onClose={() => {
          restoreFocus.current = true;
          setOpen(false);
        }}
      />
    );
  }

  return (
    <div className="fixed right-5 bottom-24 z-30 flex items-center gap-2 md:bottom-8">
      {offering ? (
        <p
          role="status"
          className="max-w-[12rem] rounded-card border border-line bg-surface px-3 py-2 text-xs text-ink-soft shadow-sm"
        >
          Want another set of eyes on that?
        </p>
      ) : null}
      <button
        ref={(node) => {
          if (node && restoreFocus.current) {
            restoreFocus.current = false;
            node.focus();
          }
        }}
        type="button"
        onClick={() => {
          setOpen(true);
          setFailures({ chunkId, count: 0 });
        }}
        aria-label={"Ask Kaz about " + contextLabel}
        className="rounded-full border border-line bg-surface p-1.5 shadow-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <KazOrb className="size-11" state={offering ? "uh-oh" : "neutral"} />
      </button>
    </div>
  );
}
