import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SendTestPanel } from "./SendTestPanel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/testing/send-test-actions", () => ({
  saveLabWebhook: vi.fn(async () => ({ status: "idle" })),
  sendTest: vi.fn(async () => ({ status: "idle" })),
}));
vi.mock("@/lib/testing/self-check-action", () => ({
  runSelfCheck: vi.fn(async () => ({ status: "idle" })),
}));

const PROPS = {
  labSlug: "03-apis-webhooks",
  chunkId: "success-test",
  caseName: "A known customer is looked up and returned",
  expected: "success is true, with the real customer name.",
  payload: { user_id: 5 },
};

describe("<SendTestPanel />", () => {
  it("shows the business scenario and expected outcome before any action", () => {
    render(<SendTestPanel {...PROPS} webhookHost={null} />);

    expect(screen.getByText(PROPS.caseName)).toBeInTheDocument();
    expect(screen.getByText(PROPS.expected)).toBeInTheDocument();
  });

  /* Vision §25: configure the webhook once per lab, before the first test. */
  it("asks for the webhook first, and cannot send until one is saved", () => {
    render(<SendTestPanel {...PROPS} webhookHost={null} />);

    expect(screen.getByLabelText(/Production webhook URL/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Test" })).toBeDisabled();
  });

  /*
   * Only the hostname is shown back — enough to recognise the saved n8n
   * without putting the full capability URL into the page.
   */
  it("shows only the saved webhook's hostname, and lets the learner change it", () => {
    render(<SendTestPanel {...PROPS} webhookHost="abc.app.n8n.cloud" />);

    expect(screen.getByText("abc.app.n8n.cloud")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change webhook" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Test" })).toBeEnabled();
    expect(screen.queryByLabelText(/Production webhook URL/)).not.toBeInTheDocument();
  });

  it("keeps the request payload behind a disclosure", () => {
    render(<SendTestPanel {...PROPS} webhookHost="abc.app.n8n.cloud" />);

    expect(screen.getByText("View the request AEP sends")).toBeInTheDocument();
  });

  /*
   * A deployed AEP cannot reach n8n on a learner's own machine. Pasting the
   * response keeps the lab finishable for them.
   */
  it("offers paste-the-response for n8n running locally", () => {
    render(<SendTestPanel {...PROPS} webhookHost={null} />);

    expect(screen.getByText(/n8n running on your own machine\?/)).toBeInTheDocument();
  });
});
