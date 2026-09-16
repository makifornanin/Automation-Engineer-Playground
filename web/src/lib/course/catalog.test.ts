import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CAPSTONE, LABS } from "./catalog";

const THIS_FILE = fileURLToPath(import.meta.url);
// web/src/lib/course -> web/src -> web -> repo root -> labs
const LABS_DIR = path.resolve(path.dirname(THIS_FILE), "..", "..", "..", "..", "labs");

function onDiskLabSlugs(): string[] {
  return fs
    .readdirSync(LABS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

describe("LABS catalog", () => {
  it("has exactly ten labs", () => {
    expect(LABS).toHaveLength(10);
  });

  it("numbers labs contiguously 01–10", () => {
    expect(LABS.map((lab) => lab.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
    ]);
  });

  it("gives every lab a non-empty title", () => {
    for (const lab of LABS) {
      expect(lab.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("gives every lab a group", () => {
    const groups = new Set(["Foundations", "Reliability", "AI Engineering"]);
    for (const lab of LABS) {
      expect(groups.has(lab.group)).toBe(true);
    }
  });

  /*
   * Guard against drift: the catalog's slugs must match the real folder
   * names under `labs/`, not just be internally consistent.
   */
  it("matches the on-disk labs/NN-* folder names exactly", () => {
    const catalogSlugs = LABS.map((lab) => lab.slug).slice().sort();
    expect(catalogSlugs).toEqual(onDiskLabSlugs());
  });

  it("does not include the Capstone as an eleventh lab", () => {
    expect(LABS.some((lab) => lab.title === CAPSTONE.title)).toBe(false);
  });
});

describe("CAPSTONE", () => {
  it("has the approved title and carries no lab number", () => {
    expect(CAPSTONE.title).toBe("AI Service Request Agent");
    expect("number" in CAPSTONE).toBe(false);
  });
});
