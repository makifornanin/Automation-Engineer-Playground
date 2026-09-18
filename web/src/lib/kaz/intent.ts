/**
 * What this question needs Kaz to look at, decided before any call is made.
 *
 * Pure string heuristics on purpose: asking a model whether to call the model
 * costs a call. "What does idempotency mean?" needs nothing but the lesson;
 * "why did my test fail?" needs the last run; "check my workflow" needs both.
 * Getting it wrong is cheap — Kaz answers from the lesson instead — so this
 * stays a small readable list rather than a classifier.
 */

export interface KazInspection {
  workflow: boolean;
  execution: boolean;
}

const EXECUTION = [
  /\b(why|bakit).{0,40}\b(fail|failed|failing|error|red|broke|broken)\b/i,
  /\bmy (test|run|execution|workflow) (fail|failed|is failing|broke)\b/i,
  /\bwhat went wrong\b/i,
  /\blast (run|execution)\b/i,
  /\bnot working\b/i,
  /\bayaw gumana\b/i,
  /\bdi gumagana\b/i,
  /\bhindi gumagana\b/i,
  /\berror\b/i,
];

const WORKFLOW = [
  /\bcheck my (workflow|flow|automation|nodes?)\b/i,
  /\blook at my (workflow|flow|automation|nodes?|build)\b/i,
  /\btingnan mo\b/i,
  /\bpakicheck\b/i,
  /\bmy (workflow|node|expression|setup)\b/i,
  /\bwhat('?s| is) wrong with (my|the)\b/i,
  /\bcompare\b/i,
];

/** A question about an idea, not about this learner's build. */
const CONCEPT_ONLY = [
  /^\s*(what|ano)('?s| is| are)?\b.{0,60}\b(mean|meaning|ibig sabihin|definition)\b/i,
  /\bwhat does\b.{0,40}\bdo\b/i,
  /\bwhy do we\b/i,
  /\bexplain\b(?!.*\bmy\b)/i,
];

export function decideInspection(message: string, canInspect: boolean): KazInspection {
  if (!canInspect) return { workflow: false, execution: false };

  const wantsExecution = EXECUTION.some((pattern) => pattern.test(message));
  const wantsWorkflow = WORKFLOW.some((pattern) => pattern.test(message));

  // A plain concept question never triggers a lookup, even if it happens to
  // contain a word like "error".
  if (!wantsWorkflow && CONCEPT_ONLY.some((pattern) => pattern.test(message))) {
    return { workflow: false, execution: false };
  }

  return { workflow: wantsWorkflow, execution: wantsExecution || wantsWorkflow };
}

/**
 * "I'm stuck" on its own is a person, not a request for a database query.
 * Kaz answers first and offers to look, which is also what stops a frustrated
 * learner's third message in a row from costing three n8n round trips.
 */
const BARE_STUCK = /^\s*(i'?m |i am )?(stuck|lost|confused|tired|frustrated|nalilito|sumusuko)\b[\s.!?😭😩😔]*$/i;

export function isBareStuck(message: string): boolean {
  return BARE_STUCK.test(message);
}
