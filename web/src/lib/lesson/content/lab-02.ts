import type { LessonChunk } from "../types";

/**
 * Lab 02 — Conditions & Routing.
 *
 * Condensed from the lab README, typed rather than parsed from disk for the
 * reasons given in lab-01.ts.
 */
export const LAB_02_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "Send each lead to the right team",
    content: [
      {
        type: "prose",
        text: "Five leads arrive. One is a hot prospect with a $5,000 budget. One is a tyre kicker. One has already been contacted three times this month.",
      },
      {
        type: "prose",
        text: "Right now your workflow treats all three exactly the same. Sales is not going to thank you for that.",
      },
      {
        type: "prose",
        text: "Almost no business treats every record identically. High-value leads need someone on the phone today; warm leads need nurturing; cold leads need a mailing list and patience.",
      },
      {
        type: "prose",
        text: "Send everything down one path and either your best leads wait in a queue, or your team spends the day on the wrong ones. A workflow that cannot decide is just an expensive pipe.",
      },
    ],
  },
  {
    kind: "concept",
    id: "concept",
    title: "Turn conditions into routes",
    content: [
      {
        type: "prose",
        text: "What is it? A condition lets the workflow inspect a record and choose what happens next, instead of sending everything the same way.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Businesses rarely treat every record the same. High-value leads may need immediate follow-up, warm leads manual review, everything else a nurture sequence — and something has to decide which is which.",
      },
      {
        type: "prose",
        text: "How does this help a real business? Conditions are the decision layer under lead routing, support triage, approvals, order processing, onboarding, risk checks and AI workflows. Clean data only becomes useful once something acts differently on it.",
      },
      {
        type: "diagram",
        ascii: [
          "Sample Leads",
          "      |",
          "Check Priority Sales --TRUE--> Priority Sales",
          "      | FALSE",
          "Check Warm Lead ------TRUE--> Nurture",
          "      | FALSE",
          "Low Priority",
        ].join("\n"),
        alt: "Leads flow into Check Priority Sales. True goes to Priority Sales; false falls through to Check Warm Lead, whose true goes to Nurture and whose false goes to Low Priority.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-leads",
    title: "Build: three leads that disagree with each other",
    whyThisMatters: [
      {
        type: "prose",
        text: "Routing logic is only as good as the cases you test it against. Three leads that each belong somewhere different will expose a wrong rule immediately; three similar ones would pass a broken workflow.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Create a workflow named AEP Lab 02 - Conditions & Routing with a Manual Trigger.",
      },
      {
        text: "Add a Code node after it, rename it Sample Leads, and set it to Run Once for All Items.",
      },
      {
        text: "Return three leads that differ in temperature, budget and contact history.",
        code: {
          language: "javascript",
          code: [
          "return [",
            '  { json: { name: "Alex Rivera", lead_temperature: "Hot",',
            "            budget: 5000, contacted_before: false } },",
            '  { json: { name: "Jamie Lee",  lead_temperature: "Warm",',
            "            budget: 2500, contacted_before: false } },",
            '  { json: { name: "Taylor Kim", lead_temperature: "Cold",',
            "            budget: 800,  contacted_before: true } }",
          "];",
          ].join("\n"),
        },
        expect: "Three separate items, not one item containing three leads.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Each lead becomes its own n8n item, and the IF node will evaluate each one independently. That is why the node returns an array of objects with a json key rather than one object holding a list.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "Code",
        what: "Runs JavaScript over the items passing through, and returns whatever items you build.",
        whyHere:
          "It is standing in for a lead source, producing three deliberately different records you control.",
        businessReason:
          "Test data that covers the real decision boundaries is how routing bugs get caught before a customer does.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-routing",
    title: "Build: teach it to decide",
    whyThisMatters: [
      {
        type: "prose",
        text: "Priority Sales is expensive: it puts a human on the phone. The business rule says a lead earns that only when it is hot AND well-funded AND not already chased. All three, not any.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add an IF node after Sample Leads and rename it Check Priority Sales.",
      },
      {
        text: "Add three conditions, picking each operator under the right type — String, Number or Boolean — and leave the dropdown between the conditions on AND.",
        code: {
          language: "text",
          code: [
            "lead_temperature  String   is equal to                  Hot",
            "budget            Number   is greater than or equal to  3000",
            "contacted_before  Boolean  is false",
            "",
            "A Boolean compared as a String fails with: Wrong type: 'false' is a boolean but was expecting a string",
          ].join("\n"),
        },
      },
      {
        text: "From its true output add an Edit Fields node named Priority Sales. Set route to Priority Sales and switch Include Other Input Fields on, so the lead's own fields travel with it.",
      },
      {
        text: "From false add another IF named Check Warm Lead (lead_temperature is equal to Warm), then Nurture on true and Low Priority on false, each setting route the same way.",
        expect: "Alex to Priority Sales, Jamie to Nurture, Taylor to Low Priority.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "The fallback branch matters as much as the rules. Without a Low Priority path, a lead matching nothing would simply stop — handled by no one, and invisible because nothing failed.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Order is part of the logic",
        text: "Specific rules go before general ones. Send every warm lead straight to Nurture and a warm lead that should have had Manual Review will never reach that check — you meet exactly this in the challenge.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "IF",
        what: "Evaluates conditions against each item and sends it out of the true or the false output.",
        whyHere:
          "It is the decision itself: this is where a lead stops being data and becomes a routing outcome.",
        businessReason:
          "Every approval, triage and escalation rule in a business is a condition somebody wrote down.",
        analogy: "A receptionist sending each visitor to the right department.",
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
        text: "Jamie is warm, has a $2,500 budget, and has not been contacted. One of those three facts satisfies the Priority Sales rule.",
      },
    ],
    prompt:
      "With AND between the conditions, how many of the three leads reach Priority Sales — and which ones?",
    reveal: [
      {
        type: "prose",
        text: "Exactly one: Alex. Jamie fails on temperature and budget, Taylor fails on all three. AND means every condition has to hold, so satisfying one is worth nothing.",
      },
      {
        type: "prose",
        text: "Hold on to that number. It is about to change without anything turning red.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "self-check",
    testCaseId: "lab-02-priority-sales",
    caseName: "Only the genuinely hot, high-budget, uncontacted lead reaches Priority Sales",
    expected: "Exactly one lead in Priority Sales — the hot, high-budget one nobody has contacted yet — tagged with its route.",
    content: [
      {
        type: "prose",
        text: "Run the workflow, open the Priority Sales node, and paste its output below. What matters here is not just which lead arrived — it is how many did.",
      },
    ],
  },
  {
    kind: "break-it",
    id: "break-it",
    title: "Now break it on purpose",
    content: [
      {
        type: "prose",
        text: "This is the most valuable bug in the course, because nothing about it looks like a bug.",
      },
      {
        type: "actions",
        items: [
          {
            text: "Open Check Priority Sales and change the dropdown between its conditions from AND to OR.",
          },
          {
            text: "Run the workflow again and look at the Priority Sales node.",
            expect: "Two leads now, where there was one.",
          },
          {
            text: "Check the execution for errors.",
            expect: "None. Every node is green.",
          },
        ],
      },
      {
        type: "prose",
        text: "Jamie has now been handed to your sales team as a hot, high-budget prospect. She is neither.",
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
            text: "Which lead was routed incorrectly, and which single condition let it through?",
            expect: "Jamie, on contacted_before being false.",
          },
          {
            text: "Write out the three results for Jamie and combine them with OR.",
            code: { language: "text", code: "FALSE OR FALSE OR TRUE  ->  TRUE" },
          },
          {
            text: "Set the dropdown back to AND and run it again.",
            expect: "One lead in Priority Sales.",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "A green execution is not a correct one",
        text: "No node failed. No error appeared. The workflow did exactly what it was configured to do, and the business result was still wrong. That is the difference between a technical failure and a logic bug — and only the second kind gets past your monitoring.",
      },
      {
        type: "prose",
        text: "The habit worth keeping: do not ask whether the workflow ran. Ask whether the right record reached the right destination.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: Smart Lead Routing",
    hintCount: 5,
    testCaseId: "lab-02-manual-review",
    caseName: "Every warm lead that qualifies on budget OR country reaches Manual Review",
    content: [
      {
        type: "prose",
        text: "Add a fourth route. Warm leads are no longer all the same: some deserve a human look before nurture.",
      },
      {
        type: "code",
        language: "text",
        code: [
          "Priority Sales   Hot AND budget >= 3000 AND not contacted before",
          "Manual Review    Warm AND (budget >= 4000 OR country = AU)",
          "Nurture          Warm, but not qualifying above",
          "Low Priority     everything else",
        ].join("\n"),
      },
      {
        type: "prose",
        text: "Replace the code in Sample Leads with these seven leads, add the Manual Review route, run the workflow, and paste the Manual Review node's output below.",
      },
      {
        type: "code",
        language: "javascript",
        code: [
          "return [",
          "  { json: { name: \"Alex Rivera\", lead_temperature: \"Hot\", budget: 5000, contacted_before: false, country: \"AU\" } },",
          "  { json: { name: \"Dana Reyes\", lead_temperature: \"Hot\", budget: 5000, contacted_before: false, country: \"Pilipins\" } },",
          "  { json: { name: \"Jamie Lee\", lead_temperature: \"Warm\", budget: 4200, contacted_before: false, country: \"AU\" } },",
          "  { json: { name: \"Jordan Patel\", lead_temperature: \"Warm\", budget: 4500, contacted_before: false, country: \"US\" } },",
          "  { json: { name: \"Casey Wong\", lead_temperature: \"Warm\", budget: 2000, contacted_before: false, country: \"AU\" } },",
          "  { json: { name: \"Taylor Kim\", lead_temperature: \"Warm\", budget: 1500, contacted_before: true, country: \"US\" } },",
          "  { json: { name: \"Morgan Cruz\", lead_temperature: \"Cold\", budget: 6000, contacted_before: false, country: \"AU\" } }",
          "];",
        ].join("\n"),
      },
      {
        type: "callout",
        tone: "warning",
        title: "One well-chosen test case beats three lucky ones",
        text: "Jamie satisfies both Manual Review conditions, so she would pass whether you used AND or OR. Jordan qualifies on budget alone and Casey on country alone — those two are what actually prove the OR is an OR.",
      },
    ],
    verification: [
      "exactly three leads reach Manual Review",
      "Jordan qualifies on budget alone and Casey on country alone",
      "Taylor is warm but qualifies for neither, and lands in Nurture",
      "Morgan matches nothing and lands in Low Priority",
      "no lead reaches a route it does not qualify for",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "Your workflow makes decisions now. It reads a record, applies a business rule, and sends it somewhere different depending on the answer — with a fallback so nothing falls through the floor.",
      },
      {
        type: "prose",
        text: "You used AND where every condition must hold and OR where any will do, and you saw why rule order changes the outcome even when every individual rule is right.",
      },
      {
        type: "prose",
        text: "The lesson that transfers furthest: a workflow can execute perfectly and still be wrong. You produced that failure deliberately, found it from the data rather than from an error message, and fixed it.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "Your workflow can shape data and decide what to do with it. All of it still happens inside n8n, though — you press a button, it runs, and the outside world never hears about any of it.",
      },
      {
        type: "prose",
        text: "Real automations get woken up by other systems and have to answer them. Lab 03 connects your workflow to the outside world.",
      },
    ],
  },
];
