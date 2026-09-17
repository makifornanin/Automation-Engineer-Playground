import "server-only";

import { revalidatePath } from "next/cache";
import { getLessonChunks } from "@/lib/lesson/registry";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSession } from "@/lib/session/get-session";
import {
  deriveCourseState,
  EVIDENCING_KINDS,
  isEvidencingKind,
  isHandsOnAvailable,
  isLessonReadable,
  type MilestoneEvidence,
} from "./progress";
import { getCourseProgress } from "./progress-store";

/**
 * Every write to learner progress, kept out of any `"use server"` module.
 *
 * That placement is the control. Every async export of a `"use server"` file
 * is a Server Action, and an action a client component imports is an endpoint
 * the browser can call with arguments of its choosing. An evidence writer
 * living there awards `verified` to anyone who names a test chunk — no test
 * run. Nothing here is reachable from a browser; each action decides which of
 * these writes a request may reach.
 *
 * The rules:
 *
 * - Evidence is derived from the chunk's kind, never accepted from a caller.
 * - `verified` is written only by {@link recordVerifiedEvidence}, called only
 *   by the self-check and Send Test actions after a passing evaluation.
 * - Nothing is written for a lab the learner could not have opened. The lock
 *   is *derived* from these rows — any row marks a lab started — so an
 *   unchecked write to a locked lab would itself unlock it.
 *
 * Accepted residual risk, unchanged: RLS lets a learner write their own rows,
 * so someone determined could POST to PostgREST with their own JWT. Closing
 * that needs a privileged write key AEP deliberately does not hold. What this
 * module guarantees is narrower and real: AEP's own endpoints cannot fabricate
 * evidence or skip the lock.
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
 * Validates that a (lab, chunk) pair names real content. Route and form input
 * are both untrusted; this stops an arbitrary string reaching a write even
 * though the CHECK constraints would also reject it.
 */
function resolveChunk(labSlug: string, chunkId: string) {
  if (!LAB_SLUG_PATTERN.test(labSlug) || !CHUNK_ID_PATTERN.test(chunkId)) {
    return null;
  }
  return getLessonChunks(labSlug)?.find((chunk) => chunk.id === chunkId) ?? null;
}

type LabAccess = "none" | "reading" | "hands-on";

/** The same two predicates the lab page uses to decide what to serve. */
async function labAccess(labSlug: string): Promise<LabAccess> {
  const { labs, currentLab } = deriveCourseState(await getCourseProgress());
  const entry = labs.find(({ lab }) => lab.slug === labSlug);
  if (!entry) return "none";
  if (isHandsOnAvailable(entry.status)) return "hands-on";
  return isLessonReadable(entry.status, currentLab.lab.slug === labSlug) ? "reading" : "none";
}

/**
 * Marks a lab as started so its hands-on chunks unlock.
 *
 * This is what makes `in-progress` mean "the learner opened this lab" rather
 * than "this lab happens to be current". Called by the lab page when a
 * readable lesson is opened; refused for any lab that is not readable.
 */
export async function startLab(labSlug: string): Promise<void> {
  if (!LAB_SLUG_PATTERN.test(labSlug) || !getLessonChunks(labSlug)) return;

  const client = await authorisedClient();
  if (!client) return;
  if ((await labAccess(labSlug)) === "none") return;

  try {
    await client.supabase.from(PROGRESS_TABLE).upsert(
      { user_id: client.userId, lab_slug: labSlug },
      { onConflict: "user_id,lab_slug", ignoreDuplicates: true },
    );
  } catch {
    // Tolerated: the fallback keeps Lab 01 open.
  }
}

/**
 * Records where the learner is in a lab.
 *
 * Position is not precious: this runs on every advance and may fail silently.
 * Blocking a Next press on a database round trip would make AEP feel slower
 * than n8n, which is the one thing it must not do.
 */
export async function recordPosition(labSlug: string, chunkId: string): Promise<void> {
  if (!resolveChunk(labSlug, chunkId)) return;

  const client = await authorisedClient();
  if (!client) return;
  if ((await labAccess(labSlug)) === "none") return;

  try {
    await client.supabase.from(PROGRESS_TABLE).upsert(
      { user_id: client.userId, lab_slug: labSlug, current_chunk_id: chunkId },
      { onConflict: "user_id,lab_slug" },
    );
  } catch {
    // Losing a position write costs the learner one resume point, not work.
  }
}

async function writeEvidence(
  labSlug: string,
  chunkId: string,
  permitted: (evidence: MilestoneEvidence) => boolean,
): Promise<void> {
  const chunk = resolveChunk(labSlug, chunkId);
  if (!chunk || !isEvidencingKind(chunk.kind)) return;

  const evidence = EVIDENCING_KINDS[chunk.kind];
  if (!permitted(evidence)) return;

  const client = await authorisedClient();
  if (!client) return;
  if ((await labAccess(labSlug)) !== "hands-on") return;

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

/**
 * Records evidence the learner produces by doing the step: `acknowledged` for
 * a build, break or debug step and `predicted` for a written prediction.
 * Refuses any chunk whose kind earns `verified` — that tier is not the
 * learner's to claim.
 */
export function recordLearnerEvidence(labSlug: string, chunkId: string): Promise<void> {
  return writeEvidence(labSlug, chunkId, (evidence) => evidence !== "verified");
}

/**
 * Records `verified` for a test or challenge chunk.
 *
 * **Call only after a passing evaluation of that chunk's own case.** The only
 * callers are the self-check and Send Test actions; nothing browser-reachable
 * may call this directly.
 */
export function recordVerifiedEvidence(labSlug: string, chunkId: string): Promise<void> {
  return writeEvidence(labSlug, chunkId, (evidence) => evidence === "verified");
}
