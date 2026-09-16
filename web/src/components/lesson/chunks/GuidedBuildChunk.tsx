import type { GuidedBuildChunk as GuidedBuildChunkData } from "@/lib/lesson/types";
import { ActionList, ContentBlocks } from "../blocks/ContentBlocks";
import { TeachingNotes } from "../blocks/TeachingNotes";

/**
 * Vision §19's Build chunk: why this matters, an optional visual, 2–4 concrete
 * actions, then why we're doing this.
 *
 * The order is deliberate and is the whole pedagogy — the reason comes before
 * the instructions, and a second reason comes after them. Dropping either one
 * turns the chunk back into the wall of steps §19 exists to replace, which is
 * why they are named fields on the type rather than blocks an author can
 * forget.
 *
 * The section headings are visible rather than `sr-only`: a learner scanning
 * back for "what was I supposed to type" needs to find "Your turn" with their
 * eyes.
 */
export function GuidedBuildChunk({ chunk }: { chunk: GuidedBuildChunkData }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Why this matters
        </h3>
        <ContentBlocks blocks={chunk.whyThisMatters} />
      </section>

      {chunk.visual ? <ContentBlocks blocks={[chunk.visual]} /> : null}

      <ContentBlocks blocks={chunk.content} />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Your turn
        </h3>
        <ActionList items={chunk.actions} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Why we&rsquo;re doing this
        </h3>
        <ContentBlocks blocks={chunk.whyWereDoingThis} />
      </section>

      {chunk.teaches ? <TeachingNotes notes={chunk.teaches} /> : null}
    </div>
  );
}
