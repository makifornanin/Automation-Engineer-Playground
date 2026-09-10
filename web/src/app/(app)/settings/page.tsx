import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

/** Appearance works today. Everything else is shown honestly as later work. */
export default function SettingsPage() {
  return (
    <PagePlaceholder title="Settings">
      <div className="flex flex-col gap-10">
        <ThemeToggle />

        <section className="flex flex-col gap-2 border-t border-line pt-6">
          <h2 className="text-sm font-medium text-ink">Language</h2>
          <p className="max-w-prose text-ink-muted">
            English, Tagalog and Taglish arrive in a later phase.
          </p>
        </section>

        <section className="flex flex-col gap-2 border-t border-line pt-6">
          <h2 className="text-sm font-medium text-ink">n8n connection</h2>
          <p className="max-w-prose text-ink-muted">
            Optional and advanced. Connecting your own n8n instance arrives with
            the testing engine.
          </p>
        </section>
      </div>
    </PagePlaceholder>
  );
}
