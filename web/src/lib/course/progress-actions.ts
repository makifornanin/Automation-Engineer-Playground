"use server";

import { revalidatePath } from "next/cache";
import { getLessonChunks } from "@/lib/lesson/registry";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSession } from "@/lib/session/get-session";
import { EVIDENCING_KINDS, isEvidencingKind } from "./progress";

/**
 * Writes to learner progress.
 *
 * The rule every action here obeys: **the client never supplies an evidence
 * value.** It names a lab and a chunk; the server looks that chunk up in the
 * lesson content and derives what evidence the chunk's own kind produces. A
 * caller cannot claim `verified` for a chunk that only offers `acknowledged`,
 * because the parameter simply does not exist.
 *
 * Note the residual risk that is accepted rather than hidden: RLS lets a
 * learner write their own rows, so someone determined could POST directly to
 * PostgREST with their own JWT and award themselves evidence. Closing that
 * would need a privileged server-side write key, a new deployment secret, and
 * an amendment to the privileged-credential security invariant — for a threat
 * that amounts to an invited learner lying to themselves. The control that
 * matters is the one above: the UI path cannot be used to fabricate evidence.
 */

const PROGRESS_TABLE = "aep_web_lab_progress";
const CHUNK_STATE_TABLE = "aep_web_lab_chunk_state";

/** Matches the CHECK constraints in `database/aep_web_schema.sql`. */
const LAB_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9-]+$/;
const CHUNK_ID_PATTERN = /^[a-z0-9-]+$/;

async function authorisedClient() {
  const session = await getSession();
  if (session.status !== "authenticated") {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  return { supabase, userId: session.user.id };
}

/**
 * Validates that a (lab, chunk) pair names real content. Route input and form
 * input are both untrusted; this is what stops an arbitrary string reaching a
 * database write even though the CHECK constraints would also reject it.
 */
function resolveChunk(labSlug: string, chunkId: string) {
  if (!LAB_SLUG_PATTERN.test(labSlug) || !CHUNK_ID_PATTERN.test(chunkId)) {
    return null;
  }
  const chunks = getLessonChunks(labSlug);
  return chunks?.find((chunk) => chunk.id === chunkId) ?? null;
}

/**
 * Records where the learner is in a lab, and starts the lab if this is their
 * first chunk in it.
 *
 * Position is not precious: this is called on every advance and is allowed to
 * fail silently. Blocking a Next press on a database round trip would make AEP
 * feel slower than n8n, which is the one thing it must not do.
 */
export async function setCurrentChunk(labSlug: string, chunkId: string): Promise<void> {
  if (!resolveChunk(labSlug, chunkId)) return;

  const client = await authorisedClient();
  if (!client) return;

  try {
    await client.supabase.from(PROGRESS_TABLE).upsert(
      {
        user_id: client.userId,
        lab_slug: labSlug,
        current_chunk_id: chunkId,
      },
      { onConflict: "user_id,lab_slug" },
    );
  } catch {
    // Deliberately swallowed. See the docstring: losing a position write
    // costs the learner one resume point, not their work.
  }
}

/**
 * Marks a lab as started so its hands-on chunks unlock.
 *
 * This is what makes `in-progress` mean "the learner opened this lab" rather
 * than "this lab happens to be current" — the distinction the hands-on seam
 * exists to protect. Called when a readable lesson is first opened.
 */
export async function startLab(labSlug: string): Promise<void> {
  if (!LAB_SLUG_PATTERN.test(labSlug) || !getLessonChunks(labSlug)) return;

  const client = await authorisedClient();
  if (!client) return;

  try {
    await client.supabase.from(PROGRESS_TABLE).upsert(
      { user_id: client.userId, lab_slug: labSlug },
      { onConflict: "user_id,lab_slug", ignoreDuplicates: true },
    );
  } catch {
    // Same tolerance as setCurrentChunk: the fallback keeps Lab 01 open.
  }
}

/**
 * Records the evidence a chunk has earned.
 *
 * `evidence` is derived from the chunk's own kind, never accepted from the
 * caller. A chunk whose kind produces no evidence — prose — is a no-op rather
 * than an error: acknowledging a paragraph is not a milestone, and Vision §3
 * is explicit that reading is not progress.
 */
export async function recordChunkEvidence(labSlug: string, chunkId: string): Promise<void> {
  const chunk = resolveChunk(labSlug, chunkId);
  if (!chunk || !isEvidencingKind(chunk.kind)) return;

  const evidence = EVIDENCING_KINDS[chunk.kind];

  const client = await authorisedClient();
  if (!client) return;

  try {
    await client.supabase.from(CHUNK_STATE_TABLE).upsert(
      {
        user_id: client.userId,
        lab_slug: labSlug,
        chunk_id: chunkId,
        evidence,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lab_slug,chunk_id" },
    );
  } catch {
    return;
  }

  // Completing a chunk can complete a lab, which can unlock the next one, so
  // the journey surfaces have to re-derive. Unlike position, this one matters.
  revalidatePath("/", "layout");
}
