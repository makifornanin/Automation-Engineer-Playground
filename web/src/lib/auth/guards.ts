import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session/get-session";
import type { AuthenticatedSession } from "@/lib/session/types";
import { SIGN_IN_PATH } from "./protected-routes";

/**
 * The authoritative, server-side check for a protected page or layout.
 * Middleware only provides defence in depth and avoids a shell flash; this
 * is what actually proves a session is real before privileged content
 * renders.
 *
 * `redirect()` throws internally (its return type is `never`), so the
 * `if` block never completes normally on the anonymous path — the return
 * below is reached only once `session` is known to be authenticated.
 *
 * Named home for a future `requireRole("admin")` (ROADMAP Phase 11 Step 3),
 * which will apply to `/admin` in place of that page's current honest
 * unprotected notice. Not added yet — nothing needs it in this Aim Point.
 */
export async function requireSession(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (session.status !== "authenticated") {
    redirect(SIGN_IN_PATH);
  }
  return session;
}
