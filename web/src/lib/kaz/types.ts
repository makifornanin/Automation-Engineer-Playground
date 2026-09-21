/**
 * Kaz V2's shared contract. Pure types and copy, no I/O: the panel is a client
 * component, so everything here is bundled for the browser and must never
 * carry a secret, an expected answer, or anything Kaz saw on the server.
 */

export type KazRole = "learner" | "kaz";

export interface KazMessage {
  /** Stable for React keys; the database id, or a local id for an optimistic turn. */
  id: string;
  role: KazRole;
  content: string;
  createdAt: string;
}

/**
 * The help ladder (Kaz V2 design §6). The level decides how much canonical
 * material may reach the model, so it is decided and stored server-side.
 */
export type HelpLevel = 1 | 2 | 3 | 4;

export const HELP_LEVEL_LABEL: Record<HelpLevel, string> = {
  1: "Nudge",
  2: "Hint",
  3: "Explain",
  4: "Show me",
};

/** What Kaz actually looked at for one answer. Shown honestly, never implied. */
export interface KazLooked {
  workflow: boolean;
  execution: boolean;
}

export type KazErrorCode =
  | "not_signed_in"
  | "locked"
  | "unknown_lab"
  | "empty"
  | "too_long"
  | "throttled"
  | "unavailable"
  | "model_error"
  | "store_unavailable";

export const KAZ_ERROR_MESSAGE: Record<KazErrorCode, string> = {
  not_signed_in: "Your session has expired. Sign in again and I will be right here.",
  locked: "This lab is still locked. Finish the lab before it and I will meet you there.",
  unknown_lab: "I cannot find that lab.",
  empty: "Type your question first.",
  too_long: "That is a lot at once. Trim it down and send it again.",
  throttled: "Give me a second to catch up.",
  unavailable: "Kaz can't reach the workshop right now.",
  model_error: "I hit a model error. Try that again.",
  store_unavailable: "I can answer, but I cannot save this conversation right now.",
};

export type KazAskState =
  | { status: "idle" }
  | {
      status: "answered";
      saved: boolean;
      question: KazMessage;
      answer: KazMessage;
      helpLevel: HelpLevel;
      looked: KazLooked;
    }
  | { status: "error"; code: KazErrorCode; message: string };

export const IDLE_KAZ_STATE: KazAskState = { status: "idle" };

export function buildKazError(code: KazErrorCode): KazAskState {
  return { status: "error", code, message: KAZ_ERROR_MESSAGE[code] };
}

/** What the panel may tell the learner about Kaz's view of their n8n. */
export type KazWorkflowVisibility =
  | { status: "linked"; host: string }
  | { status: "not_linked" }
  | { status: "no_webhook_lab" };

export const KAZ_VISIBILITY_MESSAGE: Record<KazWorkflowVisibility["status"], string> = {
  linked: "I can look at your saved workflow and its latest run.",
  not_linked:
    "I can help with the lesson and your test results, but I can't safely inspect your n8n workflow yet.",
  no_webhook_lab: "This lab runs on a Manual Trigger, so there is no workflow for me to call.",
};

/** The longest question Kaz accepts, and how much thread history she reads. */
export const MAX_QUESTION_LENGTH = 2_000;
export const THREAD_CONTEXT_TURNS = 8;
