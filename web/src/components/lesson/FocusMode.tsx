"use client";

import { useEffect, useId, useRef, useState } from "react";
import { assertNeverBlock, type LessonChunk } from "@/lib/lesson/types";
import Link from "next/link";
import { KazOrb } from "@/components/kaz/KazOrb";
import { SaveToNotesButton } from "@/components/notes/SaveToNotesButton";
import { EVIDENCING_KINDS, isEvidencingKind } from "@/lib/course/progress";
import { chunkNote } from "@/lib/kaz/notes";
import { recordChunkEvidence, setCurrentChunk } from "@/lib/course/progress-actions";
import { ContentBlocks } from "./blocks/ContentBlocks";
import { TeachingNotes } from "./blocks/TeachingNotes";
import { ChallengeChunk } from "./chunks/ChallengeChunk";
import { GuidedBuildChunk } from "./chunks/GuidedBuildChunk";
import { PredictChunk } from "./chunks/PredictChunk";
import { TestChunk } from "./chunks/TestChunk";

/**
 * Whether this lab is finished, and what finishing it opened. Computed on the
 * server from earned evidence — the client never decides a lab is complete.
 */
export interface LabCompletion {
  complete: boolean;
  next: { label: string; href: string } | null;
}

export interface FocusModeProps {
  chunks: readonly LessonChunk[];
  labSlug: string;
  /** Where this learner left off, if anywhere. */
  initialChunkId?: string | null;
  completion?: LabCompletion;
}

/** The recap's prose, as plain text for the notebook. */
function recapText(chunk: LessonChunk): string {
  const prose = chunk.content
    .filter((block) => block.type === "prose")
    .map((block) => (block.type === "prose" ? block.text : ""));
  return [chunk.title, ...prose].join("\n\n");
}

/**
 * Tells the learner, at the end of the lab, whether they have actually
 * finished it. Completion follows evidence (Vision §3), so a learner who read
 * to the end without passing the checks is told plainly what is still open
 * rather than congratulated for scrolling.
 */
