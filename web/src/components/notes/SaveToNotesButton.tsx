"use client";

import { useState } from "react";
import { saveToNotes } from "@/lib/notes/notes-actions";

type SaveState = "idle" | "saving" | "saved" | "error";

export interface SaveToNotesButtonProps {
  /** The lab note this lands in; null for the general note. */
  labSlug: string | null;
  text: string;
  label?: string;
}

/**
 * Save to Notes from inside a lesson (Vision §9, §22).
 *
 * Appends to the learner's note for this lab rather than creating a new one,
 * so the notebook stays a notebook. A failure is shown, not swallowed: the
 * learner pressed a button expecting something to be kept, and silently not
 * keeping it would be worse than saying so.
 */
export function SaveToNotesButton({
  labSlug,
  text,
  label = "Save this to your notes",
}: SaveToNotesButtonProps) {
  const [state, setState] = useState<SaveState>("idle");

  async function save() {
    setState("saving");
    try {
      const note = await saveToNotes(labSlug, text);
      setState(note ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={save}
        disabled={state === "saving" || state === "saved"}
        className="text-sm font-medium text-accent underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline"
      >
        {state === "saved" ? "Saved to your notes" : state === "saving" ? "Saving…" : label}
      </button>
      <p role="status" className="text-sm text-ink-muted">
        {state === "error" ? "Could not save — your notes are unavailable right now" : ""}
      </p>
    </div>
  );
}
