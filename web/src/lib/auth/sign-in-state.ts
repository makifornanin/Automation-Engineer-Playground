/**
 * Sign-in state machine and Supabase-error-to-learner-message mapping.
 *
 * Pure — no `@supabase/auth-js` or `@supabase/ssr` import. Every input is
 * duck-typed as `{ code?: string; status?: number }` instead of imported as
 * a real error class, so this file (and the enumeration-safety guarantee it
 * encodes) can be tested with plain object literals and never accidentally
 * gains a dependency that could later carry a session/token through it.
 */

export type SignInErrorCode = "invalid_input" | "invalid_code" | "rate_limited" | "generic";

/**
 * Closed literal by design: `sign-in-actions.ts` and `SignInForm` must never
 * be able to smuggle an extra field (a session, a token, a raw Supabase
 * message) through this type without a compiler error at the object literal
 * that adds it.
 */
export type SignInState =
  | { status: "idle" }
  | { status: "code_sent" }
  | { status: "error"; code: SignInErrorCode; message: string };

/** Initial `useActionState` value for both the request-code and verify-code
 * forms. */
export const IDLE_STATE: SignInState = { status: "idle" };

/**
 * The exact object returned both for a genuine successful code request and
 * for the three account-enumeration-sensitive Supabase error codes handled
 * below. AEP is invite-only, and `shouldCreateUser: false`
 * (`sign-in-actions.ts`) means an uninvited email produces one of those
 * codes instead of silently creating an account. If that ever became
 * distinguishable from "check your email", the sign-in form would become an
 * oracle for "is this address invited?" — the one thing invite-only access
 * must not leak. A single frozen constant, reused by reference rather than
 * rebuilt as a fresh `{ status: "code_sent" }` literal in each branch, is
 * what makes the two paths byte-identical rather than merely deep-equal.
 */
export const CODE_SENT_STATE: SignInState = Object.freeze({ status: "code_sent" });

const ERROR_MESSAGES: Record<SignInErrorCode, string> = {
  invalid_input: "Enter a valid email address.",
  invalid_code: "That code is incorrect or has expired. Request a new one.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
  generic: "Something went wrong. Please try again.",
};

/**
 * Builds an error state directly from a `SignInErrorCode`. Exported so
 * `sign-in-actions.ts` can report its own input-validation failures (a
 * malformed email, a missing code) without inventing a fake Supabase error
 * code just to route through `toSignInError` below — that would risk the
 * wrong message (e.g. an empty *code* field must not say "enter a valid
 * *email*").
 */
export function buildSignInError(code: SignInErrorCode): SignInState {
  return { status: "error", code, message: ERROR_MESSAGES[code] };
}

/** Codes that must resolve exactly like success — see `CODE_SENT_STATE`. */
const ENUMERATION_SAFE_CODES: ReadonlySet<string> = new Set([
  "otp_disabled",
  "signup_disabled",
  "user_not_found",
]);

interface DuckTypedAuthError {
  code?: string;
  status?: number;
}

export function extractCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  const code = (error as DuckTypedAuthError).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Converts anything a `signInWithOtp` / `verifyOtp` call could produce —
 * a real `AuthApiError`, a network rejection, a thrown non-Error, `null`,
 * `undefined` — into a `SignInState`. Never throws. Never reads or forwards
 * `error.message`: whatever the Auth server says internally is not written
 * to the learner-facing message map below.
 */
export function toSignInError(error: unknown): SignInState {
  const code = extractCode(error);

  if (code !== undefined && ENUMERATION_SAFE_CODES.has(code)) {
    return CODE_SENT_STATE;
  }

  switch (code) {
    case "otp_expired":
      return buildSignInError("invalid_code");
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return buildSignInError("rate_limited");
    case "validation_failed":
      return buildSignInError("invalid_input");
    default:
      return buildSignInError("generic");
  }
}

/**
 * Maps the outcome of the **request-code** step — `requestSignInCode`'s
 * call to `signInWithOtp` — to a `SignInState`. Every outcome that reached
 * Supabase at all — a genuine success, any known error code, any error code
 * this file has never seen before, a thrown value, a rejected promise —
 * resolves to {@link CODE_SENT_STATE} by reference. There is no branch here
 * that inspects the error; that absence is the point.
 *
 * WHY THIS EXISTS — DO NOT ADD AN ALLOW-LIST HERE: GoTrue rejects an
 * uninvited address with `otp_disabled` / `signup_disabled` /
 * `user_not_found` and dispatches no mail at all — measured live at ~130ms
 * across 14/14 requests. An *invited* address does dispatch mail, so it
 * alone can hit `over_email_send_rate_limit`, a mail-provider failure, or
 * any future delivery-side error code. That asymmetry is a property of
 * Supabase's own flow, not of whichever mail carrier is in use. If this
 * function special-cased a fixed set of "safe" codes instead of covering
 * every outcome, an unlisted delivery-failure code would fall through to a
 * distinguishable error state — and because that class of failure can
 * *only* happen to an address that passed the existence check, "Something
 * went wrong" would then mean "this address is invited." That is the exact
 * enumeration this file exists to prevent, so this must stay a blanket
 * policy: reached Supabase → code sent, full stop, regardless of what came
 * back.
 *
 * Deliberate cost, accepted: the request step can no longer show "Too many
 * attempts". `over_email_send_rate_limit` counts mail actually dispatched,
 * so it can only fire for an address that already exists — that one was the
 * same class of oracle. `over_request_rate_limit` is generally an IP or
 * request-volume throttle and is *not* obviously gated on whether the
 * address exists; it is covered here anyway, because the guarantee this
 * function provides is deliberately broader than any per-code reasoning:
 * every outcome that reached Supabase is uniform, so no future
 * reclassification of any code can reopen the oracle.
 * `verifySignInCode` and `toSignInError` are
 * untouched and keep every message, including the rate-limit one, because
 * the verify step does not have this asymmetry (a wrong code and a
 * never-issued code already return the same `otp_expired`).
 *
 * Only local input validation (`invalid_input` for a malformed email, in
 * `requestSignInCode`, before Supabase is ever called) stays distinguishable
 * — it cannot be an oracle for anything Supabase-side because Supabase
 * never saw the request.
 */
export function toRequestCodeState(error: unknown): SignInState {
  // Deliberately unread: see the policy above. `error` stays a parameter
  // (not an argument-less function) only so call sites read naturally next
  // to `toSignInError(error)`, and so this signature cannot be swapped for
  // a real inspection of `error` without a reviewer noticing the diff.
  void error;
  return CODE_SENT_STATE;
}
