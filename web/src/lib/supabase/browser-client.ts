import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/**
 * Supabase client for client components. Nothing calls it, and that is by
 * design rather than left over: sign-in is deliberately server-side
 * (`sign-in-actions.ts`), because the session cookie is `httpOnly`
 * (`cookie-options.ts`) and an `httpOnly` cookie cannot be read or written
 * from JavaScript at all — a browser-side `signInWithOtp`/`verifyOtp` call
 * here could not persist the session it received. Do not delete this file
 * on the assumption that "unused" means "dead": it remains the documented
 * seam for any future client-side Supabase read (e.g. a realtime
 * subscription) that does not need to write the auth cookie itself.
 *
 * No cookie adapter is supplied: `@supabase/ssr`'s browser client persists
 * the session via cookies itself and falls back to `document.cookie`, which
 * is exactly what a server render later reads.
 *
 * Throws if Supabase env vars are not configured. That is acceptable only
 * because this function is called from interactive client code that is
 * about to make a network call, never at import time or during a server
 * render — the failure is a loud local error, not a broken page.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createBrowserClient(config.url, config.publishableKey);
}
