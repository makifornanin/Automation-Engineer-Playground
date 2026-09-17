"use client";

import { useState } from "react";
import { revealNextHint, type RevealedHint } from "@/lib/kaz/hint-actions";
import { KazOrb } from "./KazOrb";

export interface KazHintsProps {
  labSlug: string;
  chunkId: string;
  hintCount: number;
  /** Hints already given to this learner, restored from their saved count. */
  initialRevealed?: readonly RevealedHint[];
}

/**
 * Kaz in Challenge Mode (Kaz §5): protect independent thinking, and help only
 * as far as the learner asks.
 *
 * Hints arrive one per press, in order, fetched from the server. Nothing here
 * holds a hint the learner has not asked for, so there is nothing to find in
 * devtools and nothing to scroll past accidentally.
 *
 * The copy stays quiet and non-judgemental. Asking for a hint is a reasonable
 * move, not a failure, and Kaz §3 is explicit that she should never make a
 * learner feel stupid for being stuck.
 */
export function KazHints({ labSlug, chunkId, hintCount, initialRevealed = [] }: KazHintsProps) {
  const [revealed, setRevealed] = useState<readonly RevealedHint[]>(initialRevealed);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const remaining = hintCount - revealed.length;

  async function askForHint() {
    setPending(true);
    setUnavailable(false);
    try {
      const hint = await revealNextHint(labSlug, chunkId, revealed.length);
      if (hint) {
        setRevealed((current) => [...current, hint]);
      } else {
        setUnavailable(true);
      }
    } catch {
      setUnavailable(true);
    } finally {
      setPending(false);
    }
  }

  if (hintCount === 0) {
    return null;
  }

  return (
    <section
      aria-label="Hints from Kaz"
      className="flex flex-col gap-3 border-t border-line pt-4"
    >
      <div className="flex items-center gap-3">
        <KazOrb className="size-8" />
        <p className="text-sm text-ink-soft">
          {revealed.length === 0
            ? "Try it first — working it out yourself is the part that teaches. I will be here if you get stuck."
            : "One at a time. See if that is enough before you ask for the next."}
        </p>
      </div>

      {revealed.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {revealed.map((hint) => (
            <li key={hint.index} className="flex flex-col gap-1">
              <p className="text-sm font-medium text-ink">
                Hint {hint.index + 1} of {hint.total}
              </p>
              <p className="max-w-prose text-sm text-ink-soft">{hint.text}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {unavailable ? (
        <p role="status" className="text-sm text-ink-muted">
          I cannot reach the hints right now. Try again in a moment.
        </p>
      ) : null}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={askForHint}
          disabled={pending}
          className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline"
        >
          {pending
            ? "Thinking…"
            : revealed.length === 0
              ? "Ask Kaz for a hint"
              : "Ask Kaz for the next hint"}
        </button>
      ) : (
        <p className="text-sm text-ink-muted">
          That is every hint. The rest is yours — and you are closer than it feels.
        </p>
      )}
    </section>
  );
}
