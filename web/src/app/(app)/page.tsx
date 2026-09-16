import Link from "next/link";
import { ContinueLearningCard } from "@/components/home/ContinueLearningCard";
import { JourneyStrip } from "@/components/home/JourneyStrip";
import { KazOrb } from "@/components/kaz/KazOrb";
import { homeNote } from "@/lib/kaz/notes";
import { getLessonChunks } from "@/lib/lesson/registry";
import { deriveCourseState, labCompletionPercent } from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";
import { getSession } from "@/lib/session/get-session";
import { sessionDisplayName } from "@/lib/session/types";

/**
 * Home stays intentionally minimal (Vision §10). Slots only: greeting,
 * Continue Learning, Your Journey, a note from Kaz, and a Notes shortcut.
 * No stat cards, analytics, goals, activity feed or quick-action panel.
 *
 * `getCourseProgress()` reads the learner's own rows under RLS. When learner
 * state is unavailable it falls back to Lab 01 in progress with nothing saved,
 * so Home still shows a real derivation rather than inventing progress.
 */
export default async function HomePage() {
  const session = await getSession();
  const name = sessionDisplayName(session);

  const progress = await getCourseProgress();
  const { currentLab, labs, capstone } = deriveCourseState(progress);

  // Vision §16 asks for a completion percentage. It is shown only once the
  // learner has actually earned something: a permanent "0%" on a first-time
  // learner's Home is less useful than the position it would replace.
  // Kaz speaks from real progress, not a fixed greeting (Kaz §4).
  const kazNote = homeNote(progress.completedLabSlugs, currentLab.lab);

  const currentChunks = getLessonChunks(currentLab.lab.slug);
  const percent = currentChunks
    ? labCompletionPercent(currentChunks, progress.labs[currentLab.lab.slug]?.evidence ?? {})
    : null;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Welcome back, {name}.
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Continue learning
        </h2>
        <ContinueLearningCard lab={currentLab.lab} percent={percent} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Your journey
        </h2>
        <JourneyStrip labs={labs} capstoneStatus={capstone.status} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          A note from Kaz
        </h2>
        <div className="flex items-center gap-4">
          <KazOrb className="size-14" state={kazNote.state} />
          <p className="text-ink-soft">{kazNote.text}</p>
        </div>
      </section>

      <section>
        <Link
          href="/notes"
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Open your notes
        </Link>
      </section>
    </div>
  );
}
