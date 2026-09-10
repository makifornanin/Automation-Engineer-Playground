import { GlassSurface } from "@/components/ui/GlassSurface";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

/**
 * NOT ROLE-ACCESS-CONTROLLED. The shared `(app)` layout now requires a
 * signed-in session (Phase 11 Step 1's `requireSession()`), so this route is
 * no longer reachable by an anonymous visitor — but it is still reachable by
 * any signed-in user, whatever their role. A narrower gap than Phase 10's,
 * and still an honest one: role gating is Phase 11 Step 3, not Step 1.
 *
 * Hiding the Admin item in the dock is presentation, not a guard. A
 * client-side redirect or a fake "not authorized" screen is deliberately NOT
 * added here: a guard that merely looks like auth is worse than an honest gap,
 * because later work would assume protection that is one devtools toggle away.
 *
 * Phase 11 Step 3 adds server-side role enforcement here, replacing the
 * on-screen notice below with the real Admin section.
 */
export default function AdminPage() {
  return (
    <PagePlaceholder
      title="Admin"
      intro="A small section inside the same app — invite a learner, see who has access, resend or revoke. Not a separate admin product."
    >
      <GlassSurface className="p-5">
        <p className="text-sm text-ink">
          <strong className="font-medium">This route is not role-access-controlled yet.</strong>{" "}
          Signing in is required, but any signed-in user can open this page
          regardless of role. Server-side role enforcement arrives in Phase 11
          Step 3.
        </p>
      </GlassSurface>
    </PagePlaceholder>
  );
}
