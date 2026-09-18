import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseProgress } from "@/lib/course/progress";
import type { KazGatewayRequest } from "./gateway";

const getSession = vi.hoisted(() => vi.fn());
const hasHandsOnAccess = vi.hoisted(() => vi.fn(async () => true));
const getCourseProgress = vi.hoisted(() => vi.fn());
const getLabWebhookUrl = vi.hoisted(() => vi.fn<() => Promise<string | null>>(async () => null));
const callKazGateway = vi.hoisted(() => vi.fn());
const webhookPathForGateway = vi.hoisted(() => vi.fn((url: string | null) => (url ? "aep-lab-03-lead" : null)));
const readThread = vi.hoisted(() =>
  vi.fn<() => Promise<{ helpLevel: 1 | 2 | 3 | 4; helpChunkId: string | null }>>(async () => ({
    helpLevel: 1,
    helpChunkId: null,
  })),
);
const readMessages = vi.hoisted(() => vi.fn(async () => []));
const appendTurn = vi.hoisted(() =>
  vi.fn(async (_lab: string, _chunk: string, _level: number, question: string, answer: string) => ({
    question: { id: "q1", role: "learner" as const, content: question, createdAt: "now" },
    answer: { id: "a1", role: "kaz" as const, content: answer, createdAt: "now" },
  })),
);
const allowKazMessage = vi.hoisted(() => vi.fn(() => true));

vi.mock("@/lib/session/get-session", () => ({ getSession }));
vi.mock("@/lib/course/progress-writes", () => ({ hasHandsOnAccess }));
vi.mock("@/lib/course/progress-store", () => ({ getCourseProgress }));
vi.mock("@/lib/testing/webhook-store", () => ({ getLabWebhookUrl }));
vi.mock("./gateway", () => ({ callKazGateway, webhookPathForGateway }));
vi.mock("./thread-store", () => ({ readThread, readMessages, appendTurn }));
vi.mock("./kaz-throttle", () => ({ allowKazMessage }));

import { askKaz } from "./ask-actions";
import { IDLE_KAZ_STATE } from "./types";

const LAB_03 = "03-apis-webhooks";
const PROGRESS: CourseProgress = {
  completedLabSlugs: ["01-data-mapping-transformation"],
  inProgressLabSlug: LAB_03,
  labs: {},
  capstone: { started: false, completed: false },
};

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function ask(fields: Record<string, string> = {}) {
  return askKaz(
    IDLE_KAZ_STATE,
    form({ labSlug: LAB_03, chunkId: "debug-it", message: "What does the IF node do?", ...fields }),
  );
}

function sentPayload(): KazGatewayRequest {
  return callKazGateway.mock.calls[0]?.[0] as KazGatewayRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({
    status: "authenticated",
    user: { id: "learner-1", displayName: "L", role: "student" },
  });
  hasHandsOnAccess.mockResolvedValue(true);
  getCourseProgress.mockResolvedValue(PROGRESS);
  getLabWebhookUrl.mockResolvedValue(null);
  webhookPathForGateway.mockImplementation((url: string | null) => (url ? "aep-lab-03-lead" : null));
  readThread.mockResolvedValue({ helpLevel: 1, helpChunkId: null });
  readMessages.mockResolvedValue([]);
  allowKazMessage.mockReturnValue(true);
  callKazGateway.mockResolvedValue({
    ok: true,
    answer: "Look at the IF node's condition.",
    looked: { workflow: false, execution: false },
  });
});

describe("askKaz refuses before it calls anything", () => {
  it("refuses a signed-out caller", async () => {
    getSession.mockResolvedValue({ status: "anonymous" });

    const state = await ask();

    expect(state.status === "error" && state.code).toBe("not_signed_in");
    expect(callKazGateway).not.toHaveBeenCalled();
  });

  /* Kaz lives inside the lesson, so she is behind the lesson's own lock. */
  it("refuses a lab the learner has not unlocked", async () => {
    hasHandsOnAccess.mockResolvedValue(false);

    const state = await ask();

    expect(state.status === "error" && state.code).toBe("locked");
    expect(callKazGateway).not.toHaveBeenCalled();
  });

  it.each([
    ["a lab that does not exist", { labSlug: "99-not-a-lab" }],
    ["a slug shaped like a path", { labSlug: "../../etc/passwd" }],
    ["a chunk that does not exist", { chunkId: "not-a-chunk" }],
  ])("refuses %s", async (_name, fields) => {
    const state = await ask(fields);

    expect(state.status === "error" && state.code).toBe("unknown_lab");
    expect(callKazGateway).not.toHaveBeenCalled();
  });

  it("refuses an empty question and an enormous one", async () => {
    expect((await ask({ message: "   " })).status === "error").toBe(true);
    const long = await ask({ message: "x".repeat(2_001) });
    expect(long.status === "error" && long.code).toBe("too_long");
    expect(callKazGateway).not.toHaveBeenCalled();
  });

  it("refuses a throttled learner without calling out", async () => {
    allowKazMessage.mockReturnValue(false);

    const state = await ask();

    expect(state.status === "error" && state.code).toBe("throttled");
    expect(callKazGateway).not.toHaveBeenCalled();
  });
});

