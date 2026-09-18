import type { User } from "@supabase/supabase-js";
import { isRevoked } from "@/lib/session/map-user";
import { isUserRole, type UserRole } from "@/lib/session/types";

/**
 * What the Admin page shows for one account. A deliberately small projection
 * of Supabase's `User`: the raw object carries identities, metadata and
 * factors that have no business reaching a rendered page.
 */
export type LearnerStatus = "invited" | "active" | "revoked";

export interface LearnerRow {
  id: string;
  email: string;
  status: LearnerStatus;
  role: UserRole;
  invitedAt: string | null;
  lastSignInAt: string | null;
}

/**
 * Revoked wins over everything: a revoked learner who had signed in before is
 * still revoked. Then an account whose email is confirmed is active — it has
 * accepted an invite or signed in. Anything else was invited and has not
 * accepted yet.
 */
export function learnerStatus(user: User, now: Date): LearnerStatus {
  if (isRevoked(user, now)) return "revoked";
  if (user.email_confirmed_at) return "active";
  return "invited";
}

export function toLearnerRow(user: User, now: Date): LearnerRow {
  const role = user.app_metadata?.role;
  return {
    id: user.id,
    email: user.email ?? "",
    status: learnerStatus(user, now),
    role: isUserRole(role) ? role : "student",
    invitedAt: user.invited_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
