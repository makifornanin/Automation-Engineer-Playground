import Link from "next/link";
import { CAPSTONE, LABS, labHref, type Lab } from "@/lib/course/catalog";
import type { LabStatus } from "@/lib/course/progress";

export interface ContinueLearningCardProps {
  lab: Lab;
  /**
   * Completion of this lab, 0–100, or null when the lab has no milestones to
   * measure. Rendered only when above zero — see the component docstring.
   */
  percent?: number | null;
  /**
   * Once every lab is complete the one thing left to continue is the Capstone,
   * so the card points there instead of back at a finished Lab 10.
   */
  capstoneStatus?: LabStatus;
}

const CAPSTONE_CARD: Record<Exclude<LabStatus, "locked">, { line: string; action: string }> = {
  "not-started": { line: "Capstone · all ten labs complete", action: "Start the Capstone" },
  "in-progress": { line: "Capstone · in progress", action: "Continue the Capstone" },
  completed: { line: "Capstone · complete", action: "Review the Capstone" },
};

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
export function ContinueLearningCard({
  lab,
  percent = null,
  capstoneStatus = "locked",
}: ContinueLearningCardProps) {
  const showPercent = percent !== null && percent > 0;

  if (capstoneStatus !== "locked") {
    const card = CAPSTONE_CARD[capstoneStatus];
    return (
      <div className="home-launch">
        <p className="text-sm text-ink-muted">{card.line}</p>
        <p className="home-launch-title">{CAPSTONE.title}</p>
        <p className="home-launch-description">{CAPSTONE.description}</p>
        <Link
          href="/capstone"
          aria-label={`${card.action} — ${CAPSTONE.title}`}
          className="workspace-primary"
        >
          {card.action}
        </Link>
      </div>
    );
  }

  return (
    <div className="home-launch">
      <p className="text-sm text-ink-muted">
        Lab {lab.number} of {LABS.length}
        {showPercent ? ` · ${percent}% complete` : ""}
      </p>
      <p className="home-launch-title">{lab.title}</p>
      <p className="home-launch-description">{lab.description}</p>
      <Link
        href={labHref(lab)}
        aria-label={`Continue Lab ${lab.number} — ${lab.title}`}
        className="workspace-primary"
      >
        Continue
      </Link>
    </div>
  );
}
