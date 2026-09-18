import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { CanonicalAllowance } from "./help-ladder";

/**
 * The canonical lab workflows, read from the repository at
 * `labs/NN-.../workflow/*.json`.
 *
 * These are hidden reference material: they are what the lab is supposed to
 * look like, which makes them the best debugging aid in the product and the
 * worst thing to hand over early. What comes out of here is therefore decided
 * by the help ladder, never by the question — see `help-ladder.ts`.
 *
 * `server-only`, and nothing here is ever returned to the browser.
 */

export interface CanonicalNode {
  name: string;
  type: string;
  /** Only at the level that allows configuration. */
  parameters?: unknown;
}

export interface CanonicalWorkflow {
  name: string;
  nodes: readonly CanonicalNode[];
  /** "Webhook -> Normalize -> Validate" style, for a structure-only summary. */
  order: readonly string[];
}

const LABS_DIR = path.resolve(process.cwd(), "..", "labs");
const LAB_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9-]+$/;

/** Node parameter keys that must never travel, whatever the level. */
const SECRET_KEY = /(key|token|secret|password|passwd|credential|authorization|auth|cookie|bearer)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Strips credential material out of a node's parameters, recursively, and caps
 * the size. The canonical exports in this repository carry no secrets — they
 * are committed — but this runs anyway: a future export, or an owner pasting
 * a working copy in, must not be able to leak one through Kaz.
 */
export function sanitizeParameters(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[nested]";
  if (typeof value === "string") return value.length > 2_000 ? value.slice(0, 2_000) + "…" : value;
  if (Array.isArray(value)) return value.slice(0, 40).map((entry) => sanitizeParameters(entry, depth + 1));
  if (!isRecord(value)) return value;

  /*
   * n8n writes headers and query parameters as `{ name, value }` pairs, so the
   * key that holds a bearer token is literally called "value". Redacting by key
   * name alone would let `{ name: "Authorization", value: "Bearer ..." }`
   * through — found by running the Gateway's own sanitizer against a hostile
   * node in `gateway-code.test.ts`.
   */
  if (typeof value.name === "string" && SECRET_KEY.test(value.name) && "value" in value) {
    return { ...value, value: "[redacted]" };
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = sanitizeParameters(entry, depth + 1);
  }
  return out;
}

function readExport(labSlug: string): Record<string, unknown> | null {
  if (!LAB_SLUG_PATTERN.test(labSlug)) return null;
  const dir = path.join(LABS_DIR, labSlug, "workflow");
  try {
    const file = fs.readdirSync(dir).find((entry) => entry.endsWith(".json"));
    if (!file) return null;
    const parsed: unknown = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    return isRecord(parsed) ? parsed : null;
  } catch {
    // No export for this lab (the Capstone has none) — Kaz works without it.
    return null;
  }
}

/**
 * The canonical workflow for a lab, cut to what this help level allows.
 *
 * `structure` gives node names, types and order: enough to say "your flow has
 * no IF between the webhook and the HTTP request". `configuration` adds the
 * parameters: enough to give the exact fix, which is level 4 only.
 */
export function getCanonicalWorkflow(
  labSlug: string,
  allowance: CanonicalAllowance,
): CanonicalWorkflow | null {
  if (!allowance.structure && !allowance.configuration) return null;

  const raw = readExport(labSlug);
  if (!raw) return null;

  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const nodes: CanonicalNode[] = rawNodes.slice(0, 60).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const name = typeof entry.name === "string" ? entry.name : "";
    const type = typeof entry.type === "string" ? entry.type : "";
    if (!name || !type) return [];
    // `credentials` is dropped entirely rather than redacted field by field.
    return [
      allowance.configuration
        ? { name, type, parameters: sanitizeParameters(entry.parameters) }
        : { name, type },
    ];
  });

  return {
    name: typeof raw.name === "string" ? raw.name : labSlug,
    nodes,
    order: nodes.map((node) => node.name),
  };
}
