import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { getLessonChunks } from "./chunks";

const LAB_01 = "01-data-mapping-transformation";

describe("getLessonChunks", () => {
  it("returns Lab 01's problem and concept chunks, in that order", () => {
    const chunks = getLessonChunks(LAB_01);

    expect(chunks).not.toBeNull();
    expect(chunks?.map((chunk) => chunk.id)).toEqual(["problem", "concept"]);
  });

  it("gives every chunk a title and at least one paragraph", () => {
    const chunks = getLessonChunks(LAB_01) ?? [];

    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.title.trim()).not.toBe("");
      expect(chunk.body.length).toBeGreaterThan(0);
      for (const paragraph of chunk.body) {
        expect(paragraph.trim()).not.toBe("");
      }
    }
  });

  /*
   * Only Lab 01 has content. The other nine must return null so their pages
   * keep the honest placeholder rather than rendering an empty lesson.
   */
  it("returns null for every lab that has no lesson yet", () => {
    for (const lab of LABS.filter((entry) => entry.slug !== LAB_01)) {
      expect(getLessonChunks(lab.slug)).toBeNull();
    }
  });

  it("returns null for an unknown slug", () => {
    expect(getLessonChunks("not-a-lab")).toBeNull();
  });

  /*
   * A real Vision §16 guard. The README this copy is condensed from carries a
   * "Difficulty: Beginner" line directly above the Hook, which is exactly the
   * region the problem chunk draws from.
   */
  it("never carries a difficulty label into the lesson copy", () => {
    const text = (getLessonChunks(LAB_01) ?? [])
      .flatMap((chunk) => [chunk.title, ...chunk.body])
      .join(" ");

    expect(text).not.toMatch(/beginner|intermediate|advanced|difficulty/i);
  });
});
