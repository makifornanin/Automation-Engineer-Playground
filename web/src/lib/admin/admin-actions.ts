"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isLikelyEmail, normalizeEmail } from "@/lib/auth/email";
import { getSession } from "@/lib/session/get-session";
import { isRevoked } from "@/lib/session/map-user";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { ADMIN_MESSAGE, type AdminActionState } from "./types";
import { isUserId } from "./users";

/**
 * Admin Server Actions: invite, resend, revoke, restore.
 *
 * A Server Action is a public endpoint — anyone signed in can call it with a
 * replayed action id, whether or not the Admin page rendered for them. So each
 * action proves the caller is an admin itself, before it builds the admin
 * client or reads a field. Hiding the page is not the check.
 *
 * The browser names a learner by id and nothing else. Their email, role and
 * status are always read back from Supabase, never taken from the form.
 *
 * Revoke is a ban, not a delete. Progress, evidence and notes stay in place.
 * What a ban does, verified in the Supabase Auth source:
 * - every Auth request with the learner's token is refused (`user_banned`),
 *   which includes the `getUser()` AEP runs on each request, so AEP treats
 *   them as signed out from their next request;
 * - verifying a sign-in code is refused, so they cannot sign back in;
 * - the ban does not delete sessions. An access token already issued stays
 *   valid for Supabase's database API until it expires (an hour at most),
 *   where row-level security still limits it to the learner's own rows.
 */

/** Long enough to mean "until restored". Supabase's own dashboard uses it. */
const REVOKE_DURATION = "876000h";

type AdminContext =
  | { ok: true; client: SupabaseClient; adminId: string }
  | { ok: false; state: AdminActionState };

async function requireAdminAction(): Promise<AdminContext> {
  const session = await getSession();
  if (session.status !== "authenticated" || session.user.role !== "admin") {
    return { ok: false, state: error("not_allowed") };
  }
  const client = await getAdminClient();
  if (!client) {
    return { ok: false, state: error("not_configured") };
  }
  return { ok: true, client, adminId: session.user.id };
}

function error(key: keyof typeof ADMIN_MESSAGE): AdminActionState {
  return { status: "error", message: ADMIN_MESSAGE[key] };
}

function done(key: keyof typeof ADMIN_MESSAGE): AdminActionState {
  return { status: "done", message: ADMIN_MESSAGE[key] };
}

/** Logs the Supabase error code only: never an email, a message or a token. */
function warnAdminFailure(action: string, cause: unknown): void {
  const code =
    typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "string"
      ? cause.code
      : "unknown";
  console.warn(`admin ${action} failed`, { code });
}

function inviteRedirect(): { redirectTo: string } | undefined {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return site ? { redirectTo: new URL("/sign-in", site).toString() } : undefined;
}

/**
 * The invite email's link confirms the account and lands on sign-in, where the
 * learner asks for a code. No `data` is passed: a new account carries no role,
 * which AEP reads as `student`.
 */
async function sendInvite(client: SupabaseClient, email: string): Promise<"sent" | "exists" | "limit" | "failed"> {
  try {
    const { error: inviteError } = await client.auth.admin.inviteUserByEmail(email, inviteRedirect());
    if (!inviteError) return "sent";
    warnAdminFailure("invite", inviteError);
    if (inviteError.code === "email_exists") return "exists";
    if (inviteError.code === "over_email_send_rate_limit") return "limit";
    return "failed";
  } catch (cause) {
    warnAdminFailure("invite", cause);
    return "failed";
  }
}

async function loadLearner(client: SupabaseClient, userId: unknown): Promise<User | null> {
  if (!isUserId(userId)) return null;
  try {
    const { data, error: loadError } = await client.auth.admin.getUserById(userId);
    if (loadError) {
      warnAdminFailure("load", loadError);
      return null;
    }
    return data.user;
  } catch (cause) {
    warnAdminFailure("load", cause);
    return null;
  }
}

export async function inviteLearner(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const context = await requireAdminAction();
  if (!context.ok) return context.state;

  const raw = formData.get("email");
  const email = typeof raw === "string" ? normalizeEmail(raw) : "";
  if (!isLikelyEmail(email)) return error("invalid_email");

  const result = await sendInvite(context.client, email);
  revalidatePath("/admin");
  if (result === "sent") return done("invite_sent");
  if (result === "exists") return error("already_active");
  if (result === "limit") return error("email_limit");
  return error("invite_failed");
}

/**
 * Supabase re-sends an invite to an account that has not confirmed its email
 * (and replaces the earlier link); for a confirmed account the same call is
 * refused as `email_exists`. So resend is offered only before acceptance.
 */
export async function resendInvite(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const context = await requireAdminAction();
  if (!context.ok) return context.state;

  const learner = await loadLearner(context.client, formData.get("userId"));
  if (!learner?.email) return error("invalid_learner");
  if (isRevoked(learner, new Date())) return error("resend_revoked");
  if (learner.email_confirmed_at) return error("resend_not_needed");

  const result = await sendInvite(context.client, learner.email);
  revalidatePath("/admin");
  if (result === "sent") return done("resend_sent");
  if (result === "limit") return error("email_limit");
  return error("invite_failed");
}

export async function revokeAccess(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const context = await requireAdminAction();
  if (!context.ok) return context.state;

  const userId = formData.get("userId");
  if (userId === context.adminId) return error("self");

  const learner = await loadLearner(context.client, userId);
  if (!learner) return error("invalid_learner");
  if (learner.app_metadata?.role === "admin") return error("admin_target");
  if (isRevoked(learner, new Date())) return done("already_revoked");

  try {
    const { error: banError } = await context.client.auth.admin.updateUserById(learner.id, {
      ban_duration: REVOKE_DURATION,
    });
    if (banError) {
      warnAdminFailure("revoke", banError);
      return error("action_failed");
    }
  } catch (cause) {
    warnAdminFailure("revoke", cause);
    return error("action_failed");
  }

  revalidatePath("/admin");
  return done("revoked");
}

export async function restoreAccess(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const context = await requireAdminAction();
  if (!context.ok) return context.state;

  const learner = await loadLearner(context.client, formData.get("userId"));
  if (!learner) return error("invalid_learner");
  if (!isRevoked(learner, new Date())) return error("not_revoked");

  try {
    const { error: unbanError } = await context.client.auth.admin.updateUserById(learner.id, {
      ban_duration: "none",
    });
    if (unbanError) {
      warnAdminFailure("restore", unbanError);
      return error("action_failed");
    }
  } catch (cause) {
    warnAdminFailure("restore", cause);
    return error("action_failed");
  }

  revalidatePath("/admin");
  return done("restored");
}
