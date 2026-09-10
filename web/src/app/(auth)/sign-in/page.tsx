import { GlassSurface } from "@/components/ui/GlassSurface";

/**
 * Static placeholder. No form, no Supabase call, no new visual language —
 * existing tokens and `GlassSurface` only. It exists so the protection seam
 * (middleware + `requireSession()`) has somewhere to send a signed-out
 * visitor. The real passwordless sign-in flow is Phase 11 Step 2.
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <GlassSurface className="w-full max-w-sm p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-3 text-ink-soft">
          Passwordless sign-in is coming soon. AEP is invite-only for now.
        </p>
      </GlassSurface>
    </div>
  );
}
