import { describe, expect, it } from "vitest";
import { isLikelyEmail, normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  ada@example.com  ")).toBe("ada@example.com");
  });

  it("lowercases the whole address", () => {
    expect(normalizeEmail("Ada@Example.COM")).toBe("ada@example.com");
  });

  it("trims and lowercases together", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("leaves an already-normalized address unchanged", () => {
    expect(normalizeEmail("ada@example.com")).toBe("ada@example.com");
  });
});

describe("isLikelyEmail", () => {
  it("accepts a plain address", () => {
    expect(isLikelyEmail("ada@example.com")).toBe(true);
  });

  it("accepts an address with a subdomain and a plus tag", () => {
    expect(isLikelyEmail("ada+aep@mail.example.co")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isLikelyEmail("")).toBe(false);
  });

  it("rejects a string with no @", () => {
    expect(isLikelyEmail("ada.example.com")).toBe(false);
  });

  it("rejects a string with no domain after @", () => {
    expect(isLikelyEmail("ada@")).toBe(false);
  });

  it("rejects a string with no local part before @", () => {
    expect(isLikelyEmail("@example.com")).toBe(false);
  });

  it("rejects a domain with no dot", () => {
    expect(isLikelyEmail("ada@example")).toBe(false);
  });

  it("rejects an address containing whitespace", () => {
    expect(isLikelyEmail("ada @example.com")).toBe(false);
  });

  it("rejects an address with more than one @", () => {
    expect(isLikelyEmail("ada@@example.com")).toBe(false);
  });
});
