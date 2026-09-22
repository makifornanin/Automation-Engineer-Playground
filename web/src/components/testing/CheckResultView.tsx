import type { CheckpointResult, TestResult } from "@/lib/testing/types";

const GLYPH: Record<CheckpointResult["state"], string> = {
  passed: "✓",
  failed: "✕",
  skipped: "·",
};

const SPOKEN: Record<CheckpointResult["state"], string> = {
  passed: "passed",
  failed: "failed",
  skipped: "not checked",
};

/**
 * One evaluated result, shared by Send Test and the paste-the-output check so
 * both explain a result identically: a clear pass or fail, the checkpoint
 * list, and expected-versus-found for the first failure only.
 *
 * Expected and found are shown only for the checkpoint that failed. Printing
 * them for passing checkpoints would hand the learner the rest of an answer
 * they have not reached yet.
 */
export function CheckResultView({ result, progressSaved }: { result: TestResult; progressSaved?: boolean }) {
  return (
    <div className="check-result" data-passed={result.passed}>
      <p className="check-result-state">{result.passed ? "Passed" : "Needs attention"}</p>
      <p className="text-sm font-medium text-ink">
        {result.passed
          ? "Pass — your workflow did exactly what this test expects."
          : "Not there yet. Here is where it first went wrong."}
      </p>

      {result.passed && progressSaved === false ? (
        <p className="check-save-warning">Your progress was not saved. Run this check again to retry saving it.</p>
      ) : null}

      <ul className="check-checkpoints">
        {result.checkpoints.map((checkpoint) => (
          <li key={checkpoint.id} data-state={checkpoint.state} className="text-sm text-ink-soft">
            <span aria-hidden>{GLYPH[checkpoint.state]} </span>
            {checkpoint.label}
            <span className="check-status">{": " + SPOKEN[checkpoint.state]}</span>
          </li>
        ))}
      </ul>

      {result.firstFailure ? (
        <dl className="check-comparison">
          <div className="flex flex-wrap gap-2">
            <dt className="font-medium text-ink">Expected</dt>
            <dd className="font-mono break-all text-ink-soft">{result.firstFailure.expected}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-medium text-ink">Found</dt>
            <dd className="font-mono break-all text-ink-soft">{result.firstFailure.actual}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
