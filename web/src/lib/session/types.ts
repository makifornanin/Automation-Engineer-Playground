/**
 * Session seam.
 *
 * Phase 10 ships no authentication. This file defines the *shape* the rest of
 * the app codes against so Phase 11 can replace the body of `getSession()`
 * without touching a single call site.
 */
export type UserRole = "student" | "admin";

export interface SessionUser {
  id: string;
  displayName: string;
  role: UserRole;
}

export type Session =
  | { status: "authenticated"; user: SessionUser }
  | { status: "anonymous" };

export const USER_ROLES: readonly UserRole[] = ["student", "admin"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}
