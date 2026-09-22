import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonChunk } from "@/lib/lesson/types";
import { FocusMode } from "./FocusMode";

/*
 * The progress actions reach `server-only` through the Supabase client, which
 * throws when resolved under jsdom. Mocking the module keeps these tests about
 * the stepper's behaviour, and lets them assert *what* was recorded — which is
 * the part worth guarding.
 */
const setCurrentChunk = vi.hoisted(() => vi.fn(async () => {}));
const recordChunkEvidence = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/lib/course/progress-actions", () => ({
  setCurrentChunk,
  recordChunkEvidence,
}));

vi.mock("@/lib/notes/notes-actions", () => ({ saveToNotes: vi.fn(async () => null) }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh }),
}));


const LAB = "01-data-mapping-transformation";

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

function renderFocus(chunks: readonly LessonChunk[] = CHUNKS, initialChunkId?: string | null) {
  return render(<FocusMode chunks={chunks} labSlug={LAB} initialChunkId={initialChunkId} />);
}

beforeEach(() => {
  setCurrentChunk.mockClear();
  recordChunkEvidence.mockClear();
});

describe("<FocusMode />", () => {
  it("labels both Back controls with plain text and no decorative arrow", () => {
    renderFocus(CHUNKS, "concept");
    for (const button of screen.getAllByRole("button", { name: /^Back to/ })) {
      expect(button.textContent?.trim()).toBe("Back");
    }
  });
  it("shows one chunk at a time, starting at the first", () => {
    renderFocus();

    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The concept" })).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("advances and goes back through the chunks", async () => {
    const user = userEvent.setup();
    renderFocus();

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));
    expect(screen.getByRole("heading", { name: "The concept" })).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to The problem" }));
    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("cannot step past either end", async () => {
    const user = userEvent.setup();
    renderFocus();

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
    renderFocus();

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));

    expect(screen.getByRole("heading", { name: "The concept" })).toHaveFocus();
  });

  /*
   * ...but not on arrival. The learner has just loaded the page and has not
   * stepped anywhere, so stealing focus would be wrong.
   */
  it("does not steal focus on first render", () => {
    renderFocus();

    expect(screen.getByRole("heading", { name: "The problem" })).not.toHaveFocus();
  });

  it("labels the region by the current chunk heading", () => {
    renderFocus();

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
    renderFocus();

    expect(
      screen.getByRole("heading", { name: "The problem" }),
    ).toHaveAccessibleDescription("Step 1 of 2");

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));

    expect(
      screen.getByRole("heading", { name: "The concept" }),
    ).toHaveAccessibleDescription("Step 2 of 2");
  });
});

describe("<FocusMode /> — resume and position", () => {
  it("starts where the learner left off", () => {
    renderFocus(CHUNKS, "concept");

    expect(screen.getByRole("heading", { name: "The concept" })).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
  });

  /*
   * Content gets reordered as labs are authored. A saved position naming a
   * chunk that no longer exists must land the learner at the start, not on a
   * blank screen.
   */
  it("falls back to the first chunk when the saved position no longer exists", () => {
    renderFocus(CHUNKS, "a-chunk-that-was-deleted");

    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("records the new position on every advance", async () => {
    const user = userEvent.setup();
    renderFocus();

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));

    expect(setCurrentChunk).toHaveBeenCalledWith(LAB, "concept");
  });

  /*
   * Reading is not evidence (Vision §3). Stepping through prose must not
   * quietly award a milestone.
   */
  it("records no evidence for prose chunks", async () => {
    const user = userEvent.setup();
    renderFocus();

    await user.click(screen.getByRole("button", { name: "Next: The concept" }));

    expect(recordChunkEvidence).not.toHaveBeenCalled();
  });
});

