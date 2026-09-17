import type { LessonChunk } from "../types";

/**
 * Lab 01 — Data Mapping & Transformation.
 *
 * Typed here rather than parsed from the lab's README on disk at runtime, for
 * two reasons that are both real:
 *
 * 1. A `- **Difficulty:** Beginner` line sits directly under each lab's H1,
 *    immediately above the Hook the Problem chunk draws from. Vision §16
 *    forbids surfacing difficulty anywhere in the product, and a parser is one
 *    careless selector away from lifting it.
 * 2. Reading files chosen by a URL slug would re-create the path-traversal
 *    surface `/labs/[slug]` was deliberately built to avoid.
 *
 * The copy is condensed from the lab's own README — the owner's voice — not
 * authored fresh.
 *
 * Sources: Problem from `## The Hook` + `## The Business Problem`. Concept
 * from `## 2. Simple Explanation`, which the README already structures as what
 * it is / what problem it solves / how it helps a real business — the three
 * questions CLAUDE.md's Learning Rule requires. Guided Build from `## 7.
 * Guided Build` Steps 1–3.
 */
export const LAB_01_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [
      {
        type: "prose",
        text: "A lead form sends you first_name, last_name and email_address. Your CRM wants name and email.",
      },
      {
        type: "prose",
        text: "Nobody is wrong. They just disagree — and until something translates between them, that lead sits in the gap doing nothing for anybody.",
      },
      {
        type: "prose",
        text: "Businesses run on connected apps: a form, a CRM, a database, an email platform, a payment system. Each one names things its own way.",
      },
      {
        type: "prose",
        text: 'When the shapes don\'t match, someone ends up copying fields by hand — or worse, the integration "works" and quietly stores rubbish. Data mapping is the unglamorous work that stops both.',
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
        text: "What is it? Data mapping means taking information from one system and matching it to the fields another system expects. Data transformation means changing or cleaning that data before sending it on.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Different apps use different field names and formats. A lead form may send first_name, last_name and email_address where a CRM expects name and email. Without mapping and transformation, integrations fail or store messy data.",
      },
      {
        type: "prose",
        text: "How does this help a real business? Businesses connect forms, CRMs, databases, email platforms and payment systems. Mapping is what moves information between them correctly, without anyone cleaning up by hand afterwards.",
      },
      {
        type: "diagram",
        ascii: [
          "Manual Trigger",
          "      |",
          "Sample Lead Input",
          "      |",
          "Transform for CRM",
          "      |",
          "Final Clean JSON",
        ].join("\n"),
        alt: "Four nodes in a line: Manual Trigger, then Sample Lead Input, then Transform for CRM, then Final Clean JSON.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-input",
    title: "Build: give the workflow something to work with",
    whyThisMatters: [
      {
        type: "prose",
        text: "Before you can transform a lead, you need a lead. Real form data is unpredictable and slow to test against, so you start with a fixed sample you control — one that is deliberately untidy in exactly the ways real data is.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Create a new workflow in n8n and add a Manual Trigger node.",
      },
      {
        text: "Add an Edit Fields (Set) node after it and rename it to Sample Lead Input.",
      },
      {
        text: "Set its Mode to JSON, then replace the example with this JSON, exactly as written — the stray spaces and capitals are the point.",
        code: {
          language: "json",
          code: `{
  "first_name": "Alex",
  "last_name": "Rivera",
  "email_address": " ALEX@EXAMPLE.COM ",
  "company": "Northstar Commerce",
  "source": "Facebook Lead Form"
}`,
        },
        expect: "Running the workflow returns one item with those five fields.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "That email has leading and trailing spaces and is in capitals. Left alone it would reach the CRM exactly like that, and every later comparison against it would silently fail. Mock data lets you test the logic safely before a real customer record is anywhere near it.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "Manual Trigger",
        what: "Starts the workflow when you click Execute, rather than waiting for an outside system.",
        whyHere:
          "You want to run this transformation on demand while you build it, without wiring up a form or a webhook first.",
        businessReason:
          "Automation engineers test logic independently before connecting a real form, CRM, webhook or API — so a mistake costs a rerun, not a customer record.",
        analogy: "A test switch. It does the same thing the real trigger will, on your schedule.",
      },
      {
        subject: "node",
        name: "Edit Fields (Set)",
        what: "Creates or overwrites fields on the items passing through it.",
        whyHere:
          "It is standing in for the lead form, producing a predictable payload every run.",
        businessReason:
          "Using mock data lets engineers prove automation logic before real customer data is involved.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-transform",
    title: "Build: translate it into what the CRM expects",
    whyThisMatters: [
      {
        type: "prose",
        text: "This is the translation itself. Four fields go in with the form's names and the form's mess; four come out with the CRM's names, cleaned. Everything else is dropped on purpose.",
      },
    ],
    content: [],
    visual: {
      type: "diagram",
      ascii: [
        "first_name + last_name  ->  name",
        "email_address           ->  email       (trimmed, lowercased)",
        "company                 ->  company",
        "source                  ->  lead_source",
      ].join("\n"),
      alt: "Field mapping: first_name and last_name combine into name; email_address becomes email, trimmed and lowercased; company stays company; source becomes lead_source.",
    },
    actions: [
      {
        text: "Add a second Edit Fields (Set) node after Sample Lead Input and rename it Transform for CRM.",
      },
      {
        text: "Add a name field that joins the two name fields with a space.",
        code: { language: "javascript", code: "{{ $json.first_name + ' ' + $json.last_name }}" },
        expect: "Alex Rivera",
      },
      {
        text: "Add an email field that strips the spaces and lowercases the value.",
        code: { language: "javascript", code: "{{ $json.email_address.trim().toLowerCase() }}" },
        expect: "alex@example.com",
      },
      {
        text: "Add company and lead_source. Leave Include Other Input Fields switched off — it starts off, and it has to stay that way.",
        code: {
          language: "javascript",
          code: `{{ $json.company }}
{{ $json.source }}`,
        },
        expect: "Four fields listed under Fields to Set: name, email, company and lead_source.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Include Other Input Fields is the switch people flip on just in case. Turn it on and the original first_name, last_name, email_address and source travel onward beside the clean ones — the CRM receives fields it never asked for, and the next person to read this data cannot tell which email is the real one.",
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "Trim before you lowercase, not after",
        text: "Both need to happen, and either order produces the same string here. What matters is that both happen at all: \" ALEX@EXAMPLE.COM \" and \"alex@example.com\" are different values to every system that compares them.",
      },
    ],
    teaches: [
      {
        subject: "code",
        name: "Cleaning the email",
        language: "javascript",
        code: "{{ $json.email_address.trim().toLowerCase() }}",
        intent:
          "Turn whatever the form sent into the single canonical form of that email address.",
        inputs: "email_address from the incoming item — here \" ALEX@EXAMPLE.COM \".",
        logic:
          "trim() removes whitespace from both ends. toLowerCase() converts every character to lower case. They chain, so the output of trim() is what toLowerCase() receives.",
        output: "alex@example.com",
        engineeringReason:
          "Email addresses are used as identity. If one system stores a padded, capitalised version, duplicate-detection and lookups quietly fail against every other system that stored it cleanly.",
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
        text: "Your workflow is built. Do not run it yet — commit to an answer first, because a prediction you make after seeing the result is not a prediction.",
      },
      {
        type: "prose",
        text: "Sample Lead Input sends five fields. Transform for CRM sets four, with Include Other Input Fields off.",
      },
    ],
    prompt:
      "When you run the whole workflow, how many fields will Transform for CRM output — and will first_name and email_address still be in it?",
    reveal: [
      {
        type: "code",
        language: "json",
        code: `{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "company": "Northstar Commerce",
  "lead_source": "Facebook Lead Form"
}`,
        caption: "Four fields. Not five, not nine.",
      },
      {
        type: "prose",
        text: "If you expected the original first_name and email_address to still be there, that is the Include Other Input Fields setting — and it is the difference between a CRM record you can trust and one with two competing email fields in it.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "self-check",
    testCaseId: "lab-01-transform-for-crm",
    caseName: "A Facebook lead arrives and the CRM gets exactly what it expects",
    expected: "Exactly four fields — name, email, company and lead_source — with the email trimmed and lowercased.",
    content: [
      {
        type: "prose",
        text: "Run the whole workflow in n8n, open the Transform for CRM node, and copy its output. Paste it below and AEP will check it field by field.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Copy whatever n8n gives you",
        text: "The output panel may show an array, a single object, or n8n's json wrapper. All three are fine — paste it as it comes.",
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
        text: "A working workflow teaches you one thing. A broken one teaches you how to fix the next fifty, so let us break this deliberately while the stakes are zero.",
      },
      {
        type: "actions",
        items: [
          {
            text: "Open Sample Lead Input and rename the field email_address to email.",
          },
          {
            text: "Change nothing in Transform for CRM. Leave the expression exactly as it is.",
            code: {
              language: "javascript",
              code: "{{ $json.email_address.trim().toLowerCase() }}",
            },
          },
          {
            text: "Run the workflow again and look at the email field.",
            expect: "An error, or an email that is undefined or null.",
          },
        ],
      },
      {
        type: "prose",
        text: "The source object no longer has an email_address, but the transformation still asks for one. Nothing about the expression changed — the data underneath it did.",
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
        text: "Resist changing the expression until you can say what is wrong. Debugging is reading, not editing.",
      },
      {
        type: "actions",
        items: [
          {
            text: "What failed? Name the field, not the workflow.",
            expect: "The email transformation.",
          },
          {
            text: "Where did it fail? Open each node and find the first one whose output is already wrong.",
            expect: "Transform for CRM.",
          },
          {
            text: "Why? Compare what the node asks for against what its input actually contains.",
            expect: "It reads email_address; the input now has email.",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "The root cause has a name: schema mismatch",
        text: "The structure of the source data no longer matches what the transformation expects. The expression was never wrong — it was right about a shape that stopped existing.",
      },
      {
        type: "prose",
        text: "Restore email_address in Sample Lead Input and run it again. The original output comes back, and no other field was affected.",
      },
      {
        type: "prose",
        text: "The habit worth keeping: when a workflow suddenly breaks, inspect the actual input before you change any logic. Most integration failures are a shape that moved, not a rule that was wrong.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: a real payload, with less help",
    hintCount: 5,
    testCaseId: "lab-01-nested-lead-to-crm",
    caseName: "A nested lead payload flattens into one clean CRM record",
    content: [
      {
        type: "prose",
        text: "Real lead payloads are not flat. This one has nested objects and arrays, and the same job: turn it into one clean CRM record.",
      },
      {
        type: "code",
        language: "json",
        code: `{
  "contact":   { "first": "  jamie ", "last": "LEE  ",
                 "email": " JAMIE.LEE@EMAIL.COM " },
  "company":   { "name": " Northstar Commerce ",
                 "role": "operations manager" },
  "marketing": { "source": "facebook",
                 "campaign": "AEP September Campaign" },
  "location":  { "city": "  Perth ", "country": "AU" },
  "interests": ["Automation", "CRM", "AI"],
  "tags":      ["Hot Lead", "Facebook", "Automation"]
}`,
      },
      {
        type: "callout",
        tone: "note",
        title: "The CRM expects exactly these fields",
        text: "full_name, email, company_name, job_title, lead_source, campaign_name, interests, location and tags.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Read the expected values character by character",
        text: "interests and tags do not use the same separator. And only one field gets lowercased — if a value in your output looks tidier than expected, you have applied a transformation somewhere nobody asked for.",
      },
    ],
    verification: [
      "full_name is the trimmed first and last name joined by a space, with the original casing left alone",
      "email is trimmed and lowercased",
      "company_name (trimmed), job_title, lead_source and campaign_name are pulled up from the nested objects",
      "interests is one string joined with a comma and a space",
      "location is City, Country",
      "tags is one string joined with a space, a pipe and a space",
      "only those nine fields remain",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "You built a translator. Messy lead data goes in, exactly the structure a CRM expects comes out, and nothing else travels with it.",
      },
      {
        type: "prose",
        text: "Along the way you renamed fields, combined two into one, cleaned a value with trim and toLowerCase, reached into nested objects, joined arrays into strings, and dropped everything the destination did not ask for.",
      },
      {
        type: "prose",
        text: "You also broke it on purpose and found the cause from the evidence rather than by guessing. Schema mismatch is the failure you will meet most often in real integration work, and you have now seen exactly what it looks like from the inside.",
      },
      {
        type: "prose",
        text: "The engineering habit that transfers: a green execution is not a correct one. This workflow ran perfectly while producing an email of null, and only the output told you the truth.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "Your data is clean and every field is where the CRM expects it. And every single lead still takes exactly the same path.",
      },
      {
        type: "prose",
        text: "A $5,000 hot prospect and a tyre kicker get identical treatment, because your workflow has no way to tell them apart. Clean data is only useful once something acts differently on it. Lab 02 teaches your workflow to decide.",
      },
    ],
  },
];
