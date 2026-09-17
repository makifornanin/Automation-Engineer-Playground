import Link from "next/link";
import { KazOrb } from "@/components/kaz/KazOrb";
import { labHref } from "@/lib/course/catalog";
import { deriveCourseState } from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";
import { homeNote } from "@/lib/kaz/notes";

/**
 * Kaz's own page.
 *
 * Deliberately honest about what she can do today. Free-form questions need a
 * model behind them, and AEP has no model credential of its own — the labs call
 * Gemini through each learner's own n8n. Rendering a chat box that always
 * replies "I can't answer" would be worse than saying so plainly, and a Kaz who
 * invents answers is precisely what her design rules out (Kaz §14: she must not
 * invent evidence or claim things she cannot back).
 *
 * What she does do is listed concretely, so a learner knows where to find her
 * at the moments that matter.
 */
export default async function KazPage() {
  const progress = await getCourseProgress();
  const { currentLab, capstone } = deriveCourseState(progress);
  // Once every lab is complete, the next thing to continue is the Capstone.
  const capstoneUnlocked = capstone.status !== "locked";
  const note = homeNote(progress.completedLabSlugs, currentLab.lab);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Kaz</h1>
        <p className="max-w-prose text-ink-soft">
          Your AEP teacher. She explains why things work, not just which button to press.
        </p>
      </header>

      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <KazOrb state={note.state} />
        <p className="max-w-prose text-ink-soft">{note.text}</p>
      </div>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-lg font-medium text-ink">Where you will find me</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ink-muted">
          <li className="max-w-prose text-ink-soft">
            <span className="font-medium text-ink">In every challenge.</span> Stuck? Ask for a
            hint and I will give you one — the symptom first, then the data, then the idea
            behind it. Never the answer.
          </li>
          <li className="max-w-prose text-ink-soft">
            <span className="font-medium text-ink">When you break things on purpose.</span> I
            have opinions about that.
          </li>
          <li className="max-w-prose text-ink-soft">
            <span className="font-medium text-ink">On Home.</span> A short note about where you
            actually are, not generic encouragement.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="text-lg font-medium text-ink">What I cannot do yet</h2>
        <p className="max-w-prose text-ink-soft">
          I cannot answer free-form questions yet. When I can, I will know which lab you are in
          and what your last test showed — and I still will not hand you a challenge answer.
        </p>
        <p className="max-w-prose text-ink-muted">
          Until then, the lesson itself has the explanation, and your notes are the best place
          to keep what you figure out.
        </p>
      </section>

      <div className="flex flex-wrap gap-6">
        <Link
          href={capstoneUnlocked ? "/capstone" : labHref(currentLab.lab)}
          aria-label={
            capstoneUnlocked
              ? "Continue to the Capstone"
              : "Continue Lab " + currentLab.lab.number + " — " + currentLab.lab.title
          }
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Continue
        </Link>
        <Link
          href="/notes"
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Open your notes
        </Link>
      </div>
    </div>
  );
}