describe("<FocusMode /> — chunk kinds", () => {
  const BUILD: LessonChunk = {
    kind: "guided-build",
    id: "build",
    title: "Build the thing",
    whyThisMatters: [{ type: "prose", text: "Because the CRM expects it." }],
    content: [],
    actions: [{ text: "Add a Set node.", expect: "One item appears." }, { text: "Rename it." }],
    whyWereDoingThis: [{ type: "prose", text: "So the shapes match." }],
  };

  it("renders a guided build's four named slots in Vision §19's order", () => {
    const { container } = renderFocus([BUILD, CHUNKS[1]]);

    expect(screen.getByText("Because the CRM expects it.")).toBeInTheDocument();
    expect(screen.getByText("So the shapes match.")).toBeInTheDocument();
    expect(screen.getByText(/One item appears\./)).toBeInTheDocument();

    // The reason must come before the actions, and a second reason after them.
    const text = container.textContent ?? "";
    expect(text.indexOf("Because the CRM expects it.")).toBeLessThan(
      text.indexOf("Add a Set node."),
    );
    expect(text.indexOf("Add a Set node.")).toBeLessThan(text.indexOf("So the shapes match."));
  });

  /*
   * Vision §19's own terminal control, scoped to one build step. This is not
   * the lab-level "Mark complete" Vision §3 rules out.
   */
  it("offers Done / Next on a build chunk and records acknowledgement", async () => {
    const user = userEvent.setup();
    renderFocus([BUILD, CHUNKS[1]]);

    await user.click(screen.getByRole("button", { name: "Done / Next: The concept" }));

    expect(recordChunkEvidence).toHaveBeenCalledWith(LAB, "build");
    expect(screen.getByRole("heading", { name: "The concept" })).toBeInTheDocument();
  });

  it("renders a node teaching note with all three mandated headings", () => {
    renderFocus([
      {
        ...BUILD,
        teaches: [
          {
            subject: "node",
            name: "Manual Trigger",
            what: "Starts the workflow.",
            whyHere: "You want to run it on demand.",
            businessReason: "Test before real data is involved.",
          },
        ],
      },
    ]);

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
    renderFocus([
      {
        kind: "predict",
        id: "predict",
        title: "Predict",
        content: [],
        prompt: "What will the email look like?",
        reveal: [{ type: "prose", text: "alex@example.com" }],
      },
    ]);

    expect(screen.getByText("What will the email look like?")).toBeInTheDocument();
    expect(screen.queryByText("alex@example.com")).not.toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "What will the email look like?" }),
      "lowercase, no spaces",
    );
    await user.click(screen.getByRole("button", { name: "Show me what happens" }));

    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    // Shown back beside the real answer — comparing the two is the lesson.
    expect(screen.getByText("lowercase, no spaces")).toBeInTheDocument();
  });

  /*
   * The QA BLOCKER. A predict chunk demands `predicted` evidence, and before
   * this nothing ever wrote it — so no lab could complete. The reveal is the
   * one place it is earned.
   */
  it("records predicted evidence when the learner reveals the answer", async () => {
    const user = userEvent.setup();
    renderFocus([
      {
        kind: "predict",
        id: "predict",
        title: "Predict",
        content: [],
        prompt: "How many leads reach Priority Sales?",
        reveal: [{ type: "prose", text: "One." }],
      },
    ]);

    await user.type(screen.getByRole("textbox"), "just one");
    await user.click(screen.getByRole("button", { name: "Show me what happens" }));

    expect(recordChunkEvidence).toHaveBeenCalledWith(LAB, "predict");
  });

  /*
   * A reveal button alone would award a milestone to anyone who clicked past
   * the question. Requiring words is what makes the evidence mean something.
   */
  it("will not reveal until the learner has written a prediction", async () => {
    const user = userEvent.setup();
    renderFocus([
      {
        kind: "predict",
        id: "predict",
        title: "Predict",
        content: [],
        prompt: "How many leads reach Priority Sales?",
        reveal: [{ type: "prose", text: "One." }],
      },
    ]);

    const reveal = screen.getByRole("button", { name: "Show me what happens" });
    expect(reveal).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "   ");
    expect(reveal).toBeDisabled();
    expect(recordChunkEvidence).not.toHaveBeenCalled();
  });

  /*
   * ASCII art read character by character is noise. The description is the
   * only thing that makes a diagram comprehensible aloud.
   */
  it("exposes a diagram by its description, not its ASCII", () => {
    renderFocus([
      {
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
      },
    ]);

    expect(
      screen.getByRole("img", { name: "Three nodes in a line: A, then B, then C." }),
    ).toBeInTheDocument();
  });
});

