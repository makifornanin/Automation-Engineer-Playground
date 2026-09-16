import "server-only";

import { cache } from "react";
import { getSession } from "@/lib/session/get-session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { Note } from "./types";

/**
 * Reads the learner's own notes under row-level security. server-only, like
 * every other privileged read in the app.
 *
 * Fails safe to an empty list on every non-success path - unconfigured
 * Supabase, an anonymous caller, a missing table, a thrown query. A notebook
 * that renders empty is recoverable; one that crashes takes the page with it.
 */

const NOTES_TABLE = "aep_web_notes";

export interface NoteRow {
  id: string;
  lab_slug: string | null;
  body: string;
  updated_at: string;
}

export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    labSlug: row.lab_slug,
    body: row.body,
    updatedAt: row.updated_at,
  };
}

export const listNotes = cache(async function listNotes(): Promise<readonly Note[]> {
  try {
    const session = await getSession();
    if (session.status !== "authenticated") {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select("id, lab_slug, body, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      warnNotesUnavailable(error.code);
      return [];
    }

    return (data ?? []).map((row) => toNote(row as NoteRow));
  } catch {
    return [];
  }
});

let hasWarnedNotesUnavailable = false;

/**
 * Logs once per process, naming only the PostgREST error code - never a note
 * body, never a user id. Note contents are the most personal thing this app
 * stores and must never reach a log. PGRST205 means the table is absent.
 */
function warnNotesUnavailable(code: string | undefined): void {
  if (hasWarnedNotesUnavailable) return;
  hasWarnedNotesUnavailable = true;
  console.warn("AEP notes are unavailable; nothing will be saved this session.", {
    code: code ?? "unknown",
  });
}
