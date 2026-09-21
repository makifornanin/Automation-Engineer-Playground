"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { upsertNote } from "@/lib/notes/notes-actions";
import type { Note, NoteSaveState } from "@/lib/notes/types";

/**
 * Long enough that a normal typing rhythm produces one write rather than
 * thirty, short enough that a learner who types a thought and closes the tab
 * keeps it.
 */
export const AUTOSAVE_DELAY_MS = 800;

const STATUS_TEXT: Record<NoteSaveState, string> = {
  idle: "",
  saving: "Saving\u2026",
  saved: "Saved",
  error: "Not saved - your notes are unavailable right now",
};

export interface NoteEditorProps {
  label: string;
  labSlug: string | null;
  note: Note | null;
  placeholder?: string;
}

/**
 * One autosaving note (Vision §17: notes autosave, with no separate Save
 * control anywhere in the product).
 *
 * Because there is no Save button, the status line is the learner's only
 * evidence that anything happened - which is exactly why the failure state is
 * shown rather than swallowed. A notebook that silently discards a paragraph
 * is worse than one that admits it could not save.
 *
 * The text is never rendered as HTML anywhere: it round-trips through a
 * textarea and is stored as plain text, so there is no injection path and no
 * reason to add a markdown renderer.
 */
export function NoteEditor({ label, labSlug, note, placeholder }: NoteEditorProps) {
  const [body, setBody] = useState(note?.body ?? "");
  const noteId = useRef<string | null>(note?.id ?? null);
  const [saveState, setSaveState] = useState<NoteSaveState>("idle");

  const fieldId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(body);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  // One write at a time: a slow first insert must finish before another edit
  // can reuse its id. Drain any newer text before claiming the note is saved.
  const save = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      while (dirty.current) {
        dirty.current = false;
        const submitted = latest.current;
        if (noteId.current === null && submitted.trim().length === 0) {
          if (mounted.current) setSaveState("idle");
          continue;
        }
        let saved: Note | null = null;
        try {
          saved = await upsertNote({ id: noteId.current, labSlug, body: submitted });
        } catch {
          // Keep the learner's text and show the same failure as a refused save.
        }
        if (saved) noteId.current = saved.id;
        if (mounted.current && !dirty.current) {
          setSaveState(saved?.body === submitted ? "saved" : "error");
        }
      }
    } finally {
      inFlight.current = false;
    }
  }, [labSlug]);

  // Flush a debounced edit on in-app navigation, without updating an unmounted
  // editor. A hard browser close still requires waiting for the Saved indicator.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      void save();
    };
  }, [save]);

  function scheduleSave(next: string) {
    setBody(next);
    latest.current = next;
    dirty.current = true;

    if (timer.current) clearTimeout(timer.current);

    // Never create a row for a note the learner has not actually written.
    // Opening the page and clicking into three textareas should leave nothing
    // behind.
    if (noteId.current === null && !inFlight.current && next.trim().length === 0) {
      dirty.current = false;
      setSaveState("idle");
      return;
    }

    setSaveState("saving");
    timer.current = setTimeout(() => { void save(); }, AUTOSAVE_DELAY_MS);
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <p aria-live="polite" className="text-sm text-ink-muted">
          {STATUS_TEXT[saveState]}
        </p>
      </div>
      <textarea
        id={fieldId}
        value={body}
        onChange={(event) => scheduleSave(event.target.value)}
        rows={6}
        placeholder={placeholder}
        className="rounded-card border border-line bg-surface p-3 text-ink outline-none focus-visible:border-accent"
      />
    </section>
  );
}
