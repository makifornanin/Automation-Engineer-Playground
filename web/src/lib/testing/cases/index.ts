import "server-only";

import { LAB_01_CHALLENGE_CASE, LAB_01_TRANSFORM_CASE } from "./lab-01";
import { LAB_02_CHALLENGE_CASE, LAB_02_ROUTING_CASE } from "./lab-02";
import type { TestCase } from "./types";

/**
 * Every test case, keyed by id. A chunk carries only the id string; this is
 * where that id resolves into checkpoints and expected values, on the server,
 * where the learner cannot read them.
 */
const CASES: Readonly<Record<string, TestCase>> = {
  [LAB_01_TRANSFORM_CASE.id]: LAB_01_TRANSFORM_CASE,
  [LAB_01_CHALLENGE_CASE.id]: LAB_01_CHALLENGE_CASE,
  [LAB_02_ROUTING_CASE.id]: LAB_02_ROUTING_CASE,
  [LAB_02_CHALLENGE_CASE.id]: LAB_02_CHALLENGE_CASE,
};

export function getTestCase(id: string): TestCase | null {
  return CASES[id] ?? null;
}

/** Exposed for tests: every case must belong to a real lab and be evaluable. */
export function allTestCases(): readonly TestCase[] {
  return Object.values(CASES);
}
