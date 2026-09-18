"use client";

import { useEffect, useSyncExternalStore } from "react";

export type InviteLanding = "accepted" | "failed" | "none";

/**
 * Reads what Supabase put after `#` when an invite link sent the learner here.
 * Accepting an invite confirms the account and appends a session to the URL;
 * a used or expired link appends an error instead.
 */
export function readInviteLanding(hash: string): InviteLanding {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  if (params.has("error") || params.has("error_code")) return "failed";
  if (params.get("type") === "invite" && params.has("access_token")) return "accepted";
  return "none";
}

function hasAuthFragment(hash: string): boolean {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return ["access_token", "refresh_token", "error", "error_code"].some((key) => params.has(key));
}

/**
 * Where the landing is remembered between the effect that finds it and the
 * render that shows it.
 *
 * The fragment cannot be read during render: the server never sees it, so
 * rendering from it would be a hydration mismatch. It cannot simply be read
 * after mount either, because the effect below removes it from the URL —
 * whichever ran second would find nothing. So the effect records what it found
 * on this history entry before cleaning the URL, then tells React to read
 * again.
 *
 * The history entry, rather than a module variable, is what makes this belong
 * to this visit: React's development Strict Mode mounts twice and must still
 * show the message, while arriving at /sign-in again later must not.
 *
 * Existing state is spread through, because the App Router keeps its own keys
 * there and replacing it wholesale would break navigation.
 */
const STATE_KEY = "aepInviteLanding";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function recordedLanding(): InviteLanding {
  const recorded = (window.history.state as Record<string, unknown> | null)?.[STATE_KEY];
  return recorded === "accepted" || recorded === "failed" ? recorded : "none";
}

const MESSAGE: Record<Exclude<InviteLanding, "none">, string> = {
  accepted: "Invite accepted. Enter your email below and we will send your code.",
  failed:
    "That invite link has expired or was already used. If you accepted it before, sign in below; otherwise ask for a new invite.",
};

/**
 * AEP signs in with a code, not a link (Vision §8), so the session an invite
 * link carries is not used. It is removed from the address bar straight away,
 * so it does not sit in history, and the learner is told what to do next.
 */
export function InviteLinkNotice() {
  const landing = useSyncExternalStore(
    subscribe,
    recordedLanding,
    () => "none" as InviteLanding,
  );

  useEffect(() => {
    const current = window.location.hash;
    if (!hasAuthFragment(current)) return;

    window.history.replaceState(
      { ...window.history.state, [STATE_KEY]: readInviteLanding(current) },
      "",
      window.location.pathname + window.location.search,
    );
    for (const listener of [...listeners]) listener();
  }, []);

  if (landing === "none") return null;
  return (
    <p role="status" className="mt-4 text-sm text-ink">
      {MESSAGE[landing]}
    </p>
  );
}
