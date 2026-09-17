import { describe, expect, it, vi } from "vitest";
import { deliverPayload, MAX_RESPONSE_BYTES, SEND_USER_AGENT, type DeliveryDeps } from "./send-test";
import { allowSend, resetSendThrottle, SEND_MIN_INTERVAL_MS } from "./send-throttle";

const URL_OK = new URL("https://abc.app.n8n.cloud/webhook/aep-lab-03-lead");
const PAYLOAD = { user_id: 5 };

function deps(overrides: Partial<DeliveryDeps> = {}): DeliveryDeps {
  return {
    lookup: async () => [{ address: "104.16.0.1" }],
    fetch: vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })),
    now: () => 0,
    ...overrides,
  };
}

describe("deliverPayload — network controls", () => {
  it("delivers to a public address and returns the response", async () => {
    const result = await deliverPayload(URL_OK, PAYLOAD, deps());

    expect(result.ok).toBe(true);
    expect(result.ok && result.status).toBe(200);
    expect(result.ok && result.text).toContain("success");
  });

  /*
   * A public-looking hostname can resolve to a private address, and a string
   * check cannot see that. Every resolved address is judged.
   */
  it("refuses a hostname that resolves to a private address", async () => {
    const fetchSpy = vi.fn();
    const result = await deliverPayload(
      URL_OK,
      PAYLOAD,
      deps({ lookup: async () => [{ address: "10.0.0.7" }], fetch: fetchSpy }),
    );

    expect(result.ok ? null : result.failure).toBe("blocked_address");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses when any one of several addresses is private", async () => {
    const fetchSpy = vi.fn();
    const result = await deliverPayload(
      URL_OK,
      PAYLOAD,
      deps({
        lookup: async () => [{ address: "104.16.0.1" }, { address: "169.254.169.254" }],
        fetch: fetchSpy,
      }),
    );

    expect(result.ok ? null : result.failure).toBe("blocked_address");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports an unresolvable host as unreachable", async () => {
    const result = await deliverPayload(
      URL_OK,
      PAYLOAD,
      deps({
        lookup: async () => {
          throw new Error("ENOTFOUND");
        },
      }),
    );

    expect(result.ok ? null : result.failure).toBe("unreachable");
  });

  /*
   * The control that carries the most weight: a redirect to cloud metadata
   * would otherwise bypass every other check.
   */
  it("never follows a redirect", async () => {
    const fetchSpy = vi.fn<typeof fetch>(
      async () =>
        new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } }),
    );
    const result = await deliverPayload(URL_OK, PAYLOAD, deps({ fetch: fetchSpy }));

    expect(result.ok ? null : result.failure).toBe("redirected");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ redirect: "manual" });
  });

  it("reports a workflow that never answers as a timeout", async () => {
    const result = await deliverPayload(
      URL_OK,
      PAYLOAD,
      deps({
        fetch: async () => {
          throw new DOMException("timed out", "TimeoutError");
        },
      }),
    );

    expect(result.ok ? null : result.failure).toBe("timeout");
  });

  it("stops reading a response past the size cap", async () => {
    const huge = "x".repeat(MAX_RESPONSE_BYTES * 3);
    const result = await deliverPayload(
      URL_OK,
      PAYLOAD,
      deps({ fetch: async () => new Response(huge, { status: 200 }) }),
    );

    expect(result.ok && result.truncated).toBe(true);
    expect(result.ok && result.text.length).toBe(MAX_RESPONSE_BYTES);
  });

  /*
   * Nothing worth relaying ever leaves AEP: no cookie, no authorization, no
   * learner session. Exactly the payload and two plain headers.
   */
  it("sends only the payload with two plain headers", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    await deliverPayload(URL_OK, PAYLOAD, deps({ fetch: fetchSpy }));

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(Object.keys(headers).sort()).toEqual(["content-type", "user-agent"]);
    expect(headers["user-agent"]).toBe(SEND_USER_AGENT);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(PAYLOAD));
    expect(init).not.toHaveProperty("credentials");
  });
});

describe("allowSend — throttle", () => {
  it("refuses a second send inside the minimum interval, then allows it", () => {
    resetSendThrottle();

    expect(allowSend("user:lab", 1_000)).toBe(true);
    expect(allowSend("user:lab", 1_000 + SEND_MIN_INTERVAL_MS - 1)).toBe(false);
    expect(allowSend("user:lab", 1_000 + SEND_MIN_INTERVAL_MS)).toBe(true);
  });

  it("throttles each learner and lab independently", () => {
    resetSendThrottle();

    expect(allowSend("a:lab-03", 0)).toBe(true);
    expect(allowSend("b:lab-03", 0)).toBe(true);
    expect(allowSend("a:lab-04", 0)).toBe(true);
  });
});
