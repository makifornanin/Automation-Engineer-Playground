import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const inviteLearner = vi.hoisted(() =>
  vi.fn(async () => ({ status: "done", message: "Invite sent." })),
);
vi.mock("@/lib/admin/admin-actions", () => ({ inviteLearner }));

import { InviteLearnerForm } from "./InviteLearnerForm";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<InviteLearnerForm />", () => {
  it("posts the typed address and shows what the server said", async () => {
    const user = userEvent.setup();
    render(<InviteLearnerForm />);

    await user.type(screen.getByLabelText(/Learner’s email/), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    await waitFor(() => expect(inviteLearner).toHaveBeenCalledTimes(1));
    const [, formData] = inviteLearner.mock.calls[0] as unknown as [unknown, FormData];
    expect(formData.get("email")).toBe("new@example.com");
    expect(await screen.findByText("Invite sent.")).toBeInTheDocument();
  });
});
