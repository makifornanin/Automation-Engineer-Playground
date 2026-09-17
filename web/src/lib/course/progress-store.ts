import "server-only";

import { cache } from "react";
import { LABS } from "./catalog";
import { getLessonChunks } from "@/lib/lesson/registry";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSession } from "@/lib/session/get-session";
import {
  EMPTY_LAB_PROGRESS,
  isLabComplete,
  type CourseProgress,
  type LabProgress,
  type MilestoneEvidence,
} from "./progress";

/**
 * The privileged half of course progress: reads a learner's own rows under
 * row-level security. `server-only` keeps it out of any client bundle; the
 * pure derivation it feeds lives in `progress.ts`.
 *
 * Every read here is scoped by RLS rather than by a `where user_id = ...`
 * clause we write ourselves. The policies are the boundary; a filter in
 * application code would merely be a second opinion about it.
 */

const PROGRESS_TABLE = "aep_web_lab_progress";
const CHUNK_STATE_TABLE = "aep_web_lab_chunk_state";

/**
 * What progress looks like when there is no store to read.
 *
 * Deliberately NOT empty. Empty progress would leave Lab 01 `not-started`,
 * which makes `isHandsOnAvailable` false and strips the Guided Build chunks
 * out of the only lab that has any — the learner would see *less* than before
 * persistence existed. That is a regression wearing a fail-safe's clothes.
 *
 * Instead the learner is placed at Lab 01 with hands-on open and nothing
 * saved, which is exactly the pre-persistence behaviour. Honest degradation:
 * the product works, it just forgets.
 */
export function fallbackProgress(): CourseProgress {
  return {
    completedLabSlugs: [],
    inProgressLabSlug: LABS[0].slug,
    labs: {},
  };
}

interface ProgressRow {
  lab_slug: string;
  current_chunk_id: string | null;
  completed_at: string | null;
}

interface ChunkStateRow {
  lab_slug: string;
  chunk_id: string;
  evidence: MilestoneEvidence | null;
  hints_used?: number | null;
}

/**
 * Reads the signed-in learner's progress.
 *
 * Fails safe on every non-success path — unconfigured Supabase, an anonymous
 * caller, a missing table, a thrown query — by returning {@link
 * fallbackProgress}. A learning app that will not render because a table is
 * absent is worse than one that renders and forgets, and the tables genuinely
 * do not exist until the schema is applied.
 */
export const getCourseProgress = cache(async function getCourseProgress(): Promise<CourseProgress> {
  try {
    const session = await getSession();
    if (session.status !== "authenticated") {
      return fallbackProgress();
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return fallbackProgress();
    }

    const [progressResult, chunkResult] = await Promise.all([
      supabase.from(PROGRESS_TABLE).select("lab_slug, current_chunk_id, completed_at"),
      supabase.from(CHUNK_STATE_TABLE).select("lab_slug, chunk_id, evidence, hints_used"),
    ]);

    if (progressResult.error || chunkResult.error) {
      warnStoreUnavailable(progressResult.error?.code ?? chunkResult.error?.code);
      return fallbackProgress();
    }

    return assembleProgress(
      (progressResult.data ?? []) as ProgressRow[],
      (chunkResult.data ?? []) as ChunkStateRow[],
    );
  } catch {
    return fallbackProgress();
  }
});

/**
 * Turns the two row sets into the shape `deriveCourseState()` consumes.
 *
 * Completion is **recomputed from evidence against the lab's current content**
 * rather than trusted from `completed_at`. If a lab gains a new milestone
 * chunk, every learner's completion re-evaluates against the new bar instead
 * of a stale boolean saying they finished a shorter version of the lab.
 */
export function assembleProgress(
  progressRows: readonly ProgressRow[],
  chunkRows: readonly ChunkStateRow[],
): CourseProgress {
  const labs: Record<string, LabProgress> = {};

  for (const row of progressRows) {
    labs[row.lab_slug] = {
      currentChunkId: row.current_chunk_id,
      completedAt: row.completed_at,
      evidence: {},
    };
  }

  for (const row of chunkRows) {
    // Hints are recorded on the lab's own row only. A hint-only row must never
    // create a lab entry: any entry marks a lab started, and started beats
    // locked.
    const started = labs[row.lab_slug];
    if (started && row.hints_used) {
      started.hintsUsed = { ...started.hintsUsed, [row.chunk_id]: row.hints_used };
    }
    if (!row.evidence) continue;
    const lab = (labs[row.lab_slug] ??= { ...EMPTY_LAB_PROGRESS, evidence: {} });
    lab.evidence = { ...lab.evidence, [row.chunk_id]: row.evidence };
  }

  const completedLabSlugs = LABS.filter((lab) => {
    const chunks = getLessonChunks(lab.slug);
    const earned = labs[lab.slug]?.evidence ?? {};
    return chunks ? isLabComplete(chunks, earned) : false;
  }).map((lab) => lab.slug);

  // The lab the learner is actually in: started, not finished. The first
  // unfinished lab is a *fallback* for Continue, computed in
  // `deriveCourseState`; this is the stronger signal and wins there.
  const inProgressLabSlug =
    LABS.find((lab) => labs[lab.slug] && !completedLabSlugs.includes(lab.slug))?.slug ?? null;

  return { completedLabSlugs, inProgressLabSlug, labs };
}

let hasWarnedStoreUnavailable = false;

/**
 * Logs once per process that learner state is unreadable, naming only the
 * PostgREST error code. Never a user id, never a row, never a query. Mirrors
 * `warnAboutMissingConfigOnce()` in `supabase/env.ts`: a silent fallback is a
 * debugging trap, a chatty one is a log flood.
 *
 * `PGRST205` here means the tables have not been created yet.
 */
function warnStoreUnavailable(code: string | undefined): void {
  if (hasWarnedStoreUnavailable) return;
  hasWarnedStoreUnavailable = true;
  console.warn(
    "AEP learner state is unavailable; progress will not persist this session.",
    { code: code ?? "unknown" },
  );
}
