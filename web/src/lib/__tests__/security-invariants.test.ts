import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * A cheap `node:fs` scan of the source tree, mechanically proving the three
 * security rules most likely to be reintroduced by a future well-meaning
 * edit. Not a substitute for the behavioural tests elsewhere — this only
 * catches the literal text patterns those rules are named for.
 */

const THIS_FILE = fileURLToPath(import.meta.url);
const SRC_DIR = path.resolve(path.dirname(THIS_FILE), "..", "..");
const WEB_DIR = path.resolve(SRC_DIR, "..");

const EXCLUDED_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "package-lock.json",
  "tsconfig.tsbuildinfo",
]);

function collectFiles(root: string): string[] {
  const files: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    // Non-null: `stack.length > 0` guarantees `pop()` returns a value.
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDED_NAMES.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function findOffenders(root: string, matches: (text: string) => boolean): string[] {
  return collectFiles(root)
    .filter((file) => file !== THIS_FILE)
    .filter((file) => {
      try {
        return matches(fs.readFileSync(file, "utf8"));
      } catch {
        // Unreadable (e.g. a binary asset) — cannot contain the pattern.
        return false;
      }
    })
    .map((file) => path.relative(WEB_DIR, file));
}

describe("security invariants", () => {
  it("never calls Supabase's own auth.getSession() anywhere under web/src", () => {
    // getUser() revalidates against the Auth server; getSession() only
    // decodes the cookie locally and would accept a revoked session.
    const offenders = findOffenders(SRC_DIR, (text) => text.includes("auth.getSession("));
    expect(offenders).toEqual([]);
  });

  it("never references a service_role / SUPABASE_SERVICE_ROLE identifier under web/src", () => {
    // No service-role client exists in this Aim Point. Nothing here needs it.
    const offenders = findOffenders(SRC_DIR, (text) => /service_role/i.test(text));
    expect(offenders).toEqual([]);
  });

  it("never references the deleted AEP_PLACEHOLDER_ROLE placeholder anywhere under web/", () => {
    const offenders = findOffenders(WEB_DIR, (text) => text.includes("AEP_PLACEHOLDER_ROLE"));
    expect(offenders).toEqual([]);
  });
});
