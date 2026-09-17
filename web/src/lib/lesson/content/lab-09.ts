import type { LessonChunk } from "../types";

/** Lab 09 — Structured AI Output. Condensed from the lab README. */
export const LAB_09_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [
      {
        type: "prose",
        text: "Your AI classifier just told you this customer belongs in Sales. Excellent. Ship it.",
      },
      {
        type: "prose",
        text: "One small problem: the answer came back as text that looks like JSON. Your Switch node reads classification, finds nothing there, and quietly routes a paying customer into the void. Nobody gets an error. Nobody gets called back either.",
      },
      {
        type: "prose",
        text: "AI reads intent far faster than a person can. But automation cannot route work on a vibe — it needs a value it can compare, in a field it can find. The real question in this lab is not whether AI can classify. It is whether automation can trust the shape of what comes back.",
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
        text: "What is it? Structured output forces a model's answer into a defined shape — real fields with allowed values — instead of free text that merely resembles JSON.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Language models produce text. A response that looks perfectly structured can still be one long string, wrapped in markdown, or carrying an invented value your automation will happily act on.",
      },
      {
        type: "prose",
        text: "How does this help a real business? Inbound messages reach the right team in seconds instead of sitting in a shared inbox — and the failure mode is a human review, not a wrong action.",
      },
      {
        type: "code",
        language: "text",
        code: "INPUT -> AI -> STRUCTURE -> VALIDATE -> ROUTE",
        caption: "Never: AI said something -> do it.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-classifier",
    title: "Build: ask the model — and limit its choices",
    whyThisMatters: [
      {
        type: "prose",
        text: "The first place you constrain a model's imagination is the prompt. Telling it exactly which classifications and actions exist is cheaper than cleaning up after it invents new ones.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add a Webhook named Receive Customer Inquiry on path aep-lab-09-ai-classification, responding through a Respond to Webhook node.",
      },
      {
        text: "Add an Edit Fields node named Prepare AI Input carrying the message and the allowed lists — and nothing else from the request.",
        code: {
          language: "text",
          code: [
            "request_id               {{ $json.body.request_id }}",
            "message                  {{ $json.body.message }}",
            "allowed_classifications  sales,support,billing,other",
            "allowed_actions          send_to_sales,create_support_ticket,send_to_billing,manual_review",
          ].join("\n"),
        },
      },
      {
        text: "Add a Basic LLM Chain named Gemini Classifier whose prompt asks for exactly three fields, chosen only from those lists.",
      },
      {
        text: "Attach a Google Gemini Chat Model node with your Gemini credential, then run it on the sales sample and open the classifier's output.",
        expect: "Something that looks like JSON.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Headers, IP address and everything else the caller sent stay out of the prompt. The model gets the message and nothing more: smaller input, fewer surprises, lower cost.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "Basic LLM Chain",
        what: "Holds the prompt and runs the request through whatever model is attached to it.",
        whyHere:
          "This is where the decision-making lives. Keeping the prompt separate from the model connection means either can change without touching the other.",
        businessReason:
          "Models get replaced and upgraded constantly. Separating what you ask from which model answers stops every model change becoming a logic rewrite.",
        analogy: "The driver. The chat model node is the engine.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-structure",
    title: "Build: make the shape reliable",
    whyThisMatters: [
      {
        type: "prose",
        text: "Look closely at what came back. Those escaped quotes exist because the whole answer is one string. $json.classification returns nothing, because there is no classification field — only a text field containing those characters.",
      },
    ],
    content: [],
    actions: [
      {
        text: "In Gemini Classifier turn on Require Specific Output Format, and attach a Structured Output Parser.",
      },
      {
        text: "Give the parser a schema that fixes the fields, the allowed values and the confidence range.",
        code: {
          language: "json",
          code: [
            "{",
            '  "type": "object",',
            '  "properties": {',
            '    "classification": { "type": "string", "enum": ["sales","support","billing","other"] },',
            '    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },',
            '    "recommended_action": { "type": "string", "enum": ["send_to_sales","create_support_ticket","send_to_billing","manual_review"] }',
            "  },",
            '  "required": ["classification","confidence","recommended_action"],',
            '  "additionalProperties": false',
            "}",
          ].join("\n"),
        },
      },
      {
        text: "Run the same request again and open the output.",
        expect: "output.classification is a real value you can route on.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "callout",
        tone: "gotcha",
        title: "JSON-looking text is not a JSON object",
        text: "This is the single most important idea in the lab, and a nasty production bug because nothing errors. You could parse the string yourself in a Code node — and then handle the run where the model wraps it in a markdown fence, or adds a friendly sentence first. That is a game you lose slowly.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "Structured Output Parser",
        what: "Attaches a required shape to the model's answer and hands back a real object instead of text.",
        whyHere:
          "Without it, sales might arrive as a sentence, inside markdown, or as a string that merely resembles JSON.",
        businessReason:
          "It turns an AI answer into data other systems can safely consume, which is the difference between a demo and an integration.",
        analogy: "A form with labelled boxes instead of a blank sheet of paper.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-validate-route",
    title: "Build: validate anyway, then route last",
    whyThisMatters: [
      {
        type: "prose",
        text: "The parser checks shape. It is part of the AI call, so its promise vanishes if the schema is edited, the model changes, or this node ever receives data from somewhere else. Your own validator does not care where the data came from.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add a Code node named Validate AI Output that checks every field against the allowed lists and the range, and adds valid: true or false.",
      },
      {
        text: "Add an IF named AI Output Valid? on valid, and on TRUE a Switch named Route by Classification with four outputs.",
      },
      {
        text: "Give each output an Edit Fields node setting success true, the three classification fields, and route: sales_team, support_team, billing_team or manual_review.",
      },
      {
        text: "On FALSE add Build Safe Fallback, then connect all five into one Respond to Webhook named Return Classification Result.",
        expect: "Every path ends at a single exit.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Routing happens after the gate, never before it. The Switch cannot see output that failed validation, so an invented classification cannot choose a destination.",
      },
      {
        type: "prose",
        text: "Every fallback value is a deliberate refusal to guess: classification other, confidence 0 because the rejected model's self-assessment is worthless, and manual_review so a person looks at it. A workflow that fails toward doing something eventually does something expensive.",
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
        text: "You are about to send a customer asking about pricing.",
      },
    ],
    prompt: "Which classification and route will it get, and will confidence be the same every time you run it?",
    reveal: [
      {
        type: "prose",
        text: "sales and sales_team — and no, confidence will wobble between runs. That is a language model being a language model. The classification and route should not, because the schema's enum pins them.",
      },
      {
        type: "prose",
        text: "In order, that result proves: the model responded, the parser produced a real object, every value survived the schema, your validator independently agreed — and only then did routing happen.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "send-test",
    testCaseId: "lab-09-sales-routed",
    payload: { request_id: "req_ai_001", message: "Hi, I'm interested in your service and would like to know your pricing." },
    expected: "Classified as sales and routed to the sales team, only after validation.",
    caseName: "A pricing question is classified as sales and routed only after validation",
    content: [
      {
        type: "prose",
        text: "Activate your workflow, save its Production URL below, then send the test. AEP posts this lab's sample request to your own n8n and checks what your workflow answers. Gemini runs inside your workflow, so allow it a few seconds.",
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
        text: "Real invalid output is rare and random, which makes it useless for a test. So fake it — on purpose, identically every time. You are testing your workflow here, not the model.",
      },
      {
        type: "actions",
        items: [
          {
            text: "Add a Code node named Simulate Invalid AI Output that breaks three rules at once.",
            code: {
              language: "javascript",
              code: [
                "return [{ json: { output: {",
                '  classification: "marketing",',
                "  confidence: 1.4,",
                '  recommended_action: "auto_delete"',
                "} } }];",
              ].join("\n"),
            },
          },
          {
            text: "Connect it into Validate AI Output and run from the simulator node.",
            expect: "The FALSE branch, and the safe fallback.",
          },
        ],
      },
      {
        type: "prose",
        text: "Look at that third value. An AI inventing an action name your automation might happily execute is the nightmare scenario in miniature.",
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
        text: "Say the simulator ran and bad output sailed through to sales_team anyway. Investigate before reading on.",
      },
      {
        type: "actions",
        items: [
          {
            text: "Did Gemini even run this time? Did the parser reject anything?",
          },
          {
            text: "Open Validate AI Output's input, not its output. Are the fields nested inside output, or sitting at the top level?",
          },
          {
            text: "What did valid come out as — and which branch actually fired?",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "The usual culprit is shape",
        text: "The validator reads $json.output. If the simulator produces flat fields with no output wrapper, the validator inspects undefined — and a check aimed at the wrong place protects nothing. Nothing throws. The only way to know a safety check works is to attack it deliberately.",
      },
      {
        type: "prose",
        text: "When you are done, disconnect the simulator so the Gemini path runs again. Keep the node — it is a testing tool worth having.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: prove all four routes and the fallback",
    hintCount: 4,
    testCaseId: "lab-09-safe-fallback",
    caseName: "Output that breaks the contract goes to a human, never to an automatic action",
    content: [
      {
        type: "prose",
        text: "Send the three challenge inquiries, then write a fourth message of your own that should land on manual_review through the other classification. Record the classification, route and confidence for each.",
      },
      {
        type: "prose",
        text: "Then trigger the invalid-output path once and paste that fallback response below.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Predict before you open the answers",
        text: "One challenge message mentions money. Decide whether that makes it billing, and what the customer actually wants done, before you look at challenge/expected-result.json.",
      },
    ],
    verification: [
      "each classification reaches its own route, after validation",
      "your own message reaches manual_review through other",
      "the invalid case returns success false and a recorded reason",
      "no invalid output ever reaches Route by Classification",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "A classifier that routes customer messages to the right team without ever acting on an answer it has not checked.",
      },
      {
        type: "prose",
        text: "You saw that an AI response can look like JSON and still be a string, used a schema to make the shape reliable, validated anyway because shape is not permission, and routed last. The failure mode you designed is a human review rather than a wrong action.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "You can now make AI output predictable. But predictable is not the same as permitted.",
      },
      {
        type: "prose",
        text: "Your classifier returns cancel_account at confidence 1.00. The shape is perfect, the schema is satisfied, the validator is delighted. Should the workflow cancel that account? Nothing you built today would stop it. Lab 10 draws that line.",
      },
    ],
  },
];
