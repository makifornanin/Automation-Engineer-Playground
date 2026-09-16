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
}

export const LABS: readonly Lab[] = [
  {
    number: "01",
    slug: "01-data-mapping-transformation",
    title: "Data Mapping & Transformation",
    group: "Foundations",
  },
  {
    number: "02",
    slug: "02-conditions-routing",
    title: "Conditions & Routing",
    group: "Foundations",
  },
  {
    number: "03",
    slug: "03-apis-webhooks",
    title: "APIs & Webhooks",
    group: "Foundations",
  },
  {
    number: "04",
    slug: "04-validation-normalization",
    title: "Validation & Normalization",
    group: "Foundations",
  },
  {
    number: "05",
    slug: "05-pagination-large-data",
    title: "Pagination & Large Data Processing",
    group: "Reliability",
  },
  {
    number: "06",
    slug: "06-retry-exponential-backoff",
    title: "Retry Logic & Exponential Backoff",
    group: "Reliability",
  },
  {
    number: "07",
    slug: "07-idempotency-duplicate-protection",
    title: "Idempotency & Duplicate Protection",
    group: "Reliability",
  },
  {
    number: "08",
    slug: "08-dead-letter-queue-failure-recovery",
    title: "Dead Letter Queue & Failure Recovery",
    group: "Reliability",
  },
  {
    number: "09",
    slug: "09-structured-ai-output",
    title: "Structured AI Output",
    group: "AI Engineering",
  },
  {
    number: "10",
    slug: "10-ai-guardrails-human-in-the-loop",
    title: "AI Guardrails & Human-in-the-Loop",
    group: "AI Engineering",
  },
];

/**
 * The Capstone is a separate constant, not an eleventh `LABS` entry: it has
 * no lab number, and a nullable `number` field on `Lab` would be abstraction
 * tax paid by every lab for the sake of one item.
 */
export const CAPSTONE = {
  title: "AI Service Request Agent",
} as const;

/**
 * Where a lab's Continue/Preview action points. Every lab resolves to the
 * same Labs placeholder today — this single function is the seam a future
 * Aim Point flips to real per-lab routes, so no routing layer is needed yet.
 */
// The parameter is the seam: call sites already pass the lab, so Aim Point 2
// swaps this body for a per-lab route without touching a single caller. The
// `_`-prefix convention is not enabled in this ESLint config (it still warns),
// so the rule is silenced explicitly rather than left as standing noise.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- unused only until per-lab routes exist.
export function labHref(lab: Lab): string {
  return "/labs";
}
