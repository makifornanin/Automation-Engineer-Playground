import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/**
 * Supabase client for client components. Nothing in this Aim Point calls it
 * yet — the sign-in page is a static placeholder (Step 2 builds the real
 * passwordless form on top of this).
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
