import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { getSession } from "@/lib/session/get-session";

/**
 * Passwordless sign-in: a 6-digit emailed code, not a magic link — Vision
 * §8, amended 2026-09-13. No callback route, no `?next=` param: `/sign-in`
 * always lands the learner on `/` (`sign-in-actions.ts`'s `redirect("/")`).
 *
 * `/sign-in` is a public path (`protected-routes.ts`), so nothing else would
 * turn an already-authenticated visit into a redirect home — this page does
 * that itself, the same direction `requireSession()` runs in reverse.
 */
export default async function SignInPage() {
  const session = await getSession();
  if (session.status === "authenticated") {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <GlassSurface className="w-full max-w-sm p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-3 text-ink-soft">
          Enter your invited email address. We will send you a 6-digit code.
        </p>
        <div className="mt-6">
          <SignInForm />
        </div>
      </GlassSurface>
    </div>
  );
}
