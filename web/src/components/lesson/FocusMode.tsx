"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import { INSTANT, PAGE_ENTER, PAGE_ENTER_OFFSET_PX } from "@/lib/motion/motion-tokens";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useId, useRef, useState } from "react";
import { assertNeverBlock, type LessonChunk } from "@/lib/lesson/types";
import Link from "next/link";
import { KazOrb } from "@/components/kaz/KazOrb";
import { SaveToNotesButton } from "@/components/notes/SaveToNotesButton";
import {
  EVIDENCING_KINDS,
  isEvidencingKind,
  type MilestoneEvidence,
} from "@/lib/course/progress";
import type { RevealedHint } from "@/lib/kaz/hint-actions";
import { chunkNote } from "@/lib/kaz/notes";
import { recordChunkEvidence, setCurrentChunk } from "@/lib/course/progress-actions";
import { WorkflowOverview } from "./blocks/WorkflowOverview";
import { ContentBlocks } from "./blocks/ContentBlocks";
import { TeachingNotes } from "./blocks/TeachingNotes";
import { KazLauncher } from "@/components/kaz/KazLauncher";
import type { KazMessage, KazWorkflowVisibility } from "@/lib/kaz/types";
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
  /** Required steps not yet earned, in lesson order. Empty when complete. */
  openSteps?: readonly OpenStep[];
}

export interface OpenStep {
  id: string;
  title: string;
  evidence: MilestoneEvidence;
}

export interface FocusModeProps {
  chunks: readonly LessonChunk[];
  labSlug: string;
  /** Where this learner left off, if anywhere. */
  initialChunkId?: string | null;
  completion?: LabCompletion;
  /** Hostname of this lab's saved webhook, for Send Test. Null when none. */
  webhookHost?: string | null;
  /** Challenge chunk id -> hints this learner has already been given. */
  revealedHints?: Readonly<Record<string, readonly RevealedHint[]>>;
  /** Kaz's floating companion for this lab, or nothing when she is unavailable. */
  kaz?: KazLessonProps;
}

/** What the launcher needs that only the server can know. */
export interface KazLessonProps {
  labLabel: string;
  initialMessages: readonly KazMessage[];
  visibility: KazWorkflowVisibility;
}

/** What finishing each kind of open step takes, in the learner's words. */
const OPEN_STEP_ACTION: Record<MilestoneEvidence, string> = {
  acknowledged: "mark it done",
  predicted: "write your prediction",
  verified: "pass the check",
};

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
 * rather than congratulated for scrolling. Each open step is named, with a way
 * straight to it, so nobody pages back through ten chunks to find the one they
 * skipped.
 */
