"use client";

import { useEffect, useId, useRef, useState } from "react";
import { assertNeverBlock, type LessonChunk } from "@/lib/lesson/types";
import { ContentBlocks } from "./blocks/ContentBlocks";
import { TeachingNotes } from "./blocks/TeachingNotes";
import { GuidedBuildChunk } from "./chunks/GuidedBuildChunk";
import { PredictChunk } from "./chunks/PredictChunk";

export interface FocusModeProps {
  chunks: readonly LessonChunk[];
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

function ChunkBody({ chunk }: { chunk: LessonChunk }) {
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
      return <PredictChunk chunk={chunk} />;

    /*
     * Both render their prose correctly today. Their interactive regions —
     * Send Test / self-check for `test`, progressive hints for `challenge` —
     * arrive with the testing and hint server actions. No content of either
     * kind exists yet, so nothing renders wrong in the meantime; this arm
     * exists so the switch stays exhaustive rather than to stand in for them.
     */
    case "test":
    case "challenge":
      return <BaseChunk chunk={chunk} />;

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
 * boundary in the lesson, and it owns nothing but the chunk index. All data
 * resolution stays on the server in the page above it.
 *
 * Accessibility: on a chunk change, focus moves to the new chunk's heading
 * rather than announcing the body through an `aria-live` region. A polite
 * region would re-read several paragraphs on every press; moving focus states
 * the new heading and leaves the reader at the top of the new content, which
 * is the standard treatment for a step pattern. The heading is only
 * programmatically focusable (`tabIndex={-1}`), so it never joins the tab
 * order.
 */
export function FocusMode({ chunks }: FocusModeProps) {
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Suppresses the focus move on first render: the learner has just arrived
  // and has not stepped anywhere yet, so stealing focus would be wrong.
  const hasStepped = useRef(false);
  const headingId = useId();
  const stepId = useId();

  const chunk = chunks[index];
  const isFirst = index === 0;
  const isLast = index === chunks.length - 1;

  useEffect(() => {
    if (!hasStepped.current) return;
    headingRef.current?.focus();
  }, [index]);

  function step(delta: number) {
    hasStepped.current = true;
    setIndex((current) => Math.min(Math.max(current + delta, 0), chunks.length - 1));
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

      <ChunkBody chunk={chunk} />

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
        <button
          type="button"
          onClick={() => step(1)}
          disabled={isLast}
          aria-label={isLast ? "Next" : `Next: ${chunks[index + 1].title}`}
          className="text-sm font-medium text-accent underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline"
        >
          Next
        </button>
      </div>
    </section>
  );
}
