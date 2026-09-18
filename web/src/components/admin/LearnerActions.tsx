"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { resendInvite, restoreAccess, revokeAccess } from "@/lib/admin/admin-actions";
import { IDLE_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/types";
import type { LearnerStatus } from "@/lib/admin/users";

const LINK_BUTTON =
  "w-fit text-sm font-medium text-accent underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60";

export interface LearnerActionsProps {
  userId: string;
  email: string;
  status: LearnerStatus;
}

/**
 * The controls for one learner. Only the id is posted; the server reloads the
 * learner and decides whether the action applies, so these buttons are a
 * convenience, not a permission.
 *
 * Revoke asks once more before it runs: it signs the learner out of AEP on
 * their next request.
 */
export function LearnerActions({ userId, email, status }: LearnerActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const revokeRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  /*
   * Confirming swaps one button for two, so React unmounts the button the
   * keyboard was on and focus falls to the document. Moving it explicitly
   * keeps a keyboard or screen reader user on the control they just acted on,
   * which matters most on the one destructive action here.
   */
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (document.activeElement === document.body) revokeRef.current?.focus();
  }, [confirming]);
  const [state, run, pending] = useActionState(
    async (previous: AdminActionState, formData: FormData) => {
      const intent = formData.get("intent");
      if (intent === "resend") return resendInvite(previous, formData);
      if (intent === "restore") return restoreAccess(previous, formData);
      const next = await revokeAccess(previous, formData);
      setConfirming(false);
      return next;
    },
    IDLE_ADMIN_ACTION_STATE,
  );

  return (
    <div className="flex flex-col gap-1">
      <form action={run} className="flex flex-wrap items-center gap-4">
        <input type="hidden" name="userId" value={userId} />

        {status === "invited" ? (
          <button type="submit" name="intent" value="resend" disabled={pending} className={LINK_BUTTON}>
            Resend invite
          </button>
        ) : null}

        {status === "revoked" ? (
          <button type="submit" name="intent" value="restore" disabled={pending} className={LINK_BUTTON}>
            Restore access
          </button>
        ) : confirming ? (
          <>
            <button
              ref={confirmRef}
              type="submit"
              name="intent"
              value="revoke"
              disabled={pending}
              aria-label={`Confirm: revoke access for ${email}`}
              className={LINK_BUTTON}
            >
              Confirm revoke
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={LINK_BUTTON}>
              Cancel
            </button>
          </>
        ) : (
          <button
            ref={revokeRef}
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Revoke access for ${email}`}
            className={LINK_BUTTON}
          >
            Revoke access
          </button>
        )}
      </form>
      <p role="status" className="text-sm text-ink-soft">
        {pending ? "Working…" : state.status === "idle" ? "" : state.message}
      </p>
    </div>
  );
}
