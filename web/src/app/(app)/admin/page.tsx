import { GlassSurface } from "@/components/ui/GlassSurface";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

/**
 * NOT ACCESS-CONTROLLED. Phase 10 ships no authentication and no
 * authorization, so this route is reachable by anyone who types the URL,
 * whatever AEP_PLACEHOLDER_ROLE says.
 *
 * Hiding the Admin item in the dock is presentation, not a guard. A
 * client-side redirect or a fake "not authorized" screen is deliberately NOT
 * added here: a guard that merely looks like auth is worse than an honest gap,
 * because later work would assume protection that is one devtools toggle away.
 *
 * PHASE 11 adds server-side role enforcement.
 */
export default function AdminPage() {
  return (
    <PagePlaceholder
      title="Admin"
      intro="A small section inside the same app — invite a learner, see who has access, resend or revoke. Not a separate admin product."
    >
      <GlassSurface className="p-5">
        <p className="text-sm text-ink">
          <strong className="font-medium">This route is not access-controlled yet.</strong>{" "}
          Authentication and server-side admin enforcement arrive in Phase 11.
          Until then anyone with this URL can open this page.
        </p>
      </GlassSurface>
    </PagePlaceholder>
  );
}
