import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveToNotesButton } from "./SaveToNotesButton";

const saveToNotes = vi.hoisted(() => vi.fn());

vi.mock("@/lib/notes/notes-actions", () => ({ saveToNotes }));

const LAB = "01-data-mapping-transformation";

beforeEach(() => {
  saveToNotes.mockReset();
  saveToNotes.mockResolvedValue({
    id: "11111111-2222-3333-4444-555555555555",
    labSlug: LAB,
    body: "x",
    updatedAt: "2026-09-17T00:00:00.000Z",
  });
});

describe("<SaveToNotesButton />", () => {
  it("saves the text into this lab's note", async () => {
    const user = userEvent.setup();
    render(<SaveToNotesButton labSlug={LAB} text="What I learned" />);

    await user.click(screen.getByRole("button", { name: "Save this to your notes" }));

    expect(saveToNotes).toHaveBeenCalledWith(LAB, "What I learned");
    expect(await screen.findByRole("button", { name: "Saved to your notes" })).toBeDisabled();
  });

  /* Pressing it twice should not append the same recap twice. */
  it("cannot save the same thing twice", async () => {
    const user = userEvent.setup();
    render(<SaveToNotesButton labSlug={LAB} text="What I learned" />);

    await user.click(screen.getByRole("button", { name: "Save this to your notes" }));
    await screen.findByRole("button", { name: "Saved to your notes" });
    await user.click(screen.getByRole("button", { name: "Saved to your notes" }));

    expect(saveToNotes).toHaveBeenCalledTimes(1);
  });

  /*
   * The learner pressed a button expecting something kept. Not keeping it
   * silently would be worse than saying so.
   */
  it("says so when the note could not be saved", async () => {
    saveToNotes.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<SaveToNotesButton labSlug={LAB} text="What I learned" />);

    await user.click(screen.getByRole("button", { name: "Save this to your notes" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/could not save/i);
  });
});
