import "server-only";

import { expectCount, expectFieldAt, expectFieldSet, type TestCase } from "./types";

/**
 * Lab 02 - Conditions & Routing.
 *
 * Both cases check a BRANCH rather than a record, because the count is the
 * evidence in a routing lab. The guided test asks for the Priority Sales node
 * output: with correct AND logic exactly one lead reaches it, and with the
 * ANY/OR bug the lab teaches, Jamie arrives too. So "exactly one lead reached
 * Priority Sales" fails precisely when the learner has made the mistake the
 * lab exists to teach - which a single-record check would miss entirely.
 *
 * Expected routing comes from the lab README and its
 * sample-data/expected-routing.json and challenge/expected-routing.json.
 */
export const LAB_02_ROUTING_CASE: TestCase = {
  id: "lab-02-priority-sales",
  labSlug: "02-conditions-routing",
  name: "Only the genuinely hot, high-budget, uncontacted lead reaches Priority Sales",
  mode: "self-check",
  shape: "items",
  checkpoints: [
    expectCount("count", "Exactly one lead reached Priority Sales", 1),
    expectFieldAt("who", "It is Alex Rivera", 0, "name", "Alex Rivera"),
    expectFieldAt("route", "Tagged with the Priority Sales route", 0, "route", "Priority Sales"),
  ],
};

/**
 * The challenge adds Manual Review, which is where the OR condition lives.
 *
 * Three leads should qualify and each for a different reason: Jamie on both
 * conditions, Jordan on budget alone, Casey on country alone. Checking the set
 * rather than the order keeps the test about the business outcome instead of
 * how the learner happened to wire their nodes.
 */
export const LAB_02_CHALLENGE_CASE: TestCase = {
  id: "lab-02-manual-review",
  labSlug: "02-conditions-routing",
  name: "Every warm lead that qualifies on budget OR country reaches Manual Review",
  mode: "self-check",
  shape: "items",
  checkpoints: [
    expectCount("count", "Exactly three leads reached Manual Review", 3),
    expectFieldSet("who", "They are Jamie, Jordan and Casey", "name", [
      "Jamie Lee",
      "Jordan Patel",
      "Casey Wong",
    ]),
    expectFieldSet("route", "All tagged Manual Review", "route", [
      "Manual Review",
      "Manual Review",
      "Manual Review",
    ]),
  ],
};
