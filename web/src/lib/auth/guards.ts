import "server-only";

import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session/get-session";
import type { AuthenticatedSession } from "@/lib/session/types";
import { SIGN_IN_PATH } from "./protected-routes";

/**
 * The authoritative, server-side check for a protected page or layout.
 * The proxy (`proxy.ts`) only provides defence in depth and avoids a shell
 * flash; this is what actually proves a session is real before privileged
 * content renders.
 *
 * `redirect()` throws internally (its return type is `never`), so the
 * `if` block never completes normally on the anonymous path — the return
 * below is reached only once `session` is known to be authenticated.
 */
export async function requireSession(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (session.status !== "authenticated") {
    redirect(SIGN_IN_PATH);
  }
  return session;
}

/**
 * The server-side check for Admin pages. The role comes from the session,
 * which `getUser()` resolved against the Auth server from `app_metadata.role`
 * — a value only the project can set. Nothing the browser sends (a cookie it
 * edited, `user_metadata`, a query parameter) can make this pass.
 *
 * A signed-in learner who is not an admin gets a 404, not a "not allowed"
 * screen: the page does not confirm it exists. Hiding the dock item is
 * presentation; this is the guard.
 */
export async function requireAdmin(): Promise<AuthenticatedSession> {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    notFound();
  }
  return session;
}
