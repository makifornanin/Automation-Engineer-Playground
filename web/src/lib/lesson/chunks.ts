/**
 * Lesson content for Focus Mode.
 *
 * Typed here rather than parsed from a lab's README on disk at runtime, for
 * two reasons that are both real:
 *
 * 1. A `- **Difficulty:** Beginner` line sits directly under each lab's H1,
 *    immediately above the Hook the Problem chunk draws from. Vision §16
 *    forbids surfacing difficulty anywhere in the product, and a parser is one
 *    careless selector away from lifting it.
 * 2. Reading files chosen by a URL slug would re-create the path-traversal
 *    surface `/labs/[slug]` was deliberately built to avoid.
 *
 * The copy is condensed from the lab's own README — the owner's voice — not
 * authored fresh.
 */

export interface LessonChunk {
  /** Stable id, used for React keys and to wire the heading to its section. */
  id: string;
  title: string;
  /** Plain paragraphs. No markdown renderer, and therefore no new dependency. */
  body: readonly string[];
}

/**
 * Lab 01 — Data Mapping & Transformation.
 *
 * Problem: `## The Hook` + `## The Business Problem`.
 * Concept: `## 2. Simple Explanation`, which the README already structures as
 * what it is / what problem it solves / how it helps a real business — the
 * three questions CLAUDE.md's Learning Rule requires.
 */
const LAB_01_CHUNKS: readonly LessonChunk[] = [
  {
    id: "problem",
    title: "The problem",
    body: [
      "A lead form sends you first_name, last_name and email_address. Your CRM wants name and email.",
      "Nobody is wrong. They just disagree — and until something translates between them, that lead sits in the gap doing nothing for anybody.",
      "Businesses run on connected apps: a form, a CRM, a database, an email platform, a payment system. Each one names things its own way.",
      "When the shapes don't match, someone ends up copying fields by hand — or worse, the integration \"works\" and quietly stores rubbish. Data mapping is the unglamorous work that stops both.",
    ],
  },
  {
    id: "concept",
    title: "The concept",
    body: [
      "What is it? Data mapping means taking information from one system and matching it to the fields another system expects. Data transformation means changing or cleaning that data before sending it on.",
      "What problem does it solve? Different apps use different field names and formats. A lead form may send first_name, last_name and email_address where a CRM expects name and email. Without mapping and transformation, integrations fail or store messy data.",
      "How does this help a real business? Businesses connect forms, CRMs, databases, email platforms and payment systems. Mapping is what moves information between them correctly, without anyone cleaning up by hand afterwards.",
    ],
  },
];

/**
 * Lesson chunks by lab slug. Only Lab 01 has content today; every other lab
 * returns `null` and its page keeps the honest placeholder rather than
 * pretending a lesson exists.
 */
const LESSONS: Readonly<Record<string, readonly LessonChunk[]>> = {
  "01-data-mapping-transformation": LAB_01_CHUNKS,
};

export function getLessonChunks(slug: string): readonly LessonChunk[] | null {
  return LESSONS[slug] ?? null;
}