describe("<FocusMode /> - the end of a lab", () => {
  const RECAP: LessonChunk = {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [{ type: "prose", text: "A translator for lead data." }],
  };

  it("says the lab is complete and names what it unlocked", () => {
    render(
      <FocusMode
        chunks={[RECAP]}
        labSlug={LAB}
        completion={{
          complete: true,
          next: { label: "Lab 02 - Conditions", href: "/labs/02-conditions-routing" },
        }}
      />,
    );

    expect(screen.getByText(/Lab complete\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Lab 02 - Conditions" })).toHaveAttribute(
      "href",
      "/labs/02-conditions-routing",
    );
  });

  /*
   * Completion follows evidence (Vision section 3). Reading to the last chunk
   * without passing the checks is not finishing, and the recap must say so
   * rather than congratulate the learner for scrolling.
   */
  it("does not congratulate a learner who has not earned it", () => {
    render(
      <FocusMode
        chunks={[RECAP]}
        labSlug={LAB}
        completion={{
          complete: false,
          next: null,
          openSteps: [{ id: "challenge", title: "Challenge", evidence: "verified" }],
        }}
      />,
    );

    expect(screen.queryByText(/Lab complete/)).not.toBeInTheDocument();
    expect(screen.getByText("One step left before this lab is complete:")).toBeInTheDocument();
  });

  /*
   * The owner reached a recap that said "anything still open is waiting back
   * through the steps" with Next disabled, and no way to tell what was open.
   * The recap now names each open step and goes straight to it.
   */
  it("names each open step on the recap and goes straight to it", async () => {
    const user = userEvent.setup();
    const BUILD: LessonChunk = {
      kind: "guided-build",
      id: "build",
      title: "Build the workflow",
      content: [],
      whyThisMatters: [{ type: "prose", text: "Why." }],
      actions: [{ text: "Do one thing." }, { text: "Do another." }],
      whyWereDoingThis: [{ type: "prose", text: "Because." }],
    };
    render(
      <FocusMode
        chunks={[BUILD, RECAP]}
        labSlug={LAB}
        initialChunkId={RECAP.id}
        completion={{
          complete: false,
          next: null,
          openSteps: [{ id: "build", title: "Build the workflow", evidence: "acknowledged" }],
        }}
      />,
    );

    expect(screen.getByText("— mark it done")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Build the workflow" }));

    expect(screen.getByRole("heading", { level: 2, name: "Build the workflow" })).toHaveFocus();
    expect(setCurrentChunk).toHaveBeenCalledWith(LAB, "build");
  });

  /*
   * Evidence writes are fire-and-forget, so without this the recap would still
   * list a step the learner finished a moment ago.
   */
  it("drops a step from the open list as soon as it is done, then refreshes", async () => {
    const user = userEvent.setup();
    refresh.mockClear();
    const BUILD: LessonChunk = {
      kind: "guided-build",
      id: "build",
      title: "Build the workflow",
      content: [],
      whyThisMatters: [{ type: "prose", text: "Why." }],
      actions: [{ text: "Do one thing." }, { text: "Do another." }],
      whyWereDoingThis: [{ type: "prose", text: "Because." }],
    };
    render(
      <FocusMode
        chunks={[BUILD, RECAP]}
        labSlug={LAB}
        completion={{
          complete: false,
          next: null,
          openSteps: [{ id: "build", title: "Build the workflow", evidence: "acknowledged" }],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Done \/ Next/ }));

    expect(screen.queryByRole("button", { name: "Build the workflow" })).not.toBeInTheDocument();
    expect(recordChunkEvidence).toHaveBeenCalledWith(LAB, "build");
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  /*
   * In Debug It the actions are questions and `expect` is the answer. Printed
   * directly under the question, "work out why" became "read why".
   */
  /*
   * A step that configures two nodes needs two values to copy. Each block is
   * captioned with its node, so the learner pastes the right code in the
   * right place.
   */
  it("renders every captioned code block a build step carries", () => {
    const BUILD: LessonChunk = {
      kind: "guided-build",
      id: "build",
      title: "Build two nodes",
      content: [],
      whyThisMatters: [{ type: "prose", text: "Why." }],
      actions: [
        {
          text: "Add two Code nodes.",
          code: [
            { caption: "First Node", language: "javascript", code: "return 1;" },
            { caption: "Second Node", language: "javascript", code: "return 2;" },
          ],
        },
        { text: "Run it." },
      ],
      whyWereDoingThis: [{ type: "prose", text: "Because." }],
    };
    render(<FocusMode chunks={[BUILD]} labSlug={LAB} />);

    expect(screen.getByText("return 1;")).toBeInTheDocument();
    expect(screen.getByText("return 2;")).toBeInTheDocument();
    expect(screen.getByText("First Node")).toBeInTheDocument();
    expect(screen.getByText("Second Node")).toBeInTheDocument();
  });

  it("keeps a debug step's answers behind a disclosure", () => {
    const DEBUG: LessonChunk = {
      kind: "debug",
      id: "debug-it",
      title: "Work out why",
      content: [
        { type: "actions", items: [{ text: "What failed?", expect: "The email transformation." }] },
      ],
    };
    render(<FocusMode chunks={[DEBUG]} labSlug={LAB} />);

    expect(screen.queryByText(/You should see/)).not.toBeInTheDocument();
    expect(screen.getByText("Check your answer").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("The email transformation.").closest("details")).not.toBeNull();
  });

  it("offers to save the recap to the learner's notes", () => {
    render(<FocusMode chunks={[RECAP]} labSlug={LAB} />);

    expect(
      screen.getByRole("button", { name: "Save this recap to your notes" }),
    ).toBeInTheDocument();
  });

  /* Kaz speaks when the learner enters Break It - and only then. */
  it("brings Kaz in at Break It but not while building", () => {
    const BREAK: LessonChunk = {
      kind: "break-it",
      id: "break-it",
      title: "Break it",
      content: [{ type: "prose", text: "Change AND to OR." }],
    };

    render(<FocusMode chunks={[CHUNKS[0], BREAK]} labSlug={LAB} initialChunkId="break-it" />);

    expect(screen.getByRole("img", { name: /Kaz/ })).toBeInTheDocument();
  });

  it("keeps Kaz quiet on an ordinary reading chunk", () => {
    render(<FocusMode chunks={CHUNKS} labSlug={LAB} />);

    expect(screen.queryByRole("img", { name: /Kaz/ })).not.toBeInTheDocument();
  });
});

it.each(["false", "throw"])("keeps a failed acknowledgement open and retryable after %s", async mode => {
  if (mode === "false") recordChunkEvidence.mockResolvedValueOnce(false as never);
  else recordChunkEvidence.mockRejectedValueOnce(new Error("offline"));
  const user = userEvent.setup();
  render(<FocusMode chunks={[{ kind: "guided-build", id: "build", title: "Build", content: [], whyThisMatters: [], actions: [], whyWereDoingThis: [] }, { kind: "recap", id: "recap", title: "Recap", content: [] }]} labSlug={LAB} completion={{ complete: false, next: null, openSteps: [{ id: "build", title: "Build", evidence: "acknowledged" }] }} />);
  await user.click(screen.getByRole("button", { name: /Done.*next/i }));
  expect(screen.getByRole("heading", { name: "Recap" })).toBeInTheDocument();
  expect(await screen.findByText(/progress.*not saved/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Build" })).toBeInTheDocument();
  recordChunkEvidence.mockResolvedValueOnce(true as never);
  await user.click(screen.getByRole("button", { name: /retry.*save/i }));
  await vi.waitFor(() => expect(screen.queryByText(/progress.*not saved/i)).not.toBeInTheDocument());
});


it("offers an upper Back control and returns focus and scroll before the next step paints", async () => {
  const user = userEvent.setup();
  const scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  renderFocus();
  expect(scrollIntoView).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Next: The concept" }));
  expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: "instant" });
  await user.click(screen.getByRole("button", { name: "Back to The problem (top)" }));
  expect(screen.getByRole("heading", { name: "The problem" })).toHaveFocus();
  expect(screen.getAllByRole("region")).toHaveLength(1);
  expect(recordChunkEvidence).not.toHaveBeenCalled();
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
});


it("keeps the scroll position when the incoming heading is already visible", async () => {
  const user = userEvent.setup();
  const scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 100, bottom: 200, left: 0, right: 500, width: 500, height: 100, x: 0, y: 100, toJSON: () => ({}),
  });
  renderFocus();
  await user.click(screen.getByRole("button", { name: "Next: The concept" }));
  expect(scrollIntoView).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "The concept" })).toHaveFocus();
  rect.mockRestore();
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
});
