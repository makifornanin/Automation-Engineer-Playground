import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./env";

/**
 * Refreshes the Supabase auth cookies for one request/response pair.
 *
 * Calling `auth.getUser()` is not merely a check here — it is what *triggers*
 * a token refresh when the access token has expired but the refresh token is
 * still valid. It also revalidates against the Auth server rather than
 * trusting the cookie locally, for the same reason `resolveSession()` never
 * calls Supabase's own client-side `getSession()` method.
 *
 * `setAll` writes each cookie to BOTH the mutable request cookies (so a
 * Server Component rendered later in this same request sees the fresh
 * token) AND the outgoing response (so the browser stores it). Writing only
 * one produces either a stale token for the current render or a refresh on
 * every single request. `options` is always forwarded — dropping it silently
 * downgrades `HttpOnly`, `SameSite` and `Secure`. `headers` (cache-control
 * headers guarding against a CDN caching one user's auth cookies for
 * another) is forwarded onto the response for the same reason.
 *
 * Returns `user: null` — never throws — when config is missing, the network
 * call fails, or no user is signed in. Callers must treat all three as
 * anonymous.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  const config = getSupabaseConfig();
  if (!config) {
    return { response: NextResponse.next(), user: null };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue);
        }
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, user };
  } catch {
    return { response, user: null };
  }
}
