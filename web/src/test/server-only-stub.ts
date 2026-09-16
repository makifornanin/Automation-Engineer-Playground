/**
 * Test-time stand-in for the `server-only` package.
 *
 * `server-only` exists to make the **bundler** fail when a client component
 * imports server code. Vitest is not the bundler: it resolves the package's
 * browser entry, which throws on import, so any test that renders a real
 * Server Component page dies before its first assertion.
 *
 * Aliasing it here (see `vitest.config.mts`) removes that import-time throw
 * and nothing else. The real guarantee is unchanged and still enforced where
 * it actually matters — `npm run build` fails if a `"use client"` module ever
 * reaches a `server-only` import, which was proven deliberately in Phase 11 by
 * importing it from a client component and watching the build break.
 *
 * In short: this weakens a test-runner artefact, not a security boundary.
 */
export {};
