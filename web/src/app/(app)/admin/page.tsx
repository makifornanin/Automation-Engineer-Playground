import { InviteLearnerForm } from "@/components/admin/InviteLearnerForm";
import { LearnerActions } from "@/components/admin/LearnerActions";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { listLearners } from "@/lib/admin/learner-store";
import type { LearnerStatus } from "@/lib/admin/users";
import { requireAdmin } from "@/lib/auth/guards";

const STATUS_LABEL: Record<LearnerStatus, string> = {
  invited: "Invited — not accepted yet",
  active: "Active",
  revoked: "Revoked",
};

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function lastSignIn(value: string | null): string {
  if (!value) return "Never signed in";
  const time = Date.parse(value);
  return Number.isNaN(time) ? "Never signed in" : `Last signed in ${DATE.format(time)}`;
}

/**
 * Admin (Vision §8): invite a learner, see who has access, resend or revoke.
 * A small section of the same app, not a separate product.
 *
 * `requireAdmin()` runs before anything is read: a learner who is not an admin
 * gets a 404 and the learner list is never fetched. Every action re-checks on
 * the server as well, because an action can be called without this page.
 *
 * Admins are shown but cannot be revoked here, and there is no way to make
 * someone an admin: that stays a deliberate step in Supabase.
 */
export default async function AdminPage() {
  const session = await requireAdmin();
  const list = await listLearners();

  return (
    <PagePlaceholder
      title="Admin"
      intro="Invite a learner, see who has access, and resend or revoke it."
    >
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-ink">Invite a learner</h2>
          <p className="max-w-prose text-ink-muted">
            They get an email from Supabase. Accepting it confirms their address; after that they
            sign in with a 6-digit code like everyone else.
          </p>
          <InviteLearnerForm />
        </section>

        <section className="flex flex-col gap-3 border-t border-line pt-6">
          <h2 className="text-lg font-medium text-ink">Learners</h2>
          {list.status === "unavailable" ? (
            <p className="max-w-prose text-ink-soft">
              The learner list could not be loaded. Check that the server has its Supabase secret
              key, then refresh.
            </p>
          ) : (
            <>
              <ul className="flex flex-col divide-y divide-line">
                {list.learners.map((learner) => (
                  <li key={learner.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-medium break-all text-ink">{learner.email}</span>
                      {learner.role === "admin" ? (
                        <span className="text-xs tracking-[0.14em] text-ink-muted uppercase">
                          Admin
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-ink-soft">
                      {STATUS_LABEL[learner.status]} · {lastSignIn(learner.lastSignInAt)}
                    </p>
                    {learner.role !== "admin" && learner.id !== session.user.id ? (
                      <LearnerActions
                        userId={learner.id}
                        email={learner.email}
                        status={learner.status}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
              {list.truncated ? (
                <p className="text-sm text-ink-muted">
                  Showing the first {list.learners.length} accounts.
                </p>
              ) : null}
            </>
          )}
        </section>

        <section className="flex flex-col gap-2 border-t border-line pt-6">
          <h2 className="text-lg font-medium text-ink">What revoking does</h2>
          <p className="max-w-prose text-ink-muted">
            A revoked learner is signed out of AEP on their next request and cannot sign in again.
            Their progress and notes are kept, and restoring access brings everything back.
          </p>
          <p className="max-w-prose text-ink-muted">
            It does not end a sign-in token they already hold: for up to an hour, that token can
            still read and change their own AEP records directly through Supabase. It never reaches
            anyone else&rsquo;s.
          </p>
        </section>
      </div>
    </PagePlaceholder>
  );
}
