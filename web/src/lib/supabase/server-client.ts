import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";
import { SUPABASE_COOKIE_OPTIONS } from "./cookie-options";

/**
 * Supabase client for Server Components and Server Actions.
 *
 * Returns `null` — never throws — when Supabase env vars are not configured,
 * so callers (in particular `resolveSession()`) can fail safe to an
 * anonymous session instead of crashing the render.
 *
 * `setAll` is wrapped in `try/catch` because Next only allows writing
 * cookies from a Server Action or Route Handler, never from a plain Server
 * Component render — calling `cookieStore.set()` outside one of those throws.
 * During a Server Component render (e.g. `resolveSession()`), the write is a
 * no-op and that is fine: `proxy.ts` already refreshed the session for this
 * request and wrote any new cookies to the response before the render ran.
 * That is no longer the whole story: `sign-in-actions.ts` and
 * `sign-out-action.ts` call this same factory from inside a real Server
 * Action, where `cookieStore.set()` succeeds and is exactly how
 * `signInWithOtp` / `verifyOtp` / `signOut` persist the session cookie. The
 * `try/catch` exists for the render call sites, not because there is
 * nothing left to persist.
 *
 * `cookieOptions: SUPABASE_COOKIE_OPTIONS` forces `httpOnly`/`sameSite`/
 * `path`/`secure` on every cookie this client writes — see that module's
 * docstring. Must stay in sync with `middleware-client.ts`.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
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
          // Expected only during a Server Component render, which cannot
          // write cookies. Middleware already refreshed this request. A
          // Server Action call site (sign-in/sign-out) reaches this line
          // too, but there `cookieStore.set()` succeeds and never throws.
        }
      },
    },
  });
}
