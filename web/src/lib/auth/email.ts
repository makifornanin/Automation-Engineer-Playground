/**
 * Pure email helpers shared by the sign-in form and server actions. No
 * Supabase import, no I/O — safe to call from both client and server code.
 */

/** Trims surrounding whitespace and lowercases the address. Supabase treats
 * `Ada@Example.com` and `ada@example.com` as the same user, but comparing an
 * un-normalized string anywhere (logs, rate-limit keys, future lookups)
 * would not. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Deliberately loose "does this look like an email" check for client-side
 * feedback only. It is not the security boundary — Supabase's own Auth
 * server validates the address before sending a code, and `isLikelyEmail`
 * must never be treated as proof an address is valid or deliverable.
 */
const LIKELY_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isLikelyEmail(email: string): boolean {
  return LIKELY_EMAIL_PATTERN.test(email);
}
