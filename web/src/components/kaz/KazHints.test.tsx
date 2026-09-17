import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KazHints } from "./KazHints";

const revealNextHint = vi.hoisted(() => vi.fn());

vi.mock("@/lib/kaz/hint-actions", () => ({ revealNextHint }));

const LAB = "01-data-mapping-transformation";

beforeEach(() => {
  revealNextHint.mockReset();
  revealNextHint.mockImplementation(async (_lab: string, _chunk: string, seen: number) => ({
    index: seen,
    total: 2,
    text: "Hint text number " + String(seen + 1),
  }));
});

describe("<KazHints />", () => {
  /*
   * Progressive means nothing is shown until the learner asks. A hint visible
   * on arrival is an answer key, not a hint.
   */
  it("shows no hint until the learner asks for one", () => {
    render(<KazHints labSlug={LAB} chunkId="challenge" hintCount={2} />);

    expect(screen.queryByText(/Hint text number/)).not.toBeInTheDocument();
    expect(revealNextHint).not.toHaveBeenCalled();
  });

  /*
   * Found in the live E2E pass: a reload took back every hint the learner had
   * already asked for, and asking again restarted at hint 1.
   */
  it("keeps the hints a learner already asked for, and continues from there", async () => {
    const user = userEvent.setup();
    render(
      <KazHints
        labSlug={LAB}
        chunkId="challenge"
        hintCount={2}
        initialRevealed={[{ index: 0, total: 2, text: "Hint text number 1" }]}
      />,
    );

    expect(screen.getByText("Hint text number 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ask Kaz for the next hint" }));
    expect(revealNextHint).toHaveBeenLastCalledWith(LAB, "challenge", 1);
  });

  it("reveals hints one at a time, in order", async () => {
    const user = userEvent.setup();
    render(<KazHints labSlug={LAB} chunkId="challenge" hintCount={2} />);

    await user.click(screen.getByRole("button", { name: "Ask Kaz for a hint" }));
    expect(await screen.findByText("Hint text number 1")).toBeInTheDocument();
    expect(screen.queryByText("Hint text number 2")).not.toBeInTheDocument();
    expect(revealNextHint).toHaveBeenLastCalledWith(LAB, "challenge", 0);

    await user.click(screen.getByRole("button", { name: "Ask Kaz for the next hint" }));
    expect(await screen.findByText("Hint text number 2")).toBeInTheDocument();
    expect(revealNextHint).toHaveBeenLastCalledWith(LAB, "challenge", 1);
  });

  it("stops offering hints once every one has been shown", async () => {
    const user = userEvent.setup();
    render(<KazHints labSlug={LAB} chunkId="challenge" hintCount={2} />);

    await user.click(screen.getByRole("button", { name: "Ask Kaz for a hint" }));
    await screen.findByText("Hint text number 1");
    await user.click(screen.getByRole("button", { name: "Ask Kaz for the next hint" }));
    await screen.findByText("Hint text number 2");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/That is every hint/)).toBeInTheDocument();
  });

  it("says so honestly when a hint cannot be fetched", async () => {
    revealNextHint.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<KazHints labSlug={LAB} chunkId="challenge" hintCount={2} />);

    await user.click(screen.getByRole("button", { name: "Ask Kaz for a hint" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/cannot reach the hints/i);
  });

  it("renders nothing for a challenge with no hints", () => {
    const { container } = render(<KazHints labSlug={LAB} chunkId="challenge" hintCount={0} />);

    expect(container).toBeEmptyDOMElement();
  });
});
