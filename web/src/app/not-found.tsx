import { NotFoundContent } from "@/components/ui/NotFoundContent";

/**
 * Lives outside the (app) group, so it renders without the dock. It still uses
 * the shell tokens, and the blocking theme script has already set data-theme,
 * so it paints in the correct theme.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start justify-center gap-4 px-5">
      <NotFoundContent />
    </main>
  );
}
