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

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

describe("security invariants", () => {
  it("never calls Supabase's own auth.getSession() anywhere under web/src", () => {
    // getUser() revalidates against the Auth server; getSession() only
    // decodes the cookie locally and would accept a revoked session.
    const offenders = findOffenders(SRC_DIR, (text) => text.includes("auth.getSession("));
    expect(offenders).toEqual([]);
  });

  it("never references a service_role / SUPABASE_SERVICE_ROLE identifier under web/src", () => {
    // Admin work uses the scoped secret key (admin-client.ts), never the
    // legacy service-role JWT.
    const offenders = findOffenders(SRC_DIR, (text) => /service_role/i.test(text));
    expect(offenders).toEqual([]);
  });

  it("reads SUPABASE_SECRET_KEY in admin-client.ts only, which is server-only", () => {
    // The secret key bypasses row-level security. One reader, behind
    // `server-only`, is what keeps it out of every browser bundle.
    const readers = findOffenders(SRC_DIR, (text) => text.includes("SUPABASE_SECRET_KEY"));
    expect(readers.map(toPosix).sort()).toEqual([
      "src/lib/supabase/admin-client.test.ts",
      "src/lib/supabase/admin-client.ts",
    ]);

    const adminClient = fs.readFileSync(path.join(SRC_DIR, "lib", "supabase", "admin-client.ts"), "utf8");
    expect(adminClient.startsWith('import "server-only";')).toBe(true);
  });

  it("never names a public secret or embeds a secret key in a file that ships", () => {
    // `.env*.local` is the one place a real key belongs: git-ignored, never
    // bundled, and the only file `admin-client.ts` reads it from. Everything
    // else under web/ — source, `.env.example`, docs, build config — must
    // carry neither a public-secret variable name nor a key.
    const isLocalEnvFile = (file: string) => /(^|[\\/])\.env(\..+)?\.local$/.test(file);
    const offenders = findOffenders(
      WEB_DIR,
      (text) =>
        /NEXT_PUBLIC_[A-Z_]*SECRET/.test(text) ||
        /sb_secret_[A-Za-z0-9]/.test(text) ||
        // n8n API keys have their own prefix, and Kaz's Gateway uses one.
        /n8n_api_[A-Za-z0-9]/.test(text),
    ).filter((file) => !isLocalEnvFile(file));
    expect(offenders).toEqual([]);
  });

  it("uses the admin client only from lib/admin, and never from client code", () => {
    const importers = findOffenders(SRC_DIR, (text) => text.includes("@/lib/supabase/admin-client"))
      .map(toPosix)
      .filter((file) => !file.endsWith(".test.ts"));
    expect(importers.every((file) => file.startsWith("src/lib/admin/"))).toBe(true);

    const clientImporters = findOffenders(
      SRC_DIR,
      (text) => /^["']use client["']/.test(text) && /supabase\/admin-client|auth\.admin/.test(text),
    );
    expect(clientImporters).toEqual([]);
  });

  it("calls Supabase Auth Admin APIs only under lib/admin", () => {
    const callers = findOffenders(SRC_DIR, (text) => text.includes("auth.admin."))
      .map(toPosix)
      .filter((file) => !file.endsWith(".test.ts"));
    expect(callers.every((file) => file.startsWith("src/lib/admin/"))).toBe(true);
  });

  it("reads the Kaz Gateway secret in gateway.ts only, which is server-only", () => {
    // The Gateway can read every workflow and execution in the owner's n8n, so
    // its credential lives in exactly one module, behind `server-only`, and the
    // browser reaches Kaz only through the Server Action.
    const readers = findOffenders(SRC_DIR, (text) => text.includes("KAZ_GATEWAY_SECRET"));
    expect(readers.map(toPosix).sort()).toEqual([
      "src/lib/kaz/gateway.test.ts",
      "src/lib/kaz/gateway.ts",
    ]);

    const gateway = fs.readFileSync(path.join(SRC_DIR, "lib", "kaz", "gateway.ts"), "utf8");
    expect(gateway.startsWith('import "server-only";')).toBe(true);
  });

  it("never exposes a Kaz server value to the browser", () => {
    const offenders = findOffenders(WEB_DIR, (text) => /NEXT_PUBLIC_KAZ/.test(text));
    expect(offenders).toEqual([]);
  });

  it("calls the Kaz Gateway from one module, and never from client code", () => {
    const importers = findOffenders(SRC_DIR, (text) => text.includes("./gateway") || text.includes("kaz/gateway"))
      .map(toPosix)
      .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));
    // The action and the page that reads a learner's webhook host; nothing else.
    expect(importers.every((file) => file.startsWith("src/lib/kaz/") || file.startsWith("src/app/"))).toBe(
      true,
    );

    const clientCallers = findOffenders(
      SRC_DIR,
      (text) => /^["']use client["']/.test(text) && /kaz\/gateway|x-aep-kaz-secret/.test(text),
    );
    expect(clientCallers).toEqual([]);
  });

  it("never references the deleted AEP_PLACEHOLDER_ROLE placeholder anywhere under web/", () => {
    const offenders = findOffenders(WEB_DIR, (text) => text.includes("AEP_PLACEHOLDER_ROLE"));
    expect(offenders).toEqual([]);
  });

  it("never passes shouldCreateUser: true anywhere under web/src", () => {
    // AEP is invite-only: signInWithOtp must never be allowed to silently
    // create a new account. sign-in-actions.ts hard-codes `false`; this
    // scan is what stops a future edit from flipping it back without
    // anyone noticing in review.
    const offenders = findOffenders(SRC_DIR, (text) => /shouldCreateUser\s*:\s*true/.test(text));
    expect(offenders).toEqual([]);
  });
});
