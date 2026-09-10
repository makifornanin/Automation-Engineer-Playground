"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Session } from "@/lib/session/types";

const SessionContext = createContext<Session | null>(null);

/**
 * Carries the session resolved once on the server down to client components.
 * Phase 10 has no authentication, so this is a placeholder — never treat a
 * value read from here as proof of identity or permission.
 */
export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }
  return session;
}
