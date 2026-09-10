import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath, SIGN_IN_PATH } from "@/lib/auth/protected-routes";
import { updateSession } from "@/lib/supabase/middleware-client";

/**
 * Composes session refresh with route protection.
 *
 * Defence in depth and UX only — not the authorization boundary. The
 * authoritative, server-side check is `requireSession()` in the layout (and
 * later, per page/Server Action). This exists so a signed-out visitor is
 * redirected before a protected shell ever renders, and so an expiring
 * access token is quietly refreshed on the way through.
 *
 * Always returns the same `NextResponse` `updateSession()` wrote cookies to.
 * On redirect, those cookies are copied onto the redirect response instead —
 * dropping them here would discard a just-refreshed token and loop the
 * browser straight back through this same redirect on the next request.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`. This is not a
 * cosmetic rename: a `proxy` file always runs on the Node.js runtime (never
 * Edge), and — unlike a `middleware` file — it cannot export `runtime` to
 * opt out; Next fails the build if it tries.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { response, user } = await updateSession(request);

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const redirectResponse = NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

/**
 * Next requires `config.matcher` to be statically analysable, so it cannot
 * call `isProtectedPath()` — that is why route protection is expressed twice
 * (here, and in `protected-routes.ts`). This matcher only decides whether
 * the proxy runs at all; `sign-in(?:/|$)` matches `/sign-in` and any future
 * nested `/sign-in/...` route (e.g. a magic-link callback), not a
 * differently-named route that merely shares the text prefix, such as
 * `/sign-in-help`. Keep this in sync with `PUBLIC_PATHS` by hand — adding a
 * new public route there does not update this pattern automatically.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sign-in(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
