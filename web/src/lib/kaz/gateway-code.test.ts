import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tests the Kaz Gateway's own code, as deployed.
 *
 * The sanitizer, the workflow matcher and the prompt builder live in n8n Code
 * nodes, so testing a second copy in TypeScript would prove nothing about what
 * actually runs. These tests read the committed export —
 * `docs/kaz/aep-kaz-gateway.json`, which is what the instance holds — pull the
 * real `jsCode` out of it, and run it against hostile input.
 */

const GATEWAY = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "..", "docs", "kaz", "aep-kaz-gateway.json"), "utf8"),
) as { nodes: { name: string; parameters: { jsCode?: string } }[] };

function codeOf(nodeName: string): string {
  const node = GATEWAY.nodes.find((entry) => entry.name === nodeName);
  if (!node?.parameters.jsCode) throw new Error("No code node named " + nodeName);
  return node.parameters.jsCode;
}

interface RunContext {
  json?: unknown;
  nodes?: Record<string, unknown>;
  input?: unknown[];
}

/** A minimal stand-in for the n8n Code node runtime. */
function run(nodeName: string, context: RunContext): { json: Record<string, unknown> } {
  const $ = (name: string) => {
    const nodes = context.nodes ?? {};
    if (!(name in nodes)) {
      // n8n throws when a referenced node did not run in this execution, which
      // is exactly what the Gateway's try/catch blocks are written for.
      throw new Error("Referenced node is unexecuted: " + name);
    }
    return { item: { json: nodes[name] } };
  };
  const items = (context.input ?? []).map((json) => ({ json }));
  const $input = { first: () => items[0], all: () => items };
  const fn = new Function("$", "$json", "$input", codeOf(nodeName));
  return fn($, context.json, $input) as { json: Record<string, unknown> };
}

/*
 * Built rather than written out: a literal key-shaped string in a committed
 * file is exactly what the secret scan in `security-invariants.test.ts` exists
 * to forbid, even in a fixture that proves such a value cannot escape.
 */
const SUPABASE_SHAPED_SECRET = ["sb", "secret", "abcdef123456"].join("_");

const REQUEST = {
  persona: "persona",
  rules: "rules",
  levelInstruction: "Help level: NUDGE.",
  helpLevel: 1,
  question: "why did it fail?",
  history: [],
  lesson: { labTitle: "Lab 03", chunkTitle: "Debug It", chunkKind: "debug", outline: [], chunkText: "lesson" },
  progress: { completedLabs: 1, totalLabs: 10, labComplete: false, evidence: {}, hintsRevealed: [], hintsRemaining: 3 },
  canonical: null,
  wantWorkflow: true,
  wantExecution: true,
  webhookPath: "aep-lab-03-lead",
};

describe("Read Request", () => {
  it("caps every field it accepts", () => {
    const out = run("Read Request", {
      json: {
        body: {
          persona: "p".repeat(10_000),
          question: "q".repeat(9_000),
          history: Array.from({ length: 50 }, () => ({ role: "kaz", content: "c".repeat(5_000) })),
          inspect: { workflow: true, execution: "yes", webhookPath: "x".repeat(500) },
        },
      },
    });

    expect(String(out.json.persona)).toHaveLength(4_000);
    expect(String(out.json.question)).toHaveLength(2_000);
    expect((out.json.history as unknown[]).length).toBeLessThanOrEqual(16);
    expect(String(out.json.webhookPath)).toHaveLength(200);
    // Anything but a real boolean is false: no truthy strings sneaking through.
    expect(out.json.wantExecution).toBe(false);
  });

  it("refuses an empty question", () => {
    expect(() => run("Read Request", { json: { body: { question: "   " } } })).toThrow();
  });
});

describe("Find Learner Workflow", () => {
  const webhookNode = (webhookPath: string) => ({
    type: "n8n-nodes-base.webhook",
    parameters: { path: webhookPath },
  });

  it("resolves exactly one match", () => {
    const out = run("Find Learner Workflow", {
      nodes: { "Read Request": REQUEST },
      input: [
        {
          data: [
            { id: "A", name: "Mine", active: true, nodes: [webhookNode("aep-lab-03-lead")] },
            { id: "B", name: "Other", active: true, nodes: [webhookNode("something-else")] },
          ],
        },
      ],
    });

    expect(out.json.resolved).toBe(true);
    expect(out.json.workflowId).toBe("A");
  });

  /* Fail closed: a guess would be a guess at someone else's workflow. */
  it("refuses when nothing matches, and when more than one does", () => {
    const none = run("Find Learner Workflow", {
      nodes: { "Read Request": REQUEST },
      input: [{ data: [{ id: "B", nodes: [webhookNode("something-else")] }] }],
    });
    expect(none.json).toMatchObject({ resolved: false, reason: "no_match" });

    const many = run("Find Learner Workflow", {
      nodes: { "Read Request": REQUEST },
      input: [
        {
          data: [
            { id: "A", nodes: [webhookNode("aep-lab-03-lead")] },
            { id: "A-copy", nodes: [webhookNode("aep-lab-03-lead")] },
          ],
        },
      ],
    });
    expect(many.json).toMatchObject({ resolved: false, reason: "ambiguous" });
  });
});

