import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyTestOutcome } from "@/lib/kaz/test-signal";

vi.mock("@/lib/kaz/ask-actions", () => ({ askKaz: vi.fn() }));

import { KazLauncher } from "./KazLauncher";

function renderLauncher(chunkId = "debug-it") {
  return render(
    <KazLauncher
      labSlug="03-apis-webhooks"
      chunkId={chunkId}
      contextLabel="Lab 03 · Debug It"
      initialMessages={[]}
      visibility={{ status: "not_linked" }}
    />,
  );
}

function failTest(chunkId = "debug-it") {
  act(() => {
    notifyTestOutcome({ labSlug: "03-apis-webhooks", chunkId, passed: false });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<KazLauncher />", () => {
  it("is a quiet orb until the learner opens it", () => {
    renderLauncher();

    expect(screen.getByRole("button", { name: /Ask Kaz/ })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the panel on click", async () => {
    const user = userEvent.setup();
    renderLauncher();

    await user.click(screen.getByRole("button", { name: /Ask Kaz/ }));

    expect(screen.getByRole("dialog", { name: /Lab 03 · Debug It/ })).toBeInTheDocument();
  });

  /*
   * Lightly proactive: after the same step fails twice she offers once. She
   * does not open herself, and nothing is sent anywhere until the learner asks.
   */
  it("offers help after the same step fails twice, without opening", () => {
    renderLauncher();

    failTest();
    expect(screen.queryByText(/another set of eyes/i)).not.toBeInTheDocument();

    failTest();
    expect(screen.getByText(/another set of eyes/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stops offering once the learner passes", () => {
    renderLauncher();

    failTest();
    failTest();
    act(() => {
      notifyTestOutcome({ labSlug: "03-apis-webhooks", chunkId: "debug-it", passed: true });
    });

    expect(screen.queryByText(/another set of eyes/i)).not.toBeInTheDocument();
  });

  it("ignores failures from another step or another lab", () => {
    renderLauncher();

    failTest("break-it");
    failTest("break-it");
    act(() => {
      notifyTestOutcome({ labSlug: "04-validation-normalization", chunkId: "debug-it", passed: false });
      notifyTestOutcome({ labSlug: "04-validation-normalization", chunkId: "debug-it", passed: false });
    });

    expect(screen.queryByText(/another set of eyes/i)).not.toBeInTheDocument();
  });
});
