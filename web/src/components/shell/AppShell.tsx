import type { ReactNode } from "react";
import type { UserRole } from "@/lib/session/types";
import { AppDock } from "@/components/dock/AppDock";
import { SkipLink } from "./SkipLink";

/**
 * The app frame: skip link, floating dock, and a single centred content
 * column. No permanent side panel and no full-height sidebar — the padding
 * reserves room so the floating dock never sits on top of content.
 */
export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-24">
      <SkipLink />
      <AppDock role={role} />
      {/*
        The focus ring is kept, not suppressed: the skip link moves focus here
        and a sighted keyboard user needs to see that it landed. The offset is
        negative so the ring sits inside the element rather than off-viewport.
      */}
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-5 pt-10 pb-32 focus-visible:-outline-offset-4 md:px-8 md:pt-16 md:pb-20"
      >
        {children}
      </main>
    </div>
  );
}
