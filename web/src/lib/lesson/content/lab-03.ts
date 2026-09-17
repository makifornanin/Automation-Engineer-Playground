import type { LessonChunk } from "../types";

/** Lab 03 — APIs & Webhooks. Condensed from the lab README. */
export const LAB_03_CHUNKS: readonly LessonChunk[] = [
  {
    kind: "problem",
    id: "problem",
    title: "The problem",
    content: [
      {
        type: "prose",
        text: "Everything you have built so far lives inside n8n. It starts when you click a button, and it talks to nobody.",
      },
      {
        type: "prose",
        text: "Real automation is not like that. A website submits a form, your workflow wakes up, asks a CRM a question, and answers back — in under a second, with nobody clicking anything.",
      },
      {
        type: "prose",
        text: "A business runs a website, a CRM, booking software, a payment platform and a database. None of them were built knowing about each other. Without a way to exchange information, somebody moves it by hand — and that person is expensive, slow, and occasionally on holiday.",
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
        text: "What is it? An API is how one system asks another for something. A webhook is an endpoint that sits and waits to be called — the same conversation, in the other direction.",
      },
      {
        type: "prose",
        text: "What problem does it solve? Businesses run many systems that need to exchange information reliably. Without APIs and webhooks, staff copy data between them by hand.",
      },
      {
        type: "prose",
        text: "How does this help a real business? Website leads reach the CRM, bookings get created, customer records get looked up, follow-ups fire — all without anyone retyping anything.",
      },
      {
        type: "diagram",
        ascii: [
          "Website",
          "   | POST",
          "Receive Lead API Request   (webhook: waits)",
          "   |",
          "Fetch External Customer Data   (HTTP request: asks)",
          "   |",
          "Check API Success --200--> Return API Success",
          "   | not 200",
          "Return API Not Found",
        ].join("\n"),
        alt: "A website POSTs to the webhook node, which calls an external API, then an IF node on the status code routes to either a success response or a not-found response.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-webhook",
    title: "Build: a door the outside world can knock on",
    whyThisMatters: [
      {
        type: "prose",
        text: "Until now you have been the trigger. A webhook hands that job to whoever needs the work done — which is what makes an automation run at three in the morning without you.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Create a workflow named AEP Lab 03 - APIs & Webhooks and add a Webhook node named Receive Lead API Request.",
        code: {
          language: "text",
          code: [
            "HTTP Method: POST",
            "Path:        aep-lab-03-lead",
            "Respond:     Using Respond to Webhook node",
            "Auth:        None",
          ].join("\n"),
        },
      },
      {
        text: "Copy the Test URL, click Execute workflow, then send it this payload with any HTTP client — curl works from a terminal: curl -X POST <Test URL> -H \"Content-Type: application/json\" -d '{\"user_id\": 5}'",
        code: {
          language: "json",
          code: ['{', '  "user_id": 5', '}'].join("\n"),
        },
        expect: "The webhook node shows the body it received.",
      },
      {
        text: "Look at where your data landed in the node output — it is under body, not at the top level.",
        expect: "body.user_id is 5.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "The Test URL only listens after you press Execute, and only for one request. The Production URL always listens, but only once the workflow is published — older n8n versions call this Active. Mixing them up is the single most common reason a lab appears to do nothing.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Respond: Using Respond to Webhook node",
        text: "That setting is what lets you decide the answer after your logic has run. Leave it on the default and n8n replies immediately, before the workflow has worked anything out.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "Webhook",
        what: "Creates a URL that waits. When another system sends a request to it, the workflow starts and receives that data.",
        whyHere:
          "Every lab so far started because you clicked Execute. A business automation has to start because a customer did something.",
        businessReason:
          "This is the entry point for form submissions, payment events and CRM notifications — the work that arrives on its own schedule, not yours.",
        analogy: "A doorbell. You get on with your day, and it tells you when someone arrives.",
      },
    ],
  },
  {
    kind: "guided-build",
    id: "build-lookup",
    title: "Build: go and ask someone else",
    whyThisMatters: [
      {
        type: "prose",
        text: "The webhook gave you a user_id, not a customer. The customer lives in another system, and the only way to get them is to ask.",
      },
    ],
    content: [],
    actions: [
      {
        text: "Add an HTTP Request node named Fetch External Customer Data, with a URL built from the incoming id.",
        code: {
          language: "text",
          code: "https://jsonplaceholder.typicode.com/users/{{ $json.body.user_id }}",
        },
        expect: "A real user record for id 5.",
      },
      {
        text: "Turn on Include Response Headers and Status, and turn on Never Error.",
        expect: "The output now carries body, headers and statusCode.",
      },
      {
        text: "Add an IF node named Check API Success, testing statusCode equals 200.",
      },
      {
        text: "Add two Respond to Webhook nodes: Return API Success on TRUE with code 200, and Return API Not Found on FALSE with code 404. Use Expression fields for the customer values.",
        expect: "A response carrying the real customer name.",
      },
    ],
    whyWereDoingThis: [
      {
        type: "prose",
        text: "Never Error is the important setting. Without it a 404 kills the run and your caller gets nothing. With it, the failure becomes data — a statusCode your own logic can inspect and answer for.",
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "Fixed vs Expression",
        text: "Type an expression into a field left in Fixed mode and n8n returns the literal text of it. The response still looks well-formed, which is what makes this worth knowing before it happens to you.",
      },
    ],
    teaches: [
      {
        subject: "node",
        name: "HTTP Request",
        what: "Calls someone else's API and hands you back the response.",
        whyHere: "The webhook gave us an id. The customer record lives elsewhere, and this goes and asks for it.",
        businessReason:
          "Nearly every integration is this node: look up a customer, create an invoice, notify a platform.",
        analogy: "The Webhook is your phone ringing. This is you making the call.",
      },
      {
        subject: "node",
        name: "Respond to Webhook",
        what: "Sends the reply back to whoever called your webhook.",
        whyHere:
          "The caller is still waiting on the line. This decides what they hear, and importantly when — nothing goes back until the logic has decided.",
        businessReason:
          "A caller that gets a clear answer can act on it. One that gets a timeout has to guess.",
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
        text: "You are about to send user_id 5, and then user_id 999, which does not exist.",
      },
    ],
    prompt:
      "For user_id 999: which node fails, what does the caller receive, and does the workflow turn red?",
    reveal: [
      {
        type: "prose",
        text: "Nothing fails. Never Error turns the 404 into data, Check API Success sees a status that is not 200, and Return API Not Found answers with a clean 404 and an explanation.",
      },
      {
        type: "prose",
        text: "That is the whole point of handling failure deliberately: the external system had a problem, and your workflow still gave a useful answer.",
      },
    ],
  },
  {
    kind: "test",
    id: "success-test",
    title: "Prove it",
    mode: "send-test",
    testCaseId: "lab-03-customer-found",
    payload: { user_id: 5, name: "Alex Rivera", email: "alex@example.com", company: "Northstar Commerce", interest: "Automation Services", source: "website" },
    expected: "success is true, with the real name and email of customer 5 — not the text of an expression.",
    caseName: "A known customer is looked up in the external API and returned to the caller",
    content: [
      {
        type: "prose",
        text: "Publish your workflow in n8n (older versions call this switching it to Active), save its Production URL below, then send the test. AEP posts this lab's sample request to your own n8n and checks what your workflow answers.",
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
            text: "Change the external URL from /users/ to /userz/ and send user_id 5 again.",
            expect: "A 404 from the API, and the not-found branch answering.",
          },
          {
            text: "Ask yourself which node actually failed — and whether the webhook itself was ever at fault.",
          },
          {
            text: "Fix the URL, then send user_id 999 instead.",
            expect: "The same not-found answer, from a completely different cause.",
          },
        ],
      },
      {
        type: "prose",
        text: "Two different problems — a wrong endpoint and a missing record — produced an identical response. That is worth sitting with.",
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
        text: "When an API workflow misbehaves, walk the data in order rather than changing nodes at random.",
      },
      {
        type: "actions",
        items: [
          {
            text: "Did the request reach the webhook at all, and what body did it receive?",
          },
          {
            text: "What URL did the HTTP Request actually call? Open the node and read the resolved value, not the template.",
          },
          {
            text: "What status came back, and which IF branch ran because of it?",
          },
        ],
      },
      {
        type: "callout",
        tone: "gotcha",
        title: "The same answer can have different causes",
        text: "Your caller cannot tell a typo in your URL from a customer who does not exist. That is fine for them and dangerous for you: a not-found response is not proof that the lookup was even aimed at the right place.",
      },
    ],
  },
  {
    kind: "challenge",
    id: "challenge",
    title: "Challenge: make it work for any customer",
    hintCount: 3,
    testCaseId: "lab-03-customer-not-found",
    caseName: "A customer who does not exist produces an honest not-found answer, not a crash",
    content: [
      {
        type: "prose",
        text: "Send user_id 2, then 7, then 999 to your Production URL. Your workflow must tell the two existing customers from the missing one without knowing any of them in advance.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Do not hardcode ids into IF conditions",
        text: "If your routing mentions a specific user_id, you have built a lookup table, not an integration. The incoming value should drive the request.",
      },
      {
        type: "prose",
        text: "Then send an id that does not exist and paste the response below.",
      },
    ],
    verification: [
      "an existing customer returns their real name and email",
      "a missing customer returns the not-found body with HTTP 404",
      "no customer id appears anywhere in your conditions",
      "the workflow never turns red for a missing customer",
    ],
  },
  {
    kind: "recap",
    id: "recap",
    title: "What you just built",
    content: [
      {
        type: "prose",
        text: "Your automation talks to the outside world now. It accepts requests it did not ask for, calls a service it does not control, inspects what came back, and answers.",
      },
      {
        type: "prose",
        text: "You built a URL dynamically from incoming data, told the difference between an HTTP status and a response body, and turned a failure into something your own logic could handle rather than something that stopped the run.",
      },
    ],
    bridge: [
      {
        type: "prose",
        text: "That is a lot of new power, and it arrives with a new problem: you no longer choose what arrives. Anyone who can reach your webhook can send an empty name, a broken email, or a date that does not exist.",
      },
      {
        type: "prose",
        text: "Right now your workflow would pass all of it straight through. Lab 04 stops bad data at the door.",
      },
    ],
  },
];
