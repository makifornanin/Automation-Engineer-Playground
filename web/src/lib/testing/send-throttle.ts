import "server-only";

/**
 * A minimum gap between Send Tests from one learner to one lab.
 *
 * This is what stops AEP being a trivial request amplifier aimed at a third
 * party: whatever URL a learner saves, AEP will not hit it faster than this.
 *
 * In-memory, and therefore per server instance. On a single Node process that
 * is exact; on serverless it is per warm instance, which still bounds a single
 * learner's burst. Deliberately not a table — a durable rate limiter would be
 * the observability infrastructure the directive rules out.
 */
export const SEND_MIN_INTERVAL_MS = 2_000;

const lastSend = new Map<string, number>();

/** Records the attempt and returns true when enough time has passed. */
export function allowSend(key: string, now: number): boolean {
  const previous = lastSend.get(key);
  if (previous !== undefined && now - previous < SEND_MIN_INTERVAL_MS) {
    return false;
  }
  lastSend.set(key, now);
  // Bounded: a long-running process should not accumulate a key per learner
  // per lab forever.
  if (lastSend.size > 5_000) {
    const oldest = lastSend.keys().next().value;
    if (oldest !== undefined) lastSend.delete(oldest);
  }
  return true;
}

export function resetSendThrottle(): void {
  lastSend.clear();
}
