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
        text: "Give it this JSON, exactly as written — the stray spaces and capitals are the point.",
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
        text: "Add company and lead_source, then turn Include Other Input Fields OFF.",
        code: {
          language: "javascript",
          code: `{{ $json.company }}
{{ $json.source }}`,
        },
        expect: "The output has exactly four fields and no first_name or email_address.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Turning off Include Other Input Fields is the step people skip. Leave it on and the original first_name, last_name, email_address and source travel onward beside the clean ones — the CRM receives fields it never asked for, and the next person to read this data cannot tell which email is the real one.",
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
];
