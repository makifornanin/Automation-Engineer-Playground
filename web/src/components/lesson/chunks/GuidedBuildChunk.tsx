import type { GuidedBuildChunk as GuidedBuildChunkData } from "@/lib/lesson/types";
import { ActionList, ContentBlocks } from "../blocks/ContentBlocks";
import { TeachingNotes } from "../blocks/TeachingNotes";

/** Actions lead the workspace; purpose and optional explanations stay nearby. */
export function GuidedBuildChunk({ chunk }: { chunk: GuidedBuildChunkData }) {
  return (
    <div className="build-workspace">
      <section className="build-purpose">
        <h3 className="lesson-eyebrow">Why this matters</h3>
        <ContentBlocks blocks={chunk.whyThisMatters} />
      </section>
      <section className="build-actions">
        <h3 className="lesson-eyebrow">Your turn</h3>
        <ActionList items={chunk.actions} />
      </section>
      <aside className="build-context">
        {chunk.visual ? <><h3 className="lesson-eyebrow">What you are building</h3><ContentBlocks blocks={[chunk.visual]} /></> : null}
        <ContentBlocks blocks={chunk.content} />
        <details className="lesson-teaching">
          <summary>Why we&rsquo;re doing this</summary>
          <div className="pt-4"><ContentBlocks blocks={chunk.whyWereDoingThis} /></div>
        </details>
        {chunk.teaches ? <TeachingNotes notes={chunk.teaches} /> : null}
      </aside>
    </div>
  );
}
