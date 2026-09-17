import { SelfCheckPanel } from "@/components/testing/SelfCheckPanel";
import { SendTestPanel } from "@/components/testing/SendTestPanel";
import type { TestChunk as TestChunkData } from "@/lib/lesson/types";
import { ContentBlocks } from "../blocks/ContentBlocks";

/**
 * A test chunk: the business scenario, then the check itself.
 *
 * `send-test` is for the labs whose workflow starts with a Webhook node —
 * 03, 04, 07, 08, 09 and 10 — where AEP posts the lab's sample request to the
 * learner's own n8n and judges the answer. `self-check` is for Labs 01, 02, 05
 * and 06, which run on a Manual Trigger and have nothing AEP could call, so
 * the learner pastes the output instead.
 */
export function TestChunk({
  chunk,
  labSlug,
  webhookHost,
}: {
  chunk: TestChunkData;
  labSlug: string;
  webhookHost: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ContentBlocks blocks={chunk.content} />

      {chunk.mode === "send-test" && chunk.payload !== undefined ? (
        <SendTestPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          caseName={chunk.caseName}
          expected={chunk.expected}
          payload={chunk.payload}
          webhookHost={webhookHost}
        />
      ) : (
        <SelfCheckPanel
          labSlug={labSlug}
          chunkId={chunk.id}
          caseName={chunk.caseName}
          expected={chunk.expected}
        />
      )}
    </div>
  );
}
