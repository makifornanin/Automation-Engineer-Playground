import { labsByGroup } from "@/lib/course/groups";
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

/** Curriculum phases with one status-labelled entry per lab and a Capstone endpoint. */
export function JourneyStrip({ labs, capstoneStatus }: JourneyStripProps) {
  return (
    <div className="journey-path">
      {labsByGroup(labs, (item) => item.lab.group).map(({ group, labs: entries }, index) => (
        <section className="journey-phase" key={group.name} data-state={entries.every((entry) => entry.status === "completed") ? "completed" : entries.some((entry) => entry.status === "in-progress") ? "current" : "upcoming"}>
          <h3><span aria-hidden className="journey-phase-number">0{index + 1}</span>{group.name}</h3>
          <ol className="journey-labs" aria-label={group.name}>
            {entries.map(({ lab, status }) => (
              <li key={lab.slug} data-state={status}>
                <span aria-hidden className="journey-lab-number">{lab.number}</span>
                <span aria-hidden className="journey-lab-title">{lab.title}</span>
                <span aria-hidden className="journey-lab-state">{GLYPH[status]} <span>{STATUS_LABEL[status]}</span></span>
                <span className="sr-only">{`Lab ${lab.number}, ${spokenTitle(lab.title)}, ${STATUS_LABEL[status]}`}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="journey-capstone"><span aria-hidden className="journey-phase-number">04</span>Capstone &mdash; {CAPSTONE.title}: {CAPSTONE_LINE[capstoneStatus]}</p>
    </div>
  );
}
