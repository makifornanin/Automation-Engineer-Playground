import type { CookieOptions } from "@supabase/ssr";

/**
 * Auth cookie options shared by every Supabase server factory in this app.
 *
 * `@supabase/ssr@0.12.7` defaults to `httpOnly: false`
 * (`node_modules/@supabase/ssr/dist/main/utils/constants.js`), so without
 * this, the session/refresh cookies are readable from `document.cookie` —
 * a live security defect (an XSS payload could exfiltrate the session).
 *
 * `secure` is derived from `NEXT_PUBLIC_SITE_URL` rather than
 * `NODE_ENV`/`VERCEL_ENV`: local development runs over `http://localhost`,
 * where a `Secure` cookie would silently never be sent, so it must track the
 * site's actual protocol, not merely "is this production".
 *
 * Must be applied to BOTH `server-client.ts` and `middleware-client.ts` via
 * `cookieOptions:`. Wiring only one silently downgrades the cookie the next
 * time the other factory's client refreshes it — see
 * `cookie-options.test.ts`, which fails if either factory stops forwarding
 * this constant.
 */
export const SUPABASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
};