function RecapCompletion({
  completion,
  openSteps,
  onGoTo,
}: {
  completion?: LabCompletion;
  openSteps: readonly OpenStep[];
  onGoTo: (chunkId: string) => void;
}) {
  if (!completion) return null;

  if (!completion.complete) {
    if (openSteps.length === 0) {
      // Every step is done on this screen; the server is catching up.
      return <p className="text-sm text-ink-muted">Saving your progress…</p>;
    }

    return (
      <section className="flex flex-col gap-2">
        <p className="font-medium text-ink">
          {openSteps.length === 1
            ? "One step left before this lab is complete:"
            : openSteps.length + " steps left before this lab is complete:"}
        </p>
        <ul className="flex flex-col gap-2">
          {openSteps.map((open) => (
            <li key={open.id} className="flex flex-wrap items-baseline gap-x-2">
              <button
                type="button"
                onClick={() => onGoTo(open.id)}
                className="text-left text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                {open.title}
              </button>
              <span className="text-sm text-ink-muted">— {OPEN_STEP_ACTION[open.evidence]}</span>
            </li>
          ))}
        </ul>
      </section>
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
          className="workspace-primary mt-3"
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

/** Readable explanation with optional context and a problem-specific system map. */
function BaseChunk({ chunk, labSlug }: { chunk: LessonChunk; labSlug: string }) {
  return (
    <div className={`lesson-explanation lesson-explanation-${chunk.kind}`}>
      <div className="min-w-0 flex flex-col gap-5">
        <ContentBlocks
          blocks={chunk.kind === "problem" || chunk.kind === "recap" ? chunk.content.slice(0, 2) : chunk.content}
          actionVariant={chunk.kind === "debug" ? "questions" : "steps"}
        />
        {(chunk.kind === "problem" || chunk.kind === "recap") && chunk.content.length > 2 ? (
          <details className="lesson-teaching">
            <summary>{chunk.kind === "recap" ? "Revisit the details" : "Why this matters in a real workflow"}</summary>
            <div className="pt-4"><ContentBlocks blocks={chunk.content.slice(2)} /></div>
          </details>
        ) : null}
      </div>
      {chunk.kind === "problem" ? <WorkflowOverview labSlug={labSlug} /> : null}
      {chunk.teaches ? <TeachingNotes notes={chunk.teaches} /> : null}
    </div>
  );
}

function ChunkBody({
  chunk,
  labSlug,
  completion,
  openSteps,
  webhookHost,
  revealedHints,
  onGoTo,
  onPredicted,
}: {
  chunk: LessonChunk;
  labSlug: string;
  completion?: LabCompletion;
  openSteps: readonly OpenStep[];
  webhookHost: string | null;
  revealedHints?: Readonly<Record<string, readonly RevealedHint[]>>;
  onGoTo: (chunkId: string) => void;
  onPredicted: (chunkId: string) => void;
}) {
  switch (chunk.kind) {
    case "problem":
    case "concept":
    case "break-it":
    case "debug":
      return <BaseChunk chunk={chunk} labSlug={labSlug} />;

    case "recap":
      return (
        <div className="recap-workspace">
          <BaseChunk chunk={chunk} labSlug={labSlug} />
          <aside className="recap-next flex min-w-0 flex-col gap-5">
          <RecapCompletion completion={completion} openSteps={openSteps} onGoTo={onGoTo} />
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
          </aside>
        </div>
      );

    case "guided-build":
      return <GuidedBuildChunk chunk={chunk} />;

    case "predict":
      return (
        <PredictChunk chunk={chunk} labSlug={labSlug} onRecorded={() => onPredicted(chunk.id)} />
      );

    case "test":
      return <TestChunk chunk={chunk} labSlug={labSlug} webhookHost={webhookHost} />;

    case "challenge":
      return (
        <ChallengeChunk
          chunk={chunk}
          labSlug={labSlug}
          revealedHints={revealedHints?.[chunk.id] ?? []}
          webhookHost={webhookHost}
        />
      );

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
  webhookHost = null,
  revealedHints,
  kaz,
}: FocusModeProps) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  // Zero keeps the first paint visible; navigation sets the entry direction.
  const [direction, setDirection] = useState(0);
  // Resume where the learner left off. An unknown id — content reordered since
  // they were last here — falls back to the start rather than to nothing.
  const resumeIndex = Math.max(
    chunks.findIndex((chunk) => chunk.id === initialChunkId),
    0,
  );

  const [index, setIndex] = useState(resumeIndex);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Suppresses the focus move on first render: the learner has just arrived
  // and has not stepped anywhere yet, so stealing focus would be wrong.
  const hasStepped = useRef(false);
  const headingId = useId();
  const stepId = useId();

  // Steps recorded on this screen since the server last rendered. Writes are
  // fire-and-forget, so the recap would otherwise list a step the learner has
  // just finished until the next navigation.
  const [recordedHere, setRecordedHere] = useState<ReadonlySet<string>>(() => new Set());
  const [unsavedSteps, setUnsavedSteps] = useState<ReadonlySet<string>>(() => new Set());
  const openSteps = (completion?.openSteps ?? []).filter((open) => !recordedHere.has(open.id));

  const chunk = chunks[index];
  const isFirst = index === 0;
  const isLast = index === chunks.length - 1;
  const acknowledgeable = isAcknowledgeable(chunk);
  // Kaz speaks only at chosen moments, and never on consecutive chunks.
  const kazNote = chunkNote(chunk.kind, index > 0 ? chunks[index - 1].kind : null);

  useLayoutEffect(() => {
    if (!hasStepped.current) return;
    // Position before paint so long-page navigation shows the full entry motion.
    const sectionTop = sectionRef.current?.getBoundingClientRect().top;
    const headingBottom = headingRef.current?.getBoundingClientRect().bottom;
    if (sectionTop !== undefined && headingBottom !== undefined &&
        (sectionTop < 24 || headingBottom > window.innerHeight)) {
      sectionRef.current?.scrollIntoView?.({ block: "start", behavior: "instant" });
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  function goToIndex(next: number) {
    hasStepped.current = true;
    setDirection(next >= index ? 1 : -1);
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

  function step(delta: number) {
    goToIndex(Math.min(Math.max(index + delta, 0), chunks.length - 1));
  }

  function goTo(chunkId: string) {
    const target = chunks.findIndex((entry) => entry.id === chunkId);
    if (target >= 0) goToIndex(target);
  }

  /*
   * A step that was open until now can complete the lab, so once its write has
   * landed the server re-derives completion. Steps already earned change
   * nothing and cost no refresh.
   */
  function noteRecorded(chunkId: string, write: Promise<boolean>) {
    const wasOpen = (completion?.openSteps ?? []).some((open) => open.id === chunkId);
    setRecordedHere((current) => new Set(current).add(chunkId));
    void write.catch(() => false).then((saved) => {
      if (!saved) {
        setRecordedHere((current) => {
          const next = new Set(current);
          next.delete(chunkId);
          return next;
        });
        setUnsavedSteps((current) => new Set(current).add(chunkId));
        return;
      }
      setUnsavedSteps((current) => {
        const next = new Set(current);
        next.delete(chunkId);
        return next;
      });
      if (wasOpen) router.refresh();
    });
  }

  function finishAndAdvance() {
    noteRecorded(chunk.id, recordChunkEvidence(labSlug, chunk.id));
    step(1);
  }

  return (
    <section ref={sectionRef} aria-labelledby={headingId} className="lesson-focus" data-kind={chunk.kind}>
      <div className="lesson-orientation">
        {!isFirst ? (
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={`Back to ${chunks[index - 1].title} (top)`}
            className="lesson-back lesson-back-top text-sm font-medium text-ink-soft"
          >
            Back
          </button>
        ) : null}
      <p id={stepId} className="lesson-position">
        Step {index + 1} of {chunks.length}
        <span aria-hidden className="lesson-kind">{chunk.kind.replace("-", " ")}</span>
      </p>
      </div>
      <div className="lesson-progress" aria-hidden><span style={{ width: `${((index + 1) / chunks.length) * 100}%` }} /></div>

      <motion.div
        key={chunk.id}
        initial={direction !== 0 && !reducedMotion ? { opacity: 0.7, x: direction * PAGE_ENTER_OFFSET_PX, scale: 0.98 } : false}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={reducedMotion ? INSTANT : PAGE_ENTER}
        className="lesson-step-motion"
      >
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
        className="lesson-step-title focus-visible:-outline-offset-4"
      >
        {chunk.title}
      </h2>

      {kazNote ? (
        <div className="flex items-center gap-3">
          <KazOrb className="size-8" state={kazNote.state} />
          <p className="text-sm text-ink-soft">{kazNote.text}</p>
        </div>
      ) : null}

      <ChunkBody
        chunk={chunk}
        labSlug={labSlug}
        completion={completion}
        openSteps={openSteps}
        webhookHost={webhookHost}
        revealedHints={revealedHints}
        onGoTo={goTo}
        onPredicted={(chunkId) => noteRecorded(chunkId, Promise.resolve(true))}
      />
      </motion.div>

      {unsavedSteps.size > 0 ? (
        <div className="flex flex-col gap-2">
          <p role="status" className="text-sm text-ink-soft">Your progress was not saved. You can keep learning and retry the save.</p>
          <button type="button" className="w-fit text-sm font-medium text-accent hover:underline" onClick={() => {
            for (const id of unsavedSteps) noteRecorded(id, recordChunkEvidence(labSlug, id));
          }}>Retry progress save</button>
        </div>
      ) : null}

      <div className="lesson-navigation">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={isFirst}
          aria-label={isFirst ? "Back" : `Back to ${chunks[index - 1].title}`}
          className="lesson-back text-sm font-medium text-ink-soft disabled:text-ink-muted"
        >
          Back
        </button>

        {/*
          Vision §19's "Done / Next". Not a lab-level Mark Complete: it closes
          one build step the learner has just carried out, which is the
          acknowledgement §19 itself specifies. Vision §3 rules out a generic
          completion button as the PRIMARY mechanism, not this.
        */}
        {acknowledgeable && !isLast ? (
          <button
            type="button"
            onClick={finishAndAdvance}
            aria-label={`Done / Next: ${chunks[index + 1].title}`}
            className="workspace-primary"
          >
            Done / Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => step(1)}
            disabled={isLast}
            aria-label={isLast ? "Next" : `Next: ${chunks[index + 1].title}`}
            className="workspace-primary"
          >
            Next
          </button>
        )}
      </div>

      {/*
        Kaz follows the learner through the lesson: the chunk she is asked
        about is the one on screen, which is client state living here.
      */}
      {kaz ? (
        <KazLauncher
          labSlug={labSlug}
          chunkId={chunk.id}
          contextLabel={kaz.labLabel + " · " + chunk.title}
          initialMessages={kaz.initialMessages}
          visibility={kaz.visibility}
        />
      ) : null}
    </section>
  );
}
