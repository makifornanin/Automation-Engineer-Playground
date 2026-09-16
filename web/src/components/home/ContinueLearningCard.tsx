import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LABS, labHref, type Lab } from "@/lib/course/catalog";

export interface ContinueLearningCardProps {
  lab: Lab;
}

/**
 * Continue Learning (Vision §10) — the current lab, its position in the
 * course, and one Continue action. Position is shown as "Lab NN of 10", not
 * a percentage or progress bar: no persistence exists yet to back one.
 *
 * The link's visible text is short ("Continue"); the destination is generic
 * (`labHref()` resolves every lab to the same place today), so the
 * accessible name carries the lab number and title instead.
 */
export function ContinueLearningCard({ lab }: ContinueLearningCardProps) {
  return (
    <GlassSurface className="flex flex-col gap-3 p-5">
      <p className="text-sm text-ink-muted">
        Lab {lab.number} of {LABS.length}
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
