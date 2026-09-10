import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Pin the Turbopack root to this app. Without it Next walks up looking for a
   * lockfile, finds an unrelated one outside the repository and warns that it
   * is ignoring it. `web/` is also the Vercel Root Directory.
   */
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  /*
   * Next 16 writes AGENTS.md and CLAUDE.md into this directory on `next dev`.
   * AEP already has its own instruction files at the repository root and a
   * second CLAUDE.md here would compete with them.
   */
  agentRules: false,
};

export default nextConfig;
