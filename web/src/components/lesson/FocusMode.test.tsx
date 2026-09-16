import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { LessonChunk } from "@/lib/lesson/types";
import { FocusMode } from "./FocusMode";

const CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [{ type: "prose", text: "Systems disagree about names." }],
  },
  {
    kind: "concept",
    id: "concept",
    title: "The concept",
    content: [{ type: "prose", text: "Mapping translates between them." }],
  },
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

describe("<FocusMode /> — chunk kinds", () => {
  it("renders a guided build's four named slots in Vision §19's order", () => {
    const build: LessonChunk = {
      kind: "guided-build",
      id: "build",
      title: "Build the thing",
      whyThisMatters: [{ type: "prose", text: "Because the CRM expects it." }],
      content: [],
      actions: [
        { text: "Add a Set node.", expect: "One item appears." },
        { text: "Rename it." },
      ],
      whyWereDoingThis: [{ type: "prose", text: "So the shapes match." }],
    };

    const { container } = render(<FocusMode chunks={[build]} />);

    expect(screen.getByText("Because the CRM expects it.")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("So the shapes match.")).toBeInTheDocument();
    expect(screen.getByText(/One item appears\./)).toBeInTheDocument();

    // The reason must come before the actions, and a second reason after them.
    const text = container.textContent ?? "";
    expect(text.indexOf("Because the CRM expects it.")).toBeLessThan(
      text.indexOf("Add a Set node."),
    );
    expect(text.indexOf("Add a Set node.")).toBeLessThan(text.indexOf("So the shapes match."));
  });

  it("renders a node teaching note with all three mandated headings", () => {
    const build: LessonChunk = {
      kind: "guided-build",
      id: "build",
      title: "Build",
      whyThisMatters: [{ type: "prose", text: "Why." }],
      content: [],
      actions: [{ text: "One." }, { text: "Two." }],
      whyWereDoingThis: [{ type: "prose", text: "Because." }],
      teaches: [
        {
          subject: "node",
          name: "Manual Trigger",
          what: "Starts the workflow.",
          whyHere: "You want to run it on demand.",
          businessReason: "Test before real data is involved.",
        },
      ],
    };

    render(<FocusMode chunks={[build]} />);

    expect(screen.getByText("What it does")).toBeInTheDocument();
    expect(screen.getByText("Why we’re using it here")).toBeInTheDocument();
    expect(screen.getByText("Business reason")).toBeInTheDocument();
    expect(screen.getByText("Starts the workflow.")).toBeInTheDocument();
  });

  /*
   * A prediction the learner can read the answer to is not a prediction.
   */
  it("hides a predict chunk's answer until the learner asks for it", async () => {
    const user = userEvent.setup();
    const predict: LessonChunk = {
      kind: "predict",
      id: "predict",
      title: "Predict",
      content: [],
      prompt: "What will the email look like?",
      reveal: [{ type: "prose", text: "alex@example.com" }],
    };

    render(<FocusMode chunks={[predict]} />);

    expect(screen.getByText("What will the email look like?")).toBeInTheDocument();
    expect(screen.queryByText("alex@example.com")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show me what happens" }));

    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
  });

  /*
   * ASCII art read character by character is noise. The description is the
   * only thing that makes a diagram comprehensible aloud.
   */
  it("exposes a diagram by its description, not its ASCII", () => {
    const chunk: LessonChunk = {
      kind: "concept",
      id: "concept",
      title: "Concept",
      content: [
        {
          type: "diagram",
          ascii: "A -> B -> C",
          alt: "Three nodes in a line: A, then B, then C.",
        },
      ],
    };

    render(<FocusMode chunks={[chunk]} />);

    expect(
      screen.getByRole("img", { name: "Three nodes in a line: A, then B, then C." }),
    ).toBeInTheDocument();
  });
});
