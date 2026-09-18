import Link from "next/link";
import { FeaturedLabCard } from "@/components/labs/FeaturedLabCard";
import { LabGroupSection } from "@/components/labs/LabGroupSection";
import { CAPSTONE } from "@/lib/course/catalog";
import { CAPSTONE_FRAMING, labsByGroup } from "@/lib/course/groups";
import { getLessonChunks } from "@/lib/lesson/registry";
import { deriveCourseState, labCompletionPercent, type LabStatus } from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";

const CAPSTONE_STATE: Record<LabStatus, { line: string; action: string }> = {
  locked: { line: "Locked until all ten labs are complete.", action: "Preview" },
  "not-started": { line: "Unlocked.", action: "Open" },
  "in-progress": { line: "In progress.", action: "Continue" },
  completed: { line: "Complete — all nine scenarios proved.", action: "Review" },
};

/**
 * The real Labs journey (Vision §16): a featured card for the current lab,
 * the curriculum grouped into Foundations / Reliability / AI Engineering,
 * then the Capstone on its own. The Capstone is the only thing on this page
 * that ever renders as locked — `deriveCourseState()` never marks a lab
 * locked (see `progress.ts`).
 */
export default async function LabsPage() {
  const progress = await getCourseProgress();
  const { currentLab, labs, capstone } = deriveCourseState(progress);
  const grouped = labsByGroup(labs, (item) => item.lab.group);

  // Vision §16's completion percentage, shown only once something is earned —
  // see the note on Home. Null falls back to position alone.
  const currentChunks = getLessonChunks(currentLab.lab.slug);
  const percent = currentChunks
    ? labCompletionPercent(currentChunks, progress.labs[currentLab.lab.slug]?.evidence ?? {})
    : null;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Labs</h1>

      <FeaturedLabCard lab={currentLab.lab} percent={percent} />

      {grouped.map(({ group, labs: groupLabs }) => (
        <LabGroupSection
          key={group.name}
          group={group}
          labs={groupLabs}
          currentLabSlug={currentLab.lab.slug}
        />
      ))}

      <section className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="text-lg font-medium text-ink">Capstone</h2>
        <p className="max-w-prose text-ink-soft">{CAPSTONE_FRAMING}</p>
        <div className="flex flex-col gap-1 pt-2">
          <p className="font-medium text-ink">{CAPSTONE.title}</p>
          <p className="text-sm text-ink-soft">{CAPSTONE.description}</p>
          <p className="text-sm text-ink-muted">{CAPSTONE_STATE[capstone.status].line}</p>
          <Link
            href="/capstone"
            aria-label={CAPSTONE_STATE[capstone.status].action + " the Capstone — " + CAPSTONE.title}
            className="w-fit pt-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {CAPSTONE_STATE[capstone.status].action}
          </Link>
        </div>
      </section>
    </div>
  );
}
