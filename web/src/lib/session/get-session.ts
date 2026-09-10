import "server-only";

import { isUserRole, type Session, type UserRole } from "./types";

/**
 * PHASE 11: delete.
 *
 * Dev scaffolding only. It exists so Admin nav visibility can be exercised
 * before real auth exists. It is server-only and must never gain a
 * NEXT_PUBLIC_ prefix — that prefix is inlined into the browser bundle.
 *
 * This is NOT an access control. It decides what the dock renders, nothing
 * more; `/admin` is reachable by URL regardless of its value.
 */
function readPlaceholderRole(): UserRole {
  const raw = process.env.AEP_PLACEHOLDER_ROLE;
  return isUserRole(raw) ? raw : "student";
}

/**
 * The single session seam for the whole app.
 *
 * Phase 10 has no authentication, so this returns a placeholder learner. The
 * `status` discriminant is here so Phase 11 can swap in a real Supabase session
 * by replacing this function body, with no call site changes.
 *
 * `import 'server-only'` keeps Phase 11's privileged code from being pulled
 * into a client bundle by an accidental import.
 */
export async function getSession(): Promise<Session> {
  return {
    status: "authenticated",
    user: {
      // PHASE 11: replaced by the real Supabase user id.
      id: "placeholder-learner",
      displayName: "Learner",
      role: readPlaceholderRole(),
    },
  };
}
