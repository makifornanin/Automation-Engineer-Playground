import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isRevoked, toSessionUser } from "./map-user";
import type { Session } from "./types";

/**
 * Resolves the caller's session from a verified Supabase user.
 *
 * Uses `supabase.auth.getUser()`, never Supabase's own client-side
 * `getSession()` method. That method decodes the auth cookie locally without
 * checking with the Auth server, so a revoked or forged session would still
 * read as valid. `getUser()` revalidates against the Auth server on every
 * call, which is also what makes a future revoke take effect immediately
 * instead of only on the caller's next login.
 *
 * Fails safe to `{ status: "anonymous" }` on every non-success path: missing
 * env (`createSupabaseServerClient()` returns `null`), no signed-in user, or
 * a thrown/rejected call anywhere along the way. No path here returns
 * `"authenticated"` on failure.
 */
export async function resolveSession(): Promise<Session> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { status: "anonymous" };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || isRevoked(user, new Date())) {
      return { status: "anonymous" };
    }

    return { status: "authenticated", user: toSessionUser(user) };
  } catch {
    return { status: "anonymous" };
  }
}

/**
 * The single session seam for the whole app. `cache()` dedupes calls within
 * one render pass — e.g. the app layout's call and Home's call — so a full
 * page load costs one round trip here, not two.
 *
 * `import "server-only"` keeps this privileged code from being pulled into a
 * client bundle by an accidental import.
 */
export const getSession = cache(resolveSession);
