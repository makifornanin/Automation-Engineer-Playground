import type { TeachingNote } from "@/lib/lesson/types";
import { CodeBlock } from "./ContentBlocks";

/**
 * CLAUDE.md's Guided Build Rule, rendered.
 *
 * The headings are fixed rather than authored per note, so every node in the
 * course is explained with the same three questions and every piece of code
 * with the same five. That consistency is the point: a learner should never
 * have to work out *which* kind of explanation they are being given.
 *
 * Rendered as a definition list because that is what this is — a term and its
 * explanation — and it gives assistive tech the pairing for free.
 */
function NoteBody({ note }: { note: TeachingNote }) {
  if (note.subject === "node") {
    return (
      <dl className="flex flex-col gap-2">
        <div>
          <dt className="text-sm font-medium text-ink">What it does</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.what}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">Why we&rsquo;re using it here</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.whyHere}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">Business reason</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.businessReason}</dd>
        </div>
        {note.analogy ? (
          <div>
            <dt className="text-sm font-medium text-ink">Think of it like</dt>
            <dd className="max-w-prose text-sm text-ink-soft">{note.analogy}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CodeBlock code={note.code} />
      <dl className="flex flex-col gap-2">
        <div>
          <dt className="text-sm font-medium text-ink">What it is trying to do</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.intent}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">The important inputs</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.inputs}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">The logic</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.logic}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">The output</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.output}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">Why the logic matters</dt>
          <dd className="max-w-prose text-sm text-ink-soft">{note.engineeringReason}</dd>
        </div>
      </dl>
    </div>
  );
}

export function TeachingNotes({ notes }: { notes: readonly TeachingNote[] }) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4">
      {notes.map((note) => (
        <section key={`${note.subject}-${note.name}`} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">
            {note.name}
          </h3>
          <NoteBody note={note} />
        </section>
      ))}
    </div>
  );
}
