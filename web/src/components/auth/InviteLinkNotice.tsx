"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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

const noSubscription = () => () => {};

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
  const hash = useSyncExternalStore(noSubscription, () => window.location.hash, () => "");
  const [landing, setLanding] = useState<InviteLanding>("none");

  // Kept once seen: clearing the fragment below must not hide the message.
  const parsed = readInviteLanding(hash);
  if (parsed !== "none" && parsed !== landing) {
    setLanding(parsed);
  }

  useEffect(() => {
    if (hasAuthFragment(window.location.hash)) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [hash]);

  if (landing === "none") return null;
  return (
    <p role="status" className="mt-4 text-sm text-ink">
      {MESSAGE[landing]}
    </p>
  );
}
