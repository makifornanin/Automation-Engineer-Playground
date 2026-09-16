import type { LessonChunk } from "../types";

/** Lab 05 — Pagination & Large Data Processing. Condensed from the lab README. */
export const LAB_05_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [
      {
        type: "prose",
        text: "You call the customers API and get back a tidy list. Five records. Job done.",
      },
      {
        type: "prose",
        text: "Then someone mentions the system has 208 customers. Your workflow is not broken — it politely accepted page one and assumed that was everything.",
      },
      {
        type: "prose",
        text: "Reports built on partial data are worse than no reports, because people trust them. A sync that quietly imports 5 of 208 customers looks like a success in every log you own.",
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
        text: "What is it? Pagination splits a large dataset into batches. Instead of sending 208 customers at once, the API sends a page at a time and waits to be asked for the next one.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Huge responses are slow, memory-hungry and prone to timeouts, so APIs cap how much they return per request. Anything larger than one page has to be retrieved in pieces.",
      },
      {
        type: "prose",
        text: "How does this help a real business? CRMs, order systems, analytics exports and contact lists all paginate. An automation that cannot ask for the rest can only ever work on a sample.",
      },
      {
        type: "code",
        language: "text",
        code: [
          "total  how many records exist in the whole dataset",
          "limit  how many to return per request",
          "skip   how many to jump past before this batch",
        ].join("\n"),
        caption: "skip is a record count, not a page number: skip 10 at limit 5 returns records 11-15.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-manual",
    title: "Build: fetch two pages by hand",
    whyThisMatters: [
      {
        type: "prose",
        text: "Automating pagination first would hide the one thing worth understanding: what actually changes between requests. Doing two pages manually makes that visible.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add a Manual Trigger named Start Lab 05, then an Edit Fields node named Set Pagination Config with limit = 5 and skip = 0, both as numbers.",
      },
      {
        text: "Add an HTTP Request named Fetch First Customer Page calling https://dummyjson.com/users with query parameters limit and skip taken from the config.",
        expect: "total, skip and limit in the response, and five users.",
      },
      {
        text: "Add a Code node named Read Pagination Info that works out where the next page starts and whether one exists.",
        code: {
          language: "javascript",
          code: [
            "const nextSkip = $json.skip + $json.limit;",
            "const hasMore = nextSkip < $json.total;",
            "return { json: { total: $json.total, next_skip: nextSkip, has_more: hasMore } };",
          ].join("\n"),
        },
        expect: "next_skip is 5 and has_more is true.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Look at the total in that first response. That number is the API telling you how much data exists — the one thing a single page cannot tell you on its own.",
      },
    ],
    teaches: [
      {
        subject: "code",
        name: "Working out the next page",
        language: "javascript",
        code: "const nextSkip = $json.skip + $json.limit;\nconst hasMore = nextSkip < $json.total;",
        intent: "Find where the next batch begins, and whether there is a next batch at all.",
        inputs: "skip, limit and total from the page the API just returned.",
        logic:
          "Moving forward by one page means skipping past everything already fetched, which is the current skip plus this page's size. If that position is still below the total, records remain.",
        output: "next_skip 5 and has_more true, after the first page of 208 records.",
        engineeringReason:
          "Pagination is two decisions repeated: where am I, and am I done. Getting either wrong silently loses data or loops forever.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-automatic",
    title: "Build: let the workflow do the counting",
    whyThisMatters: [
      {
        type: "prose",
        text: "Two pages down, ten records. Fetching all 208 by hand means forty more nodes and a rebuild the day the customer count changes. That is data entry with extra steps.",
      },
    ],
    content: [],
    actions: [
      {
        text: "From Set Pagination Config add an HTTP Request named Fetch All Customer Pages with limit = 5, and turn on its pagination option updating a query parameter named skip.",
        code: { language: "javascript", code: "{{ $pageCount * 5 }}" },
      },
      {
        text: "Set the stop condition so it ends once the last record has been reached.",
        code: {
          language: "javascript",
          code: "{{ $response.body.skip + $response.body.limit >= $response.body.total }}",
        },
        expect: "Many output items — one per page, not one per customer.",
      },
      {
        text: "Add a Code node named Combine Customer Records, set to Run Once for All Items, that flattens every page's users into one list.",
        code: {
          language: "javascript",
          code: [
            "const pages = $input.all();",
            "const customers = pages.flatMap(page => page.json.users ?? []);",
            "return [{ json: { pages_fetched: pages.length,",
            "                  total_records: customers.length, customers } }];",
          ].join("\n"),
        },
        expect: "One item carrying pages_fetched, total_records and every customer.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "callout",
        tone: "gotcha",
        title: "Pages are not records",
        text: "The HTTP node's output count is the number of page responses, not customers. Each page holds its own users array, which is why the combine step flattens them before anything downstream treats them as individual records.",
      },
      {
        type: "prose",
        text: "The stop condition is the whole safety of the loop. Without a correct one a pagination loop stops too early, requests duplicates, or runs until a rate limit ends it for you.",
      },
    ],
    teaches: [
      {
        subject: "code",
        name: "Flattening pages into records",
        language: "javascript",
        code: "pages.flatMap(page => page.json.users ?? [])",
        intent: "Turn many page responses into one list of customers.",
        inputs: "Every page item from the HTTP node, each carrying its own users array.",
        logic:
          "flatMap runs the function on every page and joins the resulting arrays into one, rather than producing an array of arrays. The ?? [] guard means a page with no users contributes nothing instead of throwing.",
        output: "One flat customers array, and a count of how many pages it took.",
        engineeringReason:
          "Downstream systems want records, not page structure. Flattening is the moment the API's delivery format stops leaking into your business data.",
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
        text: "The API reports 208 records and you are fetching 5 per request.",
      },
    ],
    prompt: "How many requests will the loop make — and why is it not 41?",
    reveal: [
      {
        type: "prose",
        text: "42. 208 divided by 5 is 41.6, and the final partial page still has to be requested to get its last three records. Rounding down would silently drop them.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "self-check",
    testCaseId: "lab-05-all-pages",
    caseName: "Every page of the customer API is fetched and combined, not just the first",
    content: [
      {
        type: "prose",
        text: "Run the workflow and paste the Combine Customer Records output below. The customers list is large — paste it all, or delete the customers array and keep pages_fetched and total_records.",
      },
      {
        type: "callout",
        tone: "note",
        title: "About the exact numbers",
        text: "The lab was written against 208 records. This is a public API and its dataset can change, so the check looks for evidence that every page was fetched rather than for one exact total.",
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
            text: "Replace the stop condition's total with a hardcoded 10.",
            code: {
              language: "javascript",
              code: "{{ $response.body.skip + $response.body.limit >= 10 }}",
            },
          },
          {
            text: "Run it again and read pages_fetched and total_records.",
            expect: "2 pages and 10 records.",
          },
          {
            text: "Check the execution for errors.",
            expect: "There are none.",
          },
        ],
      },
      {
        type: "prose",
        text: "The workflow completed successfully and imported roughly five percent of your customers.",
      },
    ],
  },
  {
    kind: "debug",
    id: "debug-it",
    title: "Work out why",
    content: [
      {
        type: "actions",
        items: [
          {
            text: "Compare what you expected against what you got, before touching anything.",
            expect: "Around 208 expected, 10 received.",
          },
          {
            text: "Rule things out: did the API fail, did a node error, what changed most recently?",
          },
          {
            text: "Restore the stop condition to compare against the response's own total.",
            expect: "Every page fetched again.",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "No error does not mean correct",
        text: "Technical failures throw. Logic failures complete. This one produced green nodes, a clean execution and a dataset that is missing most of its rows — which is precisely why pagination bugs survive into production.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: change the page size",
    hintCount: 3,
    testCaseId: "lab-05-page-size-seven",
    caseName: "A larger page size needs fewer requests but still retrieves every record",
    content: [
      {
        type: "prose",
        text: "Change the page size from 5 to 7. Before you run it, predict how many requests it will take, what the first few skip values will be, and how many records you will end up with.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "The page size lives in two places",
        text: "It is in the limit query parameter and in the $pageCount multiplier. Change one without the other and the loop either skips records or re-fetches them.",
      },
    ],
    verification: [
      "the request count drops, because each page carries more records",
      "the skip sequence begins 0, 7, 14, 21, 28",
      "the total record count does not change at all",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "Your workflow can retrieve a dataset of any size. It asks for a page, reads where it is, moves forward, and stops at exactly the right moment — then flattens the pages into individual records something downstream can use.",
      },
      {
        type: "prose",
        text: "You also saw that page size changes how many requests a job takes, never how much data exists, and that the most dangerous pagination bug is the one that returns a smaller dataset without complaining.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "You are now making a lot of requests, and every one is a chance for something to go wrong. Page 37 hits a rate limit and the whole run dies with 180 records fetched and nothing to show for them.",
      },
      {
        type: "prose",
        text: "Lab 06 makes it survive that.",
      },
    ],
  },
];
