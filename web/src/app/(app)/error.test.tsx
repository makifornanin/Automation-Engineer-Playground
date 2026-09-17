import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppError from "./error";

describe("(app) error boundary", () => {
  it("announces a plain message and never shows the error's details", () => {
    const error = Object.assign(new Error("relation aep_web_lab_progress failed at row 7"), {
      digest: "abc123",
    });
    render(<AppError error={error} retry={() => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong on our side.");
    expect(screen.queryByText(/aep_web_lab_progress|abc123/)).not.toBeInTheDocument();
  });

  it("retries the segment and offers a way Home", async () => {
    const retry = vi.fn();
    render(<AppError error={new Error("x")} retry={retry} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
  });
});
