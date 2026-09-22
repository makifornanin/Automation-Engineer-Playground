"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { askKaz } from "@/lib/kaz/ask-actions";
import {
  IDLE_KAZ_STATE,
  KAZ_ERROR_MESSAGE,
  KAZ_VISIBILITY_MESSAGE,
  MAX_QUESTION_LENGTH,
  type KazAskState,
  type KazMessage,
  type KazWorkflowVisibility,
} from "@/lib/kaz/types";
import { KazOrb } from "./KazOrb";

export interface KazPanelProps {
  labSlug: string;
  chunkId: string;
  /** "Lab 04 · Debug It" — enough context to know which Kaz you are talking to. */
  contextLabel: string;
  messages: readonly KazMessage[];
  /** Appends a finished turn to the thread the launcher holds. */
  onTurn: (question: KazMessage, answer: KazMessage) => void;
  visibility: KazWorkflowVisibility;
  onClose: () => void;
}

/**
 * The Kaz side panel: one thread, this lab's.
 *
 * Kaz is a companion inside the lesson, not a destination, so this is a panel
 * over the lesson rather than a page: the learner keeps their place, and
 * closing it does not lose the conversation.
 *
 * Optimistic by design. The learner's own message appears immediately, because
 * waiting for a round trip to see what you just typed feels broken; Kaz's
 * answer replaces the typing state when it arrives.
 */
export function KazPanel({
  labSlug,
  chunkId,
  contextLabel,
  messages,
  onTurn,
  visibility,
  onClose,
}: KazPanelProps) {
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [state, action, sending] = useActionState(async (previous: KazAskState, formData: FormData) => {
    const asked = String(formData.get("message") ?? "").trim();
    setPendingQuestion(asked);
    const next = await askKaz(previous, formData);
    setPendingQuestion(null);
    if (next.status === "answered") {
      onTurn(next.question, next.answer);
      formRef.current?.reset();
    }
    return next;
  }, IDLE_KAZ_STATE);

  // Focus lands inside the panel when it opens, so a keyboard user is not left
  // at the top of the lesson behind it.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes, the same way a dialog does.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Plain assignment rather than scrollTo: every engine supports it, and the
  // newest turn should simply be in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pendingQuestion]);

  const error = state.status === "error" ? state.message : null;
  const unsaved = (state.status === "answered" && !state.saved)
    || messages.some((message) => message.id.startsWith("local-"));

  return (
    <aside
      role="dialog"
      aria-label={"Kaz — " + contextLabel}
      className="fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40 flex h-[min(70dvh,calc(100dvh-8rem))] flex-col rounded-t-card border border-line bg-surface shadow-xl md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-[26rem] md:rounded-none md:border-y-0 md:border-r-0"
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <KazOrb className="size-8" state={sending ? "thinking" : "neutral"} />
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-medium text-ink">Kaz</p>
          <p className="truncate text-xs text-ink-muted">{contextLabel}</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="ml-auto rounded-pill px-3 py-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Close
        </button>
      </header>

      <div ref={logRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !pendingQuestion ? (
          <p className="max-w-prose text-sm text-ink-soft">
            Ask me anything about this lab — what a node does, why your test failed, or where to
            start when it all looks wrong.
          </p>
        ) : null}

        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === "learner"
                ? "ml-auto max-w-[85%] rounded-card bg-accent-soft px-3 py-2 text-sm whitespace-pre-wrap text-ink"
                : "max-w-[92%] text-sm whitespace-pre-wrap text-ink-soft"
            }
          >
            {message.content}
          </p>
        ))}

        {pendingQuestion ? (
          <>
            <p className="ml-auto max-w-[85%] rounded-card bg-accent-soft px-3 py-2 text-sm whitespace-pre-wrap text-ink">
              {pendingQuestion}
            </p>
            <p role="status" className="text-sm text-ink-muted">
              Kaz is thinking…
            </p>
          </>
        ) : null}

        {unsaved ? (
          <p role="status" className="text-sm text-ink-soft">
            {KAZ_ERROR_MESSAGE.store_unavailable}
          </p>
        ) : null}
        {error ? (
          <p role="status" className="text-sm text-ink-soft">
            {error}
          </p>
        ) : null}
      </div>

      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-2 border-t border-line px-4 py-3"
      >
        <input type="hidden" name="labSlug" value={labSlug} />
        <input type="hidden" name="chunkId" value={chunkId} />
        <label htmlFor={fieldId} className="sr-only">
          Ask Kaz
        </label>
        <textarea
          id={fieldId}
          name="message"
          rows={2}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ask Kaz…"
          className="resize-none rounded-card border border-line bg-surface-sunken px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent"
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter makes a new line — chat convention.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!sending) formRef.current?.requestSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">{KAZ_VISIBILITY_MESSAGE[visibility.status]}</p>
          <button
            type="submit"
            disabled={sending}
            className="rounded-pill bg-accent px-4 py-1.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </aside>
  );
}
