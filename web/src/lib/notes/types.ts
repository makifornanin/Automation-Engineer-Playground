/**
 * Notes are a learning notebook, not a productivity system (Vision §9).
 *
 * Pure and client-safe. Deliberately no tags, folders, titles, pinning,
 * ordering, sharing, reminders or tasks - every one of those is a step toward
 * the thing CLAUDE.md rules out.
 */

export interface Note {
  id: string;
  /** null means a general note rather than one tied to a lab. */
  labSlug: string | null;
  body: string;
  /** ISO timestamp. */
  updatedAt: string;
}

/** Matches the CHECK constraint on aep_web_notes.body. */
export const MAX_NOTE_BYTES = 20_000;

/**
 * What the editor shows about saving. There is no Save button (Vision §17:
 * progress and notes autosave, with no separate Save control), so this
 * indicator is the only feedback that anything happened - which makes the
 * error state load-bearing rather than decorative.
 */
export type NoteSaveState = "idle" | "saving" | "saved" | "error";
