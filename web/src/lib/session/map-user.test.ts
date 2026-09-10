import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { toSessionUser } from "./map-user";

/** Minimal valid Supabase `User`, overridable per test. */
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("toSessionUser", () => {
  it("REGRESSION: user_metadata.role='admin' with no app_metadata.role resolves to student, never admin", () => {
    const user = buildUser({
      app_metadata: {},
      user_metadata: { role: "admin" },
    });

    expect(toSessionUser(user).role).toBe("student");
  });

  it("never copies credentials or metadata into the browser-visible session user", () => {
    // Every dangerous field `User` allows is populated on purpose. The point
    // of this test is proving they are NOT copied through — a minimal
    // fixture staying minimal would prove nothing.
    const user = buildUser({
      email: "ada@example.com",
      app_metadata: {
        role: "admin",
        provider: "email",
        providers: ["email"],
      },
      user_metadata: {
        full_name: "Ada Lovelace",
        avatar_url: "https://example.com/avatar.png",
      },
      // The token-bearing field `User` allows: an admin action link embeds a
      // one-time-use auth token in its URL.
      action_link: "https://example.supabase.co/auth/v1/verify?token=super-secret-otp",
      phone: "+15551234567",
      confirmed_at: "2026-01-01T00:00:00.000Z",
      last_sign_in_at: "2026-01-01T00:00:00.000Z",
    });

    const sessionUser = toSessionUser(user);

    expect(Object.keys(sessionUser).sort()).toEqual(["displayName", "id", "role"]);
  });

  it("reads role from app_metadata.role when it is a valid role", () => {
    const user = buildUser({ app_metadata: { role: "admin" } });
    expect(toSessionUser(user).role).toBe("admin");
  });

  it("defaults to student when app_metadata.role is absent", () => {
    const user = buildUser({ app_metadata: {} });
    expect(toSessionUser(user).role).toBe("student");
  });

  it("defaults to student when app_metadata itself is missing entirely", () => {
    const user = buildUser();
    Reflect.deleteProperty(user, "app_metadata");
    expect(toSessionUser(user).role).toBe("student");
  });

  it("defaults to student when app_metadata.role is null", () => {
    const user = buildUser({ app_metadata: { role: null } });
    expect(toSessionUser(user).role).toBe("student");
  });

  it("defaults to student when app_metadata.role is an unknown string", () => {
    const user = buildUser({ app_metadata: { role: "owner" } });
    expect(toSessionUser(user).role).toBe("student");
  });

  it("defaults to student when app_metadata.role is a number", () => {
    const user = buildUser({ app_metadata: { role: 1 } });
    expect(toSessionUser(user).role).toBe("student");
  });

  it("defaults to student when app_metadata.role is an array", () => {
    const user = buildUser({ app_metadata: { role: ["admin"] } });
    expect(toSessionUser(user).role).toBe("student");
  });

  it("carries the Supabase user id through unchanged", () => {
    const user = buildUser({ id: "abc-def-123" });
    expect(toSessionUser(user).id).toBe("abc-def-123");
  });

  it("uses user_metadata.full_name as the display name when present", () => {
    const user = buildUser({ user_metadata: { full_name: "Ada Lovelace" } });
    expect(toSessionUser(user).displayName).toBe("Ada Lovelace");
  });

  it("falls back to the local part of the email when full_name is absent", () => {
    const user = buildUser({ email: "ada@example.com" });
    expect(toSessionUser(user).displayName).toBe("ada");
  });

  it("falls back to 'Learner' when neither full_name nor email is present", () => {
    const user = buildUser();
    expect(toSessionUser(user).displayName).toBe("Learner");
  });

  it("falls back to email local part when full_name is an empty string", () => {
    const user = buildUser({
      user_metadata: { full_name: "" },
      email: "ada@example.com",
    });
    expect(toSessionUser(user).displayName).toBe("ada");
  });
});
