import type { LabGroup } from "./catalog";

export interface LabGroupDef {
  name: LabGroup;
  framing: string;
}

/**
 * Curriculum group framing (Vision §16). Moved verbatim from the Phase 10
 * Labs placeholder — this is Vision §16's own example copy and must survive
 * character-for-character, not be rewritten in a new voice.
 */
export const LAB_GROUPS: readonly LabGroupDef[] = [
  {
    name: "Foundations",
    framing:
      "First, we make data move correctly. Fancy automation means nothing if the basics are shaky.",
  },
  {
    name: "Reliability",
    framing:
      "Now we make your workflows survive the real world. APIs fail. Events repeat. Systems get weird.",
  },
  {
    name: "AI Engineering",
    framing:
      "Time to let AI make recommendations without letting it run the company unsupervised.",
  },
];

/**
 * The Capstone's own framing line, moved verbatim alongside the three group
 * lines above. Kept out of `LAB_GROUPS`: the Capstone is not a fourth
 * curriculum group, it renders as its own section (Vision §16).
 */
export const CAPSTONE_FRAMING =
  "Everything you have learned, in one system you build end to end.";

/**
 * Groups lab-identified items by curriculum group, in `LAB_GROUPS` order.
 * Generic over the item shape (rather than tied to `Lab` or `LabWithStatus`
 * specifically) so both the raw catalog and status-annotated rows can reuse
 * it; the caller supplies how to read the group off its own item.
 */
export function labsByGroup<T>(
  items: readonly T[],
  groupOf: (item: T) => LabGroup,
): ReadonlyArray<{ group: LabGroupDef; labs: readonly T[] }> {
  return LAB_GROUPS.map((group) => ({
    group,
    labs: items.filter((item) => groupOf(item) === group.name),
  }));
}
