import "server-only";

import { lookup as dnsLookup } from "node:dns/promises";
import type { JsonValue } from "./types";
import { isBlockedAddress } from "./url-guard";

/**
 * Posts a lab's test payload to the learner's own n8n webhook and reads what
 * comes back. This is the only code in AEP that makes a request to an address
 * a learner chose, so every control here is load-bearing.
 *
 * The URL has already passed `validateLearnerWebhookUrl`. That is the
 * syntactic half; this is the half that sees the network:
 *
 * 1. Resolve the hostname and refuse if ANY address is private, loopback,
 *    link-local or otherwise not public. A public-looking name can point at
 *    10.0.0.1, and string checks cannot see that.
 * 2. `redirect: "manual"`, and any 3xx is a failure. A 302 to
 *    http://169.254.169.254 would otherwise walk straight past every check.
 * 3. A hard timeout, so a workflow that never answers cannot hold a request
 *    open indefinitely.
 * 4. The response is read up to a fixed cap and then abandoned.
 * 5. Exactly two outbound headers. No cookie, no authorization, no AEP secret,
 *    no learner session — nothing that would be worth relaying.
 *
 * Accepted residual risk: DNS rebinding between step 1 and the connection.
 * See url-guard.ts.
 */

/**
 * Generous because Labs 09 and 10 call Gemini before responding. Longer than
 * the Architect's 10s for that reason and no other.
 */
export const SEND_TIMEOUT_MS = 15_000;
export const MAX_RESPONSE_BYTES = 65_536;
export const SEND_USER_AGENT = "AEP-SendTest/1";

export type DeliveryFailure = "blocked_address" | "unreachable" | "timeout" | "redirected";

export type Delivery =
  | { ok: true; status: number; text: string; truncated: boolean; durationMs: number }
  | { ok: false; failure: DeliveryFailure; durationMs: number };

export interface DeliveryDeps {
  lookup: (hostname: string) => Promise<readonly { address: string }[]>;
  fetch: typeof fetch;
  now: () => number;
}

const defaultDeps: DeliveryDeps = {
  lookup: (hostname) => dnsLookup(hostname, { all: true, verbatim: true }),
  fetch: (input, init) => fetch(input, init),
  now: () => Date.now(),
};

/**
 * Identifies a timeout by the error's `name`, read structurally.
 *
 * Not `instanceof Error`: the timeout arrives as a DOMException, which is not
 * reliably an Error instance across realms, so an instanceof check would
 * misreport a timeout as "unreachable" and send the learner looking for a
 * network problem that is really a slow workflow.
 */
function isTimeout(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("name" in error)) return false;
  const name = String((error as { name: unknown }).name);
  return name === "TimeoutError" || name === "AbortError";
}

/** undici sometimes wraps the underlying failure as `cause`. */
function causeOf(error: unknown): unknown {
  return typeof error === "object" && error !== null && "cause" in error
    ? (error as { cause: unknown }).cause
    : undefined;
}

async function readCapped(
  response: Response,
): Promise<{ text: string; truncated: boolean }> {
  if (!response.body) return { text: "", truncated: false };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = MAX_RESPONSE_BYTES - total;
    if (value.byteLength > room) {
      chunks.push(value.subarray(0, room));
      total += room;
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(joined), truncated };
}

export async function deliverPayload(
  url: URL,
  payload: JsonValue,
  deps: DeliveryDeps = defaultDeps,
): Promise<Delivery> {
  const started = deps.now();
  const elapsed = () => deps.now() - started;

  let addresses: readonly { address: string }[];
  try {
    addresses = await deps.lookup(url.hostname);
  } catch {
    return { ok: false, failure: "unreachable", durationMs: elapsed() };
  }

  // Every address, not just the first: a name with one public and one private
  // record is exactly how a check that inspects only one gets bypassed.
  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    return { ok: false, failure: "blocked_address", durationMs: elapsed() };
  }

  let response: Response;
  try {
    response = await deps.fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": SEND_USER_AGENT },
      body: JSON.stringify(payload),
      redirect: "manual",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = isTimeout(error) || isTimeout(causeOf(error));
    return { ok: false, failure: timedOut ? "timeout" : "unreachable", durationMs: elapsed() };
  }

  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel().catch(() => {});
    return { ok: false, failure: "redirected", durationMs: elapsed() };
  }

  // The timeout covers the body too: a workflow can send headers and then stall.
  try {
    const { text, truncated } = await readCapped(response);
    return { ok: true, status: response.status, text, truncated, durationMs: elapsed() };
  } catch (error) {
    const timedOut = isTimeout(error) || isTimeout(causeOf(error));
    return { ok: false, failure: timedOut ? "timeout" : "unreachable", durationMs: elapsed() };
  }
}
