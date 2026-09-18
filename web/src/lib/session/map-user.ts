import type { User } from "@supabase/supabase-js";
import { isUserRole, type SessionUser, type UserRole } from "./types";

/**
 * Maps a verified Supabase `User` — from `supabase.auth.getUser()`, never
 * from a locally-decoded `getSession()` — onto the app's own `SessionUser`.
 *
 * Role is read from `app_metadata.role` only, through the existing
 * `isUserRole()` guard, defaulting to `"student"`. `user_metadata` is
 * writable by the signed-in user themselves via `auth.updateUser()`, so
 * reading role from it would let a learner grant themselves admin.
 *
 * `user_metadata` IS read below for `full_name` — that is safe, because a
 * display *string* grants no permission. Do not "simplify" the role read
 * above to reuse this value; that would reopen the escalation this file
 * exists to close.
 */
export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    role: resolveRole(user.app_metadata?.role),
    displayName: resolveDisplayName(user),
  };
}

/**
 * True while an admin's revoke is in force (`banned_until` in the future).
 *
 * Supabase's Auth server already refuses a banned user at `getUser()`, so
 * this rarely decides anything. It is here so a revoke still holds if that
 * behaviour ever changes, and it fails closed: a `banned_until` that cannot be
 * read as a date counts as revoked.
 */
export function isRevoked(user: Pick<User, "banned_until">, now: Date): boolean {
  const bannedUntil = user.banned_until;
  if (!bannedUntil) return false;
  const until = Date.parse(bannedUntil);
  if (Number.isNaN(until)) return true;
  return until > now.getTime();
}

function resolveRole(rawRole: unknown): UserRole {
  return isUserRole(rawRole) ? rawRole : "student";
}

function resolveDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName;
  }

  const [localPart] = user.email?.split("@") ?? [];
  if (localPart) {
    return localPart;
  }

  return "Learner";
}
