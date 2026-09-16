import { SelfCheckPanel } from "@/components/testing/SelfCheckPanel";
import type { TestChunk as TestChunkData } from "@/lib/lesson/types";
import { ContentBlocks } from "../blocks/ContentBlocks";

/**
 * A test chunk: the business scenario, then the check itself.
 *
 * Every lab currently uses `self-check`: the learner runs their own workflow
 * and pastes the result. That is the only option for Labs 01, 02, 05 and 06,
 * which run on a Manual Trigger with no webhook. `send-test` — AEP posting to
 * the learner's own webhook — needs the URL stored and validated server-side
 * first, and is not built; no lab content uses it, so the branch below is a
 * guard rather than a feature.
 */
export function TestChunk({ chunk, labSlug }: { chunk: TestChunkData; labSlug: string }) {
  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />

      {chunk.mode === "self-check" ? (
        <SelfCheckPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          caseName={chunk.caseName}
        />
      ) : (
        <p className="text-sm text-ink-muted">
          This check is not available yet.
        </p>
      )}
    </div>
  );
}
