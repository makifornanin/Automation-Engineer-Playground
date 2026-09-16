import "server-only";

import { LAB_01_CHALLENGE_CASE, LAB_01_TRANSFORM_CASE } from "./lab-01";
import { LAB_02_CHALLENGE_CASE, LAB_02_ROUTING_CASE } from "./lab-02";
import { LAB_03_CHALLENGE_CASE, LAB_03_SUCCESS_CASE } from "./lab-03";
import { LAB_04_CHALLENGE_CASE, LAB_04_SUCCESS_CASE } from "./lab-04";
import { LAB_05_CHALLENGE_CASE, LAB_05_SUCCESS_CASE } from "./lab-05";
import { LAB_06_CHALLENGE_CASE, LAB_06_SUCCESS_CASE } from "./lab-06";
import { LAB_07_CHALLENGE_CASE, LAB_07_DUPLICATE_CASE } from "./lab-07";
import { LAB_08_CHALLENGE_CASE, LAB_08_QUEUED_CASE } from "./lab-08";
import { LAB_09_FALLBACK_CASE, LAB_09_SALES_CASE } from "./lab-09";
import { LAB_10_APPROVED_CASE, LAB_10_HELD_CASE } from "./lab-10";
import type { TestCase } from "./types";

/**
 * Every test case, keyed by id. A chunk carries only the id string; this is
 * where that id resolves into checkpoints and expected values, on the server,
 * where the learner cannot read them.
 */
const ALL: readonly TestCase[] = [
  LAB_01_TRANSFORM_CASE,
  LAB_01_CHALLENGE_CASE,
  LAB_02_ROUTING_CASE,
  LAB_02_CHALLENGE_CASE,
  LAB_03_SUCCESS_CASE,
  LAB_03_CHALLENGE_CASE,
  LAB_04_SUCCESS_CASE,
  LAB_04_CHALLENGE_CASE,
  LAB_05_SUCCESS_CASE,
  LAB_05_CHALLENGE_CASE,
  LAB_06_SUCCESS_CASE,
  LAB_06_CHALLENGE_CASE,
  LAB_07_DUPLICATE_CASE,
  LAB_07_CHALLENGE_CASE,
  LAB_08_QUEUED_CASE,
  LAB_08_CHALLENGE_CASE,
  LAB_09_SALES_CASE,
  LAB_09_FALLBACK_CASE,
  LAB_10_HELD_CASE,
  LAB_10_APPROVED_CASE,
];

const CASES: Readonly<Record<string, TestCase>> = Object.fromEntries(
  ALL.map((entry) => [entry.id, entry]),
);

export function getTestCase(id: string): TestCase | null {
  return CASES[id] ?? null;
}

/** Exposed for tests: every case must belong to a real lab and be evaluable. */
export function allTestCases(): readonly TestCase[] {
  return ALL;
}
