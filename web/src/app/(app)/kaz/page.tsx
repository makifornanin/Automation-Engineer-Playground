import { KazOrb } from "@/components/kaz/KazOrb";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

/** One static orb. No chat, no AI, no teaching modes — those are Phase 14. */
export default function KazPage() {
  return (
    <PagePlaceholder
      title="Kaz"
      intro="Your AEP teacher. She explains why things work, not just which button to press."
    >
      <div className="flex flex-col items-start gap-6">
        <KazOrb />
        <p className="max-w-prose text-ink-muted">
          Kaz arrives in a later phase. For now this is her shape.
        </p>
      </div>
    </PagePlaceholder>
  );
}
