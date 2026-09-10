import clsx from "clsx";

/**
 * Kaz's visual identity (Kaz §9): a small floating orb with a chrome/glass
 * surface and a light instead of a face. Blue glow in light mode, coral in
 * dark, driven entirely by the `--kaz-*` tokens.
 *
 * This is a static decorative orb. Kaz's visual states, motion and AI arrive
 * in Phase 14.
 */
export function KazOrb({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Kaz, a small glass orb"
      className={clsx("relative size-28 shrink-0", className)}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: "var(--kaz-glow)" }}
      />
      <div
        aria-hidden
        className="glass-surface absolute inset-0 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.55), transparent 46%)",
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, var(--kaz-core), var(--kaz-glow) 62%, transparent 72%)",
        }}
      />
    </div>
  );
}
