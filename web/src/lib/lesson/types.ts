/**
 * The lesson content contract.
 *
 * Pure types and data. This module is reachable from `FocusMode`, which is a
 * client component, so everything here is client-bundled. That is the real
 * reason lesson content must never import anything server-side, and why every
 * field below must be JSON-serialisable — no functions, no `Date`, no class
 * instances, no symbols. It is a build constraint, not a style preference.
 *
 * Shape: a discriminated union on `kind` for teaching semantics, carrying a
 * shared `content` array of reusable primitives. `kind` is independently
 * required for the section roadmap (Vision §18) and for deriving milestones,
 * and a flat block array could not express that a Guided Build *must* have
 * actions. A bespoke-fields-per-kind union was rejected because nearly every
 * kind needs prose, code, callouts and diagrams, which would be duplicated
 * across nine arms.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type CodeLanguage = "json" | "javascript" | "sql" | "text";
export type CalloutTone = "note" | "warning" | "gotcha";

/**
 * One step the learner performs. `code` is the exact value to enter; `expect`
 * is what they should see afterwards, which is what turns an instruction into
 * something checkable.
 */
export interface LessonAction {
  text: string;
  code?: { language: CodeLanguage; code: string };
  expect?: string;
}

/**
 * The only renderable leaf types in V1. Adding a member breaks exactly one
 * exhaustive switch at a named line, which is the desired failure.
 *
 * Deliberately no `image`: no screenshot assets exist in this repository, and
 * a member nothing renders is a shape nobody has tested.
 */
export type ContentBlock =
  | { type: "prose"; text: string }
  | { type: "callout"; tone: CalloutTone; title?: string; text: string }
  | { type: "code"; language: CodeLanguage; code: string; caption?: string }
  | { type: "diagram"; ascii: string; alt: string }
  | { type: "actions"; items: readonly LessonAction[] };

/**
 * CLAUDE.md's Guided Build Rule carried as structured data rather than prose,
 * so the renderer emits consistent headings and Kaz can consume the same
 * fields later. The `node` arm is What / Why here / Business reason verbatim
 * (plus Vision §4's optional analogy); the `code` arm is intent / inputs /
 * logic / output / engineering reason verbatim.
 *
 * A test asserts every field is non-empty. That is what makes "never teach
 * code as just paste this" mechanically enforced rather than aspirational.
 */
export type TeachingNote =
  | {
      subject: "node";
      name: string;
      what: string;
      whyHere: string;
      businessReason: string;
      analogy?: string;
    }
  | {
      subject: "code";
      name: string;
      language: CodeLanguage;
      code: string;
      intent: string;
      inputs: string;
      logic: string;
      output: string;
      engineeringReason: string;
    };

/**
 * Nine kinds, not Vision §17's eleven rhythm steps. §17 states the steps "do
 * not need to map one-to-one to separate screens": "Understand Result" is the
 * result region of a `test` chunk, and "Make It Your Own" is authored as a
 * `challenge` with no evaluator. Recorded rather than silently collapsed.
 */
export type LessonChunkKind =
  | "problem"
  | "concept"
  | "guided-build"
  | "predict"
  | "test"
  | "break-it"
  | "debug"
  | "challenge"
  | "recap";

interface LessonChunkBase {
  /** Stable id: React keys, `aria` wiring, and the persisted chunk position. */
  id: string;
  title: string;
  content: readonly ContentBlock[];
  teaches?: readonly TeachingNote[];
}

/**
 * Vision §19's four named slots. Named fields rather than one blocks array
 * because §19's structure *is* the pedagogy: a blocks array cannot guarantee
 * the parts exist, cannot label them, and lets an author silently drop "Why
 * we're doing this" — the one part that stops a build chunk becoming
 * copy-paste.
 */
export interface GuidedBuildChunk extends LessonChunkBase {
  kind: "guided-build";
  whyThisMatters: readonly ContentBlock[];
  /** Only when it makes the relationship clearer (Vision §19, §20). */
  visual?: ContentBlock;
  /** "Your turn" — 2–4 actions, asserted by test rather than by the type. */
  actions: readonly LessonAction[];
  whyWereDoingThis: readonly ContentBlock[];
}

export interface PredictChunk extends LessonChunkBase {
  kind: "predict";
  prompt: string;
  reveal: readonly ContentBlock[];
}

/**
 * Send Test metadata with no server import: the chunk carries a string id and
 * nothing else. The evaluator is looked up from a `server-only` registry keyed
 * by that id, so content stays serialisable and the client bundle never sees
 * an evaluator, an expected output, or a checkpoint predicate.
 *
 * `mode` distinguishes the two real cases in this course. Labs 01, 02, 05 and
 * 06 run on a Manual Trigger and have no webhook at all, so their test is a
 * self-check against an expected output; Labs 03, 04, 07–10 start with a
 * Webhook node and can take a real request.
 */
export interface TestChunk extends LessonChunkBase {
  kind: "test";
  testCaseId: string;
  caseName: string;
  mode: "send-test" | "self-check";
  /** Present only for `send-test`; the payload AEP posts to the learner. */
  payload?: JsonValue;
  /**
   * The business outcome that counts as a pass, in plain words. This is not a
   * predicate and reveals no expected values — those stay in the server-only
   * case — it is what the learner is trying to make happen.
   */
  expected?: string;
  /**
   * How many times Send Test delivers the payload; the last response is the
   * one judged. Lab 07 needs two, because only a repeat proves duplicate
   * protection. Capped server-side.
   */
  deliveries?: number;
}

/**
 * `hints` is deliberately absent. Hints are fetched one at a time by a server
 * action that increments `hints_used`. Serialising them into the initial
 * payload would put every challenge answer in devtools and make Kaz's
 * progressive-hint guardrail decorative.
 */
export interface ChallengeChunk extends LessonChunkBase {
  kind: "challenge";
  hintCount: number;
  verification?: readonly string[];
  /**
   * Optional self-check, so a challenge can earn real `verified` evidence
   * rather than the learner's word for it (FEATURES 16 — "provide a way to
   * verify the final result").
   *
   * Without this a challenge could never be completed, because `verified` is
   * only ever granted by an evaluator — which would leave any lab containing
   * one permanently incomplete and the next lab permanently locked.
   */
  testCaseId?: string;
  caseName?: string;
}

export type LessonChunk =
  | (LessonChunkBase & { kind: "problem" })
  | (LessonChunkBase & { kind: "concept" })
  | (LessonChunkBase & { kind: "break-it" })
  | (LessonChunkBase & { kind: "debug" })
  | (LessonChunkBase & { kind: "recap"; bridge?: readonly ContentBlock[] })
  | GuidedBuildChunk
  | PredictChunk
  | TestChunk
  | ChallengeChunk;

/**
 * Exhaustiveness helper. A `switch` with a `return` in every case and this in
 * `default` makes an unhandled variant a compile error here, rather than a
 * silent fallthrough somewhere else.
 */
export function assertNeverBlock(value: never): never {
  throw new Error(`Unhandled lesson variant: ${JSON.stringify(value)}`);
}
