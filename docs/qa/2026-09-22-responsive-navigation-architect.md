# ARCHITECT REVIEW

## Existing Repo Findings
Architect independently traced FocusMode synchronous state updates and fire-and-forget position writes. No three-second timer exists. DockItem has no pending feedback; no route loading boundary exists. PageTransition originally starts only on incoming mount. Proxy authentication, render session verification and data reads can delay routes; live durations were not measured. Individual lab rendering calls startLab, so forced full prefetch could mutate progress before a visit.

## Approved Aim Point
Immediate page-switch feedback, perceptible horizontal slide/subtle zoom, plain Back controls without arrows. Preserve the accepted design and learning contracts.

## Proposed Architecture / File Boundaries
Add `(app)/loading.tsx` and framework Link pending feedback in DockItem. Keep default partial prefetch. PageTransition waits for actual streamed content before its entry animation. FocusMode keeps one mounted step and uses directional entry. Scoped clipping preserves the page width and focus rings. Back retains native keyboard activation and a generous target with no decorative chrome.

## Data Flow / Security Boundaries
Existing server authorization, session validation, RLS, progress actions, evidence eligibility and Kaz context remain authoritative. No persistent auth caching, full lab prefetch, speculative server parallelization, retained outgoing forms, transition locks, dependencies or backend changes.

## Acceptance Criteria
Immediate observable feedback on an intentionally delayed real Next route; animation starts when content arrives; visible initial SSR; instant reduced motion; one current form and correct heading focus/Kaz context after rapid steps; simple arrow-free Back; no mobile overflow; normal keyboard navigation and safe cancellation.

## Risks / Decisions
Loading UI does not eliminate server or proxy latency. Use an isolated production Next router fixture to test the real routing mechanism while keeping its simulated server delay distinct from live authenticated performance. Root's baseline fixture measured 3017.5ms before any feedback. No claim that backend response time has improved is authorized by fixture timing.

## Developer Handoff / Execution Order
Implement loading/pending feedback, content-ready route motion, matching step motion and Back simplification. Verify focused behaviors, full project checks and real router/browser timing. Integration then QA then Project Manager reconcile evidence. No release action belongs to this implementation handoff.
