"use client";

import { useId, useState } from "react";
import { recordChunkEvidence } from "@/lib/course/progress-actions";
import type { PredictChunk as PredictChunkData } from "@/lib/lesson/types";
import { ContentBlocks } from "../blocks/ContentBlocks";

/**
 * Vision §2: "Let learners predict outcomes before running tests."
 *
 * The learner writes a prediction before the answer can be revealed, and the
 * reveal is what records `predicted` evidence. Requiring the words is what
 * makes that evidence mean something: a reveal button alone would record a
 * milestone for anyone who clicked past the question without thinking.
 *
 * The prediction itself is not stored or graded. Predictions are meant to be
 * wrong sometimes — that is where the learning is — so marking them would
 * punish exactly the honesty the exercise depends on. It is shown back beside
 * the real answer, because comparing the two is the lesson.
 *
 * The reveal is not undoable. Re-hiding an answer the learner has already read
 * helps nobody, and a toggle invites fiddling instead of thinking.
 */
export function PredictChunk({
  chunk,
  labSlug,
}: {
  chunk: PredictChunkData;
  labSlug: string;
}) {
  const [prediction, setPrediction] = useState("");
  const [revealed, setRevealed] = useState(false);
  const fieldId = useId();

  const ready = prediction.trim().length > 0;

  function reveal() {
    if (!ready) return;
    setRevealed(true);
    // Fire and forget, like every other position/evidence write in the
    // stepper: a failed write must never block the learner seeing the answer.
    void recordChunkEvidence(labSlug, chunk.id).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />

      <label htmlFor={fieldId} className="max-w-prose font-medium text-ink">
        {chunk.prompt}
      </label>

      {revealed ? (
        <>
          <section className="flex flex-col gap-1">
            <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
              You predicted
            </h3>
            <p className="max-w-prose whitespace-pre-wrap text-ink-soft">{prediction}</p>
          </section>
          <section className="flex flex-col gap-2 border-t border-line pt-4">
            <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
              What actually happens
            </h3>
            <ContentBlocks blocks={chunk.reveal} />
          </section>
        </>
      ) : (
        <>
          <textarea
            id={fieldId}
            value={prediction}
            onChange={(event) => setPrediction(event.target.value)}
            rows={3}
            placeholder="Commit to an answer before you look."
            className="rounded-card border border-line bg-surface p-3 text-ink outline-none focus-visible:border-accent"
          />
          <button
            type="button"
            onClick={reveal}
            disabled={!ready}
            className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline"
          >
            Show me what happens
          </button>
        </>
      )}
    </div>
  );
}
