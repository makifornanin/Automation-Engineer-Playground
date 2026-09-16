import Link from "next/link";
import { CAPSTONE } from "@/lib/course/catalog";
import {
  CAPSTONE_FLOW,
  CAPSTONE_FLOW_ALT,
  CAPSTONE_REQUIREMENTS,
  CAPSTONE_SCENARIOS,
} from "@/lib/course/capstone";
import { CAPSTONE_FRAMING } from "@/lib/course/groups";
import { deriveCourseState } from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";

/**
 * The Capstone (Vision §3: it unlocks after Labs 01–10; Vision §12: it has no
 * navigation item and appears at the end of the Labs journey).
 *
 * Previewable before it unlocks, like any future lab — why it matters and the
 * shape of the system — with the requirements and scenarios held back until
 * the course is done, the same way hands-on lab work is.
 *
 * Honest about its limit: AEP cannot check a Capstone for the learner yet. The
 * runtime lives in n8n with no exported workflow to build an evaluator from,
 * so the page asks the learner to prove each scenario in their own executions
 * rather than offering a completion button that would mean nothing.
 */
export default async function CapstonePage() {
  const progress = await getCourseProgress();
  const { capstone, labs } = deriveCourseState(progress);
  const unlocked = capstone.status !== "locked";
  const completed = labs.filter(({ status }) => status === "completed").length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted">Capstone</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{CAPSTONE.title}</h1>
        <p className="max-w-prose text-ink-soft">{CAPSTONE_FRAMING}</p>
        <p className="text-sm text-ink-muted">
          Status: {unlocked ? "Unlocked" : "Preview"}
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-ink">Why it matters</h2>
        <p className="max-w-prose text-ink-soft">
          Ten labs gave you ten skills in ten separate workflows. Real systems do not get to be
          tidy like that. A single customer request has to be validated and deduplicated and
          classified and authorised — and when the downstream API has a bad afternoon, retried,
          and if it stays down, recovered.
        </p>
        <p className="max-w-prose text-ink-soft">
          The interesting problems live in how those pieces interact. That is what this builds.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-ink">What you will build</h2>
        <pre
          role="img"
          aria-label={CAPSTONE_FLOW_ALT}
          className="overflow-x-auto rounded-card border border-line bg-surface-sunken p-3 text-sm"
        >
          <code aria-hidden className="font-mono text-ink-soft">
            {CAPSTONE_FLOW}
          </code>
        </pre>
      </section>

      {!unlocked ? (
        <section className="flex flex-col gap-2 border-t border-line pt-6">
          <p className="text-ink-soft">
            Complete all ten labs to unlock the Capstone. You have finished {completed} of 10.
          </p>
          <Link
            href="/labs"
            className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Back to the labs
          </Link>
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <h2 className="text-lg font-medium text-ink">Requirements</h2>
            <p className="max-w-prose text-ink-muted">
              None of this is new. Each line is something a lab already taught you.
            </p>
            <ul className="flex flex-col gap-2">
              {CAPSTONE_REQUIREMENTS.map((requirement) => (
                <li key={requirement.capability} className="flex gap-3 text-ink-soft">
                  <span className="shrink-0 text-sm text-ink-muted tabular-nums">
                    Lab {requirement.fromLab}
                  </span>
                  <span className="max-w-prose">{requirement.capability}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <h2 className="text-lg font-medium text-ink">What you must prove</h2>
            <p className="max-w-prose text-ink-muted">
              Each of these is its own run with its own expected outcome. A single successful
              execution proves almost none of them.
            </p>
            <ol className="flex list-decimal flex-col gap-3 pl-5 marker:text-ink-muted">
              {CAPSTONE_SCENARIOS.map((scenario) => (
                <li key={scenario.name} className="pl-1">
                  <p className="font-medium text-ink">{scenario.name}</p>
                  <p className="max-w-prose text-sm text-ink-soft">Proves {scenario.proves}.</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-2 border-t border-line pt-6">
            <h2 className="text-lg font-medium text-ink">How you finish</h2>
            <p className="max-w-prose text-ink-soft">
              Build the agent in your own n8n and run every scenario above. Keep the execution
              and its outcome for each one in your notes — that record is your evidence.
            </p>
            <p className="max-w-prose text-ink-muted">
              AEP cannot check a Capstone for you yet. Proving each scenario in your own
              executions is the honest version of done; a completion button here would mean
              nothing.
            </p>
            <Link
              href="/notes"
              className="w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Open your notes
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
