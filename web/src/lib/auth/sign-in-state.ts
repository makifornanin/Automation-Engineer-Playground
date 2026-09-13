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

function extractCode(error: unknown): string | undefined {
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
