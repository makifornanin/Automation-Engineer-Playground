import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.hoisted(() => vi.fn());
const listLearners = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/guards", () => ({ requireAdmin }));
vi.mock("@/lib/admin/learner-store", () => ({ listLearners }));
vi.mock("@/lib/admin/admin-actions", () => ({
  inviteLearner: vi.fn(),
  resendInvite: vi.fn(),
  revokeAccess: vi.fn(),
  restoreAccess: vi.fn(),
}));

import AdminPage from "./page";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue({
    status: "authenticated",
    user: { id: OWNER_ID, displayName: "Owner", role: "admin" },
  });
});

describe("<AdminPage />", () => {
  it("reads nothing when the caller is not an admin", async () => {
    requireAdmin.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(AdminPage()).rejects.toThrow("NOT_FOUND");
    expect(listLearners).not.toHaveBeenCalled();
  });

  it("lists learners with their status, and offers no actions on admin accounts", async () => {
    listLearners.mockResolvedValue({
      status: "ok",
      truncated: false,
      learners: [
        { id: "a", email: "new@example.com", status: "invited", role: "student", invitedAt: null, lastSignInAt: null },
        { id: "b", email: "gone@example.com", status: "revoked", role: "student", invitedAt: null, lastSignInAt: "2026-09-17T08:00:00.000Z" },
        { id: OWNER_ID, email: "owner@example.com", status: "active", role: "admin", invitedAt: null, lastSignInAt: null },
      ],
    });

    render(await AdminPage());

    expect(screen.getByText("Invited — not accepted yet · Never signed in")).toBeInTheDocument();
    expect(screen.getByText("Revoked · Last signed in 17 Sept 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend invite" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore access" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke access for owner@example.com" })).not.toBeInTheDocument();
  });

  it("says so when the list cannot be loaded", async () => {
    listLearners.mockResolvedValue({ status: "unavailable" });

    render(await AdminPage());

    expect(screen.getByText(/could not be loaded/)).toBeInTheDocument();
  });
});
