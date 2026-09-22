import { notFound } from "next/navigation";
import { FocusMode } from "@/components/lesson/FocusMode";
import { LABS, labHref } from "@/lib/course/catalog";
import {
  deriveCourseState,
  isHandsOnAvailable,
  isLabComplete,
  isLessonReadable,
  openMilestones,
  visibleChunks,
} from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";
import { startLab } from "@/lib/course/progress-writes";
import { getChallengeHints } from "@/lib/kaz/hints";
import { webhookPathForGateway } from "@/lib/kaz/gateway";
import { readMessages } from "@/lib/kaz/thread-store";
import type { KazWorkflowVisibility } from "@/lib/kaz/types";
import { getLessonChunks } from "@/lib/lesson/registry";
import { getLabWebhookHost, getLabWebhookUrl } from "@/lib/testing/webhook-store";

export interface LabPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * A lab's page: the overview header, then either its lesson in Focus Mode or a
 * prerequisite line. Every lab has authored content; the final fallback below
 * is kept only so a lab whose content is ever missing says so honestly rather
 * than rendering an empty lesson.
 *
 * `slug` is untrusted route input. It is only ever compared against the
 * static `LABS` catalog below; it is never interpolated into a filesystem
 * path or used to read README content at runtime, and an unknown value 404s
 * before anything else renders. The route itself needs no auth code:
 * `isProtectedPath` denies by default and `(app)/layout.tsx`'s
 * `requireSession()` is the authoritative guard.
 */
export default async function LabPage({ params }: LabPageProps) {
  const { slug } = await params;
  const lab = LABS.find((entry) => entry.slug === slug);

  if (!lab) {
    notFound();
  }

  const progress = await getCourseProgress();
  const { labs, currentLab } = deriveCourseState(progress);
  const index = LABS.findIndex((entry) => entry.slug === lab.slug);
  const status = labs[index].status;
  const prerequisite = index > 0 ? LABS[index - 1] : null;
  const isCurrent = currentLab.lab.slug === lab.slug;

  // A lab is only ever shown as "future" when its lesson is not readable and
  // it has an earlier lab to point to. Lab 01 has no prerequisite, so it can
  // never claim one whatever its status.
  const readable = isLessonReadable(status, isCurrent);
  const isFuture = !readable && prerequisite !== null;

  const allChunks = readable ? getLessonChunks(lab.slug) : null;

  /*
   * Opening a readable lesson starts the lab. That is what makes
   * `in-progress` mean "the learner opened this" rather than "this happens to
   * be current" — the distinction `isHandsOnAvailable` exists to protect — and
   * it is what unlocks the hands-on chunks below.
   *
   * The status read above is from before this write, so it is recomputed
   * rather than reused: otherwise a learner's first visit would serve them the
   * reading-only chunk list and need a refresh to show the build.
   */
  if (allChunks) {
    await startLab(lab.slug);
  }
  const effectiveStatus = allChunks && status === "not-started" ? "in-progress" : status;

  // Filtered on the server, before serialisation: a locked chunk must not
  // reach the browser at all, not merely render as locked.
  const chunks = allChunks ? visibleChunks(allChunks, effectiveStatus) : null;

  // Only labs with a Send Test read the saved webhook (Vision §25: webhook
  // configuration exists only where a lab needs it). Hostname only.
  const usesSendTest = (chunks ?? []).some(
    (chunk) => (chunk.kind === "test" || chunk.kind === "challenge") && chunk.mode === "send-test",
  );
  const webhookHost = usesSendTest ? await getLabWebhookHost(lab.slug) : null;

  /*
   * What Kaz can honestly see of this learner's n8n. A lab with no webhook has
   * nothing to link; a saved webhook on some other host is real, but not on the
   * n8n Kaz can read, and she says so rather than pretending.
   */
  const handsOn = isHandsOnAvailable(effectiveStatus);
  const savedWebhook = usesSendTest && handsOn ? await getLabWebhookUrl(lab.slug) : null;
  const kazVisibility: KazWorkflowVisibility = !usesSendTest
    ? { status: "no_webhook_lab" }
    : webhookPathForGateway(savedWebhook) && webhookHost
      ? { status: "linked", host: webhookHost }
      : { status: "not_linked" };
  const kaz = handsOn
    ? {
        labLabel: "Lab " + lab.number,
        initialMessages: await readMessages(lab.slug),
        visibility: kazVisibility,
      }
    : undefined;

  // Completion is decided here, from earned evidence against the lab's full
  // content — never by the client. Lab 10's "next" is the Capstone.
  const nextLab = LABS[index + 1] ?? null;
  const earned = progress.labs[lab.slug]?.evidence ?? {};
  const completion = {
    complete: allChunks ? isLabComplete(allChunks, earned) : false,
    next: nextLab
      ? { label: "Lab " + nextLab.number + " — " + nextLab.title, href: labHref(nextLab) }
      : { label: "The Capstone", href: "/capstone" },
    // What the recap names when the lab is not complete: each unfinished step,
    // limited to the chunks this learner can actually open.
    openSteps: (chunks ? openMilestones(chunks, earned) : []).flatMap(({ chunkId, evidence }) => {
      const open = chunks?.find((entry) => entry.id === chunkId);
      return open ? [{ id: open.id, title: open.title, evidence }] : [];
    }),
  };

  // Hints a learner has already asked for stay revealed after a reload. They
  // were earned one request at a time; losing them would make the learner ask
  // again and restart the count Kaz keys hint strength off.
  const hintsUsed = progress.labs[lab.slug]?.hintsUsed ?? {};
  const allHints = getChallengeHints(lab.slug);
  const revealedHints = Object.fromEntries(
    (chunks ?? [])
      .filter((entry) => entry.kind === "challenge")
      .map((entry) => [
        entry.id,
        allHints
          .slice(0, Math.min(hintsUsed[entry.id] ?? 0, allHints.length))
          .map((text, hintIndex) => ({ index: hintIndex, total: allHints.length, text })),
      ]),
  );

  /*
   * Same vocabulary the Labs rows use — Completed / Current / Preview — rather
   * than the raw `LabStatus`. A learner clicking through from a row marked
   * "Current" should not arrive at a page calling the same lab "not started".
   */
  const stateLabel =
    effectiveStatus === "completed" ? "Completed" : isCurrent ? "Current" : "Preview";

  return (
    <div data-workspace="lesson" className="flex flex-col gap-8">
      <header className="lesson-lab-header flex flex-col gap-2">
        <p className="text-sm text-ink-muted">
          Lab {lab.number} of {LABS.length} · {lab.group}
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{lab.title}</h1>
        <p className="sr-only">{lab.description}</p>
        <p className="text-sm text-ink-muted">Status: {stateLabel}</p>
      </header>

      {isFuture && prerequisite ? (
        <p className="text-ink-soft">
          Complete Lab {prerequisite.number} — {prerequisite.title} first.
        </p>
      ) : chunks && chunks.length > 0 ? (
        <FocusMode
          chunks={chunks}
          initialChunkId={progress.labs[lab.slug]?.currentChunkId ?? null}
          labSlug={lab.slug}
          completion={completion}
          webhookHost={webhookHost}
          revealedHints={revealedHints}
          kaz={kaz}
        />
      ) : (
        <p className="text-ink-soft">This lesson is not available yet.</p>
      )}
    </div>
  );
}
