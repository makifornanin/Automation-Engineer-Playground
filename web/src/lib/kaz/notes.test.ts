import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { chunkNote, homeNote } from "./notes";

describe("chunkNote — when Kaz speaks in a lesson", () => {
  it("speaks when the learner enters Break It", () => {
    expect(chunkNote("break-it", "test")).not.toBeNull();
  });

  /*
   * Kaz §6: during most Guided Build steps she stays quiet unless asked. The
   * learner is building; interrupting them is the opposite of helping.
   */
  it("stays quiet while the learner builds", () => {
    expect(chunkNote("guided-build", "concept")).toBeNull();
  });

  it("stays quiet through reading and debugging", () => {
    for (const kind of ["problem", "concept", "predict", "debug", "recap"] as const) {
      expect(chunkNote(kind, null)).toBeNull();
    }
  });

  /*
   * Kaz §7's cooldown as a rule: never on consecutive chunks, even if a future
   * lab puts two speaking kinds side by side.
   */
  it("never speaks on two consecutive chunks", () => {
    expect(chunkNote("break-it", "break-it")).toBeNull();
  });

  it("never teases in a way that mocks the learner", () => {
    const note = chunkNote("break-it", "test");
    expect(note?.text).not.toMatch(/stupid|wrong again|obviously|failed you/i);
  });

  /*
   * Kaz must not invent test results; AEP's evidence is authoritative. Next
   * works on a test chunk without a pass, and this note cannot see evidence,
   * so it must not claim an outcome either way.
   */
  it("never claims a test result it has not seen", () => {
    const note = chunkNote("break-it", "test");
    expect(note?.text).not.toMatch(/\b(pass|passed|passing|fail|failed|green|worked|succeeded)\b/i);
  });
});

describe("homeNote — motivation from real progress", () => {
  it("welcomes a first-time learner with the owner's own copy", () => {
    const note = homeNote([], LABS[0]);

    expect(note.text).toContain("start with Lab 01");
    expect(note.state).toBe("neutral");
  });

  /*
   * Kaz §4 rules out generic encouragement. Mid-course, the note has to name
   * what the learner actually did and what actually comes next.
   */
  it("names the lab just finished and the one that is next", () => {
    const note = homeNote([LABS[0].slug, LABS[1].slug], LABS[2]);

    expect(note.text).toContain("Lab " + LABS[1].number + " done");
    expect(note.text).toContain(LABS[2].title);
    expect(note.text).toContain("8 labs");
    expect(note.text).not.toMatch(/you can do it/i);
  });

  it("uses the singular when one lab is left", () => {
    const allButLast = LABS.slice(0, -1).map((lab) => lab.slug);

    expect(homeNote(allButLast, LABS[9]).text).toContain("1 lab to go");
  });

  it("celebrates the whole course and points at the Capstone", () => {
    const note = homeNote(
      LABS.map((lab) => lab.slug),
      LABS[9],
    );

    expect(note.state).toBe("celebrating");
    expect(note.text).toContain("Capstone");
  });
});
