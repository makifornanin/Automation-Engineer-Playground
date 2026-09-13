"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isLikelyEmail, normalizeEmail } from "./email";
import {
  buildSignInError,
  CODE_SENT_STATE,
  extractCode,
  toRequestCodeState,
  toSignInError,
  type SignInState,
} from "./sign-in-state";

/**
 * The only file that calls `signInWithOtp` / `verifyOtp`. Both Server
 * Actions are consumed by `SignInForm` through `useActionState`, which is
 * why each takes `(prevState, formData)` and returns a `SignInState` rather
 * than throwing on an expected failure — a Server Action can throw for a
 * true redirect (see `verifySignInCode`), but a wrong code or a rate limit
 * is not exceptional, it is the form's normal error path.
 */

/**
 * Requests a 6-digit sign-in code for an email address.
 *
 * `shouldCreateUser: false` is the invite-only enforcement point: without
 * it, `signInWithOtp` would silently create a new account for any email
 * that does not already exist. Public sign-up is also disabled at the
 * Supabase project level, but this stays as defence in depth — see
 * `sign-in-actions.test.ts`'s REGRESSION test, which exists so this literal
 * cannot be quietly deleted later.
 */
export async function requestSignInCode(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return buildSignInError("invalid_input");
  }

  const email = normalizeEmail(rawEmail);
  if (!isLikelyEmail(email)) {
    return buildSignInError("invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    // Deliberately NOT routed through toRequestCodeState. This fires only when the
    // server itself is unconfigured (getSupabaseConfig() returned null), which is
    // identical for every request regardless of which email was submitted — so it
    // cannot signal whether an address is invited. Collapsing it into the uniform
    // state would only hide a misconfiguration from the operator.
    return toSignInError(null);
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) {
      warnRequestCodeFailure(error);
      return toRequestCodeState(error);
    }

    return CODE_SENT_STATE;
  } catch (error) {
    warnRequestCodeFailure(error);
    return toRequestCodeState(error);
  }
}

/**
 * Compensating control for `toRequestCodeState` always returning
 * `CODE_SENT_STATE`: since the learner can no longer see whether the
 * request step actually succeeded, a broken mail path (Supabase's mail
 * provider failing, the address being rate-limited, a misconfigured email
 * template) would otherwise be silent. This logs the Supabase error `code`
 * ONLY — never the email address, never `error.message`, never a token — so
 * it cannot itself become a new leak.
 */
function warnRequestCodeFailure(error: unknown): void {
  console.warn("requestSignInCode: signInWithOtp did not send a code", {
    code: extractCode(error) ?? "unknown",
  });
}

/**
 * Verifies the 6-digit code and, on success, redirects home.
 *
 * `verifyOtp`'s response carries `data.session` (access + refresh tokens).
 * That value is deliberately never read into a local binding that could be
 * returned, stored in `useActionState`, or logged — success is signalled
 * only by `redirect("/")`, which throws and never returns to the caller.
 * `revalidatePath("/", "layout")` runs first so the now-authenticated
 * layout (`(app)/layout.tsx`) re-resolves the session on the page the
 * learner lands on, instead of serving a cached anonymous render.
 */
export async function verifySignInCode(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawEmail = formData.get("email");
  const rawCode = formData.get("code");
  if (typeof rawEmail !== "string") {
    return buildSignInError("invalid_input");
  }
  if (typeof rawCode !== "string") {
    return buildSignInError("invalid_code");
  }

  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();
  if (code.length === 0) {
    return buildSignInError("invalid_code");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return toSignInError(null);
  }

  try {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      return toSignInError(error);
    }
  } catch (error) {
    return toSignInError(error);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
