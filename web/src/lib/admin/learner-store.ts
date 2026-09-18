import "server-only";

import type { User } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { toLearnerRow, type LearnerRow } from "./users";

export type LearnerList =
  | { status: "ok"; learners: LearnerRow[]; truncated: boolean }
  | { status: "unavailable" };

/** V1 is invite-only and small. One page is the whole list; past it, say so. */
const PAGE_SIZE = 200;

const STATUS_ORDER: Record<LearnerRow["status"], number> = { invited: 0, active: 1, revoked: 2 };

/**
 * Every account, projected to what the Admin page shows. `getAdminClient()`
 * returns nothing for a non-admin, so this reads nothing for one either.
 */
export async function listLearners(): Promise<LearnerList> {
  const client = await getAdminClient();
  if (!client) return { status: "unavailable" };

  try {
    const { data, error } = (await client.auth.admin.listUsers({
      page: 1,
      perPage: PAGE_SIZE,
    })) as { data: { users: User[]; nextPage?: number | null }; error: { code?: string } | null };
    if (error) {
      console.warn("admin list failed", { code: error.code ?? "unknown" });
      return { status: "unavailable" };
    }

    const now = new Date();
    const learners = data.users
      .map((user) => toLearnerRow(user, now))
      .sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.email.localeCompare(b.email),
      );
    // Supabase's own "there is a page after this one", so an exact 200
    // accounts is not reported as truncated.
    return { status: "ok", learners, truncated: Boolean(data.nextPage) };
  } catch {
    console.warn("admin list failed", { code: "unknown" });
    return { status: "unavailable" };
  }
}
