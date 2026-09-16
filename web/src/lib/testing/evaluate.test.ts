import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { getLessonChunks } from "@/lib/lesson/registry";
import { allTestCases, getTestCase } from "./cases";
import { expectField, expectNoFields, type Checkpoint } from "./cases/types";
import { evaluateCheckpoints, normaliseSubmittedOutput } from "./evaluate";
import type { JsonValue } from "./types";

const CORRECT: JsonValue = {
  name: "Alex Rivera",
  email: "alex@example.com",
  company: "Northstar Commerce",
  lead_source: "Facebook Lead Form",
};

const CHECKS: readonly Checkpoint[] = [
  expectField("a", "First check", "name", "Alex Rivera"),
  expectField("b", "Second check", "email", "alex@example.com"),
  expectField("c", "Third check", "company", "Northstar Commerce"),
];

describe("evaluateCheckpoints", () => {
  it("passes when every checkpoint passes", () => {
    const result = evaluateCheckpoints("case", CHECKS, CORRECT);

    expect(result.passed).toBe(true);
    expect(result.firstFailure).toBeNull();
    expect(result.checkpoints.every((entry) => entry.state === "passed")).toBe(true);
  });

  /*
   * The diagnostic behaviour that makes this useful rather than a wall of red.
   * One first failure points at one mistake; cascading failures teach nothing.
   */
  it("stops at the first failure and skips the rest", () => {
    const result = evaluateCheckpoints("case", CHECKS, { ...CORRECT, email: "ALEX@EXAMPLE.COM " });

    expect(result.passed).toBe(false);
    expect(result.checkpoints.map((entry) => entry.state)).toEqual([
      "passed",
      "failed",
      "skipped",
    ]);
    expect(result.firstFailure?.id).toBe("b");
  });

  it("reports what was expected and what was actually found", () => {
    const result = evaluateCheckpoints("case", CHECKS, { ...CORRECT, name: "alex rivera" });

    expect(result.firstFailure?.expected).toContain("Alex Rivera");
    expect(result.firstFailure?.actual).toContain("alex rivera");
  });

  /* Missing and wrong are different mistakes and must read differently. */
  it("distinguishes a missing field from a wrong one", () => {
    const missing = evaluateCheckpoints("case", CHECKS, { email: "x", company: "y" });
    expect(missing.firstFailure?.actual).toMatch(/missing/i);

    const wrong = evaluateCheckpoints("case", CHECKS, { ...CORRECT, name: "Nope" });
    expect(wrong.firstFailure?.actual).not.toMatch(/missing/i);
  });

  it("never reports a pass when there is nothing to check", () => {
    const result = evaluateCheckpoints("case", [], CORRECT);

    expect(result.passed).toBe(false);
  });

  it("catches leftover source fields", () => {
    const check = [expectNoFields("clean", "Originals dropped", ["first_name", "source"])];
    const result = evaluateCheckpoints("case", check, { ...CORRECT, first_name: "Alex" });

    expect(result.passed).toBe(false);
    expect(result.firstFailure?.actual).toContain("first_name");
  });
});

/*
 * n8n shows a node's output as an array of items, and learners paste whatever
 * the panel handed them. Rejecting a correct answer because of how the tool
 * formatted it would teach nothing except that AEP is fussy.
 */
describe("normaliseSubmittedOutput", () => {
  it("accepts a bare object", () => {
    expect(normaliseSubmittedOutput(CORRECT)).toEqual(CORRECT);
  });

  it("accepts a single-item array", () => {
    expect(normaliseSubmittedOutput([CORRECT])).toEqual(CORRECT);
  });

  it("unwraps n8n's json envelope", () => {
    expect(normaliseSubmittedOutput([{ json: CORRECT }])).toEqual(CORRECT);
  });

  it("survives an empty array without throwing", () => {
    expect(normaliseSubmittedOutput([])).toBeNull();
  });

  it("evaluates identically however the learner pasted it", () => {
    const shapes: JsonValue[] = [CORRECT, [CORRECT], [{ json: CORRECT }]];

    for (const shape of shapes) {
      const result = evaluateCheckpoints("case", CHECKS, normaliseSubmittedOutput(shape));
      expect(result.passed).toBe(true);
    }
  });
});

describe("the test case registry", () => {
  it("returns null for an unknown id", () => {
    expect(getTestCase("not-a-case")).toBeNull();
  });

  it("gives every case a unique id", () => {
    const ids = allTestCases().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every case at a real lab", () => {
    const slugs = new Set(LABS.map((lab) => lab.slug));
    for (const entry of allTestCases()) {
      expect(slugs.has(entry.labSlug)).toBe(true);
    }
  });

  it("gives every case at least one checkpoint with a learner-facing label", () => {
    for (const entry of allTestCases()) {
      expect(entry.checkpoints.length).toBeGreaterThan(0);
      for (const checkpoint of entry.checkpoints) {
        expect(checkpoint.label.trim()).not.toBe("");
      }
    }
  });

  /*
   * Labs 01, 02, 05 and 06 run on a Manual Trigger and have no webhook, so a
   * send-test case for any of them would be unreachable by construction.
   */
  it("only uses send-test for labs that actually have a webhook", () => {
    const MANUAL_TRIGGER_LABS = new Set([
      "01-data-mapping-transformation",
      "02-conditions-routing",
      "05-pagination-large-data",
      "06-retry-exponential-backoff",
    ]);

    for (const entry of allTestCases()) {
      if (MANUAL_TRIGGER_LABS.has(entry.labSlug)) {
        expect(entry.mode).toBe("self-check");
      }
    }
  });

  /* A case nothing references is a case nobody runs. */
  it("is referenced by a real chunk in its own lab", () => {
    for (const entry of allTestCases()) {
      const chunks = getLessonChunks(entry.labSlug) ?? [];
      const referenced = chunks.some(
        (chunk) =>
          (chunk.kind === "test" || chunk.kind === "challenge") &&
          chunk.testCaseId === entry.id,
      );
      expect(referenced).toBe(true);
    }
  });
});
