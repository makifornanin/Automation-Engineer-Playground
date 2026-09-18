import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/session/get-session";

/**
 * Supabase client for Auth Admin operations: inviting, listing and revoking
 * learners. The only module that reads `SUPABASE_SECRET_KEY`.
 *
 * The secret key bypasses row-level security and can manage every account, so:
 *
 * - `server-only` makes importing this from a Client Component a build error;
 * - the variable has no `NEXT_PUBLIC_` prefix, so Next never inlines it into a
 *   browser bundle;
 * - nothing here logs, returns or echoes the key;
 * - the client is only handed to a caller whose own session is an admin, so a
 *   future caller that forgets its own check still gets nothing.
 *
 * The role comes from `getSession()`, which reads `app_metadata.role` from a
 * user the Auth server just verified. Callers still check first
 * (`requireAdmin()`, `requireAdminAction()`), so they can answer a learner
 * properly; this is the second lock, not the only one.
 *
 * No session is persisted or refreshed: this client acts as the project, not
 * as a user, and must never pick up or write a learner's auth cookie.
 *
 * Returns `null` for a non-admin, and when either value is missing so the
 * Admin page can say the server is not configured instead of crashing.
 */
export async function getAdminClient(): Promise<SupabaseClient | null> {
  const session = await getSession();
  if (session.status !== "authenticated" || session.user.role !== "admin") {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    return null;
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
