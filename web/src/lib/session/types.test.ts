import { describe, expect, it } from "vitest";
import {
  isUserRole,
  sessionDisplayName,
  sessionRole,
  USER_ROLES,
  type AuthenticatedSession,
  type Session,
} from "./types";

const authenticated: Session = {
  status: "authenticated",
  user: { id: "user-1", displayName: "Ada", role: "admin" },
};

const anonymous: Session = { status: "anonymous" };

describe("USER_ROLES / isUserRole (unchanged)", () => {
  it("still lists exactly student and admin", () => {
    expect(USER_ROLES).toEqual(["student", "admin"]);
  });

  it("still accepts only known roles", () => {
    expect(isUserRole("student")).toBe(true);
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("owner")).toBe(false);
  });
});

describe("sessionRole", () => {
  it("returns the user's role for an authenticated session", () => {
    expect(sessionRole(authenticated)).toBe("admin");
  });

  it("returns student for an anonymous session", () => {
    expect(sessionRole(anonymous)).toBe("student");
  });
});

describe("sessionDisplayName", () => {
  it("returns the user's display name for an authenticated session", () => {
    expect(sessionDisplayName(authenticated)).toBe("Ada");
  });

  it("returns a generic greeting name for an anonymous session", () => {
    expect(sessionDisplayName(anonymous)).toBe("there");
  });
});

describe("AuthenticatedSession", () => {
  it("narrows to the authenticated branch at the type level", () => {
    const session: AuthenticatedSession = authenticated;
    expect(session.user.id).toBe("user-1");
  });
});
