/**
 * The Capstone: the AI Service Request Agent.
 *
 * Pure data, sourced from ROADMAP Phase 9 and FEATURES 26. The repository's
 * capstone/ directory holds no workflow exports — the four-workflow runtime
 * exists only inside n8n — so nothing here is read from disk, and nothing here
 * claims to check a learner's Capstone for them.
 *
 * Every requirement names the lab that taught it. That mapping is the point:
 * the Capstone is not a new subject, it is ten skills the learner already has,
 * forced to work together in one system.
 */

export interface CapstoneRequirement {
  capability: string;
  /** Two-digit lab number that taught it. */
  fromLab: string;
}

export interface CapstoneScenario {
  name: string;
  proves: string;
}

export const CAPSTONE_FLOW = [
  "Incoming service request",
  "   |",
  "Validate + normalise          (Lab 04)",
  "   |",
  "Duplicate check               (Lab 07)",
  "   |",
  "AI classification, structured (Lab 09)",
  "   |",
  "Guardrails + confidence       (Lab 10)",
  "   |              \\",
  "Automatic action   Human review",
  "   |",
  "External API call",
  "   |           \\",
  "Success -> log  Failure -> retry with backoff (Lab 06)",
  "                   |",
  "                Retries exhausted -> dead letter queue (Lab 08)",
].join("\n");

export const CAPSTONE_FLOW_ALT =
  "A service request is validated and normalised, checked for duplicates, classified by AI into structured output, and passed through guardrails. Safe, confident actions run automatically; everything else goes to human review. The external API call is retried with backoff on temporary failure, and anything still failing is sent to the dead letter queue.";

export const CAPSTONE_REQUIREMENTS: readonly CapstoneRequirement[] = [
  { capability: "Receive a service request through a webhook", fromLab: "03" },
  { capability: "Validate and normalise the incoming data, rejecting what does not qualify", fromLab: "04" },
  { capability: "Prevent the same request being processed twice", fromLab: "07" },
  { capability: "Classify the request with AI into structured, validated output", fromLab: "09" },
  { capability: "Route on the classification only after validation", fromLab: "02" },
  { capability: "Allow safe, confident actions to run automatically and hold the rest for a human", fromLab: "10" },
  { capability: "Retry temporary failures of the external call with exponential backoff", fromLab: "06" },
  { capability: "Send unrecoverable failures to a dead letter queue, and allow them to be replayed", fromLab: "08" },
  { capability: "Shape every payload into exactly what the next system expects", fromLab: "01" },
];

/**
 * What the learner must prove, from the verified paths recorded in ROADMAP
 * Phase 9. Each is a separate run with a separate expected outcome — a single
 * happy-path execution proves almost none of them.
 */
export const CAPSTONE_SCENARIOS: readonly CapstoneScenario[] = [
  { name: "A valid, safe request", proves: "the whole pipeline runs end to end and acts automatically" },
  { name: "An invalid request", proves: "bad input is refused at the door, before AI or any action" },
  { name: "The same request twice", proves: "the second delivery performs no second business action" },
  { name: "A restricted action", proves: "a confident AI recommendation is still held for a human" },
  { name: "A human approval, then a rejection", proves: "only approved work executes, and each decision is recorded" },
  { name: "Deciding the same request twice", proves: "an already-decided request cannot be decided again" },
  { name: "A temporary external failure", proves: "the call recovers through retries without resubmission" },
  { name: "A permanent external failure", proves: "the request lands in the dead letter queue instead of vanishing" },
  { name: "Replaying a dead-lettered request", proves: "failed work can be recovered once the cause is fixed" },
];
