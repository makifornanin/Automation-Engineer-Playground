import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Delivery } from "./send-test";

const recordVerifiedEvidence = vi.hoisted(() => vi.fn(async () => {}));
const getSession = vi.hoisted(() => vi.fn());
const getLabWebhookUrl = vi.hoisted(() => vi.fn());
const storeLabWebhookUrl = vi.hoisted(() => vi.fn());
const deliverPayload = vi.hoisted(() => vi.fn());

vi.mock("@/lib/course/progress-writes", () => ({ recordVerifiedEvidence }));
vi.mock("@/lib/session/get-session", () => ({ getSession }));
vi.mock("./webhook-store", () => ({ getLabWebhookUrl, storeLabWebhookUrl }));
vi.mock("./send-test", () => ({ deliverPayload }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { resetSendThrottle } from "./send-throttle";
import { saveLabWebhook, sendTest } from "./send-test-actions";
import { IDLE_SEND_TEST_STATE, IDLE_WEBHOOK_SAVE_STATE } from "./types";

const LAB_03 = "03-apis-webhooks";
const LAB_07 = "07-idempotency-duplicate-protection";
const SAVED = "https://abc.app.n8n.cloud/webhook/aep-lab-03-lead";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function answer(body: unknown, status = 200): Delivery {
  return { ok: true, status, text: JSON.stringify(body), truncated: false, durationMs: 12 };
}

const LAB_03_CORRECT = {
  success: true,
  message: "External customer data found",
  customer_name: "Chelsey Dietrich",
  customer_email: "Lucio_Hettinger@annie.ca",
};

beforeEach(() => {
  resetSendThrottle();
  recordVerifiedEvidence.mockClear();
  deliverPayload.mockReset();
  getLabWebhookUrl.mockReset();
  storeLabWebhookUrl.mockReset();
  getSession.mockResolvedValue({
    status: "authenticated",
    user: { id: "learner-1", displayName: "L", role: "student" },
  });
  getLabWebhookUrl.mockResolvedValue(SAVED);
  deliverPayload.mockResolvedValue(answer(LAB_03_CORRECT));
});

describe("sendTest", () => {
  it("sends the chunk's payload to the saved webhook and records evidence on a pass", async () => {
    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

    expect(state.status === "complete" && state.result.passed).toBe(true);
    expect(deliverPayload).toHaveBeenCalledTimes(1);
    const [url, payload] = deliverPayload.mock.calls[0] as [URL, unknown];
    expect(url.toString()).toBe(SAVED);
    expect(payload).toMatchObject({ user_id: 5 });
    expect(recordVerifiedEvidence).toHaveBeenCalledWith(LAB_03, "success-test");
  });

  /*
   * The action cannot be turned into a relay: a URL or payload in the request
   * is simply never read. Only the learner's saved URL and the chunk's own
   * payload are used.
   */
  it("ignores a URL and payload supplied in the request", async () => {
    await sendTest(
      IDLE_SEND_TEST_STATE,
      form({
        labSlug: LAB_03,
        chunkId: "success-test",
        webhookUrl: "https://attacker.example.com/",
        payload: '{"evil":true}',
      }),
    );

    const [url, payload] = deliverPayload.mock.calls[0] as [URL, unknown];
    expect(url.toString()).toBe(SAVED);
    expect(payload).not.toHaveProperty("evil");
  });

  it("records nothing when the response is wrong, and says where", async () => {
    deliverPayload.mockResolvedValue(
      answer({ ...LAB_03_CORRECT, customer_name: "{{ $json.body.name }}" }),
    );

    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

    expect(state.status === "complete" && state.result.passed).toBe(false);
    expect(state.status === "complete" && state.result.firstFailure?.id).toBe("name");
    expect(recordVerifiedEvidence).not.toHaveBeenCalled();
  });

  it("asks for a webhook when none is saved", async () => {
    getLabWebhookUrl.mockResolvedValue(null);

    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

    expect(state.status === "error" && state.code).toBe("not_configured");
    expect(deliverPayload).not.toHaveBeenCalled();
  });

  /* A row saved under older rules is re-checked, never trusted. */
  it("refuses a saved URL that no longer passes the guard", async () => {
    getLabWebhookUrl.mockResolvedValue("http://127.0.0.1:5678/webhook/x");

    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

    expect(state.status === "error" && state.code).toBe("invalid_url");
    expect(deliverPayload).not.toHaveBeenCalled();
  });

  it("requires a signed-in learner", async () => {
    getSession.mockResolvedValue({ status: "anonymous" });

    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

    expect(state.status === "error" && state.code).toBe("not_signed_in");
    expect(deliverPayload).not.toHaveBeenCalled();
  });

  it("only runs for a send-test chunk", async () => {
    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "challenge" }));

    expect(state.status === "error" && state.code).toBe("unknown_case");
    expect(deliverPayload).not.toHaveBeenCalled();
  });

  it("throttles a second send inside the interval", async () => {
    await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));
    const second = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

    expect(second.status === "error" && second.code).toBe("throttled");
    expect(deliverPayload).toHaveBeenCalledTimes(1);
  });

  /* Lab 07 proves duplicate protection only on the second delivery. */
  it("delivers repeatedly when the chunk asks for it and judges the last response", async () => {
    deliverPayload
      .mockResolvedValueOnce(
        answer({ success: true, duplicate: false, message: "Event processed successfully", event_id: "evt_504", status: "processed" }),
      )
      .mockResolvedValueOnce(
        answer({ success: true, duplicate: true, message: "Duplicate event ignored", event_id: "evt_504" }),
      );

    const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_07, chunkId: "success-test" }));

    expect(deliverPayload).toHaveBeenCalledTimes(2);
    expect(state.status === "complete" && state.result.passed).toBe(true);
  });

  describe("diagnostic hints", () => {
    it.each([
      ["unreachable", "own machine"],
      ["timeout", "Respond to Webhook"],
      ["blocked_address", "private or local"],
      ["redirected", "redirect"],
    ] as const)("explains a %s failure", async (failure, hint) => {
      deliverPayload.mockResolvedValue({ ok: false, failure, durationMs: 5 });

      const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

      expect(state.status === "error" && state.code).toBe(failure);
      expect(state.status === "error" && state.message).toContain(hint);
    });

    it("recognises an inactive n8n webhook", async () => {
      deliverPayload.mockResolvedValue(
        answer({ code: 404, message: 'The requested webhook "POST aep-lab-03-lead" is not registered.' }, 404),
      );

      const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

      expect(state.status === "error" && state.code).toBe("webhook_not_active");
      expect(state.status === "error" && state.message).toContain("Production URL");
    });

    it("points at the execution when the workflow itself failed", async () => {
      deliverPayload.mockResolvedValue(answer({ message: "Workflow errored" }, 500));

      const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

      expect(state.status === "error" && state.code).toBe("workflow_error");
    });

    it("says so when the workflow answers without JSON", async () => {
      deliverPayload.mockResolvedValue({ ok: true, status: 200, text: "<html>ok</html>", truncated: false, durationMs: 3 });

      const state = await sendTest(IDLE_SEND_TEST_STATE, form({ labSlug: LAB_03, chunkId: "success-test" }));

      expect(state.status === "error" && state.code).toBe("bad_response");
    });
  });
});

