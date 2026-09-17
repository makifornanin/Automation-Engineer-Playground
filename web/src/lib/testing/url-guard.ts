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
 * Expands an IPv6 address into its eight hextets, or null if it is not one
 * written purely in hex. Compressed forms have to be expanded before any
 * prefix check: `2001::1` is Teredo, but its second group is not written.
 */
function parseIPv6Hextets(address: string): number[] | null {
  const halves = address.split("::");
  if (halves.length > 2) return null;

  const toGroups = (half: string) => (half === "" ? [] : half.split(":"));
  const head = toGroups(halves[0] ?? "");
  const tail = halves.length === 2 ? toGroups(halves[1] ?? "") : [];

  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;

  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16));
}

/**
 * Whether a resolved address is off limits.
 *
 * IPv6 is handled by allow-list rather than deny-list: only global unicast
 * (2000::/3) is permitted, minus the documentation prefix and the 6to4
 * (2002::/16) and Teredo (2001::/32) transition prefixes, which sit inside
 * global unicast but tunnel to an IPv4 address that may be private.
 * Enumerating every special IPv6 range is how deny-lists get bypassed; there
 * are few legitimate reasons for a learner's public n8n to answer anywhere
 * else. IPv4-mapped IPv6 is unwrapped and judged as the IPv4 it carries, and
 * any other form with an embedded dotted IPv4 is refused.
 *
 * Anything unparseable is blocked. Failing closed is the only safe default for
 * an address about to receive a request.
 */
export function isBlockedAddress(address: string): boolean {
  const trimmed = address.trim().toLowerCase();

  const v4 = parseIPv4(trimmed);
  if (v4 !== null) return isBlockedIPv4(v4);

  if (trimmed.startsWith("::ffff:")) {
    const mapped = parseIPv4(trimmed.slice("::ffff:".length));
    return mapped === null ? true : isBlockedIPv4(mapped);
  }

  const hextets = parseIPv6Hextets(trimmed);
  if (hextets === null) return true;
  const [first = 0, second = 0] = hextets;

  const isGlobalUnicast = first >= 0x2000 && first <= 0x3fff;
  if (!isGlobalUnicast) return true;

  const isDocumentation = first === 0x2001 && second === 0x0db8;
  const isTeredo = first === 0x2001 && second === 0x0000;
  const is6to4 = first === 0x2002;
  return isDocumentation || isTeredo || is6to4;
}
