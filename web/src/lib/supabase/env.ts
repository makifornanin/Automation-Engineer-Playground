/**
 * Supabase environment configuration.
 *
 * Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as
 * literal `process.env.X` member expressions, never a computed
 * `process.env[name]` lookup. Next.js inlines `NEXT_PUBLIC_*` values into the
 * browser bundle by static text substitution at build time; a computed
 * lookup still works in Node but silently yields `undefined` in the browser
 * bundle — a bug that only appears in production.
 *
 * Every other Supabase/session module imports this file; it imports nothing
 * project-local itself.
 */
export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

// Module-scope, not per-call: every server/middleware/browser path that fails
// safe to "anonymous" because config is missing funnels through here, and a
// per-request warning would flood the log without adding information after
// the first one.
let hasWarnedAboutMissingConfig = false;

/**
 * Logs once per process that Supabase is unconfigured. Deliberately names
 * only the *condition*, never a value: no URL, no key material (not even a
 * prefix or length), no cookie contents. Missing config is expected in local
 * development and must never throw or otherwise change caller behaviour —
 * this exists purely so silently-anonymous sessions are not a silent
 * debugging trap.
 */
function warnAboutMissingConfigOnce(): void {
  if (hasWarnedAboutMissingConfig) return;
  hasWarnedAboutMissingConfig = true;
  console.warn(
    "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); all sessions resolve as anonymous.",
  );
}

/**
 * Returns `null` — never throws — when either value is missing or an empty
 * string. `NEXT_PUBLIC_SUPABASE_URL=` with nothing after it is the most
 * common `.env` mistake, and must count as missing so every caller can fail
 * safe instead of crashing at import time.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    warnAboutMissingConfigOnce();
    return null;
  }

  return { url, publishableKey };
}
