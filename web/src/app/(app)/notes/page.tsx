import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

/** Notebook framing only. No editor and no persistence until Phase 12. */
export default function NotesPage() {
  return (
    <PagePlaceholder
      title="Notes"
      intro="A learning notebook, not a task system. Concepts worth keeping, debugging observations, and snippets from your labs live here."
    >
      <p className="max-w-prose text-ink-muted">
        Writing and saving notes arrives with the learning engine.
      </p>
    </PagePlaceholder>
  );
}
