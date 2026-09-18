import { KazHints } from "@/components/kaz/KazHints";
import type { RevealedHint } from "@/lib/kaz/hint-actions";
import { SelfCheckPanel } from "@/components/testing/SelfCheckPanel";
import { SendTestPanel } from "@/components/testing/SendTestPanel";
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
 * exist, and `KazHints` fetches them from the server one at a time — which is
 * what makes progressive hinting real rather than decorative. Serialising them
 * here would put every answer one devtools panel away.
 */
export function ChallengeChunk({
  chunk,
  labSlug,
  revealedHints = [],
  webhookHost = null,
}: {
  chunk: ChallengeChunkData;
  labSlug: string;
  /** Hints this learner already asked for, so a reload does not take them back. */
  revealedHints?: readonly RevealedHint[];
  /** Hostname of the lab's saved webhook, for a challenge that uses Send Test. */
  webhookHost?: string | null;
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

      {chunk.testCaseId && chunk.caseName && chunk.mode === "send-test" && chunk.payload !== undefined ? (
        <SendTestPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          caseName={chunk.caseName}
          expected={chunk.expected}
          payload={chunk.payload}
          webhookHost={webhookHost}
        />
      ) : chunk.testCaseId && chunk.caseName ? (
        <SelfCheckPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          caseName={chunk.caseName}
          expected={chunk.expected}
        />
      ) : null}

      <KazHints
        labSlug={labSlug}
        chunkId={chunk.id}
        hintCount={chunk.hintCount}
        initialRevealed={revealedHints}
      />
    </div>
  );
}
