import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { LessonChunk } from "@/lib/lesson/chunks";
import { FocusMode } from "./FocusMode";

const CHUNKS: readonly LessonChunk[] = [
  { id: "problem", title: "The problem", body: ["Systems disagree about names."] },
  { id: "concept", title: "The concept", body: ["Mapping translates between them."] },
];

describe("<FocusMode />", () => {
  it("shows one chunk at a time, starting at the first", () => {
    render(<FocusMode chunks={CHUNKS} />);

    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The concept" })).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("advances and goes back through the chunks", async () => {
    const user = userEvent.setup();
    render(<FocusMode chunks={CHUNKS} />);

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));
    expect(screen.getByRole("heading", { name: "The concept" })).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to The problem" }));
    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("cannot step past either end", async () => {
    const user = userEvent.setup();
    render(<FocusMode chunks={CHUNKS} />);

    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  /*
   * The stepper's main accessibility risk is a screen reader user not being
   * told anything changed. Focus moves to the new heading rather than an
   * aria-live region re-reading the body on every press.
   */
  it("moves focus to the new chunk's heading after stepping", async () => {
    const user = userEvent.setup();
    render(<FocusMode chunks={CHUNKS} />);

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));

    expect(screen.getByRole("heading", { name: "The concept" })).toHaveFocus();
  });

  /*
   * ...but not on arrival. The learner has just loaded the page and has not
   * stepped anywhere, so stealing focus would be wrong.
   */
  it("does not steal focus on first render", () => {
    render(<FocusMode chunks={CHUNKS} />);

    expect(screen.getByRole("heading", { name: "The problem" })).not.toHaveFocus();
  });

  it("labels the region by the current chunk heading", () => {
    render(<FocusMode chunks={CHUNKS} />);

    expect(screen.getByRole("region", { name: "The problem" })).toBeInTheDocument();
  });

  /*
   * Focus lands on the heading every step, so the position has to reach the
   * reader through that heading. Without the description the announcement is
   * "The concept, heading level 2" — what they arrived at, but not where they
   * are in the sequence.
   */
  it("carries the step position in the focused heading's description", async () => {
    const user = userEvent.setup();
    render(<FocusMode chunks={CHUNKS} />);

    expect(
      screen.getByRole("heading", { name: "The problem" }),
    ).toHaveAccessibleDescription("Step 1 of 2");

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));

    expect(
      screen.getByRole("heading", { name: "The concept" }),
    ).toHaveAccessibleDescription("Step 2 of 2");
  });
});
