import { AppShell } from "@/components/shell/AppShell";
import { MotionProvider } from "@/components/shell/MotionProvider";
import { SessionProvider } from "@/components/session/SessionProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getSession } from "@/lib/session/get-session";

/**
 * The shell resolves the session here and passes the role down to the dock.
 * A Server Component page that needs the session calls `getSession()` itself
 * (Home does, for the greeting) because a layout cannot pass props to the page
 * it wraps. That is safe while the body is a placeholder with no I/O.
 *
 * PHASE 11: once this reads a real Supabase session, wrap it in React `cache()`
 * so repeated calls within one request are deduplicated, and narrow on `status`
 * with an exhaustive switch rather than a ternary — a ternary with an else
 * branch will not raise a compile error if the union gains a state.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session.status === "authenticated" ? session.user.role : "student";

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