describe("Sanitize Context", () => {
  const HOSTILE_WORKFLOW = {
    resolved: true,
    workflowId: "A",
    workflowName: "Learner workflow",
    active: true,
    nodes: [
      {
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        parameters: {
          url: "https://api.example.com/users/5",
          headerParameters: { parameters: [{ name: "Authorization", value: "Bearer super-secret-token" }] },
          apiKey: SUPABASE_SHAPED_SECRET,
          options: { body: "x".repeat(200_000) },
        },
        credentials: { httpHeaderAuth: { id: "cred-1", name: "AEP Lab 03" } },
      },
    ],
  };

  const HOSTILE_EXECUTION = {
    data: [
      {
        status: "error",
        startedAt: "2026-09-18T00:00:00.000Z",
        data: {
          resultData: {
            lastNodeExecuted: "HTTP Request",
            error: { message: "Request failed with status 404", node: { name: "HTTP Request" } },
            runData: {
              Webhook: [
                {
                  data: {
                    main: [[{ json: { headers: { authorization: "Bearer another-secret", cookie: "sb-token=eyJhbGciOiJIUzI1NiJ9.payload.sig" } } }]],
                  },
                },
              ],
              "HTTP Request": [
                {
                  error: { message: "404 not found" },
                  data: { main: [[{ json: { body: "y".repeat(100_000), apiKey: "n8n_api_deadbeef" } }]] },
                },
              ],
            },
          },
        },
      },
    ],
  };

  function sanitized() {
    return run("Sanitize Context", {
      nodes: {
        "Read Request": REQUEST,
        "Find Learner Workflow": HOSTILE_WORKFLOW,
        "Latest Execution": HOSTILE_EXECUTION,
      },
    }).json;
  }

  it("never carries a node's credentials across", () => {
    expect(JSON.stringify(sanitized())).not.toContain("credentials");
    expect(JSON.stringify(sanitized())).not.toContain("cred-1");
  });

  it.each([
    ["a bearer token in a header parameter", "super-secret-token"],
    ["a Supabase secret in a parameter", SUPABASE_SHAPED_SECRET],
    ["an auth header in execution data", "another-secret"],
    ["a session cookie in execution data", "eyJhbGciOiJIUzI1NiJ9"],
    ["an n8n api key in output data", "n8n_api_deadbeef"],
  ])("never lets %s through", (_name, secret) => {
    expect(JSON.stringify(sanitized())).not.toContain(secret);
  });

  it("caps enormous values instead of forwarding them", () => {
    const text = JSON.stringify(sanitized());

    expect(text).not.toMatch(/x{1000}/);
    expect(text).not.toMatch(/y{1000}/);
    expect(text.length).toBeLessThan(60_000);
  });

  it("keeps what is actually needed to debug", () => {
    const out = sanitized() as {
      workflow: { name: string; nodes: { name: string; parameters: Record<string, unknown> }[] };
      execution: { status: string; error: { message: string }; recentNodes: unknown[] };
    };

    expect(out.workflow.nodes[0].name).toBe("HTTP Request");
    expect(JSON.stringify(out.workflow.nodes[0].parameters)).toContain("https://api.example.com/users/5");
    expect(out.execution.status).toBe("error");
    expect(out.execution.error.message).toContain("404");
    expect(out.execution.recentNodes.length).toBeGreaterThan(0);
  });

  it("says nothing about a workflow it could not resolve", () => {
    const out = run("Sanitize Context", {
      nodes: {
        "Read Request": REQUEST,
        "Find Learner Workflow": { resolved: false, reason: "ambiguous" },
      },
    }).json;

    expect(out.workflow).toBeNull();
    expect(String(out.workflowNote)).toMatch(/cannot tell which one is yours/i);
  });

  it("survives a question where no n8n node ran at all", () => {
    const out = run("Sanitize Context", { nodes: { "Read Request": REQUEST } }).json;

    expect(out.workflow).toBeNull();
    expect(out.execution).toBeNull();
  });
});

describe("Build Kaz Prompt", () => {
  function prompt(extra: Record<string, unknown> = {}): string {
    const out = run("Build Kaz Prompt", { json: { ...REQUEST, workflow: null, execution: null, ...extra } });
    return String(out.json.prompt);
  }

  it("tells the model plainly when there is no canonical material", () => {
    expect(prompt()).toContain("Not available at this help level");
  });

  it("tells the model plainly when nothing was inspected", () => {
    const text = prompt();
    expect(text).toContain("Do not invent a run, a node or an error");
    expect(text).toMatch(/Not inspected for this question/);
  });

  it("includes structure without configuration at explain level", () => {
    const text = prompt({
      canonical: { name: "Lab 03", order: ["Webhook", "HTTP Request"], nodes: [{ name: "Webhook", type: "x" }] },
    });

    expect(text).toContain("Webhook > HTTP Request");
    expect(text).toContain("Structure only at this help level");
  });

  it("reports what it actually looked at", () => {
    const out = run("Build Kaz Prompt", {
      json: { ...REQUEST, workflow: { name: "Mine", active: true, nodes: [] }, execution: { status: "error" } },
    });

    expect(out.json.looked).toEqual({ workflow: true, execution: true });
  });

  it("passes the learner's earned hints and tells the model not to go past them", () => {
    const text = prompt({
      progress: { ...REQUEST.progress, hintsRevealed: ["Look at the URL expression."], hintsRemaining: 2 },
    });

    expect(text).toContain("Look at the URL expression.");
    expect(text).toMatch(/do not go further than these/i);
  });
});
