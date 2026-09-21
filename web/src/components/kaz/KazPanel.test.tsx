import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KazMessage } from "@/lib/kaz/types";

const askKaz = vi.hoisted(() =>
  vi.fn(async (_previous: unknown, formData: FormData) => ({
    status: "answered" as const,
    saved: true,
    question: {
      id: "q",
      role: "learner" as const,
      content: String(formData.get("message")),
      createdAt: "now",
    },
    answer: { id: "a", role: "kaz" as const, content: "Start with the webhook.", createdAt: "now" },
    helpLevel: 1 as const,
    looked: { workflow: false, execution: false },
  })),
);

vi.mock("@/lib/kaz/ask-actions", () => ({ askKaz }));

import { KazPanel } from "./KazPanel";

const HISTORY: KazMessage[] = [
  { id: "1", role: "learner", content: "what is a webhook?", createdAt: "earlier" },
  { id: "2", role: "kaz", content: "A URL that waits for someone to call it.", createdAt: "earlier" },
];

function renderPanel(overrides: Partial<React.ComponentProps<typeof KazPanel>> = {}) {
  const onClose = vi.fn();
  const onTurn = vi.fn();
  render(
    <KazPanel
      labSlug="03-apis-webhooks"
      chunkId="debug-it"
      contextLabel="Lab 03 · Debug It"
      messages={HISTORY}
      onTurn={onTurn}
      visibility={{ status: "linked", host: "n8n.example.com" }}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { onClose, onTurn };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<KazPanel />", () => {
  it("shows which Kaz this is, and the thread so far", () => {
    renderPanel();

    expect(screen.getByRole("dialog", { name: /Lab 03 · Debug It/ })).toBeInTheDocument();
    expect(screen.getByText("what is a webhook?")).toBeInTheDocument();
    expect(screen.getByText("A URL that waits for someone to call it.")).toBeInTheDocument();
  });

  it("sends the lab, the chunk and the question, and shows the answer", async () => {
    const user = userEvent.setup();
    const { onTurn } = renderPanel();

    await user.type(screen.getByLabelText("Ask Kaz"), "why did my test fail?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(askKaz).toHaveBeenCalledTimes(1));
    const [, formData] = askKaz.mock.calls[0] as unknown as [unknown, FormData];
    expect(formData.get("labSlug")).toBe("03-apis-webhooks");
    expect(formData.get("chunkId")).toBe("debug-it");
    expect(formData.get("message")).toBe("why did my test fail?");
    // The launcher owns the thread, so the panel hands the finished turn up.
    await waitFor(() => expect(onTurn).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/cannot save this conversation/i)).not.toBeInTheDocument();
  });

  /* Honest about her own eyes: the panel never implies she can see more. */
  it("says plainly what Kaz can and cannot see", () => {
    renderPanel({ visibility: { status: "not_linked" } });
    expect(screen.getByText(/can't safely inspect your n8n workflow yet/i)).toBeInTheDocument();
  });

  it("says when a lab has no workflow to inspect at all", () => {
    renderPanel({ visibility: { status: "no_webhook_lab" } });
    expect(screen.getByText(/Manual Trigger/i)).toBeInTheDocument();
  });

  it("shows an honest failure instead of an invented answer", async () => {
    askKaz.mockResolvedValue({
      status: "error",
      code: "unavailable",
      message: "Kaz can't reach the workshop right now.",
    } as never);
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText("Ask Kaz"), "check my workflow");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/can't reach the workshop/i)).toBeInTheDocument();
  });

  it("closes on Escape and on the Close button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("puts focus inside the panel when it opens", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });
});

it("keeps the unsaved warning when the panel reopens with a local turn", () => {
  renderPanel({ messages: [{ ...HISTORY[1], id: "local-kaz-answer" }] });
  expect(screen.getByText(/cannot save this conversation/i)).toHaveAttribute("role", "status");
  expect(screen.getByText(HISTORY[1].content)).toBeInTheDocument();
});

it("warns about an unsaved answer while retaining the turn", async () => {
  askKaz.mockResolvedValueOnce({ status: "answered", saved: false, question: HISTORY[0], answer: HISTORY[1], helpLevel: 1, looked: { workflow: false, execution: false } } as never);
  const user = userEvent.setup();
  const { onTurn } = renderPanel();
  await user.type(screen.getByLabelText("Ask Kaz"), "help");
  await user.click(screen.getByRole("button", { name: "Send" }));
  expect(await screen.findByText(/cannot save this conversation/i)).toHaveAttribute("role", "status");
  expect(onTurn).toHaveBeenCalledWith(HISTORY[0], HISTORY[1]);
});
