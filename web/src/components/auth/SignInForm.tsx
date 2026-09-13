"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { requestSignInCode, verifySignInCode } from "@/lib/auth/sign-in-actions";
import { IDLE_STATE } from "@/lib/auth/sign-in-state";

const FIELD_CLASS =
  "rounded-card border border-line bg-surface px-3 py-2 text-ink outline-none focus-visible:border-accent";
const PRIMARY_BUTTON_CLASS =
  "rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Two-step passwordless sign-in: request a 6-digit emailed code, then verify
 * it. Vision §8 (amended 2026-09-13) — a code, not a magic link — so this is
 * the whole flow: no callback route, no `?next=`.
 *
 * No `motion` components: `/sign-in` sits outside `(app)`, so there is no
 * `MotionProvider` here to resolve `reducedMotion="user"`. Anything built
 * with `motion` on this page would silently ignore the learner's reduced-
 * motion preference.
 *
 * The active step is derived, not stored as independent state: it is
 * "email" only while `manualStepOverride` says so, otherwise it follows
 * whether the request action has already succeeded. That keeps "use a
 * different email" (which sets the override) and a second successful
 * request (which the override does not survive past resubmission) from
 * fighting each other.
 */
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [manualStepOverride, setManualStepOverride] = useState<"email" | null>(null);
  const [requestState, requestAction, requestPending] = useActionState(
    requestSignInCode,
    IDLE_STATE,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifySignInCode,
    IDLE_STATE,
  );

  const step = manualStepOverride ?? (requestState.status === "code_sent" ? "code" : "email");

  const codeInputRef = useRef<HTMLInputElement>(null);
  const emailFieldId = useId();
  const codeFieldId = useId();

  // Moves focus to the code field whenever the learner lands on the code
  // step, whether that is the first successful request or a later one.
  useEffect(() => {
    if (step === "code") {
      codeInputRef.current?.focus();
    }
  }, [step]);

  const requestError = requestState.status === "error" ? requestState.message : null;
  const verifyError = verifyState.status === "error" ? verifyState.message : null;

  if (step === "email") {
    return (
      <form
        action={requestAction}
        onSubmit={() => setManualStepOverride(null)}
        noValidate
        className="flex flex-col gap-4 text-left"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor={emailFieldId} className="text-sm font-medium text-ink">
            Email address
          </label>
          <input
            id={emailFieldId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        {requestError ? (
          <p role="alert" className="text-sm text-ink-soft">
            {requestError}
          </p>
        ) : null}

        <button type="submit" disabled={requestPending} className={PRIMARY_BUTTON_CLASS}>
          {requestPending ? "Sending…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} noValidate className="flex flex-col gap-4 text-left">
      <input type="hidden" name="email" value={email} />

      <p className="text-sm text-ink-soft">
        We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor={codeFieldId} className="text-sm font-medium text-ink">
          6-digit code
        </label>
        <input
          id={codeFieldId}
          ref={codeInputRef}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          // The server is authoritative on the code; these only stop a learner
          // silently over-typing past six digits and waiting on a doomed submit.
          maxLength={6}
          pattern="[0-9]*"
          required
          className={FIELD_CLASS}
        />
      </div>

      {verifyError ? (
        <p role="alert" className="text-sm text-ink-soft">
          {verifyError}
        </p>
      ) : null}

      <button type="submit" disabled={verifyPending} className={PRIMARY_BUTTON_CLASS}>
        {verifyPending ? "Verifying…" : "Verify code"}
      </button>

      <button
        type="button"
        onClick={() => setManualStepOverride("email")}
        className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
      >
        Use a different email
      </button>
    </form>
  );
}
