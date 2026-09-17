import type { LessonChunk } from "../types";

/** Lab 06 — Retry Logic & Exponential Backoff. Condensed from the lab README. */
export const LAB_06_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [
      {
        type: "prose",
        text: "Your workflow calls a payment API. The API is having a bad afternoon and returns a 503.",
      },
      {
        type: "prose",
        text: "Your automation gives up, marks the job failed, and moves on. Two seconds later the API is perfectly fine. Nothing was actually wrong — you just asked at the worst possible moment.",
      },
      {
        type: "prose",
        text: "Most integration failures are temporary. Treating them as permanent drops real work for no reason. But naive retries are their own disaster: hammering a struggling service every 100ms is how a brief wobble becomes a full outage.",
      },
    ],
  },
  {
    kind: "concept",
    id: "concept",
    title: "The concept",
    content: [
      {
        type: "prose",
        text: "What is it? Retry logic tries a failed request again, automatically. Exponential backoff waits longer after each failure, and a maximum attempt limit guarantees it stops.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Temporary failures — a rate limit, a brief outage, a timeout — recover on their own if you give them a moment. Without retries, recoverable work gets dropped and someone re-runs it by hand.",
      },
      {
        type: "prose",
        text: "How does this help a real business? A booking, a payment or an order reaches its destination even when the destination hiccups, and nobody has to resubmit anything.",
      },
      {
        type: "code",
        language: "text",
        code: [
          "Retry these      429 Too Many Requests, 500, 502, 503, 504",
          "Do not retry     400 Bad Request, 401, 403, 404",
        ].join("\n"),
        caption: "Retrying a broken request just produces the same failure more slowly.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-detect",
    title: "Build: notice the failure and judge it",
    whyThisMatters: [
      {
        type: "prose",
        text: "The first decision is not whether to retry. It is whether this failure could possibly recover — because retrying a 400 forever is still a bug, just a patient one.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add a Manual Trigger named Start Lab 06, then an Edit Fields node named Set Retry Config with its Mode set to JSON and this config.",
        code: {
          language: "json",
          code: [
            "{",
            "  \"scenario\": \"eventual_success\",",
            "  \"max_attempts\": 4,",
            "  \"success_on_attempt\": 3,",
            "  \"base_delay_seconds\": 1,",
            "  \"attempt\": 1",
            "}",
          ].join("\n"),
        },
      },
      {
        text: "Add a Code node named Simulate API Request. It returns predictable 429, 503 and 200 responses so the lab does not depend on a genuinely unreliable service.",
        code: {
          language: "javascript",
          code: [
            "const attempt = $json.attempt;",
            "const successOnAttempt = $json.success_on_attempt;",
            "const scenario = $json.scenario;",
            "",
            "let statusCode;",
            "let message;",
            "",
            "if (scenario === 'non_retryable_failure') {",
            "  statusCode = 400;",
            "  message = 'Bad request';",
            "} else if (scenario === 'permanent_failure') {",
            "  statusCode = 503;",
            "  message = 'Service unavailable';",
            "} else if (attempt >= successOnAttempt) {",
            "  statusCode = 200;",
            "  message = 'Request successful';",
            "} else if (attempt === 1) {",
            "  statusCode = 429;",
            "  message = 'Too many requests';",
            "} else {",
            "  statusCode = 503;",
            "  message = 'Service unavailable';",
            "}",
            "",
            "return {",
            "  json: {",
            "    ...$json,",
            "    response: {",
            "      status_code: statusCode,",
            "      message",
            "    }",
            "  }",
            "};",
          ].join("\n"),
        },
      },
      {
        text: "Add an IF node named Was Request Successful? with the Number condition {{ $json.response.status_code }} is equal to 200.",
      },
      {
        text: "On false, add a Code node named Classify Failure that marks the failure retryable only for 429, 500, 502, 503 and 504.",
        code: {
          language: "javascript",
          code: [
            "const statusCode = $json.response.status_code;",
            "",
            "const retryableStatusCodes = [429, 500, 502, 503, 504];",
            "",
            "const isRetryable = retryableStatusCodes.includes(statusCode);",
            "",
            "return {",
            "  json: {",
            "    ...$json,",
            "    failure: {",
            "      status_code: statusCode,",
            "      retryable: isRetryable",
            "    }",
            "  }",
            "};",
          ].join("\n"),
        },
        expect: "failure.retryable is true for a 429.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "A simulator is the right tool here, not a shortcut. Retry behaviour is only testable when you can make a service fail on demand and in a known order; a real flaky API would teach you to distrust your own tests.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-retry-loop",
    title: "Build: wait, then try again — within a limit",
    whyThisMatters: [
      {
        type: "prose",
        text: "Retrying instantly is not patience, it is impatience with a loop around it. The struggling service now has two requests instead of one.",
      },
    ],
    content: [],
    actions: [
      {
        text: "After Classify Failure, add a Code node named Log Failed Attempt that records every failure. Return Success counts this log to report retries.",
        code: {
          language: "javascript",
          code: [
            "const retryLog = $json.retry_log ?? [];",
            "",
            "retryLog.push({",
            "  attempt: $json.attempt,",
            "  status_code: $json.response.status_code,",
            "  message: $json.response.message",
            "});",
            "",
            "return {",
            "  json: {",
            "    ...$json,",
            "    retry_log: retryLog",
            "  }",
            "};",
          ].join("\n"),
        },
      },
      {
        text: "Add an IF node named Should Retry? with two conditions and AND between them.",
        code: {
          language: "text",
          code: [
            "{{ $json.failure.retryable }}  Boolean  is true",
            "{{ $json.attempt }}           Number   is less than  {{ $json.max_attempts }}",
          ].join("\n"),
        },
      },
      {
        text: "On true, add a Code node named Calculate Backoff that doubles the delay each attempt and adds up to a second of jitter.",
        code: {
          language: "javascript",
          code: [
            "const attempt = $json.attempt;",
            "const baseDelay = $json.base_delay_seconds;",
            "",
            "const backoffSeconds =",
            "  baseDelay * Math.pow(2, attempt - 1);",
            "",
            "// Add up to 1 second of random jitter",
            "const jitterSeconds = Math.random();",
            "",
            "const delaySeconds =",
            "  backoffSeconds + jitterSeconds;",
            "",
            "return {",
            "  json: {",
            "    ...$json,",
            "    retry: {",
            "      backoff_seconds: backoffSeconds,",
            "      jitter_seconds: jitterSeconds,",
            "      delay_seconds: delaySeconds",
            "    }",
            "  }",
            "};",
          ].join("\n"),
        },
      },
      {
        text: "Add a Wait node named Wait Before Retry (Resume: After Time Interval, Wait Amount {{ $json.retry.delay_seconds }}, Wait Unit: Seconds), then a Code node named Increase Retry Counter, and connect it back into Simulate API Request.",
        code: {
          language: "javascript",
          code: [
            "return {",
            "  json: {",
            "    ...$json,",
            "    attempt: $json.attempt + 1",
            "  }",
            "};",
          ].join("\n"),
        },
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "That last connection is the retry loop, and it happens inside one execution. Running the workflow again yourself is not a retry — it is a fresh start from attempt 1.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Why jitter",
        text: "If a thousand clients hit the same outage and all back off by exactly four seconds, they all return at the same instant and cause a second spike. A little randomness spreads them out.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "Wait",
        what: "Pauses the workflow for a set time, then carries on from where it left off.",
        whyHere:
          "Everything before it calculated how long to wait. Without this node that number is just JSON, and the retry fires instantly.",
        businessReason:
          "Backing off is what keeps your automation from turning another company's brief outage into a longer one — and keeps your API key from being revoked.",
        analogy: "The part of a retry that actually has manners.",
      },
      {
        subject: "code",
        name: "Exponential backoff",
        language: "javascript",
        code: "base_delay_seconds * 2 ** (attempt - 1)",
        intent: "Wait progressively longer after each failure.",
        inputs: "The base delay from config and the current attempt number.",
        logic:
          "2 ** (attempt - 1) is 1, 2, 4, 8 for attempts 1 to 4. Multiplying rather than adding means the gaps grow quickly: 2, 4, 8, 16 rather than 2, 4, 6, 8.",
        output: "With a base of 1: waits of 1, 2 and 4 seconds before retries.",
        engineeringReason:
          "A service that is overloaded needs time more than it needs requests. Linear delays keep up the pressure; exponential ones step back hard enough to let it recover.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-report",
    title: "Build: report how it ended",
    whyThisMatters: [
      {
        type: "prose",
        text: "A retry loop that ends silently leaves someone guessing whether the work happened. Each exit reports what it knows: the final status, how many attempts it took, and every failure along the way.",
      },
    ],
    content: [],
    actions: [
      {
        text: "On the true branch of Was Request Successful?, add a Code node named Return Success.",
        code: {
          language: "javascript",
          code: [
            "const retryLog = $json.retry_log ?? [];",
            "",
            "return {",
            "  json: {",
            "    success: true,",
            "    final_status_code: $json.response.status_code,",
            "    message: $json.response.message,",
            "    attempts_used: $json.attempt,",
            "    retries_performed: retryLog.length,",
            "    retry_log: retryLog",
            "  }",
            "};",
          ].join("\n"),
        },
        expect: "429, then 503, then 200 — inside a single execution.",
      },
      {
        text: "On the false branch of Should Retry?, add a Code node named Return Permanent Failure for requests that could not be saved.",
        code: {
          language: "javascript",
          code: [
            "const retryLog = $json.retry_log ?? [];",
            "const isRetryable = $json.failure?.retryable ?? false;",
            "",
            "const message = isRetryable",
            "  ? 'Request failed after maximum retry attempts'",
            "  : 'Request failed with a non-retryable error';",
            "",
            "return {",
            "  json: {",
            "    success: false,",
            "    final_status_code: $json.response.status_code,",
            "    message,",
            "    attempts_used: $json.attempt,",
            "    failed_attempts: retryLog.length,",
            "    retries_performed: Math.max($json.attempt - 1, 0),",
            "    retry_log: retryLog",
            "  }",
            "};",
          ].join("\n"),
        },
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Two exits, and both carry the retry log. When a request finally succeeds, the log shows the outage it rode out; when it fails for good, the log is the evidence someone needs to decide what to do next.",
      },
    ],
  },
  {
    kind: "predict",
    id: "predict",
    title: "Before you run it",
    content: [
      {
        type: "prose",
        text: "The simulator fails with a 429, then a 503, then succeeds on attempt 3. max_attempts is 4.",
      },
    ],
    prompt: "How many attempts does it use, and how many retries is that?",
    reveal: [
      {
        type: "prose",
        text: "Three attempts, two retries. The first attempt is the original request, not a retry — so attempts and retries are always one apart when the request eventually succeeds.",
      },
      {
        type: "prose",
        text: "That distinction sounds pedantic until someone reports 'it retried three times' when it retried twice, and you spend an afternoon looking for a retry that never happened.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "self-check",
    testCaseId: "lab-06-eventual-success",
    caseName: "A request that fails twice recovers on its own without anyone resubmitting it",
    expected: "success is true with a final 200, after three attempts and two retries.",
    content: [
      {
        type: "prose",
        text: "Run the workflow with the eventual_success config and paste the Return Success output below.",
      },
    ],
  },
  {
    kind: "break-it",
    id: "break-it",
    title: "Now break it on purpose",
    content: [
      {
        type: "actions",
        items: [
          {
            text: "Lower max_attempts from 4 to 2, leaving success_on_attempt at 3.",
          },
          {
            text: "Run it again.",
            expect: "Two failed attempts, then it stops — never reaching attempt 3.",
          },
        ],
      },
      {
        type: "prose",
        text: "The service would have recovered on the very next attempt. Your limit gave up one request too early and turned a recoverable blip into a permanent failure.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Retry limits are a trade-off, not a setting",
        text: "Too many retries waste resources and hold work up for minutes. Too few drop recoverable requests. The right number depends on how long the thing you are calling tends to be unwell.",
      },
    ],
  },
  {
    kind: "debug",
    id: "debug-it",
    title: "Work out why",
    content: [
      {
        type: "prose",
        text: "A classic retry confusion: you run the workflow manually three times, and attempt reads 1 every single time. You expected 1, 2, 3.",
      },
      {
        type: "actions",
        items: [
          {
            text: "Find the node that sets attempt, and notice where every manual run begins.",
            expect: "Set Retry Config resets attempt to 1.",
          },
          {
            text: "Decide where the counter has to live for it to survive between attempts.",
            expect: "Inside one execution, carried round the loop.",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "A new execution does not remember the last one",
        text: "Retries have to happen inside a single run. Each manual execution starts from the top with fresh state — which is also why Lab 07 needs a database to remember anything across runs at all.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: a longer outage",
    hintCount: 5,
    testCaseId: "lab-06-challenge-recovery",
    caseName: "A longer outage still recovers, inside a higher attempt limit",
    content: [
      {
        type: "prose",
        text: "Before running, predict the status sequence and the base wait before each retry.",
      },
      {
        type: "code",
        language: "json",
        code: [
          "{",
          '  "scenario": "eventual_success",',
          '  "max_attempts": 5,',
          '  "success_on_attempt": 4,',
          '  "base_delay_seconds": 2,',
          '  "attempt": 1',
          "}",
        ].join("\n"),
      },
      {
        type: "callout",
        tone: "warning",
        title: "Your delays will not be round numbers",
        text: "Jitter adds up to a second of randomness to every wait. Check the base backoff sequence, not the exact delay.",
      },
    ],
    verification: [
      "the status sequence is 429, 503, 503, then 200",
      "the base backoff sequence is 2, 4, 8 — doubling, not adding",
      "four attempts are used, three of them retries",
      "the request succeeds inside a single execution",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "Your workflow recovers from temporary failures on its own. It tells recoverable errors from permanent ones, waits longer after each failure, adds jitter so it does not stampede, and stops deliberately at a limit.",
      },
      {
        type: "prose",
        text: "You also learned the two things that make retry systems go wrong in practice: confusing attempts with retries, and expecting state to survive between separate executions.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "Now consider what a retry actually is: doing the same thing a second time.",
      },
      {
        type: "prose",
        text: "If the first attempt failed after charging the customer — a timeout on the response, not the request — your retry charges them again. From the outside a retry is indistinguishable from a duplicate. Lab 07 makes sure the same event can only ever act once.",
      },
    ],
  },
];
