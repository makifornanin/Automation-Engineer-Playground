"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId } from "react";
import { runSelfCheck } from "@/lib/testing/self-check-action";
import { IDLE_TEST_STATE } from "@/lib/testing/types";
import { CheckResultView } from "./CheckResultView";

export interface SelfCheckPanelProps {
  labSlug: string;
  chunkId: string;
  /**
   * The business behaviour being proved, shown before any raw data. Omitted
   * when this panel is a fallback inside Send Test, which already shows it.
   */
  caseName?: string;
  /** The outcome that counts as a pass, in plain words. */
  expected?: string;
  title?: string;
}

/**
 * The paste-the-output check (Vision §23), for labs AEP cannot call and as the
 * fallback when Send Test cannot reach a learner's n8n.
 *
 * The learner runs their own workflow, pastes the output, and gets
 * checkpoint-level feedback rather than a bare pass/fail. Used by every lab,
 * so its own copy stays lab-agnostic: the chunk around it says which node to
 * copy from.
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
  expected,
  title = "Test it",
}: SelfCheckPanelProps) {
  const [state, action, pending] = useActionState(runSelfCheck, IDLE_TEST_STATE);
  const router = useRouter();
  const fieldId = useId();

  // A pass records evidence and may complete the lab. Refreshing the server
  // tree is what lets the recap and the Labs journey show the unlock now,
  // rather than only after the learner happens to navigate away.
  useEffect(() => {
    if (state.status === "complete" && state.result.passed) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-sunken p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">{title}</h3>
        {caseName ? <p className="max-w-prose text-ink-soft">{caseName}</p> : null}
        {expected ? (
          <p className="max-w-prose text-sm text-ink-muted">
            <span className="font-medium text-ink">Expected: </span>
            {expected}
          </p>
        ) : null}
      </div>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="labSlug" value={labSlug} />
        <input type="hidden" name="chunkId" value={chunkId} />

        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          Paste the output your workflow produced
        </label>
        <p className="max-w-prose text-sm text-ink-muted">
          In n8n, open the node, switch its output view to JSON and copy all of it.
        </p>
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
        {state.status === "error" ? <p className="text-sm text-ink-soft">{state.message}</p> : null}
        {state.status === "complete" ? <CheckResultView result={state.result} /> : null}
      </div>
    </div>
  );
}
