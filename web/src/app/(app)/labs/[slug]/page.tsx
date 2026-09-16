import { notFound } from "next/navigation";
import { FocusMode } from "@/components/lesson/FocusMode";
import { LABS } from "@/lib/course/catalog";
import { deriveCourseState, getCourseProgress, isLessonReadable } from "@/lib/course/progress";
import { getLessonChunks } from "@/lib/lesson/registry";

export interface LabPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * A lab's page: the overview header, then either its lesson in Focus Mode, a
 * prerequisite line, or an honest placeholder. Only Lab 01 has lesson content
 * today; the other nine keep the placeholder rather than pretending otherwise.
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

  /*
   * Same vocabulary the Labs rows use — Completed / Current / Preview — rather
   * than the raw `LabStatus`. A learner clicking through from a row marked
   * "Current" should not arrive at a page calling the same lab "not started".
   */
  const stateLabel =
    status === "completed" ? "Completed" : isCurrent ? "Current" : "Preview";

  // A lab is only ever shown as "future" when its lesson is not readable and
  // it has an earlier lab to point to. Lab 01 has no prerequisite, so it can
  // never claim one whatever its status.
  const readable = isLessonReadable(status, isCurrent);
  const isFuture = !readable && prerequisite !== null;

  // Only Lab 01 has lesson content today. Every other readable lab keeps the
  // honest placeholder rather than pretending a lesson exists.
  const chunks = readable ? getLessonChunks(lab.slug) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted">
          Lab {lab.number} of {LABS.length} · {lab.group}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{lab.title}</h1>
        <p className="max-w-prose text-ink-soft">{lab.description}</p>
        <p className="text-sm text-ink-muted">Status: {stateLabel}</p>
      </header>

      {isFuture && prerequisite ? (
        <p className="text-ink-soft">
          Complete Lab {prerequisite.number} — {prerequisite.title} first.
        </p>
      ) : chunks ? (
        <FocusMode chunks={chunks} />
      ) : (
        <p className="text-ink-soft">Lesson content arrives with Focus Mode.</p>
      )}
    </div>
  );
}