describe("saveLabWebhook", () => {
  it("saves a valid public https URL for a webhook lab", async () => {
    storeLabWebhookUrl.mockResolvedValue("saved");

    const state = await saveLabWebhook(IDLE_WEBHOOK_SAVE_STATE, form({ labSlug: LAB_03, webhookUrl: SAVED }));

    expect(state).toEqual({ status: "saved", host: "abc.app.n8n.cloud" });
    expect(storeLabWebhookUrl).toHaveBeenCalledWith(LAB_03, SAVED);
  });

  it("refuses a localhost URL before anything is stored, and says why", async () => {
    const state = await saveLabWebhook(
      IDLE_WEBHOOK_SAVE_STATE,
      form({ labSlug: LAB_03, webhookUrl: "http://localhost:5678/webhook/aep-lab-03-lead" }),
    );

    expect(state.status).toBe("error");
    expect(state.status === "error" && state.message).toMatch(/https/i);
    expect(storeLabWebhookUrl).not.toHaveBeenCalled();
  });

  /* Vision §25: webhook configuration only exists where a lab needs it. */
  it("refuses to store a webhook for a lab that has none", async () => {
    const state = await saveLabWebhook(
      IDLE_WEBHOOK_SAVE_STATE,
      form({ labSlug: "01-data-mapping-transformation", webhookUrl: SAVED }),
    );

    expect(state.status).toBe("error");
    expect(storeLabWebhookUrl).not.toHaveBeenCalled();
  });

  it("says so when the store is unavailable", async () => {
    storeLabWebhookUrl.mockResolvedValue("store_unavailable");

    const state = await saveLabWebhook(IDLE_WEBHOOK_SAVE_STATE, form({ labSlug: LAB_03, webhookUrl: SAVED }));

    expect(state.status === "error" && state.message).toMatch(/cannot save/i);
  });
});
