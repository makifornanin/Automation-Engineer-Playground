import { describe, expect, it } from "vitest";
import { isBlockedAddress, validateLearnerWebhookUrl } from "./url-guard";

/*
 * The adversarial table. Written before any request code, per the
 * Architect's instruction: the learner-supplied URL is the primary attack
 * surface of Send Test, and every rule below is a way someone could turn AEP
 * into a relay aimed at somewhere it must never reach.
 */
describe("validateLearnerWebhookUrl — refuses", () => {
  const cases: readonly [string, string, string][] = [
    ["plain http", "http://abc.app.n8n.cloud/webhook/x", "not_https"],
    ["a file URL", "file:///etc/passwd", "not_https"],
    ["a data URL", "data:text/plain,hello", "not_https"],
    ["gopher", "gopher://example.com/", "not_https"],
    ["credentials in the URL", "https://user:pass@abc.app.n8n.cloud/webhook/x", "credentials"],
    ["a username alone", "https://user@abc.app.n8n.cloud/webhook/x", "credentials"],
    ["a non-default port", "https://abc.app.n8n.cloud:8080/webhook/x", "port"],
    ["n8n's local port", "https://example.com:5678/webhook/x", "port"],
    ["loopback", "https://127.0.0.1/webhook/x", "ip_literal"],
    ["cloud metadata", "https://169.254.169.254/latest/meta-data", "ip_literal"],
    ["a private address", "https://10.0.0.5/webhook/x", "ip_literal"],
    ["IPv6 loopback", "https://[::1]/webhook/x", "ip_literal"],
    ["decimal-encoded loopback", "https://2130706433/webhook/x", "ip_literal"],
    ["hex-encoded loopback", "https://0x7f.0.0.1/webhook/x", "ip_literal"],
    ["octal-encoded loopback", "https://017700000001/webhook/x", "ip_literal"],
    ["localhost", "https://localhost/webhook/x", "not_public_hostname"],
    ["a .localhost subdomain", "https://n8n.localhost/webhook/x", "not_public_hostname"],
    ["a .local name", "https://n8n.local/webhook/x", "not_public_hostname"],
    ["a .internal name", "https://metadata.google.internal/x", "not_public_hostname"],
    ["a bare hostname with no dot", "https://n8n/webhook/x", "not_public_hostname"],
    ["garbage", "not a url at all", "malformed"],
    ["an empty value", "   ", "empty"],
  ];

  it.each(cases)("%s", (_label, raw, reason) => {
    const result = validateLearnerWebhookUrl(raw);
    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.reason).toBe(reason);
  });

  it("an absurdly long URL", () => {
    const result = validateLearnerWebhookUrl("https://example.com/" + "a".repeat(3000));
    expect(result.ok ? null : result.reason).toBe("too_long");
  });
});

describe("validateLearnerWebhookUrl — accepts", () => {
  it.each([
    ["an n8n Cloud production webhook", "https://abc.app.n8n.cloud/webhook/aep-lab-03-lead"],
    ["an ngrok tunnel", "https://a1b2-203-0-113-9.ngrok-free.app/webhook/aep-lab-07-event"],
    ["a self-hosted n8n on its own domain", "https://n8n.example.com/webhook/aep-lab-04-lead"],
    ["the explicit default port", "https://n8n.example.com:443/webhook/x"],
  ])("%s", (_label, raw) => {
    expect(validateLearnerWebhookUrl(raw).ok).toBe(true);
  });

  it("trims surrounding whitespace from a pasted URL", () => {
    const result = validateLearnerWebhookUrl("  https://abc.app.n8n.cloud/webhook/x  ");
    expect(result.ok && result.url.hostname).toBe("abc.app.n8n.cloud");
  });
});

/*
 * The DNS half. A public-looking hostname can resolve to a private address,
 * so every resolved address is judged before a request is made.
 */
describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
    "2001:db8::1",
    "not-an-address",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "104.16.0.1", "172.32.0.1", "2606:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});
