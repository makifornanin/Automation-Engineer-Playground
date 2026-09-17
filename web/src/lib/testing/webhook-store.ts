import "server-only";

import { getSession } from "@/lib/session/get-session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * The learner's own webhook URL, one per lab (Vision §25: configure it once,
 * reuse it for every test in that lab).
 *
 * Read and written only through the learner's session under RLS, in its own
 * table, so the Send Test path reads exactly one table under one policy and a
 * learner can never read or overwrite anyone else's URL.
 *
 * The URL is never logged. It is effectively a capability — anyone holding an
 * unauthenticated n8n webhook URL can trigger that workflow.
 */

const WEBHOOKS_TABLE = "aep_web_lab_webhooks";

async function authorised() {
  const session = await getSession();
  if (session.status !== "authenticated") return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  return { supabase, userId: session.user.id };
}

/** The saved URL for this lab, or null when none is saved or it cannot be read. */
export async function getLabWebhookUrl(labSlug: string): Promise<string | null> {
  try {
    const client = await authorised();
    if (!client) return null;
    const { data, error } = await client.supabase
      .from(WEBHOOKS_TABLE)
      .select("webhook_url")
      .eq("lab_slug", labSlug)
      .maybeSingle();
    if (error || !data) return null;
    const url = (data as { webhook_url: unknown }).webhook_url;
    return typeof url === "string" ? url : null;
  } catch {
    return null;
  }
}

/**
 * Only the hostname, for display. Enough for a learner to recognise which n8n
 * they saved without putting the full capability URL into the page.
 */
export async function getLabWebhookHost(labSlug: string): Promise<string | null> {
  const url = await getLabWebhookUrl(labSlug);
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export type StoreWebhookResult = "saved" | "not_signed_in" | "store_unavailable";

export async function storeLabWebhookUrl(
  labSlug: string,
  webhookUrl: string,
): Promise<StoreWebhookResult> {
  try {
    const client = await authorised();
    if (!client) return "not_signed_in";
    const { error } = await client.supabase.from(WEBHOOKS_TABLE).upsert(
      { user_id: client.userId, lab_slug: labSlug, webhook_url: webhookUrl },
      { onConflict: "user_id,lab_slug" },
    );
    return error ? "store_unavailable" : "saved";
  } catch {
    return "store_unavailable";
  }
}
