import Link from "next/link";
import { ContentBlocks } from "@/components/lesson/blocks/ContentBlocks";
import { SelfCheckPanel } from "@/components/testing/SelfCheckPanel";
import { CAPSTONE, CAPSTONE_SLUG } from "@/lib/course/catalog";
import {
  CAPSTONE_FLOW,
  CAPSTONE_FLOW_ALT,
  CAPSTONE_REQUIREMENTS,
  CAPSTONE_SCENARIOS,
} from "@/lib/course/capstone";
import { CAPSTONE_FRAMING } from "@/lib/course/groups";
import { deriveCourseState, type LabStatus } from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";
import { startLab } from "@/lib/course/progress-writes";
import { getLessonChunks } from "@/lib/lesson/registry";

const STATUS_LABEL: Record<LabStatus, string> = {
  locked: "Preview",
  "not-started": "Unlocked",
  "in-progress": "In progress",
  completed: "Completed",
};

/**
 * The Capstone (Vision §3: it unlocks after Labs 01–10; Vision §12: it has no
 * navigation item and appears at the end of the Labs journey).
 *
 * Previewable before it unlocks, like any future lab — why it matters and the
 * shape of the system — with the requirements and proofs held back until the
 * course is done. The proofs are not even read from the registry while locked,
 * so they never reach the page payload.
 *
 * Completion is earned, not claimed: one pasted response per scenario, each
 * checked on the server against the behaviour that scenario proves. All nine
 * verified completes the Capstone. There is no completion button — the
 * evidence is the completion.
 *
 * Opening the unlocked page starts the Capstone, the same way opening a lab
 * starts that lab.
 */
export default async function CapstonePage() {
  const progress = await getCourseProgress();
  const { capstone, labs } = deriveCourseState(progress);
  const unlocked = capstone.status !== "locked";
  const completed = labs.filter(({ status }) => status === "completed").length;

  if (unlocked) {
    await startLab(CAPSTONE_SLUG);
  }
  // The status above was read before that write, so a first visit shows the
  // Capstone as started without needing a refresh.
  const status: LabStatus = capstone.status === "not-started" ? "in-progress" : capstone.status;

  const proofs = unlocked ? (getLessonChunks(CAPSTONE_SLUG) ?? []) : [];
  const earned = progress.labs[CAPSTONE_SLUG]?.evidence ?? {};
  const proved = proofs.filter((proof) => earned[proof.id] === "verified").length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted">Capstone</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{CAPSTONE.title}</h1>
        <p className="max-w-prose text-ink-soft">{CAPSTONE_FRAMING}</p>
        <p className="text-sm text-ink-muted">
          Status: {STATUS_LABEL[status]}
          {unlocked ? ` · ${proved} of ${proofs.length} scenarios proved` : ""}
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
              Build the agent in your own n8n, then prove it one scenario at a time. Each is its
              own run with its own expected outcome — a single successful execution proves almost
              none of them. AEP does not run your agent: it checks the response you paste.
            </p>
            {status === "completed" ? (
              <p role="status" className="max-w-prose font-medium text-ink">
                Capstone complete. All nine scenarios are proved by your own agent&rsquo;s
                responses.
              </p>
            ) : null}
            <ol className="flex flex-col gap-3">
              {proofs.map((proof, index) => {
                const scenario = CAPSTONE_SCENARIOS[index];
                const isProved = earned[proof.id] === "verified";
                return (
                  <li key={proof.id}>
                    <details className="group rounded-card border border-line p-4">
                      <summary className="flex cursor-pointer flex-col gap-1">
                        <span className="font-medium text-ink">
                          {index + 1}. {proof.title}
                        </span>
                        <span className="text-sm text-ink-soft">
                          {isProved ? "✓ Proved" : "Not proved yet"} · Proves {scenario?.proves}.
                        </span>
                      </summary>
                      <div className="mt-4 flex flex-col gap-4">
                        <ContentBlocks blocks={proof.content} />
                        {proof.kind === "test" ? (
                          <SelfCheckPanel
                            labSlug={CAPSTONE_SLUG}
                            chunkId={proof.id}
                            caseName={proof.caseName}
                            expected={proof.expected}
                            title="Check the response"
                          />
                        ) : null}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ol>
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
