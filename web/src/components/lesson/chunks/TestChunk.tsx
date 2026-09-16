import { SelfCheckPanel } from "@/components/testing/SelfCheckPanel";
import type { TestChunk as TestChunkData } from "@/lib/lesson/types";
import { ContentBlocks } from "../blocks/ContentBlocks";

/**
 * A test chunk: the business scenario, then the check itself.
 *
 * `self-check` is for the labs AEP cannot call — Labs 01, 02, 05 and 06 run on
 * a Manual Trigger with no webhook, so the learner runs their own workflow and
 * pastes the result. `send-test` posts a payload to the learner's webhook and
 * arrives with Lab 03, the first lab that has one.
 */
export function TestChunk({ chunk, labSlug }: { chunk: TestChunkData; labSlug: string }) {
  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />

      {chunk.mode === "self-check" ? (
        <SelfCheckPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          testCaseId={chunk.testCaseId}
          caseName={chunk.caseName}
        />
      ) : (
        <p className="text-sm text-ink-muted">
          Send Test arrives with the labs that expose a webhook.
        </p>
      )}
    </div>
  );
}
