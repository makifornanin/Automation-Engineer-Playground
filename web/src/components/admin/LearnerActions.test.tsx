import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resendInvite = vi.hoisted(() => vi.fn(async () => ({ status: "done", message: "resent" })));
const revokeAccess = vi.hoisted(() => vi.fn(async () => ({ status: "done", message: "revoked" })));
const restoreAccess = vi.hoisted(() => vi.fn(async () => ({ status: "done", message: "restored" })));

vi.mock("@/lib/admin/admin-actions", () => ({ resendInvite, revokeAccess, restoreAccess }));

import { LearnerActions } from "./LearnerActions";

const ID = "22222222-2222-4222-8222-222222222222";

function postedFields(mock: typeof revokeAccess): Record<string, FormDataEntryValue> {
  const calls = mock.mock.calls as unknown as [unknown, FormData][];
  return Object.fromEntries(calls[0][1].entries());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<LearnerActions />", () => {
  it("offers resend and revoke for an invited learner", () => {
    render(<LearnerActions userId={ID} email="a@example.com" status="invited" />);

    expect(screen.getByRole("button", { name: "Resend invite" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke access for a@example.com" })).toBeInTheDocument();
  });

  it("offers only restore for a revoked learner", () => {
    render(<LearnerActions userId={ID} email="a@example.com" status="revoked" />);

    expect(screen.getByRole("button", { name: "Restore access" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revoke/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend invite" })).not.toBeInTheDocument();
  });

  /* Revoke signs a learner out; one stray click must not do it. */
  it("asks for confirmation before revoking, and posts only the learner id", async () => {
    const user = userEvent.setup();
    render(<LearnerActions userId={ID} email="a@example.com" status="active" />);

    await user.click(screen.getByRole("button", { name: "Revoke access for a@example.com" }));
    expect(revokeAccess).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm: revoke access for a@example.com" }));

    await waitFor(() => expect(revokeAccess).toHaveBeenCalledTimes(1));
    expect(postedFields(revokeAccess)).toEqual({ userId: ID, intent: "revoke" });
    expect(await screen.findByText("revoked")).toBeInTheDocument();
  });

  /* A destructive action must not drop a keyboard user to the top of the page. */
  it("moves focus to the confirm button, and back when cancelled", async () => {
    const user = userEvent.setup();
    render(<LearnerActions userId={ID} email="a@example.com" status="active" />);

    await user.click(screen.getByRole("button", { name: "Revoke access for a@example.com" }));
    expect(screen.getByRole("button", { name: "Confirm: revoke access for a@example.com" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Revoke access for a@example.com" })).toHaveFocus();
  });

  it("sends resend to the resend action, not revoke", async () => {
    const user = userEvent.setup();
    render(<LearnerActions userId={ID} email="a@example.com" status="invited" />);

    await user.click(screen.getByRole("button", { name: "Resend invite" }));

    await waitFor(() => expect(resendInvite).toHaveBeenCalledTimes(1));
    expect(revokeAccess).not.toHaveBeenCalled();
  });
});
