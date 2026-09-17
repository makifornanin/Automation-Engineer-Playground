"use server";

import { hasHandsOnAccess } from "@/lib/course/progress-writes";
import { getLessonChunks } from "@/lib/lesson/registry";
import { getSession } from "@/lib/session/get-session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getChallengeHints } from "./hints";

const CHUNK_STATE_TABLE = "aep_web_lab_chunk_state";
const LAB_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9-]+$/;
const CHUNK_ID_PATTERN = /^[a-z0-9-]+$/;

export interface RevealedHint {
  /** Zero-based position of this hint. */
  index: number;
  total: number;
  text: string;
}

/**
 * Hands out exactly one challenge hint: the next one after those the learner
 * has already seen.
 *
 * This is what makes hinting progressive rather than decorative. The hints
 * never travel in the page payload; each one costs a request, and each request
 * returns only the next. The learner gets the symptom before the data, and the
 * data before the concept (Vision §6, Kaz §5).
 *
 * The count is also recorded as `hints_used`, best-effort, because that is the
 * signal Kaz's later guardrails key hint strength off (Kaz §14). When learner
 * state is unavailable the hint is still served — being unable to save how
 * stuck someone is must not stop Kaz from helping them.
 *
 * A determined learner could ask for hint 3 directly. That is accepted: an
 * invited learner skipping their own thinking in a lab they have open. What
 * this prevents is the answer sitting in the page, and any hint being served
 * for a lab whose hands-on work is still locked.
 */
export async function revealNextHint(
  labSlug: string,
  chunkId: string,
  alreadySeen: number,
): Promise<RevealedHint | null> {
  if (!LAB_SLUG_PATTERN.test(labSlug) || !CHUNK_ID_PATTERN.test(chunkId)) return null;
  if (!Number.isInteger(alreadySeen) || alreadySeen < 0) return null;

  // Only a real challenge chunk in this lab may ask for this lab's hints.
  const chunk = getLessonChunks(labSlug)?.find((entry) => entry.id === chunkId);
  if (!chunk || chunk.kind !== "challenge") return null;

  // A challenge is hands-on content, so its hints stay behind the same lock.
  if (!(await hasHandsOnAccess(labSlug))) return null;

  const hints = getChallengeHints(labSlug);
  if (alreadySeen >= hints.length) return null;

  await recordHintsUsed(labSlug, chunkId, alreadySeen + 1);

  return { index: alreadySeen, total: hints.length, text: hints[alreadySeen] };
}

async function recordHintsUsed(labSlug: string, chunkId: string, used: number): Promise<void> {
  try {
    const session = await getSession();
    if (session.status !== "authenticated") return;
    const supabase = await createSupabaseServerClient();
    if (!supabase) return;

    // Only hints_used is sent, so an upsert never overwrites evidence this
    // chunk has already earned.
    await supabase.from(CHUNK_STATE_TABLE).upsert(
      {
        user_id: session.user.id,
        lab_slug: labSlug,
        chunk_id: chunkId,
        hints_used: Math.min(used, 10),
      },
      { onConflict: "user_id,lab_slug,chunk_id" },
    );
  } catch {
    // Best-effort by design; see the docstring above.
  }
}
