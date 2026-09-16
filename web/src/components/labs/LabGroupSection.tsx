import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { labHref } from "@/lib/course/catalog";
import type { LabGroupDef } from "@/lib/course/groups";
import { isHandsOnAvailable, type LabWithStatus } from "@/lib/course/progress";

type RowState = "completed" | "current" | "preview";

const ROW_LABEL: Record<RowState, string> = {
  completed: "Completed",
  current: "Current",
  preview: "Preview",
};

/**
 * The featured card names one lab as the one to continue, so that same lab's
 * row has to agree with it. Deriving the row purely from `LabStatus` is not
 * enough: with no persisted progress every lab is `not-started`, including the
 * current one, which would render the first lab as "Preview" directly beneath
 * a card offering "Continue" for it — two clickable links with opposing verbs
 * and conflicting accessible names pointing at one destination. Vision §3 also
 * states Lab 01 is available to a first-time learner, so "Preview" would be
 * wrong on its own terms.
 */
function rowState(status: LabWithStatus["status"], isCurrent: boolean): RowState {
  if (status === "completed") return "completed";
  if (isCurrent || status === "in-progress") return "current";
  return "preview";
}

export interface LabGroupSectionProps {
  group: LabGroupDef;
  labs: readonly LabWithStatus[];
  /** Slug of the lab the featured card is offering, so the two never disagree. */
  currentLabSlug: string;
}

/**
 * One curriculum group on the Labs screen (Vision §16): a heading, its
 * framing line, and its lab rows. Presentation vocabulary is
 * completed / current / preview — three states, never a difficulty scale
 * (Vision §16 forbids Beginner / Intermediate / Advanced anywhere in the
 * product).
 *
 * A row's action is Continue when its hands-on content is open
 * (`isHandsOnAvailable`) and Preview otherwise: preview is always
 * available, hands-on is not.
 */
export function LabGroupSection({ group, labs, currentLabSlug }: LabGroupSectionProps) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-ink">{group.name}</h2>
        <p className="max-w-prose text-ink-soft">{group.framing}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {labs.map(({ lab, status }) => {
          const isCurrent = lab.slug === currentLabSlug;
          const state = rowState(status, isCurrent);
          const actionLabel =
            isCurrent || isHandsOnAvailable(status) ? "Continue" : "Preview";

          return (
            <li key={lab.slug}>
              <GlassSurface className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-ink-muted">
                    Lab {lab.number} · {ROW_LABEL[state]}
                  </p>
                  <p className="font-medium text-ink">{lab.title}</p>
                  <p className="text-sm text-ink-soft">{lab.description}</p>
                </div>
                <Link
                  href={labHref(lab)}
                  aria-label={`${actionLabel} Lab ${lab.number} — ${lab.title}`}
                  className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  {actionLabel}
                </Link>
              </GlassSurface>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
