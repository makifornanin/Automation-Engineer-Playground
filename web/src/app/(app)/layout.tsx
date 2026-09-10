import { AppShell } from "@/components/shell/AppShell";
import { MotionProvider } from "@/components/shell/MotionProvider";
import { SessionProvider } from "@/components/session/SessionProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { requireSession } from "@/lib/auth/guards";
import { sessionRole } from "@/lib/session/types";

/**
 * The shell resolves the session here and passes the role down to the dock.
 * `requireSession()` is the authoritative server-side check: it redirects an
 * unauthenticated visitor to `/sign-in` before any protected content renders,
 * and its return type guarantees an authenticated session below. A Server
 * Component page that needs the session calls `getSession()` itself (Home
 * does, for the greeting) because a layout cannot pass props to the page it
 * wraps; `getSession()` is `cache()`-wrapped, so that second call is
 * deduplicated rather than a second network round trip.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const role = sessionRole(session);

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <MotionProvider>
          <AppShell role={role}>{children}</AppShell>
        </MotionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
