import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

/**
 * Group headings only. Lab rows, progress and unlocking arrive in Phase 12,
 * and there is no lab data source yet. No difficulty badges — Vision §16 rules
 * out Beginner / Intermediate / Advanced labels anywhere in the product.
 */
const GROUPS = [
  {
    name: "Foundations",
    framing:
      "First, we make data move correctly. Fancy automation means nothing if the basics are shaky.",
  },
  {
    name: "Reliability",
    framing:
      "Now we make your workflows survive the real world. APIs fail. Events repeat. Systems get weird.",
  },
  {
    name: "AI Engineering",
    framing:
      "Time to let AI make recommendations without letting it run the company unsupervised.",
  },
  {
    name: "Capstone",
    framing: "Everything you have learned, in one system you build end to end.",
  },
];

export default function LabsPage() {
  return (
    <PagePlaceholder
      title="Labs"
      intro="The full journey, grouped so you can see how it builds. Lab content arrives with the learning engine."
    >
      <div className="flex flex-col gap-8">
        {GROUPS.map((group) => (
          <section key={group.name} className="flex flex-col gap-2 border-t border-line pt-6">
            <h2 className="text-lg font-medium text-ink">{group.name}</h2>
            <p className="max-w-prose text-ink-soft">{group.framing}</p>
          </section>
        ))}
      </div>
    </PagePlaceholder>
  );
}