describe("askKaz trusts nothing the browser sends beyond lab, chunk and question", () => {
  /*
   * The whole security model in one test: a replayed action id with extra
   * fields buys nothing, because none of them is read.
   */
  it("ignores an injected user id, workflow id, help level and webhook url", async () => {
    getLabWebhookUrl.mockResolvedValue("https://n8n.example.com/webhook/aep-lab-03-lead");

    await ask({
      userId: "some-other-learner",
      workflowId: "WORKFLOW-I-DO-NOT-OWN",
      helpLevel: "4",
      webhookUrl: "https://attacker.example.com/webhook/steal",
      message: "check my workflow",
    });

    const payload = JSON.stringify(sentPayload());
    expect(payload).not.toContain("some-other-learner");
    expect(payload).not.toContain("WORKFLOW-I-DO-NOT-OWN");
    expect(payload).not.toContain("attacker.example.com");
    expect(sentPayload().helpLevel).toBe(1);
  });

  it("asks n8n for nothing on a concept question", async () => {
    getLabWebhookUrl.mockResolvedValue("https://n8n.example.com/webhook/aep-lab-03-lead");

    await ask({ message: "What does idempotency mean?" });

    expect(sentPayload().inspect).toEqual({ workflow: false, execution: false, webhookPath: null });
  });

  it("sends the path only when it will actually be used", async () => {
    getLabWebhookUrl.mockResolvedValue("https://n8n.example.com/webhook/aep-lab-03-lead");

    await ask({ message: "check my workflow please" });

    expect(sentPayload().inspect).toEqual({
      workflow: true,
      execution: true,
      webhookPath: "aep-lab-03-lead",
    });
  });

  it("sends no path when the saved webhook is not on Kaz's n8n", async () => {
    getLabWebhookUrl.mockResolvedValue("https://elsewhere.example.com/webhook/aep-lab-03-lead");
    webhookPathForGateway.mockReturnValue(null);

    await ask({ message: "check my workflow please" });

    expect(sentPayload().inspect.webhookPath).toBeNull();
    expect(sentPayload().inspect.workflow).toBe(false);
  });
});

describe("askKaz and the help ladder", () => {
  it("starts at a nudge and sends no canonical material", async () => {
    await ask();

    expect(sentPayload().helpLevel).toBe(1);
    expect(sentPayload().canonical).toBeNull();
  });

  it("climbs when the learner says they are still stuck", async () => {
    readThread.mockResolvedValue({ helpLevel: 2, helpChunkId: "debug-it" });

    await ask({ message: "still not working" });

    expect(sentPayload().helpLevel).toBe(3);
  });

  it("starts again at a nudge on a different step of the same lab", async () => {
    readThread.mockResolvedValue({ helpLevel: 4, helpChunkId: "break-it" });

    await ask({ chunkId: "debug-it" });

    expect(sentPayload().helpLevel).toBe(1);
  });

  it("gives the canonical configuration when the learner asks outright", async () => {
    await ask({ message: "just show me the exact fix" });

    expect(sentPayload().helpLevel).toBe(4);
    expect(sentPayload().canonical?.nodes.some((node) => node.parameters !== undefined)).toBe(true);
  });

  /* A challenge is the learner's own problem; its hints come one at a time. */
  it("never sends canonical material for a challenge, even at the top of the ladder", async () => {
    await ask({ chunkId: "challenge", message: "just show me the answer" });

    expect(sentPayload().helpLevel).toBe(4);
    expect(sentPayload().canonical).toBeNull();
  });

  /*
   * Withholding the material was not enough on its own: found live, the SHOW ME
   * instruction still told the model to give the exact fix, and it rebuilt one
   * from the learner's own run.
   */
  it("never tells the model to give the fix on a challenge", async () => {
    await ask({ chunkId: "challenge", message: "just show me the answer" });

    expect(sentPayload().levelInstruction).not.toMatch(/Give the exact fix/i);
    expect(sentPayload().levelInstruction).toMatch(/Help level: CHALLENGE/);
  });

  it("tells the model which language this message is in", async () => {
    await ask({ message: "bakit hindi gumagana yung webhook?" });
    expect(sentPayload().levelInstruction).toMatch(/answer in natural Taglish/i);

    callKazGateway.mockClear();
    allowKazMessage.mockReturnValue(true);
    await ask({ message: "why is the webhook not working?" });
    expect(sentPayload().levelInstruction).toMatch(/answer in English/i);
  });
});

describe("askKaz and the answer", () => {
  it("records the turn and returns both messages", async () => {
    const state = await ask();

    expect(appendTurn).toHaveBeenCalledWith(LAB_03, "debug-it", 1, "What does the IF node do?", "Look at the IF node's condition.");
    expect(state.status).toBe("answered");
    expect(state.status === "answered" && state.answer.content).toBe("Look at the IF node's condition.");
  });

  it("says so honestly when the gateway is down, and records nothing", async () => {
    callKazGateway.mockResolvedValue({ ok: false, code: "unavailable" });

    const state = await ask();

    expect(state.status === "error" && state.message).toMatch(/can't reach the workshop/i);
    expect(appendTurn).not.toHaveBeenCalled();
  });

  it("says so honestly when the model fails", async () => {
    callKazGateway.mockResolvedValue({ ok: false, code: "model_error" });

    const state = await ask();

    expect(state.status === "error" && state.message).toMatch(/model error/i);
  });
});
