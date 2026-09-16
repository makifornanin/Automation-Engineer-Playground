import { SelfCheckPanel } from "@/components/testing/SelfCheckPanel";
import type { ChallengeChunk as ChallengeChunkData } from "@/lib/lesson/types";
import { ContentBlocks } from "../blocks/ContentBlocks";

/**
 * A challenge: requirements and what must be proven, never the answer.
 *
 * `verification` lists what a correct result looks like in business terms —
 * that is the specification, not a solution. The expected values live in the
 * `server-only` case registry, so the learner can check their work without
 * being able to read the answer out of the page.
 *
 * Hints are deliberately absent from this payload. `hintCount` says how many
 * exist; fetching them one at a time is what makes progressive hinting real
 * rather than decorative, and serialising them here would put every answer one
 * devtools panel away.
 */
export function ChallengeChunk({
  chunk,
  labSlug,
}: {
  chunk: ChallengeChunkData;
  labSlug: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />

      {chunk.verification && chunk.verification.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
            It passes when
          </h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-ink-muted">
            {chunk.verification.map((line) => (
              <li key={line} className="max-w-prose text-ink-soft">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {chunk.testCaseId && chunk.caseName ? (
        <SelfCheckPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          testCaseId={chunk.testCaseId}
          caseName={chunk.caseName}
        />
      ) : null}

      {chunk.hintCount > 0 ? (
        <p className="text-sm text-ink-muted">
          {chunk.hintCount} hints are available in the lab notes if you get stuck. Try it
          first — predicting is the part that teaches.
        </p>
      ) : null}
    </div>
  );
}
