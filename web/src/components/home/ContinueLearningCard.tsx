import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LABS, labHref, type Lab } from "@/lib/course/catalog";

export interface ContinueLearningCardProps {
  lab: Lab;
  /**
   * Completion of this lab, 0–100, or null when the lab has no milestones to
   * measure. Rendered only when above zero — see the component docstring.
   */
  percent?: number | null;
}

/**
 * Continue Learning (Vision §10) — the current lab, its position in the
 * course, and one Continue action.
 *
 * Position is always shown. The completion percentage (Vision §16) joins it
 * only once the learner has earned something: a first-time learner staring at
 * "0%" learns nothing the position does not already tell them, and it reads as
 * a judgement rather than information.
 *
 * The link's visible text is short ("Continue"), so the accessible name
 * carries the lab number and title.
 */
export function ContinueLearningCard({ lab, percent = null }: ContinueLearningCardProps) {
  const showPercent = percent !== null && percent > 0;

  return (
    <GlassSurface className="flex flex-col gap-3 p-5">
      <p className="text-sm text-ink-muted">
        Lab {lab.number} of {LABS.length}
        {showPercent ? ` · ${percent}% complete` : ""}
      </p>
      <p className="text-lg font-medium text-ink">{lab.title}</p>
      <Link
        href={labHref(lab)}
        aria-label={`Continue Lab ${lab.number} — ${lab.title}`}
        className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Continue
      </Link>
    </GlassSurface>
  );
}
