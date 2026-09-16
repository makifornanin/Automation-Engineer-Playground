import Link from "next/link";
import { ContinueLearningCard } from "@/components/home/ContinueLearningCard";
import { JourneyStrip } from "@/components/home/JourneyStrip";
import { KazOrb } from "@/components/kaz/KazOrb";
import { deriveCourseState, getCourseProgress } from "@/lib/course/progress";
import { getSession } from "@/lib/session/get-session";
import { sessionDisplayName } from "@/lib/session/types";

/**
 * Home stays intentionally minimal (Vision §10). Slots only: greeting,
 * Continue Learning, Your Journey, a note from Kaz, and a Notes shortcut.
 * No stat cards, analytics, goals, activity feed or quick-action panel.
 *
 * `getCourseProgress()` is a stub returning empty progress until learner
 * state is persisted — the journey strip therefore shows the real derivation
 * of "everything not-started" rather than inventing progress.
 */
export default async function HomePage() {
  const session = await getSession();
  const name = sessionDisplayName(session);

  const progress = await getCourseProgress();
  const { currentLab, labs, capstone } = deriveCourseState(progress);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Welcome back, {name}.
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Continue learning
        </h2>
        <ContinueLearningCard lab={currentLab.lab} />
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
          <KazOrb className="size-14" />
          <p className="text-ink-soft">
            Ten labs, then the Capstone. I will be here the whole way through
            — start with Lab 01 whenever you are ready.
          </p>
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
