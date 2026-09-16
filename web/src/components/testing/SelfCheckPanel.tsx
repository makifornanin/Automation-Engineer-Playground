"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId } from "react";
import { runSelfCheck } from "@/lib/testing/self-check-action";
import { IDLE_TEST_STATE, type CheckpointResult } from "@/lib/testing/types";

const GLYPH: Record<CheckpointResult["state"], string> = {
  passed: "✓",
  failed: "✕",
  skipped: "·",
};

const SPOKEN: Record<CheckpointResult["state"], string> = {
  passed: "passed",
  failed: "failed",
  skipped: "not checked",
};

export interface SelfCheckPanelProps {
  labSlug: string;
  chunkId: string;
  /** The business behaviour being proved, shown before any raw data. */
  caseName: string;
}

/**
 * The inline test experience for a lab AEP cannot call (Vision §23).
 *
 * The learner runs their own workflow, pastes the node's output, and gets
 * checkpoint-level feedback rather than a bare pass/fail. Used by every lab,
 * so its own copy stays lab-agnostic: the chunk around it says which node to
 * copy from. Ordering follows
 * §23's rule: the business scenario first, then the interpretation, and raw
 * detail only on demand — "simple first, depth on demand".
 *
 * A `role="status"` live region is correct here, and is the opposite call from
 * the chunk stepper. There the result of pressing Next is that focus moves, so
 * the new heading announces itself. Here the result appears in place with
 * focus still on the button, so without a live region a screen reader user
 * would be told nothing at all.
 */
export function SelfCheckPanel({
  labSlug,
  chunkId,
  caseName,
}: SelfCheckPanelProps) {
  const [state, action, pending] = useActionState(runSelfCheck, IDLE_TEST_STATE);
  const router = useRouter();

  // A pass records evidence and may complete the lab. Refreshing the server
  // tree is what lets the recap and the Labs journey show the unlock now,
  // rather than only after the learner happens to navigate away.
  useEffect(() => {
    if (state.status === "complete" && state.result.passed) {
      router.refresh();
    }
  }, [state, router]);
  const fieldId = useId();

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-sunken p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Test it
        </h3>
        <p className="max-w-prose text-ink-soft">{caseName}</p>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="labSlug" value={labSlug} />
        <input type="hidden" name="chunkId" value={chunkId} />

        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          Paste the output your workflow produced
        </label>
        <textarea
          id={fieldId}
          name="output"
          rows={6}
          spellCheck={false}
          placeholder="Paste the JSON exactly as n8n shows it"
          className="rounded-card border border-line bg-surface p-3 font-mono text-sm text-ink outline-none focus-visible:border-accent"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Checking…" : "Check my output"}
        </button>
      </form>

      <div role="status" className="flex flex-col gap-3">
        {state.status === "error" ? (
          <p className="text-sm text-ink-soft">{state.message}</p>
        ) : null}

        {state.status === "complete" ? (
          <>
            <p className="text-sm font-medium text-ink">
              {state.result.passed
                ? "All checks passed — your workflow did exactly what this case expects."
                : "Not there yet. Here is where it first went wrong."}
            </p>

            <ul className="flex flex-col gap-1">
              {state.result.checkpoints.map((checkpoint) => (
                <li key={checkpoint.id} className="text-sm text-ink-soft">
                  <span aria-hidden>{GLYPH[checkpoint.state]} </span>
                  {checkpoint.label}
                  <span className="sr-only">{`: ${SPOKEN[checkpoint.state]}`}</span>
                </li>
              ))}
            </ul>

            {/*
              Expected and actual are shown only for the checkpoint that
              failed. Printing them for passing checkpoints would hand the
              learner the rest of the answer they have not reached yet.
            */}
            {state.result.firstFailure ? (
              <dl className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
                <div className="flex gap-2">
                  <dt className="font-medium text-ink">Expected</dt>
                  <dd className="font-mono text-ink-soft">
                    {state.result.firstFailure.expected}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium text-ink">Found</dt>
                  <dd className="font-mono text-ink-soft">
                    {state.result.firstFailure.actual}
                  </dd>
                </div>
              </dl>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
