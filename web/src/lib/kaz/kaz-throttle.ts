import "server-only";

/**
 * What one learner may cost Kaz.
 *
 * Every accepted message is an n8n round trip and a Gemini call, so this is
 * the difference between a companion and a bill. In-memory and per instance,
 * exactly like `send-throttle.ts`: it bounds one learner's burst without
 * becoming the durable rate-limiting infrastructure AEP deliberately does not
 * run.
 */

export const KAZ_MIN_INTERVAL_MS = 3_000;
export const KAZ_MAX_PER_MINUTE = 12;

const recent = new Map<string, number[]>();

/** Records the attempt and returns whether it is allowed through. */
export function allowKazMessage(userId: string, now: number): boolean {
  const times = (recent.get(userId) ?? []).filter((time) => now - time < 60_000);

  const last = times[times.length - 1];
  if (last !== undefined && now - last < KAZ_MIN_INTERVAL_MS) {
    recent.set(userId, times);
    return false;
  }
  if (times.length >= KAZ_MAX_PER_MINUTE) {
    recent.set(userId, times);
    return false;
  }

  times.push(now);
  recent.set(userId, times);

  // Bounded, so a long-running process cannot accumulate a key per learner
  // forever.
  if (recent.size > 5_000) {
    const oldest = recent.keys().next().value;
    if (oldest !== undefined) recent.delete(oldest);
  }
  return true;
}

export function resetKazThrottle(): void {
  recent.clear();
}
