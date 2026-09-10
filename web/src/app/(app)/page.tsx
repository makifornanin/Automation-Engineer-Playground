import Link from "next/link";
import { KazOrb } from "@/components/kaz/KazOrb";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { getSession } from "@/lib/session/get-session";
import { sessionDisplayName } from "@/lib/session/types";

/**
 * Home stays intentionally minimal (Vision §10). Slots only: greeting,
 * Continue Learning, Your Journey, a note from Kaz, and a Notes shortcut.
 * No stat cards, analytics, goals, activity feed or quick-action panel.
 *
 * Everything here is static. There is no progress data source until Phase 12,
 * so the journey strip shows the notation rather than inventing progress.
 */
const LAB_NUMBERS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];

export default async function HomePage() {
  const session = await getSession();
  const name = sessionDisplayName(session);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Welcome back, {name}.
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Continue learning
        </h2>
        <GlassSurface className="p-5">
          <p className="text-ink-soft">
            Your current lab and a Continue action appear here once the learning
            engine is connected.
          </p>
        </GlassSurface>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          Your journey
        </h2>
        <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
          {LAB_NUMBERS.map((lab) => (
            <li key={lab} className="tabular-nums">
              {lab} <span aria-hidden>○</span>
              {/* The glyph is decorative, so the status is spelled out for
                  assistive tech instead of being lost. */}
              <span className="sr-only">not started</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-muted">
          {/* The legend explains the glyphs to sighted readers. Screen readers
              already hear each item's status, so the glyphs are hidden. */}
          <span aria-hidden>✓ completed · ● in progress · ○ not started.</span>{" "}
          Progress appears here once lessons are connected.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
          A note from Kaz
        </h2>
        <div className="flex items-center gap-4">
          <KazOrb className="size-14" />
          <p className="text-ink-soft">
            Still just a shell for now. Build the foundation properly and the
            rest gets easier.
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
