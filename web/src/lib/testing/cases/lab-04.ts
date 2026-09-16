import "server-only";

import { expectField, type TestCase } from "./types";

/**
 * Lab 04 — Validation & Normalization.
 *
 * The checkpoints read through the response envelope with dotted paths, so the
 * learner pastes the whole response their workflow returned rather than
 * hand-extracting the inner object. Asking someone to edit their own evidence
 * before submitting it is a good way to get evidence that no longer matches
 * what their workflow does.
 *
 * Expected values come from the lab README's success test.
 */
export const LAB_04_SUCCESS_CASE: TestCase = {
  id: "lab-04-lead-accepted",
  labSlug: "04-validation-normalization",
  name: "A messy but valid lead is cleaned up and accepted",
  mode: "self-check",
  checkpoints: [
    expectField("accepted", "The lead was accepted", "success", "true"),
    expectField("name", "Name trimmed", "data.name", "Dana Reyes"),
    expectField("email", "Email trimmed and lowercased", "data.email", "dana.reyes@example.com"),
    expectField("phone", "Phone reduced to digits", "data.phone", "09175550142"),
    expectField("country", "Country uppercased", "data.country", "PH"),
    expectField(
      "date",
      "Date converted to YYYY-MM-DD",
      "data.preferred_contact_date",
      "2026-09-08",
    ),
  ],
};

/**
 * The challenge lead is valid but messier, and its phone number is the
 * interesting part: +63 (917) 555-1234 has to survive normalisation as twelve
 * digits before the length rule can accept it. Normalise wrongly and a real
 * number gets rejected.
 */
export const LAB_04_CHALLENGE_CASE: TestCase = {
  id: "lab-04-challenge-lead",
  labSlug: "04-validation-normalization",
  name: "An international lead with a formatted phone number is normalised and accepted",
  mode: "self-check",
  checkpoints: [
    expectField("accepted", "The lead was accepted", "success", "true"),
    expectField("name", "Name trimmed", "data.name", "Alex Rivera"),
    expectField("company", "Optional company kept and trimmed", "data.company", "Northstar Commerce"),
    expectField("email", "Email trimmed and lowercased", "data.email", "alex.rivera@example.com"),
    expectField("phone", "Formatting stripped to digits", "data.phone", "639175551234"),
    expectField("country", "Country uppercased", "data.country", "AU"),
    expectField(
      "date",
      "Single-digit day and month padded",
      "data.preferred_contact_date",
      "2026-09-09",
    ),
  ],
};
