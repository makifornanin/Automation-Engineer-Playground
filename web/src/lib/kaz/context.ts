import "server-only";

import { CAPSTONE, CAPSTONE_SLUG, LABS } from "@/lib/course/catalog";
import type { CourseProgress } from "@/lib/course/progress";
import { getChallengeHints } from "@/lib/kaz/hints";
import { getLessonChunks } from "@/lib/lesson/registry";
import type { ContentBlock, LessonChunk } from "@/lib/lesson/types";
import { canonicalAllowance } from "./help-ladder";
import { getCanonicalWorkflow, type CanonicalWorkflow } from "./canonical";
import type { HelpLevel, KazMessage } from "./types";

/**
 * Deterministic retrieval: the smallest slice of AEP's own material that could
 * answer this question (Kaz V2 design §8).
 *
 * No embeddings and no vector store, which is a deliberate amendment to Kaz
 * design §13. The corpus is ten labs and a Capstone, and the learner's position
 * already names the relevant slice — the current chunk, its lab, and what they
 * have proved. A semantic index would be infrastructure answering a question
 * the route already answers.
 *
 * Everything here is bounded. Nothing grows with conversation length.
 */

const MAX_CHUNK_TEXT = 4_000;
const MAX_OUTLINE_CHUNKS = 24;

export interface KazLessonContext {
  labTitle: string;
  labSlug: string;
  chunkTitle: string;
  chunkKind: string;
  /** Chunk titles in order, so Kaz knows where the learner is in the arc. */
  outline: readonly string[];
  /** The current chunk, flattened to plain text. */
  chunkText: string;
}

export interface KazProgressContext {
  completedLabs: number;
  totalLabs: number;
  labComplete: boolean;
  /** chunk id -> evidence earned, for this lab only. */
  evidence: Readonly<Record<string, string>>;
  /** Hints this learner has already been given on the current challenge. */
  hintsRevealed: readonly string[];
  hintsRemaining: number;
}

function blockText(block: ContentBlock): string {
  switch (block.type) {
    case "prose":
      return block.text;
    case "callout":
      return (block.title ? block.title + ": " : "") + block.text;
    case "code":
      return (block.caption ? block.caption + "\n" : "") + block.code;
    case "diagram":
      return block.alt;
    case "actions":
      return block.items
        .map((item) => {
          const code = item.code
            ? "\n" + (Array.isArray(item.code) ? item.code : [item.code]).map((entry) => entry.code).join("\n")
            : "";
          return "- " + item.text + code + (item.expect ? "\n  Expect: " + item.expect : "");
        })
        .join("\n");
    default:
      return "";
  }
}

/**
 * One chunk as text.
 *
 * A Predict chunk's reveal is withheld until the learner has actually
 * predicted: it is the answer to the question the chunk asks, and Kaz handing
 * it over early would quietly delete the step.
 */
export function flattenChunk(chunk: LessonChunk, earnedEvidence: boolean): string {
  const parts: string[] = [chunk.title];

  if (chunk.kind === "guided-build") {
    parts.push(...chunk.whyThisMatters.map(blockText));
    parts.push(...chunk.actions.map((item) => "- " + item.text + (item.expect ? " (expect: " + item.expect + ")" : "")));
    parts.push(...chunk.whyWereDoingThis.map(blockText));
  }

  parts.push(...chunk.content.map(blockText));

  if (chunk.kind === "predict") {
    parts.push("Prediction asked: " + chunk.prompt);
    if (earnedEvidence) parts.push(...chunk.reveal.map(blockText));
  }

  if (chunk.kind === "test") {
    parts.push("This step is checked by AEP: " + chunk.caseName);
    if (chunk.expected) parts.push("A pass means: " + chunk.expected);
  }

  if (chunk.kind === "challenge" && chunk.verification) {
    parts.push("It passes when:", ...chunk.verification.map((line) => "- " + line));
  }

  const text = parts.filter(Boolean).join("\n\n");
  return text.length > MAX_CHUNK_TEXT ? text.slice(0, MAX_CHUNK_TEXT) + "…" : text;
}

export function buildLessonContext(labSlug: string, chunkId: string, earned: boolean): KazLessonContext | null {
  const chunks = getLessonChunks(labSlug);
  if (!chunks) return null;
  const chunk = chunks.find((entry) => entry.id === chunkId);
  if (!chunk) return null;

  const lab = LABS.find((entry) => entry.slug === labSlug);
  return {
    labSlug,
    labTitle: lab ? "Lab " + lab.number + " — " + lab.title : CAPSTONE.title,
    chunkTitle: chunk.title,
    chunkKind: chunk.kind,
    outline: chunks.slice(0, MAX_OUTLINE_CHUNKS).map((entry) => entry.title),
    chunkText: flattenChunk(chunk, earned),
  };
}

export function buildProgressContext(
  progress: CourseProgress,
  labSlug: string,
  chunkId: string,
): KazProgressContext {
  const lab = progress.labs[labSlug];
  const evidence = lab?.evidence ?? {};
  const hints = getChallengeHints(labSlug);
  const used = Math.min(lab?.hintsUsed?.[chunkId] ?? 0, hints.length);

  return {
    completedLabs: progress.completedLabSlugs.length,
    totalLabs: LABS.length,
    labComplete:
      labSlug === CAPSTONE_SLUG
        ? progress.capstone.completed
        : progress.completedLabSlugs.includes(labSlug),
    evidence,
    hintsRevealed: hints.slice(0, used),
    hintsRemaining: Math.max(hints.length - used, 0),
  };
}

/**
 * The canonical workflow Kaz may see for this answer.
 *
 * Two gates, not one. The help ladder decides how much of it (`help-ladder.ts`),
 * and a Challenge chunk overrides that to nothing at all: the challenge is the
 * learner's own problem to solve, its hints are handed out one at a time by
 * `revealNextHint`, and a Kaz who could read the finished workflow would be a
 * second, unlimited hint path around that (Kaz design §14).
 */
export function buildCanonicalContext(
  labSlug: string,
  chunkKind: string,
  level: HelpLevel,
): CanonicalWorkflow | null {
  if (chunkKind === "challenge") return null;
  return getCanonicalWorkflow(labSlug, canonicalAllowance(level));
}

/** The last few turns, oldest first, trimmed so context cannot grow forever. */
export function recentTurns(messages: readonly KazMessage[], turns: number): readonly KazMessage[] {
  return messages.slice(-turns * 2).map((message) => ({
    ...message,
    content: message.content.length > 1_200 ? message.content.slice(0, 1_200) + "…" : message.content,
  }));
}
