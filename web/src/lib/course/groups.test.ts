import { describe, expect, it } from "vitest";
import { CAPSTONE, LABS } from "./catalog";
import { LAB_GROUPS, labsByGroup } from "./groups";

describe("LAB_GROUPS", () => {
  it("orders Foundations, then Reliability, then AI Engineering", () => {
    expect(LAB_GROUPS.map((group) => group.name)).toEqual([
      "Foundations",
      "Reliability",
      "AI Engineering",
    ]);
  });
});

describe("labsByGroup", () => {
  it("places every lab in exactly one group", () => {
    const grouped = labsByGroup(LABS, (lab) => lab.group);
    const seen = grouped.flatMap(({ labs }) => labs.map((lab) => lab.slug));

    expect(seen.length).toBe(LABS.length);
    expect(new Set(seen).size).toBe(LABS.length);
    expect(seen.slice().sort()).toEqual(LABS.map((lab) => lab.slug).slice().sort());
  });

  it("groups in Foundations -> Reliability -> AI Engineering order", () => {
    const grouped = labsByGroup(LABS, (lab) => lab.group);

    expect(grouped.map(({ group }) => group.name)).toEqual([
      "Foundations",
      "Reliability",
      "AI Engineering",
    ]);
  });

  it("puts each lab under its own declared group", () => {
    const grouped = labsByGroup(LABS, (lab) => lab.group);

    for (const { group, labs } of grouped) {
      for (const lab of labs) {
        expect(lab.group).toBe(group.name);
      }
    }
  });
});

describe("the Capstone", () => {
  it("has no group field — it cannot be placed in a curriculum group by construction", () => {
    expect("group" in CAPSTONE).toBe(false);
  });

  it("never appears among the grouped labs", () => {
    const grouped = labsByGroup(LABS, (lab) => lab.group);
    const titles = grouped.flatMap(({ labs }) => labs.map((lab) => lab.title));

    expect(titles).not.toContain(CAPSTONE.title);
  });
});
