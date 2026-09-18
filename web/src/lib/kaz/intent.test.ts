import { describe, expect, it } from "vitest";
import { decideInspection, isBareStuck } from "./intent";

const LINKED = true;

describe("decideInspection", () => {
  /* A concept question costs nothing: no n8n call, no execution fetch. */
  it.each([
    "What does idempotency mean?",
    "Ano ibig sabihin ng webhook?",
    "What does the Merge node do?",
    "Why do we retry with backoff?",
  ])("looks at nothing for %j", (question) => {
    expect(decideInspection(question, LINKED)).toEqual({ workflow: false, execution: false });
  });

  it.each(["Why did my test fail?", "my run failed", "bakit ayaw gumana", "I keep getting an error"])(
    "reads the latest run for %j",
    (question) => {
      expect(decideInspection(question, LINKED).execution).toBe(true);
    },
  );

  it("reads both for 'check my workflow'", () => {
    expect(decideInspection("Check my workflow please", LINKED)).toEqual({
      workflow: true,
      execution: true,
    });
  });

  /* Nothing to inspect means nothing is requested, whatever was asked. */
  it("asks for nothing when no workflow is linked", () => {
    expect(decideInspection("check my workflow, why did it fail?", false)).toEqual({
      workflow: false,
      execution: false,
    });
  });
});

describe("isBareStuck", () => {
  it.each(["I'm stuck", "stuck", "confused", "nalilito 😭"])("recognises %j", (message) => {
    expect(isBareStuck(message)).toBe(true);
  });

  it("does not swallow a real question that mentions being stuck", () => {
    expect(isBareStuck("I'm stuck on the IF node, what does 'any' mean here?")).toBe(false);
  });
});
