"use client";

import { useState } from "react";
import type { PredictChunk as PredictChunkData } from "@/lib/lesson/types";
import { ContentBlocks } from "../blocks/ContentBlocks";

/**
 * Vision §2: "Let learners predict outcomes before running tests."
 *
 * The answer is hidden behind a deliberate action rather than rendered further
 * down the page, because a prediction the learner can read the answer to is
 * not a prediction. It is client state rather than a `<details>` element so the
 * reveal can later record `predicted` evidence without changing the markup the
 * learner already knows.
 *
 * The reveal is not removed once shown — re-hiding an answer the learner has
 * already read helps nobody, and a toggle invites fiddling instead of thinking.
 */
export function PredictChunk({ chunk }: { chunk: PredictChunkData }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />

      <p className="max-w-prose font-medium text-ink">{chunk.prompt}</p>

      {revealed ? (
        <section className="flex flex-col gap-2 border-t border-line pt-4">
          <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
            What actually happens
          </h3>
          <ContentBlocks blocks={chunk.reveal} />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Show me what happens
        </button>
      )}
    </div>
  );
}
