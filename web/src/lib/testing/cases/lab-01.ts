import "server-only";

import { expectField, expectNoFields, type TestCase } from "./types";

/**
 * Lab 01 — Data Mapping & Transformation.
 *
 * Lab 01 runs on a Manual Trigger and has no webhook, so AEP cannot call it.
 * The learner runs their own workflow, copies the `Transform for CRM` output,
 * and pastes it here. That is a genuine expected-vs-actual check with real
 * evidence behind it, rather than an acknowledgement button — Vision §3 asks
 * for progress earned through learning evidence, and this is the strongest
 * evidence available for a lab AEP cannot observe directly.
 *
 * Checkpoint order matters: evaluation stops at the first failure, so these
 * run from "did you build the field at all" outward to "did you remember to
 * drop the originals". The first failing checkpoint is the one worth telling
 * the learner about.
 *
 * Expected values come from the lab's own `sample-data/expected-output.json`
 * and are typed here rather than read from disk at runtime, for the same
 * reason lesson content is: a slug-driven file read would re-create the path
 * traversal surface `/labs/[slug]` exists to avoid.
 */
export const LAB_01_TRANSFORM_CASE: TestCase = {
  id: "lab-01-transform-for-crm",
  labSlug: "01-data-mapping-transformation",
  name: "A Facebook lead arrives and the CRM gets exactly what it expects",
  mode: "self-check",
  checkpoints: [
    expectField(
      "name",
      "First and last name combined",
      "name",
      "Alex Rivera",
    ),
    expectField(
      "email",
      "Email trimmed and lowercased",
      "email",
      "alex@example.com",
    ),
    expectField(
      "company",
      "Company carried across",
      "company",
      "Northstar Commerce",
    ),
    expectField(
      "lead_source",
      "Source renamed to lead_source",
      "lead_source",
      "Facebook Lead Form",
    ),
    expectNoFields(
      "no-originals",
      "Original form fields dropped",
      ["first_name", "last_name", "email_address", "source"],
    ),
  ],
};

/**
 * Lab 01's challenge — the nested lead payload.
 *
 * Expected values come from `labs/01-data-mapping-transformation/challenge/
 * expected-output.json`, typed here for the same reason as above.
 *
 * Checkpoint order runs from "did you reach into the nested objects at all"
 * out to the two array joins, which are the actual lesson. `full_name` is
 * deliberately `"jamie LEE"` and not title-cased: the challenge asks the
 * learner to lowercase the *email* and nothing else, and an output that looks
 * tidier than expected means a transformation was applied where it was not
 * requested. That is Hint 5 in the lab, and this checkpoint is what catches it.
 */
export const LAB_01_CHALLENGE_CASE: TestCase = {
  id: "lab-01-nested-lead-to-crm",
  labSlug: "01-data-mapping-transformation",
  name: "A nested lead payload flattens into one clean CRM record",
  mode: "self-check",
  checkpoints: [
    expectField("full-name", "Nested first and last name combined", "full_name", "jamie LEE"),
    expectField("email", "Email trimmed and lowercased", "email", "jamie.lee@email.com"),
    expectField(
      "company-name",
      "Company name extracted and trimmed",
      "company_name",
      "Northstar Commerce",
    ),
    expectField("job-title", "Role renamed to job_title", "job_title", "operations manager"),
    expectField("lead-source", "Marketing source renamed", "lead_source", "facebook"),
    expectField(
      "campaign",
      "Campaign renamed to campaign_name",
      "campaign_name",
      "AEP September Campaign",
    ),
    expectField(
      "location",
      "Location flattened to City, Country",
      "location",
      "Perth, AU",
    ),
    expectField(
      "interests",
      "Interests joined with a comma",
      "interests",
      "Automation, CRM, AI",
    ),
    expectField(
      "tags",
      "Tags joined with a pipe",
      "tags",
      "Hot Lead | Facebook | Automation",
    ),
    expectNoFields("no-nested", "Nested objects flattened away", [
      "contact",
      "company",
      "marketing",
    ]),
  ],
};
