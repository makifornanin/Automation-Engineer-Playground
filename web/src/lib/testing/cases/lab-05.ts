import "server-only";

import { expectAtLeast, expectBetween, type TestCase } from "./types";

/**
 * Lab 05 — Pagination & Large Data Processing.
 *
 * The lab paginates dummyjson.com's public users API, which held 208 records
 * when the lab was written and warns in its own README that the total could
 * change. So these checkpoints prove the lesson rather than the number: a
 * workflow that stops at page one fetches 1 page and 5 records, and one with
 * the Break It stop condition fetches 2 and 10. Floors well above both catch
 * every early stop without failing a correct workflow the day the dataset
 * moves.
 */
export const LAB_05_SUCCESS_CASE: TestCase = {
  id: "lab-05-all-pages",
  labSlug: "05-pagination-large-data",
  name: "Every page of the customer API is fetched and combined, not just the first",
  mode: "self-check",
  checkpoints: [
    expectAtLeast("pages", "Far more than one page was fetched", "pages_fetched", 20),
    expectAtLeast("records", "Records from every page were combined", "total_records", 100),
  ],
};

/**
 * The challenge changes the page size from 5 to 7 over the same dataset.
 *
 * Total records must stay in the same range — page size changes how many
 * requests it takes, never how much data exists — and the request count must
 * fall inside the band a size-7 run produces. A learner who changed the limit
 * but left the $pageCount multiplier at 5 skips records and fails the first
 * checkpoint; one who changed neither stays near 42 pages and fails the second.
 */
export const LAB_05_CHALLENGE_CASE: TestCase = {
  id: "lab-05-page-size-seven",
  labSlug: "05-pagination-large-data",
  name: "A larger page size needs fewer requests but still retrieves every record",
  mode: "self-check",
  checkpoints: [
    expectAtLeast(
      "records",
      "The same full dataset was retrieved",
      "total_records",
      100,
    ),
    expectBetween(
      "pages",
      "Fewer requests were needed at seven per page",
      "pages_fetched",
      25,
      35,
    ),
  ],
};
