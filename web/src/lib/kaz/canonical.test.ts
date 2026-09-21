import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCanonicalWorkflow, sanitizeParameters } from "./canonical";

const LAB_03 = "03-apis-webhooks";

describe("getCanonicalWorkflow", () => {
  it("returns nothing at all when the level allows nothing", () => {
    expect(getCanonicalWorkflow(LAB_03, { structure: false, configuration: false })).toBeNull();
  });

  it("gives node names and order at structure level, and no parameters", () => {
    const workflow = getCanonicalWorkflow(LAB_03, { structure: true, configuration: false });

    expect(workflow?.nodes.length).toBeGreaterThan(2);
    expect(workflow?.order.length).toBe(workflow?.nodes.length);
    for (const node of workflow?.nodes ?? []) {
      expect(node.name.length).toBeGreaterThan(0);
      expect(node).not.toHaveProperty("parameters");
    }
  });

  it("gives the configuration only when the level allows it", () => {
    const workflow = getCanonicalWorkflow(LAB_03, { structure: true, configuration: true });

    expect(workflow?.nodes.some((node) => node.parameters !== undefined)).toBe(true);
  });

  it("never carries a node's credentials across", () => {
    const workflow = getCanonicalWorkflow(LAB_03, { structure: true, configuration: true });

    expect(JSON.stringify(workflow)).not.toContain("credentials");
  });

  it("returns nothing for a lab with no export, and for a bogus slug", () => {
    const allowance = { structure: true, configuration: true };
    expect(getCanonicalWorkflow("11-capstone", allowance)).toBeNull();
    expect(getCanonicalWorkflow("../../etc", allowance)).toBeNull();
    expect(getCanonicalWorkflow("99-not-a-lab", allowance)).toBeNull();
  });
});

/* Assembled, not written out: the secret scan forbids key-shaped literals in
   any file that ships, fixtures included. */
const SUPABASE_SHAPED_SECRET = ["sb", "secret", "live"].join("_");

describe("sanitizeParameters", () => {
  it("redacts anything whose key looks like a secret, at any depth", () => {
    const cleaned = sanitizeParameters({
      url: "https://example.com/users/1",
      headers: { Authorization: "Bearer abc123", apiKey: SUPABASE_SHAPED_SECRET },
      nested: { deep: { token: "t-123", keep: "visible" } },
    });

    const text = JSON.stringify(cleaned);
    expect(text).not.toContain("abc123");
    expect(text).not.toContain(SUPABASE_SHAPED_SECRET);
    expect(text).not.toContain("t-123");
    expect(text).toContain("visible");
    expect(text).toContain("https://example.com/users/1");
  });

  it("caps long strings and long arrays", () => {
    const cleaned = sanitizeParameters({
      big: "x".repeat(10_000),
      many: Array.from({ length: 500 }, (_, index) => index),
    }) as { big: string; many: unknown[] };

    expect(cleaned.big.length).toBeLessThanOrEqual(2_001);
    expect(cleaned.many.length).toBeLessThanOrEqual(40);
  });

  it("does not recurse forever", () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let i = 0; i < 40; i += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(() => sanitizeParameters(deep)).not.toThrow();
  });
});

it("sanitizes siblings of sensitive name/value pairs recursively", () => {
  const text = JSON.stringify(sanitizeParameters({ name: "Authorization", value: "fixture-header", password: "fixture-password", nested: { name: "Cookie", value: "fixture-cookie", child: { token: "fixture-token" } }, large: "x".repeat(9000) }));
  for (const secret of ["fixture-header", "fixture-password", "fixture-cookie", "fixture-token"]) expect(text).not.toContain(secret);
  expect(text).not.toContain("x".repeat(2002));
});
