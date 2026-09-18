import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_MESSAGE, IDLE_ADMIN_ACTION_STATE } from "./types";

const getSession = vi.hoisted(() => vi.fn());
const getAdminClient = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session/get-session", () => ({ getSession }));
vi.mock("@/lib/supabase/admin-client", () => ({ getAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { inviteLearner, resendInvite, restoreAccess, revokeAccess } from "./admin-actions";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const LEARNER_ID = "22222222-2222-4222-8222-222222222222";

const ADMIN_SESSION = {
  status: "authenticated",
  user: { id: ADMIN_ID, displayName: "Owner", role: "admin" },
};
const STUDENT_SESSION = {
  status: "authenticated",
  user: { id: LEARNER_ID, displayName: "Learner", role: "student" },
};

const admin = {
  inviteUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
};

function learner(overrides: Partial<User> = {}): User {
  return {
    id: LEARNER_ID,
    email: "learner@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(ADMIN_SESSION);
  getAdminClient.mockResolvedValue({ auth: { admin } });
  admin.inviteUserByEmail.mockResolvedValue({ data: { user: learner() }, error: null });
  admin.getUserById.mockResolvedValue({ data: { user: learner() }, error: null });
  admin.updateUserById.mockResolvedValue({ data: { user: learner() }, error: null });
});

describe("every admin action refuses a caller who is not an admin", () => {
  const calls = [
    ["inviteLearner", () => inviteLearner(IDLE_ADMIN_ACTION_STATE, form({ email: "new@example.com" }))],
    ["resendInvite", () => resendInvite(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }))],
    ["revokeAccess", () => revokeAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: ADMIN_ID }))],
    ["restoreAccess", () => restoreAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }))],
  ] as const;

  /*
   * A Server Action is callable with a replayed action id whether or not the
   * Admin page rendered, so the page's 404 protects nothing here.
   */
  it.each(calls)("%s: a student gets not_allowed and no admin client is built", async (_name, call) => {
    getSession.mockResolvedValue(STUDENT_SESSION);

    const state = await call();

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.not_allowed });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it.each(calls)("%s: a signed-out caller gets not_allowed", async (_name, call) => {
    getSession.mockResolvedValue({ status: "anonymous" });

    const state = await call();

    expect(state.status).toBe("error");
    expect(getAdminClient).not.toHaveBeenCalled();
  });
});

describe("inviteLearner", () => {
  it("invites the normalised address with no metadata, so the account defaults to student", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://aep.example.com");

    const state = await inviteLearner(IDLE_ADMIN_ACTION_STATE, form({ email: "  New@Example.com " }));

    expect(state).toEqual({ status: "done", message: ADMIN_MESSAGE.invite_sent });
    expect(admin.inviteUserByEmail).toHaveBeenCalledWith("new@example.com", {
      redirectTo: "https://aep.example.com/sign-in",
    });
    vi.unstubAllEnvs();
  });

  it("refuses an address that is not an email without calling Supabase", async () => {
    const state = await inviteLearner(IDLE_ADMIN_ACTION_STATE, form({ email: "not-an-email" }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.invalid_email });
    expect(admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("says an existing confirmed account already has access", async () => {
    admin.inviteUserByEmail.mockResolvedValue({ data: { user: null }, error: { code: "email_exists" } });

    const state = await inviteLearner(IDLE_ADMIN_ACTION_STATE, form({ email: "old@example.com" }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.already_active });
  });

  it("names Supabase's email limit instead of a generic failure", async () => {
    admin.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { code: "over_email_send_rate_limit" },
    });

    const state = await inviteLearner(IDLE_ADMIN_ACTION_STATE, form({ email: "new@example.com" }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.email_limit });
  });

  it("says not configured when the server has no secret key", async () => {
    getAdminClient.mockResolvedValue(null);

    const state = await inviteLearner(IDLE_ADMIN_ACTION_STATE, form({ email: "new@example.com" }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.not_configured });
  });
});

describe("resendInvite", () => {
  it("re-invites an unconfirmed learner at the email Supabase holds, not one from the form", async () => {
    const state = await resendInvite(
      IDLE_ADMIN_ACTION_STATE,
      form({ userId: LEARNER_ID, email: "attacker@example.com" }),
    );

    expect(state).toEqual({ status: "done", message: ADMIN_MESSAGE.resend_sent });
    expect(admin.getUserById).toHaveBeenCalledWith(LEARNER_ID);
    expect(admin.inviteUserByEmail.mock.calls[0][0]).toBe("learner@example.com");
  });

  it("does not resend to a learner who has already accepted", async () => {
    admin.getUserById.mockResolvedValue({
      data: { user: learner({ email_confirmed_at: "2026-09-02T00:00:00.000Z" }) },
      error: null,
    });

    const state = await resendInvite(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.resend_not_needed });
    expect(admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("does not resend to a revoked learner", async () => {
    admin.getUserById.mockResolvedValue({
      data: { user: learner({ banned_until: "2126-01-01T00:00:00.000Z" }) },
      error: null,
    });

    const state = await resendInvite(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.resend_revoked });
    expect(admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("refuses an id that is not a user id without calling Supabase", async () => {
    const state = await resendInvite(IDLE_ADMIN_ACTION_STATE, form({ userId: "../users" }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.invalid_learner });
    expect(admin.getUserById).not.toHaveBeenCalled();
  });
});

describe("revokeAccess", () => {
  it("bans the learner until restored and deletes nothing", async () => {
    const state = await revokeAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "done", message: ADMIN_MESSAGE.revoked });
    expect(admin.updateUserById).toHaveBeenCalledWith(LEARNER_ID, { ban_duration: "876000h" });
    expect(admin.deleteUser).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("refuses to revoke the admin's own account", async () => {
    const state = await revokeAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: ADMIN_ID }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.self });
    expect(admin.updateUserById).not.toHaveBeenCalled();
  });

  it("refuses to revoke another admin", async () => {
    admin.getUserById.mockResolvedValue({
      data: { user: learner({ app_metadata: { role: "admin" } }) },
      error: null,
    });

    const state = await revokeAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.admin_target });
    expect(admin.updateUserById).not.toHaveBeenCalled();
  });

  it("reports a failed ban instead of claiming it worked", async () => {
    admin.updateUserById.mockResolvedValue({ data: { user: null }, error: { code: "unexpected_failure" } });

    const state = await revokeAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.action_failed });
  });
});

describe("restoreAccess", () => {
  it("lifts the ban on a revoked learner", async () => {
    admin.getUserById.mockResolvedValue({
      data: { user: learner({ banned_until: "2126-01-01T00:00:00.000Z" }) },
      error: null,
    });

    const state = await restoreAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "done", message: ADMIN_MESSAGE.restored });
    expect(admin.updateUserById).toHaveBeenCalledWith(LEARNER_ID, { ban_duration: "none" });
  });

  it("does nothing for a learner who already has access", async () => {
    const state = await restoreAccess(IDLE_ADMIN_ACTION_STATE, form({ userId: LEARNER_ID }));

    expect(state).toEqual({ status: "error", message: ADMIN_MESSAGE.not_revoked });
    expect(admin.updateUserById).not.toHaveBeenCalled();
  });
});
