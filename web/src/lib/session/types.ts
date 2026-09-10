/**
 * Session model for the whole app.
 *
 * `getSession()` (`web/src/lib/session/get-session.ts`) resolves a real,
 * server-revalidated Supabase user into this shape. Call sites should prefer
 * `sessionRole()` / `sessionDisplayName()` over narrowing on `status`
 * themselves — both use an exhaustive `switch`, so adding a third `Session`
 * state fails `tsc --noEmit` at a named line here instead of silently
 * defaulting somewhere else.
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

/** The authenticated branch of `Session`, narrowed for call sites that have
 * already confirmed a real session exists (e.g. `requireSession()`). */
export type AuthenticatedSession = Extract<Session, { status: "authenticated" }>;

export const USER_ROLES: readonly UserRole[] = ["student", "admin"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Exhaustiveness helper: a `switch` with a `return` in every case and this in
 * `default` makes an unhandled `Session` state a compile error here, rather
 * than a ternary silently falling through to its `else` branch.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled session status: ${JSON.stringify(value)}`);
}

export function sessionRole(session: Session): UserRole {
  switch (session.status) {
    case "authenticated":
      return session.user.role;
    case "anonymous":
      return "student";
    default:
      return assertNever(session);
  }
}

export function sessionDisplayName(session: Session): string {
  switch (session.status) {
    case "authenticated":
      return session.user.displayName;
    case "anonymous":
      return "there";
    default:
      return assertNever(session);
  }
}
