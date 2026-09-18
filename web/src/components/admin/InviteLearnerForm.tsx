"use client";

import { useActionState, useId } from "react";
import { inviteLearner } from "@/lib/admin/admin-actions";
import { IDLE_ADMIN_ACTION_STATE } from "@/lib/admin/types";

const PRIMARY_BUTTON =
  "w-fit rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

/** One field, one button. The server decides whether the address is valid. */
export function InviteLearnerForm() {
  const fieldId = useId();
  const [state, action, pending] = useActionState(inviteLearner, IDLE_ADMIN_ACTION_STATE);

  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        Learner&rsquo;s email
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={fieldId}
          name="email"
          type="email"
          required
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-card border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent sm:max-w-sm"
        />
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? "Sending…" : "Send invite"}
        </button>
      </div>
      <p role="status" className="text-sm text-ink-soft">
        {state.status === "idle" ? "" : state.message}
      </p>
    </form>
  );
}
