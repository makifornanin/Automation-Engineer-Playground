import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignOutButton } from "./SignOutButton";

const mockSignOutAction = vi.fn();

vi.mock("@/lib/auth/sign-out-action", () => ({
  signOutAction: (...args: unknown[]) => mockSignOutAction(...args),
}));

beforeEach(() => {
  mockSignOutAction.mockReset();
  mockSignOutAction.mockResolvedValue(undefined);
});

describe("SignOutButton", () => {
  it("renders inside a <form>, not a link or a GET route — a GET sign-out endpoint is a CSRF footgun (<img src>)", () => {
    const { container } = render(<SignOutButton />);
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("renders a submit button labelled Sign out", () => {
    render(<SignOutButton />);
    const button = screen.getByRole("button", { name: /sign out/i });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("invokes the sign-out server action when submitted", async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockSignOutAction).toHaveBeenCalled();
  });
});
