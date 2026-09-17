import type { LessonChunk } from "../types";

/** Lab 04 — Validation & Normalization. Condensed from the lab README. */
export const LAB_04_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [
      {
        type: "prose",
        text: "A lead arrives from your shiny new webhook: a name of three spaces, an email with no @, and a phone number three digits long.",
      },
      {
        type: "code",
        language: "json",
        code: '{ "name": "   ", "email": "danareyesexample.com", "phone": "123" }',
      },
      {
        type: "prose",
        text: "Your workflow, being helpful, saves it to the CRM anyway.",
      },
      {
        type: "prose",
        text: "Bad data does not announce itself. It sits in the CRM looking like a real lead until somebody tries to email it, call it, or report on it — by which time it has been copied into three other systems and nobody remembers where it came from.",
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
        text: "What is it? Normalisation converts incoming data into one consistent format. Validation decides whether the data is acceptable. They are different jobs and they happen in that order.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Anyone who can reach your webhook can send you anything — missing fields, stray spaces, inconsistent capitalisation, impossible dates. Trusting that input is how bad records get in.",
      },
      {
        type: "prose",
        text: "How does this help a real business? Duplicate contacts, failed API calls, broken reports and bounced email all start as data somebody accepted without checking.",
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "Normalised does not mean valid",
        text: "31/02/2026 normalises perfectly into 2026-02-31. The format is now exactly right, and the date still does not exist. Cleaning is not checking.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-normalize",
    title: "Build: clean it before you judge it",
    whyThisMatters: [
      {
        type: "prose",
        text: "Validating raw input means writing rules that cope with every way a value can be untidy. Clean first and the rules get to be simple and strict.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Create a workflow with a Webhook node named Receive Lead Request on path aep-lab-04-lead, responding through a Respond to Webhook node.",
      },
      {
        text: "Add a Code node named Normalize Lead Data, set to Run Once for Each Item.",
      },
      {
        text: "Clean each field by its own rule, and keep the original input alongside the cleaned version.",
        code: {
          language: "javascript",
          code: [
            "name:    String(input.name ?? '').trim(),",
            "email:   String(input.email ?? '').trim().toLowerCase(),",
            "phone:   String(input.phone ?? '').replace(/\\D/g, ''),",
            "country: String(input.country ?? '').trim().toUpperCase(),",
          ].join("\n"),
        },
        expect: "A normalized object beside a raw_input object.",
      },
      {
        text: "Convert DD/MM/YYYY dates to YYYY-MM-DD, and leave anything you do not recognise untouched.",
        expect: "08/09/2026 becomes 2026-09-08.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Keeping raw_input costs nothing and answers the only question that matters when this misbehaves: what arrived, and what did the workflow turn it into?",
      },
      {
        type: "prose",
        text: "Note the date rule refuses to guess. An unrecognised format passes through unchanged so validation can reject it, rather than being quietly converted into a date nobody sent.",
      },
    ],
    teaches: [
      {
        subject: "code",
        name: "Reducing a phone number to digits",
        language: "javascript",
        code: "String(input.phone ?? '').replace(/\\D/g, '')",
        intent: "Turn every way a human might write a phone number into one comparable value.",
        inputs: "The raw phone field, which may be missing, or carry spaces, brackets, dashes and a country prefix.",
        logic:
          "\\D matches anything that is not a digit, and the g flag replaces every occurrence — so punctuation and spaces all disappear and only the numbers survive. The ?? '' guard means a missing field becomes an empty string rather than throwing.",
        output: "+63 (917) 555-1234 becomes 639175551234.",
        engineeringReason:
          "Two systems holding the same number in different formats cannot match it. Normalising on the way in is what makes later deduplication and lookup possible at all.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-validate",
    title: "Build: decide what you will accept",
    whyThisMatters: [
      {
        type: "prose",
        text: "A validator that returns only true or false tells the caller they were wrong without telling them how. Useful validation explains itself.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add a Code node named Validate Lead Data that collects errors into an array rather than returning on the first one.",
        code: {
          language: "javascript",
          code: [
            "const errors = [];",
            "if (!data.name)  errors.push('name is required');",
            "if (data.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email))",
            "  errors.push('email is invalid');",
            "return { json: { ...$json, validation: { is_valid: errors.length === 0, errors } } };",
          ].join("\n"),
        },
      },
      {
        text: "Check the phone has 10 to 15 digits, and check the date is a calendar date that really exists.",
        expect: "2026-02-31 is rejected even though its format is correct.",
      },
      {
        text: "Add an IF node named Is Lead Valid? testing validation.is_valid.",
      },
      {
        text: "Respond 200 with the cleaned data on TRUE, and 400 with the error list on FALSE.",
        expect: "A valid lead returns Lead accepted.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Missing and malformed are different problems and deserve different messages. An empty email is the caller forgetting a field; a broken one is the caller getting it wrong. Telling them apart turns a support ticket into a one-line fix.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Why 400 and not 500",
        text: "400 Bad Request says the request was the problem. 500 would claim your automation broke, sending someone to debug a workflow that behaved perfectly.",
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
        text: "You are about to send a lead whose date is 31/02/2026 and whose phone is 123.",
      },
    ],
    prompt: "Which of those two survives normalisation, and which errors come back?",
    reveal: [
      {
        type: "prose",
        text: "Both survive normalisation. 31/02/2026 becomes 2026-02-31 — correctly formatted and impossible — and 123 stays 123 because stripping non-digits leaves it unchanged.",
      },
      {
        type: "prose",
        text: "Validation is what catches them: the date is not a real calendar day, and the phone is below the ten-digit floor. Cleaning made them tidy. It did not make them true.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "send-test",
    testCaseId: "lab-04-lead-accepted",
    payload: { name: "   Dana Reyes   ", email: "  DANA.REYES@EXAMPLE.COM ", phone: "0917 555 0142", country: " ph ", preferred_contact_date: "08/09/2026" },
    expected: "HTTP 200 and Lead accepted, with every field cleaned into one consistent format.",
    caseName: "A messy but valid lead is cleaned up and accepted",
    content: [
      {
        type: "prose",
        text: "Activate your workflow, save its Production URL below, then send the test. AEP posts this lab's sample request to your own n8n and checks what your workflow answers. This is the messy-but-valid lead below.",
      },
      {
        type: "code",
        language: "json",
        code: [
          "{",
          '  "name": "   Dana Reyes   ",',
          '  "email": "  DANA.REYES@EXAMPLE.COM ",',
          '  "phone": "0917 555 0142",',
          '  "country": " ph ",',
          '  "preferred_contact_date": "08/09/2026"',
          "}",
        ].join("\n"),
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
            text: "Send a lead whose email field is named email_address instead of email, but is otherwise perfectly valid.",
            code: {
              language: "json",
              code: '{ "name": "Jamie Cruz", "email_address": "jamie@example.com", "phone": "09175550142", "preferred_contact_date": "08/09/2026" }',
            },
            expect: "email is required — for a payload that clearly contains one.",
          },
          {
            text: "Read the raw_input in the normalize node output and compare it against what the code reads.",
          },
        ],
      },
      {
        type: "prose",
        text: "The email is right there in the request. The workflow still says it is missing, and it is not wrong.",
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
            text: "Which exact key does the normalizer read, and which exact key did the caller send?",
            expect: "It reads email. The caller sent email_address.",
          },
          {
            text: "Decide whether the fix belongs in your workflow or in the caller.",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "This is a data contract, not a bug",
        text: "email and email_address are different keys. Nothing infers that they mean the same thing. A data contract is the agreement about what fields exist, what they are called, which are required and what format they use — and most integration failures are two systems disagreeing about it.",
      },
      {
        type: "prose",
        text: "Check the incoming payload before you change any logic. The rule was right; the assumption about the field name was not.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: predict every field",
    hintCount: 3,
    testCaseId: "lab-04-challenge-lead",
    caseName: "An international lead with a formatted phone number is normalised and accepted",
    content: [
      {
        type: "prose",
        text: "Before you send this, write down what each field will become and whether the lead will be accepted.",
      },
      {
        type: "code",
        language: "json",
        code: [
          "{",
          '  "name": "   Alex Rivera   ",',
          '  "company": "   Northstar Commerce   ",',
          '  "email": "  ALEX.RIVERA@EXAMPLE.COM ",',
          '  "phone": "+63 (917) 555-1234",',
          '  "country": " au ",',
          '  "preferred_contact_date": "9/9/2026"',
          "}",
        ].join("\n"),
      },
      {
        type: "callout",
        tone: "warning",
        title: "Two of these are traps",
        text: "The phone has brackets, spaces, a dash and a country prefix, and still has to pass the ten-digit rule. The date has single-digit day and month, which have to be padded rather than left as 2026-9-9.",
      },
    ],
    verification: [
      "the lead is accepted with HTTP 200",
      "the optional company field is kept and trimmed, not required",
      "the phone survives as twelve digits rather than being rejected",
      "the date is padded to 2026-09-09",
      "country is uppercased to AU",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "Your workflow now decides what it will accept. Incoming data is cleaned into one consistent shape, checked against rules you wrote down, and either passed on or refused with an explanation.",
      },
      {
        type: "prose",
        text: "You separated cleaning from judging, told missing apart from malformed, kept the raw input for debugging, and met the failure mode that sinks most integrations: two systems quietly disagreeing about a field name.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "Bad data now gets rejected with a clear reason, and good data arrives in a predictable shape. But valid and complete are not the same thing.",
      },
      {
        type: "prose",
        text: "A request can pass every check you wrote and still be missing most of the data, because the API only sent you the first page of it. Your validation would happily approve 5 customers out of 208 — and it would be right, technically. Lab 05 goes back for the rest.",
      },
    ],
  },
];
