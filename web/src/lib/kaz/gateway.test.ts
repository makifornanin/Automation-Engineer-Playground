import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { callKazGateway, webhookPathForGateway, type KazGatewayRequest } from "./gateway";

const N8N_HOST = "n8n.example.com";
const SECRET = "test-gateway-secret-not-a-real-one";

const REQUEST: KazGatewayRequest = {
  persona: "persona",
  rules: "rules",
  levelInstruction: "level",
  helpLevel: 1,
  question: "why did my test fail?",
  history: [],
  lesson: {
    labSlug: "03-apis-webhooks",
    labTitle: "Lab 03",
    chunkTitle: "Debug It",
    chunkKind: "debug",
    outline: [],
    chunkText: "",
  },
  progress: {
    completedLabs: 1,
    totalLabs: 10,
    labComplete: false,
    evidence: {},
    hintsRevealed: [],
    hintsRemaining: 0,
  },
  canonical: null,
  inspect: { workflow: false, execution: false, webhookPath: null },
};

beforeEach(() => {
  vi.stubEnv("KAZ_GATEWAY_URL", "https://n8n.example.com/webhook/aep-kaz-gateway");
  vi.stubEnv("KAZ_GATEWAY_SECRET", SECRET);
  vi.stubEnv("KAZ_N8N_HOST", N8N_HOST);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("webhookPathForGateway", () => {
  it("returns the path when the saved webhook lives on the n8n Kaz can read", () => {
    expect(webhookPathForGateway("https://n8n.example.com/webhook/aep-lab-03-lead")).toBe(
      "aep-lab-03-lead",
    );
  });

  /*
   * A learner running their own n8n somewhere else is a real setup, not an
   * attack — and asking the owner's instance about their path would either
   * find nothing or, worse, find someone else's workflow.
   */
  it("returns nothing for a webhook on any other host", () => {
    expect(webhookPathForGateway("https://someone-else.app.n8n.cloud/webhook/aep-lab-03-lead")).toBeNull();
  });

  it("returns nothing for no saved webhook, or an unparsable one", () => {
    expect(webhookPathForGateway(null)).toBeNull();
    expect(webhookPathForGateway("not a url")).toBeNull();
  });

  it("strips the test-webhook prefix as well as the production one", () => {
    expect(webhookPathForGateway("https://n8n.example.com/webhook-test/aep-lab-04-lead")).toBe(
      "aep-lab-04-lead",
    );
  });
});

describe("callKazGateway", () => {
  function reply(body: unknown, status = 200): typeof fetch {
    return vi.fn(async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
    ) as unknown as typeof fetch;
  }

  it("sends the shared secret as a header and returns the answer", async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(JSON.stringify({ answer: "Look at the IF node.", looked: { execution: true } }), {
        status: 200,
      }),
    );

    const result = await callKazGateway(REQUEST, { fetch: fetchSpy as unknown as typeof fetch });

    expect(result).toEqual({
      ok: true,
      answer: "Look at the IF node.",
      looked: { workflow: false, execution: true },
    });
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-aep-kaz-secret"]).toBe(SECRET);
    expect(init.redirect).toBe("manual");
  });

  it("is unavailable when nothing is configured, and never calls out", async () => {
    vi.stubEnv("KAZ_GATEWAY_URL", "");
    const fetchSpy = vi.fn();

    const result = await callKazGateway(REQUEST, { fetch: fetchSpy as unknown as typeof fetch });

    expect(result).toEqual({ ok: false, code: "unavailable" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is unavailable when the gateway cannot be reached", async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    expect(await callKazGateway(REQUEST, { fetch: fetchSpy as unknown as typeof fetch })).toEqual({
      ok: false,
      code: "unavailable",
    });
  });

  it("treats a redirect as a failure rather than following it", async () => {
    expect(await callKazGateway(REQUEST, { fetch: reply("", 302) })).toEqual({
      ok: false,
      code: "unavailable",
    });
  });

  it("reports a model error for a 5xx and for an answerless body", async () => {
    expect(await callKazGateway(REQUEST, { fetch: reply({ error: "boom" }, 502) })).toEqual({
      ok: false,
      code: "model_error",
    });
    expect(await callKazGateway(REQUEST, { fetch: reply({ looked: {} }) })).toEqual({
      ok: false,
      code: "model_error",
    });
    expect(await callKazGateway(REQUEST, { fetch: reply("not json at all") })).toEqual({
      ok: false,
      code: "model_error",
    });
  });

  it("caps a long answer instead of passing it through", async () => {
    const result = await callKazGateway(REQUEST, {
      fetch: reply({ answer: "x".repeat(20_000), looked: {} }),
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.answer.length).toBe(4_000);
  });

  /*
   * A response too large to be a Kaz answer is refused, not parsed: the body is
   * read up to a fixed cap and whatever is left is not JSON any more.
   */
  it("refuses a response past the read cap", async () => {
    const result = await callKazGateway(REQUEST, {
      fetch: reply({ answer: "x".repeat(200_000), looked: {} }),
    });

    expect(result).toEqual({ ok: false, code: "model_error" });
  });
});