function RecapCompletion({ completion }: { completion?: LabCompletion }) {
  if (!completion) return null;

  if (!completion.complete) {
    return (
      <p className="max-w-prose text-sm text-ink-muted">
        This lab completes once its build steps, test and challenge are done. Anything still
        open is waiting for you back through the steps.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium text-ink">
        Lab complete.{completion.next ? " " + completion.next.label + " is unlocked." : ""}
      </p>
      {completion.next ? (
        <Link
          href={completion.next.href}
          className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          {"Go to " + completion.next.label}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Whether finishing this chunk is something the learner asserts with a press.
 *
 * Only `acknowledged` kinds qualify. `test` and `challenge` earn `verified`
 * from an evaluator looking at real output — letting a button award that would
 * make the strongest evidence in the product the easiest to fake.
 */
function isAcknowledgeable(chunk: LessonChunk): boolean {
  return isEvidencingKind(chunk.kind) && EVIDENCING_KINDS[chunk.kind] === "acknowledged";
}

/**
 * The base layout — content blocks then teaching notes — is the *correct final*
 * rendering for problem, concept, break-it, debug and recap, not a placeholder.
 * Those kinds are prose and visuals by nature; only the kinds that carry their
 * own structure get a bespoke arm.
 */
function BaseChunk({ chunk }: { chunk: LessonChunk }) {
  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />
      {chunk.teaches ? <TeachingNotes notes={chunk.teaches} /> : null}
    </div>
  );
}

function ChunkBody({
  chunk,
  labSlug,
  completion,
}: {
  chunk: LessonChunk;
  labSlug: string;
  completion?: LabCompletion;
}) {
  switch (chunk.kind) {
    case "problem":
    case "concept":
    case "break-it":
    case "debug":
      return <BaseChunk chunk={chunk} />;

    case "recap":
      return (
        <div className="flex flex-col gap-4">
          <BaseChunk chunk={chunk} />
          <RecapCompletion completion={completion} />
          <SaveToNotesButton
            labSlug={labSlug}
            text={recapText(chunk)}
            label="Save this recap to your notes"
          />
          {chunk.bridge ? (
            <section className="flex flex-col gap-2 border-t border-line pt-4">
              <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
                What&rsquo;s next
              </h3>
              <ContentBlocks blocks={chunk.bridge} />
            </section>
          ) : null}
        </div>
      );

    case "guided-build":
      return <GuidedBuildChunk chunk={chunk} />;

    case "predict":
      return <PredictChunk chunk={chunk} labSlug={labSlug} />;

    case "test":
      return <TestChunk chunk={chunk} labSlug={labSlug} />;

    case "challenge":
      return <ChallengeChunk chunk={chunk} labSlug={labSlug} />;

    default:
      return assertNeverBlock(chunk);
  }
}

/**
 * One lesson chunk at a time, with Next/Back and a position indicator
 * (Vision §17 — show one meaningful learning chunk, not a giant scrolling
 * lesson).
 *
 * The app's default is server components; this is the one deliberate client
 * boundary in the lesson, and it owns the chunk index and nothing else. All
 * data resolution, and all gating of which chunks exist at all, stays on the
 * server in the page above it.
 *
 * Accessibility: on a chunk change, focus moves to the new chunk's heading
 * rather than announcing the body through an `aria-live` region. A polite
 * region would re-read several paragraphs on every press; moving focus states
 * the new heading and leaves the reader at the top of the new content, which
 * is the standard treatment for a step pattern. The heading is only
 * programmatically focusable (`tabIndex={-1}`), so it never joins the tab
 * order.
 */
export function FocusMode({
  chunks,
  labSlug,
  initialChunkId = null,
  completion,
}: FocusModeProps) {
  // Resume where the learner left off. An unknown id — content reordered since
  // they were last here — falls back to the start rather than to nothing.
  const resumeIndex = Math.max(
    chunks.findIndex((chunk) => chunk.id === initialChunkId),
    0,
  );

  const [index, setIndex] = useState(resumeIndex);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Suppresses the focus move on first render: the learner has just arrived
  // and has not stepped anywhere yet, so stealing focus would be wrong.
  const hasStepped = useRef(false);
  const headingId = useId();
  const stepId = useId();

  const chunk = chunks[index];
  const isFirst = index === 0;
  const isLast = index === chunks.length - 1;
  const acknowledgeable = isAcknowledgeable(chunk);
  // Kaz speaks only at chosen moments, and never on consecutive chunks.
  const kazNote = chunkNote(chunk.kind, index > 0 ? chunks[index - 1].kind : null);

  useEffect(() => {
    if (!hasStepped.current) return;
    headingRef.current?.focus();
  }, [index]);

  function step(delta: number) {
    hasStepped.current = true;
    const next = Math.min(Math.max(index + delta, 0), chunks.length - 1);
    setIndex(next);

    /*
     * Fire and forget, deliberately. Position is not precious: losing this
     * write costs one resume point, and awaiting it would put a network round
     * trip between the learner pressing Next and the next thought appearing.
     * AEP must feel easier than n8n, and a stalling Next button is the fastest
     * way to lose that.
     */
    void setCurrentChunk(labSlug, chunks[next].id).catch(() => {});
  }

  function finishAndAdvance() {
    void recordChunkEvidence(labSlug, chunk.id).catch(() => {});
    step(1);
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <p id={stepId} className="text-sm text-ink-muted">
        Step {index + 1} of {chunks.length}
      </p>

      {/*
        `aria-describedby` on the heading is what makes the visible position
        text reach a screen reader. Focus lands here on every step, and without
        it the announcement is just "The concept, heading level 2" — the reader
        is told what they arrived at but not where they are in the sequence.
        Describing the heading adds one short phrase; putting the position in
        an aria-live region instead would re-announce on every press.
      */}
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        aria-describedby={stepId}
        className="text-xl font-medium text-ink focus-visible:-outline-offset-4"
      >
        {chunk.title}
      </h2>

      {kazNote ? (
        <div className="flex items-center gap-3">
          <KazOrb className="size-8" state={kazNote.state} />
          <p className="text-sm text-ink-soft">{kazNote.text}</p>
        </div>
      ) : null}

      <ChunkBody chunk={chunk} labSlug={labSlug} completion={completion} />

      <div className="flex flex-wrap gap-4 pt-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={isFirst}
          aria-label={isFirst ? "Back" : `Back to ${chunks[index - 1].title}`}
          className="text-sm font-medium text-accent underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline"
        >
          Back
        </button>

        {/*
          Vision §19's "Done — Next". Not a lab-level Mark Complete: it closes
          one build step the learner has just carried out, which is the
          acknowledgement §19 itself specifies. Vision §3 rules out a generic
          completion button as the PRIMARY mechanism, not this.
        */}
        {acknowledgeable && !isLast ? (
          <button
            type="button"
            onClick={finishAndAdvance}
            aria-label={`Done — next: ${chunks[index + 1].title}`}
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Done — Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => step(1)}
            disabled={isLast}
            aria-label={isLast ? "Next" : `Next: ${chunks[index + 1].title}`}
            className="text-sm font-medium text-accent underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline"
          >
            Next
          </button>
        )}
      </div>
    </section>
  );
}
