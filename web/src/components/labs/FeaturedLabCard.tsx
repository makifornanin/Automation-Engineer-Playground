import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LABS, labHref, type Lab } from "@/lib/course/catalog";

export interface FeaturedLabCardProps {
  lab: Lab;
  /**
   * Completion of this lab, 0–100, or null when the lab has no milestones to
   * measure. Rendered only when above zero — see the component docstring.
   */
  percent?: number | null;
}

/**
 * The Labs screen's current-lab card (Vision §16): position, title,
 * description, group, and one clear Continue action.
 *
 * Vision §16 asks for a completion percentage here. It is shown alongside the
 * position rather than instead of it, and only once the learner has earned a
 * milestone — a permanent "0%" is a worse first impression than the position
 * alone, and while learner state is unavailable it would be the only value
 * this could ever show.
 *
 * Deliberately its own component rather than a `variant` prop shared with
 * Home's `ContinueLearningCard`: the two overlap on only a few lines, and a
 * shared-component-with-a-variant-prop is the abstraction the owner ruled out
 * for this pair.
 *
 * The link's visible text is short ("Continue"); the accessible name carries
 * the lab number and title so assistive tech and speech-input users get the
 * same identity a sighted reader gets from the card around it.
 */
export function FeaturedLabCard({ lab, percent = null }: FeaturedLabCardProps) {
  const showPercent = percent !== null && percent > 0;

  return (
    <GlassSurface className="flex flex-col gap-3 p-6">
      <p className="text-sm text-ink-muted">
        Lab {lab.number} of {LABS.length} · {lab.group}
        {showPercent ? ` · ${percent}% complete` : ""}
      </p>
      <p className="text-xl font-medium text-ink">{lab.title}</p>
      <p className="max-w-prose text-ink-soft">{lab.description}</p>
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
