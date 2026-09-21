import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kaz reads canonical workflow exports dynamically from the sibling labs tree.
  // Keep these server assets in deployment traces without copying the whole repo.
  outputFileTracingRoot: path.resolve(import.meta.dirname, ".."),
  outputFileTracingIncludes: {
    "/*": ["../labs/*/workflow/*.json"],
  },

  /*
   * Use the same repository root for Turbopack and output tracing. This keeps
   * sibling lab assets available and avoids unrelated lockfiles above the repo.
   * `web/` remains the Vercel Root Directory.
   */
  turbopack: {
    root: path.resolve(import.meta.dirname, ".."),
  },

  /*
   * Next 16 writes AGENTS.md and CLAUDE.md into this directory on `next dev`.
   * AEP already has its own instruction files at the repository root and a
   * second CLAUDE.md here would compete with them.
   */
  agentRules: false,
};

export default nextConfig;
