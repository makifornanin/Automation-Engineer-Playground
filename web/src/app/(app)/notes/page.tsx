import { NoteEditor } from "@/components/notes/NoteEditor";
import { LABS } from "@/lib/course/catalog";
import { deriveCourseState } from "@/lib/course/progress";
import { getCourseProgress } from "@/lib/course/progress-store";
import { listNotes } from "@/lib/notes/notes-store";

/**
 * The learning notebook (Vision §9).
 *
 * One general note plus one note per lab. Deliberately not a note manager:
 * there is no new-note button, no list to curate, no titles, no folders and no
 * search, because every one of those turns a notebook into the productivity
 * system CLAUDE.md rules out.
 *
 * Only labs the learner has actually written about are shown, plus the lab
 * they are currently on - so the page starts nearly empty and fills up as they
 * work, rather than presenting ten blank boxes on day one.
 */
export default async function NotesPage() {
  const [notes, progress] = await Promise.all([listNotes(), getCourseProgress()]);
  const { currentLab } = deriveCourseState(progress);

  const general = notes.find((note) => note.labSlug === null) ?? null;

  const labSections = LABS.map((lab) => ({
    lab,
    note: notes.find((note) => note.labSlug === lab.slug) ?? null,
  })).filter(({ lab, note }) => note !== null || lab.slug === currentLab.lab.slug);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Notes</h1>
        <p className="max-w-prose text-ink-soft">
          A learning notebook, not a task system. Concepts worth keeping, debugging
          observations, and snippets from your labs live here. Everything saves as you
          type.
        </p>
      </header>

      <NoteEditor
        label="General notes"
        labSlug={null}
        note={general}
        placeholder="Anything worth remembering that is not tied to one lab."
      />

      {labSections.map(({ lab, note }) => (
        <NoteEditor
          key={lab.slug}
          label={"Lab " + lab.number + " - " + lab.title}
          labSlug={lab.slug}
          note={note}
          placeholder="What surprised you, what broke, what you want to remember."
        />
      ))}
    </div>
  );
}
