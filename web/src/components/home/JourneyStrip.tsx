import { CAPSTONE } from "@/lib/course/catalog";
import type { LabStatus, LabWithStatus } from "@/lib/course/progress";

/*
 * `locked` deliberately shares the `not-started` glyph, and the visible
 * legend below does not mention it. That is safe only because
 * `deriveCourseState()` never emits `locked` for a lab today and the Capstone
 * renders as its own text line rather than a glyph. If a later Aim Point
 * starts marking labs locked, sighted readers would see no difference while
 * screen reader users would hear one — give `locked` its own glyph and legend
 * entry at that point.
 */
const GLYPH: Record<LabStatus, string> = {
  completed: "✓",
  "in-progress": "●",
  "not-started": "○",
  locked: "○",
};

const STATUS_LABEL: Record<LabStatus, string> = {
  completed: "completed",
  "in-progress": "in progress",
  "not-started": "not started",
  locked: "locked",
};

/** Spoken form for assistive tech — "&" reads oddly aloud. */
function spokenTitle(title: string): string {
  return title.replace(/ & /g, " and ");
}

export interface JourneyStripProps {
  labs: readonly LabWithStatus[];
  capstoneStatus: LabStatus;
}

/**
 * Lightweight Your Journey indicator (Vision §10). Non-interactive this Aim
 * Point — ten identical `/labs` links would be worse than none.
 *
 * Each item's number and glyph are decorative and hidden from assistive
 * tech; the sr-only text carries the full equivalent — number, title and
 * status — so AT users get the same journey sighted users get from the
 * notation, without ten titles appearing on screen at small widths.
 *
 * The Capstone renders as one line after the strip, not an eleventh
 * numbered item.
 */
export function JourneyStrip({ labs, capstoneStatus }: JourneyStripProps) {
  return (
    <>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
        {labs.map(({ lab, status }) => (
          <li key={lab.slug} className="tabular-nums">
            <span aria-hidden>
              {lab.number} {GLYPH[status]}
            </span>
            <span className="sr-only">
              {`Lab ${lab.number}, ${spokenTitle(lab.title)}, ${STATUS_LABEL[status]}`}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-ink-muted">
        <span aria-hidden>✓ completed · ● in progress · ○ not started.</span>
      </p>
      <p className="text-sm text-ink-muted">
        Capstone — {CAPSTONE.title}:{" "}
        {capstoneStatus === "locked"
          ? "locked until all ten labs are complete"
          : "unlocked"}
      </p>
    </>
  );
}
