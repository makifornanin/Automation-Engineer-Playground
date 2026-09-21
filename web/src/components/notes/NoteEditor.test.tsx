import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Note } from "@/lib/notes/types";
import { AUTOSAVE_DELAY_MS, NoteEditor } from "./NoteEditor";

const upsertNote = vi.hoisted(() => vi.fn());

vi.mock("@/lib/notes/notes-actions", () => ({ upsertNote }));

const LAB = "01-data-mapping-transformation";

/*
 * Real timers, deliberately. Fake timers deadlock against React 19's
 * scheduler under jsdom once userEvent is involved, and the alternative -
 * adding a delay prop to the component so tests can shorten it - would be
 * production API existing only for the test suite. A few real seconds across
 * this file is the cheaper trade.
 */
const SETTLE = { timeout: AUTOSAVE_DELAY_MS * 4 };

function savedNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    labSlug: LAB,
    body: "",
    updatedAt: "2026-09-17T00:00:00.000Z",
    ...overrides,
  };
}

const idle = () => new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DELAY_MS * 2));

beforeEach(() => {
  upsertNote.mockReset();
  upsertNote.mockImplementation(async (input: { body: string }) => savedNote({ body: input.body }));
});

describe("<NoteEditor />", () => {
  it("flushes an unsaved edit when navigating away before the debounce", async () => {
    const { unmount } = render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "keep this thought" } });
    unmount();
    await waitFor(() => expect(upsertNote).toHaveBeenCalledWith({ id: null, labSlug: LAB, body: "keep this thought" }));
  });

  it("queues edits behind an unfinished insert and saves the latest text to that same note", async () => {
    let finishFirst!: (note: Note) => void;
    let finishSecond!: (note: Note) => void;
    upsertNote
      .mockImplementationOnce(() => new Promise<Note>((resolve) => { finishFirst = resolve; }))
      .mockImplementationOnce(() => new Promise<Note>((resolve) => { finishSecond = resolve; }));
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "first" } });
    await waitFor(() => expect(upsertNote).toHaveBeenCalledTimes(1), SETTLE);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "latest thought" } });
    await act(async () => { await idle(); });
    expect(upsertNote).toHaveBeenCalledTimes(1);
    await act(async () => { finishFirst(savedNote({ body: "first" })); });
    await waitFor(() => expect(upsertNote).toHaveBeenCalledTimes(2), SETTLE);
    expect(upsertNote.mock.calls[1][0]).toEqual({ id: savedNote().id, labSlug: LAB, body: "latest thought" });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    await act(async () => { finishSecond(savedNote({ body: "latest thought" })); });
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("latest thought");
  });

  it("does not report Saved when the server only persisted a truncated body", async () => {
    upsertNote.mockResolvedValue(savedNote({ body: "only part" }));
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "only part plus unsaved text" } });
    expect(await screen.findByText(/not saved/i, undefined, SETTLE)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("only part plus unsaved text");
  });

  /* Vision §17 rules out a separate Save control anywhere in the product. */
  it("offers no save button", () => {
    render(<NoteEditor label="General notes" labSlug={null} note={null} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("saves once after the learner stops typing, not per keystroke", async () => {
    const user = userEvent.setup();
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);

    await user.type(screen.getByRole("textbox"), "trim then lowercase");
    expect(upsertNote).not.toHaveBeenCalled();

    await waitFor(() => expect(upsertNote).toHaveBeenCalledTimes(1), SETTLE);
    expect(upsertNote).toHaveBeenCalledWith({
      id: null,
      labSlug: LAB,
      body: "trim then lowercase",
    });
  });

  it("tells the learner it saved", async () => {
    const user = userEvent.setup();
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);

    await user.type(screen.getByRole("textbox"), "a");

    expect(await screen.findByText("Saved", undefined, SETTLE)).toBeInTheDocument();
  });

  /*
   * The real bug this guards: without adopting the id returned by the first
   * save, every later autosave would insert another row and one note would
   * quietly become twenty.
   */
  it("adopts the new id so the next save updates rather than inserts", async () => {
    const user = userEvent.setup();
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);

    await user.type(screen.getByRole("textbox"), "first");
    await waitFor(() => expect(upsertNote).toHaveBeenCalledTimes(1), SETTLE);

    await user.type(screen.getByRole("textbox"), " second");
    await waitFor(() => expect(upsertNote).toHaveBeenCalledTimes(2), SETTLE);

    expect(upsertNote.mock.calls[0][0].id).toBeNull();
    expect(upsertNote.mock.calls[1][0].id).toBe(savedNote().id);
  });

  /*
   * Clicking into three empty textareas on the Notes page must not leave three
   * empty rows behind.
   */
  it("never creates a note the learner has not written", async () => {
    const user = userEvent.setup();
    render(<NoteEditor label="General notes" labSlug={null} note={null} />);

    await user.type(screen.getByRole("textbox"), "  ");
    await idle();

    expect(upsertNote).not.toHaveBeenCalled();
  });

  /*
   * With no Save button, the status line is the only evidence anything
   * happened - so a failure has to be visible rather than swallowed.
   */
  it("says so when the note could not be saved", async () => {
    upsertNote.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={null} />);

    await user.type(screen.getByRole("textbox"), "something worth keeping");

    expect(await screen.findByText(/not saved/i, undefined, SETTLE)).toBeInTheDocument();
  });

  it("starts from an existing note and updates it in place", async () => {
    const existing = savedNote({ body: "earlier thought" });
    const user = userEvent.setup();
    render(<NoteEditor label="Lab notes" labSlug={LAB} note={existing} />);

    expect(screen.getByRole("textbox")).toHaveValue("earlier thought");

    await user.type(screen.getByRole("textbox"), "!");

    await waitFor(
      () =>
        expect(upsertNote).toHaveBeenCalledWith({
          id: existing.id,
          labSlug: LAB,
          body: "earlier thought!",
        }),
      SETTLE,
    );
  });
});
