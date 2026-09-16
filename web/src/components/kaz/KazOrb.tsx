import clsx from "clsx";
import type { KazState } from "@/lib/kaz/notes";

/**
 * How strongly the orb glows in each state (Kaz §10).
 *
 * Intensity only — no animation. The visual direction is frozen, and a glow
 * that brightens when Kaz celebrates and dims when she is focused carries the
 * state without adding motion that would need reduced-motion handling or
 * compete with the lesson for attention (Kaz §11: "No large character
 * animations").
 */
const GLOW_OPACITY: Record<KazState, number> = {
  neutral: 0.85,
  thinking: 0.7,
  amused: 1,
  "uh-oh": 0.9,
  celebrating: 1,
  focused: 0.55,
};

const STATE_LABEL: Record<KazState, string> = {
  neutral: "",
  thinking: ", thinking",
  amused: ", amused",
  "uh-oh": ", concerned",
  celebrating: ", celebrating",
  focused: ", focused",
};

/**
 * Kaz's visual identity (Kaz §9): a small floating orb with a chrome/glass
 * surface and a light instead of a face. Blue glow in light mode, coral in
 * dark, driven entirely by the --kaz-* tokens.
 */
export function KazOrb({
  className,
  state = "neutral",
}: {
  className?: string;
  state?: KazState;
}) {
  return (
    <div
      role="img"
      aria-label={"Kaz, a small glass orb" + STATE_LABEL[state]}
      data-state={state}
      className={clsx("relative size-28 shrink-0", className)}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: "var(--kaz-glow)", opacity: GLOW_OPACITY[state] }}
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
          opacity: GLOW_OPACITY[state],
        }}
      />
    </div>
  );
}
