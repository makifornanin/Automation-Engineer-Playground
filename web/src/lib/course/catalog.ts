/**
 * Static course catalog — the ten labs plus the Capstone.
 *
 * Pure data: this file imports nothing from `app/` or `components/`, so both
 * server pages and presentational components can read it without pulling in
 * React or Next.
 */

export type LabGroup = "Foundations" | "Reliability" | "AI Engineering";

export interface Lab {
  /** Two-digit display number, e.g. "01". */
  number: string;
  /** On-disk folder name under `labs/`, e.g. "01-data-mapping-transformation". */
  slug: string;
  /** Verbatim H1 title from the lab's README. */
  title: string;
  group: LabGroup;
  /**
   * One short sentence, condensed from the lab README's own "The Hook"
   * section — the owner's learner-facing framing, not invented product
   * copy. Never a difficulty label (Vision §16).
   */
  description: string;
}

export const LABS: readonly Lab[] = [
  {
    number: "01",
    slug: "01-data-mapping-transformation",
    title: "Data Mapping & Transformation",
    group: "Foundations",
    description:
      "A lead form sends first_name and email_address; your CRM wants name and email — you build the translator.",
  },
  {
    number: "02",
    slug: "02-conditions-routing",
    title: "Conditions & Routing",
    group: "Foundations",
    description:
      "A $5,000 prospect and a tyre kicker hit your workflow at the same time, and it treats them identically.",
  },
  {
    number: "03",
    slug: "03-apis-webhooks",
    title: "APIs & Webhooks",
    group: "Foundations",
    description:
      "Your automation has only ever talked to itself — now it answers a live webhook from the outside world.",
  },
  {
    number: "04",
    slug: "04-validation-normalization",
    title: "Validation & Normalization",
    group: "Foundations",
    description:
      "A lead arrives with no name, a broken email, and a three-digit phone number, and your workflow saves it anyway.",
  },
  {
    number: "05",
    slug: "05-pagination-large-data",
    title: "Pagination & Large Data Processing",
    group: "Reliability",
    description:
      "The customers API hands back five tidy records and calls it done — even though 208 customers exist.",
  },
  {
    number: "06",
    slug: "06-retry-exponential-backoff",
    title: "Retry Logic & Exponential Backoff",
    group: "Reliability",
    description:
      "A payment API has one bad afternoon and returns a 503, so your workflow gives up two seconds too early.",
  },
  {
    number: "07",
    slug: "07-idempotency-duplicate-protection",
    title: "Idempotency & Duplicate Protection",
    group: "Reliability",
    description:
      "A retried webhook delivers the same new-lead event twice, and your workflow processes it twice.",
  },
  {
    number: "08",
    slug: "08-dead-letter-queue-failure-recovery",
    title: "Dead Letter Queue & Failure Recovery",
    group: "Reliability",
    description:
      "Three retries fail, the service is not coming back this afternoon, and the customer's order quietly disappears.",
  },
  {
    number: "09",
    slug: "09-structured-ai-output",
    title: "Structured AI Output",
    group: "AI Engineering",
    description:
      "Your AI classifier answers with text that only looks like JSON, and a paying customer vanishes into the void.",
  },
  {
    number: "10",
    slug: "10-ai-guardrails-human-in-the-loop",
    title: "AI Guardrails & Human-in-the-Loop",
    group: "AI Engineering",
    description:
      "Your AI is completely right that the customer wants to cancel — which is exactly why it should not act alone.",
  },
];

/**
 * The Capstone is a separate constant, not an eleventh `LABS` entry: it has
 * no lab number, and a nullable `number` field on `Lab` would be abstraction
 * tax paid by every lab for the sake of one item.
 */
export const CAPSTONE = {
  title: "AI Service Request Agent",
  description:
    "Validation, retries, idempotency and AI guardrails combine into one AI Service Request Agent that runs for real.",
} as const;

/**
 * The Capstone's key in the learner progress tables. It follows the lab slug
 * shape the schema's CHECK constraint requires, so Capstone progress and
 * evidence reuse the same rows, policies and writers as every lab.
 */
export const CAPSTONE_SLUG = "11-capstone";

/**
 * Where a lab's Continue/Preview action points.
 */
export function labHref(lab: Lab): string {
  return `/labs/${lab.slug}`;
}
