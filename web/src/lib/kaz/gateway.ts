import "server-only";

import type { CanonicalWorkflow } from "./canonical";
import type { KazLessonContext, KazProgressContext } from "./context";
import type { HelpLevel, KazLooked, KazMessage } from "./types";

/**
 * The only module that holds the Kaz Gateway credential, and the only one that
 * talks to it.
 *
 * The Gateway is privileged: it can read workflows and executions from the
 * owner's n8n. So the browser must never reach it, and the shared secret must
 * never leave the server. `server-only` makes an accidental client import a
 * build error, and the variable has no `NEXT_PUBLIC_` prefix, so Next cannot
 * inline it into a bundle.
 *
 * What AEP sends is already decided: the personality, the rules, the retrieved
 * lesson material, the canonical slice the help level permits, and — only when
 * the question needs it — a webhook path to resolve. The Gateway chooses
 * nothing about teaching policy; it reads n8n, sanitizes, calls Gemini, and
 * returns the answer.
 *
 * The learner's webhook URL never travels. `webhook-store.ts` is right that it
 * is a capability: AEP compares its host to the Gateway's own n8n host here and
 * sends the path alone.
 */

export const KAZ_GATEWAY_TIMEOUT_MS = 30_000;
export const MAX_GATEWAY_RESPONSE_BYTES = 32_768;
export const MAX_ANSWER_LENGTH = 4_000;

export interface KazGatewayRequest {
  persona: string;
  rules: string;
  levelInstruction: string;
  helpLevel: HelpLevel;
  question: string;
  history: readonly Pick<KazMessage, "role" | "content">[];
  lesson: KazLessonContext;
  progress: KazProgressContext;
  canonical: CanonicalWorkflow | null;
  inspect: {
    workflow: boolean;
    execution: boolean;
    /** Path only, never the full URL, and only when the host already matched. */
    webhookPath: string | null;
  };
}

export type KazGatewayResult =
  | { ok: true; answer: string; looked: KazLooked }
  | { ok: false; code: "unavailable" | "model_error" };

interface GatewayConfig {
  url: string;
  secret: string;
  n8nHost: string;
}

/**
 * Read as literal `process.env.X` member expressions, never a computed lookup:
 * the same rule `supabase/env.ts` follows, for the same reason.
 */
export function getGatewayConfig(): GatewayConfig | null {
  const url = process.env.KAZ_GATEWAY_URL;
  const secret = process.env.KAZ_GATEWAY_SECRET;
  const n8nHost = process.env.KAZ_N8N_HOST;
  if (!url || !secret || !n8nHost) return null;
  return { url, secret, n8nHost };
}

/**
 * The path of the learner's saved webhook, but only if it lives on the n8n the
 * Gateway can actually read. A learner running their own n8n elsewhere gets an
 * honest "I can't inspect that" instead of AEP asking the owner's instance
 * about a workflow that was never there.
 */
export function webhookPathForGateway(savedUrl: string | null): string | null {
  const config = getGatewayConfig();
  if (!savedUrl || !config) return null;
  try {
    const url = new URL(savedUrl);
    if (url.hostname.toLowerCase() !== config.n8nHost.toLowerCase()) return null;
    // "/webhook/aep-lab-03-lead" -> "aep-lab-03-lead"
    const path = url.pathname.replace(/^\/+(webhook-test|webhook)\/+/, "").replace(/^\/+|\/+$/g, "");
    return path.length > 0 && path.length <= 200 ? path : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Logs why a Kaz call failed, by code only: never the secret, path or answer. */
function warnGatewayFailure(reason: string): void {
  console.warn("kaz gateway call failed", { reason });
}

export async function callKazGateway(
  request: KazGatewayRequest,
  deps: { fetch?: typeof fetch } = {},
): Promise<KazGatewayResult> {
  const config = getGatewayConfig();
  if (!config) {
    warnGatewayFailure("not_configured");
    return { ok: false, code: "unavailable" };
  }

  const doFetch = deps.fetch ?? fetch;
  let response: Response;
  try {
    response = await doFetch(config.url, {
      method: "POST",
      // Redirects are a failure, not a destination: a privileged call must not
      // be walked somewhere else.
      redirect: "manual",
      signal: AbortSignal.timeout(KAZ_GATEWAY_TIMEOUT_MS),
      headers: {
        "content-type": "application/json",
        "x-aep-kaz-secret": config.secret,
      },
      body: JSON.stringify(request),
    });
  } catch {
    warnGatewayFailure("unreachable");
    return { ok: false, code: "unavailable" };
  }

  if (response.status >= 300 && response.status < 400) {
    warnGatewayFailure("redirected");
    return { ok: false, code: "unavailable" };
  }
  if (!response.ok) {
    warnGatewayFailure("http_" + String(response.status));
    return { ok: false, code: response.status >= 500 ? "model_error" : "unavailable" };
  }

  let text: string;
  try {
    text = (await response.text()).slice(0, MAX_GATEWAY_RESPONSE_BYTES);
  } catch {
    warnGatewayFailure("unreadable");
    return { ok: false, code: "unavailable" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    warnGatewayFailure("bad_json");
    return { ok: false, code: "model_error" };
  }

  if (!isRecord(parsed) || typeof parsed.answer !== "string" || parsed.answer.trim().length === 0) {
    warnGatewayFailure("no_answer");
    return { ok: false, code: "model_error" };
  }

  const looked = isRecord(parsed.looked) ? parsed.looked : {};
  return {
    ok: true,
    answer: parsed.answer.slice(0, MAX_ANSWER_LENGTH).trim(),
    looked: { workflow: looked.workflow === true, execution: looked.execution === true },
  };
}
