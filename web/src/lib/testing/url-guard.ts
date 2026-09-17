/**
 * The boundary for learner-supplied webhook URLs.
 *
 * A URL a learner types becomes a server-side request. That makes this the
 * primary attack surface of Send Test: without these checks AEP would be a
 * request relay that could be pointed at cloud metadata endpoints, the host's
 * own services, or anything on a private network.
 *
 * Pure and dependency-free, so every rule is unit tested directly. The check
 * here is the SYNTACTIC half. A public-looking hostname can still resolve to a
 * private address, so the transport resolves DNS at send time and applies
 * `isBlockedAddress` to every result before connecting, and refuses to follow
 * redirects — a 302 to http://169.254.169.254 would bypass everything below.
 *
 * Residual risk, accepted and named: DNS rebinding between resolution and
 * connection is not closed; that needs connection pinning. AEP is invite-only,
 * so the realistic case is a curious learner, which resolution-time checks
 * stop. Re-open if self-serve sign-up is ever enabled.
 */

export const MAX_WEBHOOK_URL_LENGTH = 2048;

/** Hostname suffixes that only ever mean a private or local network. */
const INTERNAL_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".localdomain",
  ".home.arpa",
  ".lan",
  ".intranet",
  ".corp",
];

export type WebhookUrlRejection =
  | "empty"
  | "too_long"
  | "malformed"
  | "not_https"
  | "credentials"
  | "port"
  | "ip_literal"
  | "not_public_hostname";

export type WebhookUrlCheck =
  | { ok: true; url: URL }
  | { ok: false; reason: WebhookUrlRejection };

/**
 * Accepts only an https URL on the default port, with no embedded credentials,
 * addressed by a public-looking hostname rather than an IP.
 *
 * The IP-literal rule does a lot of work cheaply. The WHATWG URL parser
 * normalises decimal, octal and hex IPv4 spellings — 2130706433, 0x7f.0.0.1,
 * 017700000001 — into dotted form before we look, so one dotted-quad check
 * rejects every encoding of 127.0.0.1 and 169.254.169.254, and bracketed
 * hostnames reject IPv6 literals such as [::1].
 */
export function validateLearnerWebhookUrl(raw: string): WebhookUrlCheck {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.length > MAX_WEBHOOK_URL_LENGTH) return { ok: false, reason: "too_long" };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (url.protocol !== "https:") return { ok: false, reason: "not_https" };
  if (url.username !== "" || url.password !== "") return { ok: false, reason: "credentials" };
  if (url.port !== "" && url.port !== "443") return { ok: false, reason: "port" };

  const host = url.hostname.toLowerCase().replace(/\.$/, "");

  if (host.startsWith("[") || host.includes(":") || /^\d+(\.\d+){3}$/.test(host)) {
    return { ok: false, reason: "ip_literal" };
  }

  if (host === "localhost" || INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: false, reason: "not_public_hostname" };
  }

  // A public hostname has at least two labels and ends in a real top-level
  // label: letters, or an internationalised xn-- label. A bare "n8n" or a
  // numeric final label is not something the public internet routes to.
  const labels = host.split(".");
  const topLevel = labels[labels.length - 1] ?? "";
  if (labels.length < 2 || labels.some((label) => label.length === 0)) {
    return { ok: false, reason: "not_public_hostname" };
  }
  if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(topLevel)) {
    return { ok: false, reason: "not_public_hostname" };
  }

  return { ok: true, url };
}

/** IPv4 ranges that must never be the destination of a Send Test. */
const BLOCKED_IPV4: readonly [number, number][] = [
  [ipv4ToInt("0.0.0.0"), 8],
  [ipv4ToInt("10.0.0.0"), 8],
  [ipv4ToInt("100.64.0.0"), 10], // carrier-grade NAT
  [ipv4ToInt("127.0.0.0"), 8],
  [ipv4ToInt("169.254.0.0"), 16], // link-local, including cloud metadata
  [ipv4ToInt("172.16.0.0"), 12],
  [ipv4ToInt("192.0.0.0"), 24],
  [ipv4ToInt("192.0.2.0"), 24],
  [ipv4ToInt("192.168.0.0"), 16],
  [ipv4ToInt("198.18.0.0"), 15],
  [ipv4ToInt("198.51.100.0"), 24],
  [ipv4ToInt("203.0.113.0"), 24],
  [ipv4ToInt("224.0.0.0"), 4], // multicast
  [ipv4ToInt("240.0.0.0"), 4], // reserved and broadcast
];

function ipv4ToInt(address: string): number {
  return address.split(".").reduce((total, octet) => (total << 8) + Number(octet), 0) >>> 0;
}

function parseIPv4(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  if (!parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return null;
  return ipv4ToInt(address);
}

function isBlockedIPv4(value: number): boolean {
  return BLOCKED_IPV4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (base & mask);
  });
}

/**
 * Whether a resolved address is off limits.
 *
 * IPv6 is handled by allow-list rather than deny-list: only global unicast
 * (2000::/3) is permitted, minus the documentation prefix. Enumerating every
 * special IPv6 range is how deny-lists get bypassed; there are few legitimate
 * reasons for a learner's public n8n to answer anywhere else. IPv4-mapped IPv6
 * is unwrapped and judged as the IPv4 it carries, and any other mapped form is
 * refused.
 *
 * Anything unparseable is blocked. Failing closed is the only safe default for
 * an address about to receive a request.
 */
export function isBlockedAddress(address: string): boolean {
  const trimmed = address.trim().toLowerCase();

  const v4 = parseIPv4(trimmed);
  if (v4 !== null) return isBlockedIPv4(v4);

  if (!trimmed.includes(":")) return true;

  if (trimmed.startsWith("::ffff:")) {
    const mapped = parseIPv4(trimmed.slice("::ffff:".length));
    return mapped === null ? true : isBlockedIPv4(mapped);
  }

  if (trimmed.startsWith(":")) return true; // ::, ::1 and other zero-prefixed forms

  const firstHextet = Number.parseInt(trimmed.split(":")[0] ?? "", 16);
  if (!Number.isFinite(firstHextet)) return true;

  const isGlobalUnicast = firstHextet >= 0x2000 && firstHextet <= 0x3fff;
  if (!isGlobalUnicast) return true;

  const secondHextet = Number.parseInt(trimmed.split(":")[1] ?? "", 16);
  const isDocumentation = firstHextet === 0x2001 && secondHextet === 0x0db8;
  return isDocumentation;
}
