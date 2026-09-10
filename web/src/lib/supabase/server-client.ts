import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/**
 * Supabase client for Server Components and Server Actions.
 *
 * Returns `null` — never throws — when Supabase env vars are not configured,
 * so callers (in particular `resolveSession()`) can fail safe to an
 * anonymous session instead of crashing the render.
 *
 * `setAll` is a deliberate no-op wrapped in `try/catch`: a Server Component
 * cannot set cookies (Next throws if you try outside a Server Action or
 * Route Handler), and by the time one runs, `middleware.ts` has already
 * refreshed the session for this request and written any new cookies to the
 * response. There is nothing left for this client to persist here.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Expected: this runs during a Server Component render, which
          // cannot write cookies. Middleware already refreshed this request.
        }
      },
    },
  });
}
