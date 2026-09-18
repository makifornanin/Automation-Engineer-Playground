import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { isUserId, learnerStatus, toLearnerRow } from "./users";

const NOW = new Date("2026-09-18T12:00:00.000Z");

function user(overrides: Partial<User> = {}): User {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    email: "learner@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("learnerStatus", () => {
  it("is invited until the email is confirmed", () => {
    expect(learnerStatus(user({ invited_at: "2026-09-01T00:00:00.000Z" }), NOW)).toBe("invited");
  });

  it("is active once the email is confirmed", () => {
    expect(learnerStatus(user({ email_confirmed_at: "2026-09-02T00:00:00.000Z" }), NOW)).toBe(
      "active",
    );
  });

  it("is revoked while a ban is in force, even for a confirmed learner", () => {
    const revoked = user({
      email_confirmed_at: "2026-09-02T00:00:00.000Z",
      banned_until: "2126-09-02T00:00:00.000Z",
    });
    expect(learnerStatus(revoked, NOW)).toBe("revoked");
  });

  it("is no longer revoked once the ban has passed", () => {
    const lifted = user({
      email_confirmed_at: "2026-09-02T00:00:00.000Z",
      banned_until: "2026-09-10T00:00:00.000Z",
    });
    expect(learnerStatus(lifted, NOW)).toBe("active");
  });
});

describe("toLearnerRow", () => {
  it("projects only what the Admin page shows", () => {
    const row = toLearnerRow(
      user({
        app_metadata: { role: "admin", provider: "email" },
        user_metadata: { role: "student", full_name: "Ada" },
        identities: [],
        phone: "+15551234567",
        action_link: "https://example.supabase.co/auth/v1/verify?token=secret",
      }),
      NOW,
    );

    expect(Object.keys(row).sort()).toEqual(
      ["email", "id", "invitedAt", "lastSignInAt", "role", "status"].sort(),
    );
    expect(row.role).toBe("admin");
  });

  it("reads role from app_metadata only", () => {
    expect(toLearnerRow(user({ user_metadata: { role: "admin" } }), NOW).role).toBe("student");
  });
});

describe("isUserId", () => {
  it("accepts a UUID and nothing else", () => {
    expect(isUserId("22222222-2222-4222-8222-222222222222")).toBe(true);
    expect(isUserId("22222222-2222-4222-8222-22222222222")).toBe(false);
    expect(isUserId("../admin/users")).toBe(false);
    expect(isUserId(null)).toBe(false);
  });
});
