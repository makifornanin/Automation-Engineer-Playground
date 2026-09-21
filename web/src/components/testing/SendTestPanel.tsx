"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { saveLabWebhook, sendTest } from "@/lib/testing/send-test-actions";
import {
  IDLE_SEND_TEST_STATE,
  IDLE_WEBHOOK_SAVE_STATE,
  type JsonValue,
  type WebhookSaveState,
} from "@/lib/testing/types";
import { notifyTestOutcome } from "@/lib/kaz/test-signal";
import { CheckResultView } from "./CheckResultView";
import { SelfCheckPanel } from "./SelfCheckPanel";

export interface SendTestPanelProps {
  labSlug: string;
  chunkId: string;
  /** The business scenario being tested, shown first. */
  caseName: string;
  /** The outcome that counts as a pass, in plain words. */
  expected?: string;
  /** What AEP will send. Not secret — the learner built the workflow for it. */
  payload: JsonValue;
  /** Hostname of the saved webhook, or null when none is saved yet. */
  webhookHost: string | null;
}

const PRIMARY_BUTTON =
  "w-fit rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";
const LINK_BUTTON = "w-fit text-sm font-medium text-accent underline-offset-4 hover:underline";

/**
 * Send Test (Vision §23, §24): the learner presses one button and AEP calls
 * their own n8n workflow, then explains what came back.
 *
 * Order follows §23's "simple first, depth on demand": the business scenario
 * and expected outcome, then the one action, then pass/fail with the first
 * failure explained. The payload and the raw response sit behind disclosures.
 *
 * The webhook is configured once per lab (§25) and only its hostname is shown
 * back. The browser never sends a URL or a payload with a test: both are read
 * on the server, which is what keeps the action from being usable as a relay.
 *
 * Paste-the-response stays available underneath. A learner running n8n on
 * their own machine cannot be reached from a deployed AEP, and must still be
 * able to finish the lab.
 */
export function SendTestPanel({
  labSlug,
  chunkId,
  caseName,
  expected,
  payload,
  webhookHost,
}: SendTestPanelProps) {
  const router = useRouter();
  const fieldId = useId();
  const [editing, setEditing] = useState(false);

  // Closing the form and refreshing happen as part of the save itself, not in
  // an effect reacting to it afterwards.
  const [saveState, saveAction, saving] = useActionState(
    async (previous: WebhookSaveState, formData: FormData) => {
      const next = await saveLabWebhook(previous, formData);
      if (next.status === "saved") {
        setEditing(false);
        router.refresh();
      }
      return next;
    },
    IDLE_WEBHOOK_SAVE_STATE,
  );
  const [testState, testAction, sending] = useActionState(sendTest, IDLE_SEND_TEST_STATE);

  const host = saveState.status === "saved" ? saveState.host : webhookHost;
  const showWebhookForm = host === null || editing;

  // A pass records evidence and may unlock the next lab; refresh so it shows.
  useEffect(() => {
    if (testState.status !== "complete") return;
    notifyTestOutcome({ labSlug, chunkId, passed: testState.result.passed });
    if (testState.result.passed && testState.progressSaved !== false) {
      router.refresh();
    }
  }, [testState, router, labSlug, chunkId]);

  const technical =
    testState.status === "complete" || testState.status === "error" ? testState.technical : null;

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-sunken p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium tracking-[0.14em] text-ink-muted uppercase">Test it</h3>
        <p className="max-w-prose text-ink-soft">{caseName}</p>
        {expected ? (
          <p className="max-w-prose text-sm text-ink-muted">
            <span className="font-medium text-ink">Expected: </span>
            {expected}
          </p>
        ) : null}
      </div>

      {showWebhookForm ? (
        <form action={saveAction} className="flex flex-col gap-2">
          <input type="hidden" name="labSlug" value={labSlug} />
          <label htmlFor={fieldId} className="text-sm font-medium text-ink">
            Your workflow&rsquo;s Production webhook URL
          </label>
          <input
            id={fieldId}
            name="webhookUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://your-n8n.example.com/webhook/..."
            className="rounded-card border border-line bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus-visible:border-accent"
          />
          <p className="max-w-prose text-sm text-ink-muted">
            Publish the workflow in n8n first. AEP saves this URL for this lab only and needs a public
            https address.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={saving} className={PRIMARY_BUTTON}>
              {saving ? "Saving…" : "Save webhook"}
            </button>
            {host !== null ? (
              <button type="button" onClick={() => setEditing(false)} className={LINK_BUTTON}>
                Cancel
              </button>
            ) : null}
          </div>
          <p role="status" className="text-sm text-ink-soft">
            {saveState.status === "error" ? saveState.message : ""}
          </p>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-soft">
            Sending to <span className="font-mono text-ink">{host}</span>
          </p>
          <button type="button" onClick={() => setEditing(true)} className={LINK_BUTTON}>
            Change webhook
          </button>
        </div>
      )}

      <form action={testAction}>
        <input type="hidden" name="labSlug" value={labSlug} />
        <input type="hidden" name="chunkId" value={chunkId} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={host === null || sending}
            aria-describedby={host === null ? `${fieldId}-needs-webhook` : undefined}
            className={PRIMARY_BUTTON}
          >
            {sending ? "Sending…" : "Send Test"}
          </button>
          {host === null ? (
            <span id={`${fieldId}-needs-webhook`} className="text-sm text-ink-muted">
              Save your webhook URL first.
            </span>
          ) : null}
        </div>
      </form>

      <div role="status" className="flex flex-col gap-3">
        {testState.status === "error" ? (
          <p className="max-w-prose text-sm text-ink-soft">{testState.message}</p>
        ) : null}
        {testState.status === "complete" ? <CheckResultView result={testState.result} progressSaved={testState.progressSaved} /> : null}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-ink-muted">View the request AEP sends</summary>
        <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-surface p-3">
          <code className="font-mono text-ink-soft">{JSON.stringify(payload, null, 2)}</code>
        </pre>
      </details>

      {technical ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-ink-muted">Show technical details</summary>
          <dl className="mt-2 flex flex-col gap-1">
            <div className="flex gap-2">
              <dt className="text-ink">HTTP status</dt>
              <dd className="font-mono text-ink-soft">{technical.status ?? "no response"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink">Time</dt>
              <dd className="font-mono text-ink-soft">{technical.durationMs} ms</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink">Deliveries</dt>
              <dd className="font-mono text-ink-soft">{technical.deliveries}</dd>
            </div>
          </dl>
          {technical.response ? (
            <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-surface p-3">
              <code className="font-mono text-ink-soft">
                {technical.response}
                {technical.truncated ? "\n… (response truncated)" : ""}
              </code>
            </pre>
          ) : null}
        </details>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-ink-muted">
          n8n running on your own machine? Paste the response instead
        </summary>
        <div className="mt-3">
          <SelfCheckPanel labSlug={labSlug} chunkId={chunkId} title="Paste the response" />
        </div>
      </details>
    </div>
  );
}
