import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
const recordChunkEvidence = vi.hoisted(() => vi.fn());
vi.mock("@/lib/course/progress-actions", () => ({ recordChunkEvidence }));
import { PredictChunk } from "./PredictChunk";

it.each(["false", "throw"])("keeps the revealed answer and retries evidence after %s", async mode => {
  if (mode === "false") recordChunkEvidence.mockResolvedValueOnce(false);
  else recordChunkEvidence.mockRejectedValueOnce(new Error("offline"));
  const onRecorded = vi.fn();
  const user = userEvent.setup();
  render(<PredictChunk labSlug="03-apis-webhooks" chunk={{ kind: "predict", id: "predict", title: "Predict", content: [], prompt: "What happens?", reveal: [{ type: "prose", text: "The revealed answer." }] }} onRecorded={onRecorded} />);
  await user.type(screen.getByRole("textbox"), "My prediction");
  await user.click(screen.getByRole("button", { name: "Show me what happens" }));
  expect(screen.getByText("The revealed answer.")).toBeInTheDocument();
  expect(await screen.findByText(/progress.*not saved/i)).toBeInTheDocument();
  expect(onRecorded).not.toHaveBeenCalled();
  recordChunkEvidence.mockResolvedValueOnce(true);
  await user.click(screen.getByRole("button", { name: /retry.*save/i }));
  await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
  expect(screen.queryByText(/progress.*not saved/i)).not.toBeInTheDocument();
});
