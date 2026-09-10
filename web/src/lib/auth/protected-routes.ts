/**
 * Route protection map. Pure and runtime-neutral — imported by both
 * `middleware.ts` (edge) and `guards.ts` (Node), so it must not import
 * `next/headers`, `server-only`, or anything else runtime-specific.
 */
export const SIGN_IN_PATH = "/sign-in";

/**
 * Public paths never require an authenticated session. Everything else is
 * protected by default: a new route added without updating this list is
 * denied, not silently left open.
 */
export const PUBLIC_PATHS: readonly string[] = [SIGN_IN_PATH];

export function isProtectedPath(pathname: string): boolean {
  return !PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
