"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session/get-session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { toNote, type NoteRow } from "./notes-store";
import { MAX_NOTE_BYTES, type Note } from "./types";

/**
 * Writing notes.
 *
 * Every write is scoped by RLS to the caller's own rows, and user_id comes
 * from the verified session rather than the form - so a caller cannot write
 * into somebody else's notebook by naming their id.
 *
 * Note bodies are the most personal thing AEP stores. They are never logged,
 * never returned to another user, and never rendered as HTML: the editor and
 * the reader both treat them as plain text, which is a second reason no
 * markdown renderer was added.
 */

const NOTES_TABLE = "aep_web_notes";
const SELECTED_COLUMNS = "id, lab_slug, body, updated_at";
const LAB_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorised() {
  const session = await getSession();
  if (session.status !== "authenticated") return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  return { supabase, userId: session.user.id };
}

/** Returns undefined for a slug that is neither null nor a real lab shape. */
function normaliseLabSlug(labSlug: string | null): string | null | undefined {
  if (labSlug === null) return null;
  return LAB_SLUG_PATTERN.test(labSlug) ? labSlug : undefined;
}

export interface UpsertNoteInput {
  /** Absent for a note being written for the first time. */
  id?: string | null;
  labSlug: string | null;
  body: string;
}

/**
 * Creates or updates one note and returns it, so a client that has just
 * written its first note learns the id and every later autosave updates that
 * row instead of inserting another.
 *
 * Returns null rather than throwing when the store is unavailable. The editor
 * then shows an honest not-saved indicator and the learner keeps their text on
 * screen, which beats an error boundary eating what they just typed.
 */
export async function upsertNote(input: UpsertNoteInput): Promise<Note | null> {
  const labSlug = normaliseLabSlug(input.labSlug);
  if (labSlug === undefined) return null;
  if (input.id != null && !UUID_PATTERN.test(input.id)) return null;

  // Truncated rather than rejected: the CHECK constraint would fail the whole
  // write, and silently losing a learner's last paragraph is worse than
  // keeping the first 20k of it.
  const body = input.body.slice(0, MAX_NOTE_BYTES);

  const client = await authorised();
  if (!client) return null;

  try {
    if (input.id) {
      const { data, error } = await client.supabase
        .from(NOTES_TABLE)
        .update({ body })
        .eq("id", input.id)
        .select(SELECTED_COLUMNS)
        .single();
      if (error || !data) return null;
      return toNote(data as NoteRow);
    }

    const { data, error } = await client.supabase
      .from(NOTES_TABLE)
      .insert({ user_id: client.userId, lab_slug: labSlug, body })
      .select(SELECTED_COLUMNS)
      .single();
    if (error || !data) return null;
    return toNote(data as NoteRow);
  } catch {
    return null;
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;

  const client = await authorised();
  if (!client) return false;

  try {
    const { error } = await client.supabase.from(NOTES_TABLE).delete().eq("id", id);
    if (error) return false;
  } catch {
    return false;
  }

  revalidatePath("/notes");
  return true;
}

/**
 * Appends a snippet to the notebook from elsewhere in the product - lesson
 * content today, a Kaz explanation later (Vision §9, §22).
 *
 * Appends to the relevant note rather than creating a new one each time, so
 * saving three things from one lab leaves three paragraphs in one place rather
 * than three notes to tidy up. A notebook, not an inbox.
 */
export async function saveToNotes(labSlug: string | null, text: string): Promise<Note | null> {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  const slug = normaliseLabSlug(labSlug);
  if (slug === undefined) return null;

  const client = await authorised();
  if (!client) return null;

  try {
    const base = client.supabase
      .from(NOTES_TABLE)
      .select(SELECTED_COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(1);

    const { data: existing } = slug === null
      ? await base.is("lab_slug", null)
      : await base.eq("lab_slug", slug);

    const rows = (existing ?? []) as NoteRow[];
    const current = rows.length > 0 ? toNote(rows[0]) : null;
    const body =
      current && current.body.trim().length > 0
        ? current.body + "\n\n" + trimmed
        : trimmed;

    const saved = await upsertNote({ id: current?.id ?? null, labSlug: slug, body });
    if (saved) revalidatePath("/notes");
    return saved;
  } catch {
    return null;
  }
}
