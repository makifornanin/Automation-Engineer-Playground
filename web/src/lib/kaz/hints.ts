import "server-only";

/**
 * Progressive challenge hints, per lab (Vision §6, Kaz §5 Challenge Mode).
 *
 * server-only, and never serialised into a page. They are handed out one at a
 * time by `revealNextHint`, so a learner sees hint 2 only after asking for
 * hint 1 — which is the whole difference between progressive hinting and a
 * collapsed answer key sitting in devtools.
 *
 * Each lab's hints follow the order the lab template asks for: point at the
 * symptom, then the data or its shape, then the rule or concept, then where to
 * inspect. None contains the finished expression. A hint that hands over the
 * answer is not a hint.
 *
 * Condensed from each lab README's own "Progressive Hints" section.
 */
export const CHALLENGE_HINTS: Readonly<Record<string, readonly string[]>> = {
  "01-data-mapping-transformation": [
    "Look at the path to each value you need. first sits inside contact, so the expression has to walk through contact to reach it.",
    "Some values carry spaces that should not reach the CRM. Think about which string method removes whitespace from both ends — and use it only where it is needed.",
    "location is an object: you read its properties. interests and tags are arrays: they have methods for working with every value at once.",
    "Do not reference tags[0], tags[1], tags[2] by hand — that breaks the moment the array changes length. Look for the array method that turns every value into one string with a separator you choose. Then read the expected output character by character: interests and tags do not use the same separator.",
    "Re-read the requirements. Only the email is lowercased. If a value in your output looks tidier than the expected result, you applied a transformation somewhere nobody asked for.",
  ],
  "02-conditions-routing": [
    "Priority Sales has the most requirements. Check the most specific rule first, before any broader rule gets a chance to catch the lead.",
    "Do not send every warm lead straight to Nurture. Some warm leads need a second decision first.",
    "Ask of each rule: must every condition be true, or is any one enough? The first is AND. The second is OR.",
    "For Manual Review, a warm lead qualifies on budget of at least 4000 OR country AU. Either one is enough on its own.",
    "Jamie satisfies both Manual Review conditions, so she would pass under AND or OR — she proves nothing about which you used. Look at the leads who satisfy only one.",
  ],
  "03-apis-webhooks": [
    "Ask yourself which value decides which customer record the API should return.",
    "Look at the incoming webhook body. The value you need is already there.",
    "Use the incoming user_id inside the HTTP Request URL, so the request changes with every call instead of being fixed.",
  ],
  "04-validation-normalization": [
    "Before predicting validity, work out exactly what each normalisation rule does to each field.",
    "Remember the five rules in play: trim, lowercase, digits only, uppercase, and YYYY-MM-DD.",
    "The phone normaliser strips every non-digit before the length check ever runs. Count the digits that are left.",
  ],
  "05-pagination-large-data": [
    "Changing the page size changes how many records come back per request. It does not change how many records exist.",
    "Divide the total records by the new page size, then round up — the last partial page still needs its own request.",
    "The skip value increases by the page size each time, so the sequence steps in sevens now.",
  ],
  "06-retry-exponential-backoff": [
    "If your delays look like 2, 4, 6, 8, the growth is linear. Exponential backoff doubles: 2, 4, 8, 16.",
    "If the workflow retries forever, look at attempt and max_attempts — and make sure the counter increases before the loop returns to the request.",
    "If a 400 is being retried, inspect the list of status codes you treat as retryable.",
    "If every manual run starts at attempt 1, remember that each manual execution is a brand-new run with fresh state.",
    "If a successful output still carries old failure details, look for where ...$json is copying earlier fields forward.",
  ],
  "07-idempotency-duplicate-protection": [
    "Count the rows in lab07_business_actions for your first challenge event. If there are two, the duplicate was not recognised as one.",
    "Look at processed_events after the first delivery. Was a row written at all? Without it there is nothing for the second delivery to find.",
    "Idempotency depends on a stable identity: the same event must produce the same key every time it arrives. Compare the key Extract Event Identity produced on both deliveries.",
    "Open Check Processed Event on the second delivery and read its output, not its input. Empty means the lookup found nothing — then work backwards: wrong key, wrong filter, or no row written the first time.",
  ],
  "08-dead-letter-queue-failure-recovery": [
    "Start with what is actually in the queue. If you see fewer than two rows, the problem happened before recovery — the events never reached the DLQ.",
    "If Fetch Pending DLQ Event returns nothing, either the id does not exist or the row is no longer pending. Both filters have to match — and remember the ids are yours, not the example values.",
    "A failed recovery is not a completed recovery. If a failed replay ends up marked recovered, ask which node is allowed to change status, and on which branch it sits.",
    "Open Recovery Successful? and follow both outputs. Only the true branch should ever reach Mark DLQ Recovered.",
  ],
  "09-structured-ai-output": [
    "Two challenge messages are easy to place. The third mentions money — decide whether that makes it billing, or what the customer actually wants done.",
    "For your own other message, think about what genuinely fits none of sales, support or billing. The other-inquiry sample shows the flavour; write a different one.",
    "To trigger the fallback on demand, reconnect the simulator you built in Break It. You do not need the model to misbehave on command.",
    "If a route fires but confidence arrives empty, check the field type on that route's Set node. confidence is a Number, not a String.",
  ],
  "10-ai-guardrails-human-in-the-loop": [
    "Two scenarios can go through the live Gemini path. The third specifies a confidence value directly — and you built something in this lab for exactly that.",
    "You need the database ids of your pending requests before you can decide them. Query approval_requests for status pending and work from what is actually there.",
    "Testing that a request cannot be decided twice needs no new mechanism. Send an approval, then send the identical request again and compare the two responses.",
    "If Fetch Pending Approval finds nothing on a first attempt, check the type of approval_id you are sending, and confirm the row's status is still exactly pending.",
  ],
};

export function getChallengeHints(labSlug: string): readonly string[] {
  return CHALLENGE_HINTS[labSlug] ?? [];
}
