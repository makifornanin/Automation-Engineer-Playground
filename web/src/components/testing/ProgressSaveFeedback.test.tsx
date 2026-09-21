import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
const result = vi.hoisted(() => ({ status: "complete" as const, progressSaved: false, result: { caseName: "Fixture", passed: true, checkpoints: [], firstFailure: null }, technical: { status: 200, durationMs: 1, response: "{}", truncated: false, deliveries: 1 } }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/testing/self-check-action", () => ({ runSelfCheck: vi.fn(async () => result) }));
vi.mock("@/lib/testing/send-test-actions", () => ({ sendTest: vi.fn(async () => result), saveLabWebhook: vi.fn(async () => ({ status: "idle" })) }));
import { SelfCheckPanel } from "./SelfCheckPanel";
import { SendTestPanel } from "./SendTestPanel";

it.each(["self-check", "send"])("retains the genuine pass and warns about unsaved progress in %s", async mode => {
  refresh.mockClear();
  const user = userEvent.setup();
  if (mode === "self-check") render(<SelfCheckPanel labSlug="03-apis-webhooks" chunkId="success-test" />);
  else render(<SendTestPanel labSlug="03-apis-webhooks" chunkId="success-test" caseName="Fixture" webhookHost="example.com" payload={{ user_id: 5 }} />);
  await user.click(screen.getByRole("button", { name: mode === "send" ? "Send Test" : /check.*output/i }));
  expect(await screen.findByText(/Pass.*your workflow/i)).toBeInTheDocument();
  expect(screen.getByText(/progress.*not saved/i)).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();
});
