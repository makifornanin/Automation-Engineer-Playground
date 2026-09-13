import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CODE_SENT_STATE } from "@/lib/auth/sign-in-state";
import { SignInForm } from "./SignInForm";

const mockRequestSignInCode = vi.fn();
const mockVerifySignInCode = vi.fn();

vi.mock("@/lib/auth/sign-in-actions", () => ({
  requestSignInCode: (...args: unknown[]) => mockRequestSignInCode(...args),
  verifySignInCode: (...args: unknown[]) => mockVerifySignInCode(...args),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  mockRequestSignInCode.mockReset();
  mockVerifySignInCode.mockReset();
});

async function advanceToCodeStep(user: ReturnType<typeof userEvent.setup>) {
  mockRequestSignInCode.mockResolvedValue(CODE_SENT_STATE);
  await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
  await user.click(screen.getByRole("button", { name: /send code/i }));
  return screen.findByLabelText(/6-digit code/i);
}

describe("SignInForm — step 1 (request code)", () => {
  it("renders an email field with an associated label", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("disables the submit button while the request is pending, and re-enables after it resolves", async () => {
    // Resolves to an error state (not CODE_SENT_STATE) deliberately: a
    // success would swap the whole form out for the code step, and the
    // captured `submitButton` reference would go stale. Staying on step 1
    // is what lets this test check the *same* button re-enables.
    const errorState = {
      status: "error" as const,
      code: "rate_limited" as const,
      message: "Too many attempts. Wait a moment and try again.",
    };
    const { promise, resolve } = deferred<typeof errorState>();
    mockRequestSignInCode.mockReturnValue(promise);
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    const submitButton = screen.getByRole("button", { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());

    resolve(errorState);

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it("shows the mapped error message when the request fails", async () => {
    mockRequestSignInCode.mockResolvedValue({
      status: "error",
      code: "invalid_input",
      message: "Enter a valid email address.",
    });
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    );
  });
});

describe("SignInForm — step 2 (verify code)", () => {
  it("moves to the code step after a successful request, with the code field correctly configured", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const codeInput = await advanceToCodeStep(user);

    expect(codeInput).toHaveAttribute("inputMode", "numeric");
    expect(codeInput).toHaveAttribute("autoComplete", "one-time-code");
  });

  it("moves focus to the code field when the step changes", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const codeInput = await advanceToCodeStep(user);

    await waitFor(() => expect(codeInput).toHaveFocus());
  });

  it("disables the verify button while verification is pending", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await advanceToCodeStep(user);

    const errorState = {
      status: "error" as const,
      code: "invalid_code" as const,
      message: "That code is incorrect or has expired. Request a new one.",
    };
    const { promise, resolve } = deferred<typeof errorState>();
    mockVerifySignInCode.mockReturnValue(promise);

    await user.type(screen.getByLabelText(/6-digit code/i), "123456");
    const verifyButton = screen.getByRole("button", { name: /verify code/i });
    await user.click(verifyButton);

    await waitFor(() => expect(verifyButton).toBeDisabled());

    // Resolved rather than left dangling: an action left permanently
    // pending when its component unmounts is not a state this form can
    // ever really be in (the real action always settles), and leaving one
    // unresolved here bled into later tests' timing.
    resolve(errorState);
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
  });

  it("shows the mapped error message when verification fails, without leaving the code step", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await advanceToCodeStep(user);

    mockVerifySignInCode.mockResolvedValue({
      status: "error",
      code: "invalid_code",
      message: "That code is incorrect or has expired. Request a new one.",
    });

    await user.type(screen.getByLabelText(/6-digit code/i), "000000");
    await user.click(screen.getByRole("button", { name: /verify code/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That code is incorrect or has expired. Request a new one.",
    );
    expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument();
  });

  it("returns to the email step via 'use a different email'", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await advanceToCodeStep(user);

    await user.click(screen.getByRole("button", { name: /use a different email/i }));

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/6-digit code/i)).not.toBeInTheDocument();
  });
});
