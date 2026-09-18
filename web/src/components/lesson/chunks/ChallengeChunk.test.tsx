import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getLessonChunks } from "@/lib/lesson/registry";
import type { ChallengeChunk as ChallengeChunkData } from "@/lib/lesson/types";
import { ChallengeChunk } from "./ChallengeChunk";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/kaz/hint-actions", () => ({ revealNextHint: vi.fn() }));
vi.mock("@/lib/testing/send-test-actions", () => ({
  saveLabWebhook: vi.fn(async () => ({ status: "idle" })),
  sendTest: vi.fn(async () => ({ status: "idle" })),
}));
vi.mock("@/lib/testing/self-check-action", () => ({
  runSelfCheck: vi.fn(async () => ({ status: "idle" })),
}));

function challengeOf(slug: string): ChallengeChunkData {
  const chunk = getLessonChunks(slug)?.find((entry) => entry.kind === "challenge");
  if (!chunk || chunk.kind !== "challenge") throw new Error("no challenge in " + slug);
  return chunk;
}

describe("<ChallengeChunk />", () => {
  it("offers Send Test for a challenge that opted in, with the paste fallback still there", () => {
    render(
      <ChallengeChunk
        chunk={challengeOf("03-apis-webhooks")}
        labSlug="03-apis-webhooks"
        webhookHost="abc.app.n8n.cloud"
      />,
    );

    expect(screen.getByRole("button", { name: "Send Test" })).toBeEnabled();
    expect(screen.getByText("abc.app.n8n.cloud")).toBeInTheDocument();
    expect(screen.getByText(/Paste the response instead/)).toBeInTheDocument();
    expect(screen.getByText(/success is false/)).toBeInTheDocument();
  });

  it("keeps paste-only challenges as they were", () => {
    render(
      <ChallengeChunk
        chunk={challengeOf("07-idempotency-duplicate-protection")}
        labSlug="07-idempotency-duplicate-protection"
        webhookHost="abc.app.n8n.cloud"
      />,
    );

    expect(screen.queryByRole("button", { name: "Send Test" })).not.toBeInTheDocument();
  });
});
