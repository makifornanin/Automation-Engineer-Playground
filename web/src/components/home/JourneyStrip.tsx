import { CAPSTONE } from "@/lib/course/catalog";
import type { LabStatus, LabWithStatus } from "@/lib/course/progress";

/*
 * `locked` has its own glyph and its own legend entry.
 *
 * It previously shared the `not-started` circle, which was safe only while
 * `deriveCourseState()` never emitted `locked`. Sequential unlocking makes it
 * reachable, and a shared glyph would mean sighted readers saw no difference
 * while screen reader users heard one.
 *
 * The dotted circle is deliberately quiet rather than a padlock: Vision §16
 * says locked labs "should not look disabled or discouraging. They should
 * create curiosity without allowing the learner to skip the intended
 * sequence."
 */
const GLYPH: Record<LabStatus, string> = {
  completed: "✓",
  "in-progress": "●",
  "not-started": "○",
  locked: "◌",
};

const STATUS_LABEL: Record<LabStatus, string> = {
  completed: "completed",
  "in-progress": "in progress",
  "not-started": "not started",
  locked: "locked",
};

const CAPSTONE_LINE: Record<LabStatus, string> = {
  locked: "locked until all ten labs are complete",
  "not-started": "unlocked",
  "in-progress": "in progress",
  completed: "complete",
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
 * Lightweight Your Journey indicator (Vision §10). Non-interactive: ten
 * identical `/labs` links would be worse than none.
 *
 * Each item's number and glyph are decorative and hidden from assistive tech;
 * the sr-only text carries the full equivalent — number, title and status — so
 * AT users get the same journey sighted users get from the notation, without
 * ten titles appearing on screen at small widths.
 *
 * The Capstone renders as one line after the strip, not an eleventh numbered
 * item.
 */
export function JourneyStrip({ labs, capstoneStatus }: JourneyStripProps) {
  // Only name the states actually present, so a first-time learner is not
  // handed a glossary of four symbols for a strip showing two.
  const present = new Set(labs.map(({ status }) => status));
  const legend = (["completed", "in-progress", "not-started", "locked"] as const)
    .filter((status) => present.has(status))
    .map((status) => `${GLYPH[status]} ${STATUS_LABEL[status]}`)
    .join(" · ");

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
        <span aria-hidden>{legend}.</span>
      </p>
      <p className="text-sm text-ink-muted">
        Capstone — {CAPSTONE.title}: {CAPSTONE_LINE[capstoneStatus]}
      </p>
    </>
  );
}
