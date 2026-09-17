import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LABS } from "@/lib/course/catalog";
import LabPage from "./page";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("<LabPage />", () => {
  it("triggers notFound() for an unknown slug", async () => {
    await expect(
      LabPage({ params: Promise.resolve({ slug: "not-a-real-lab" }) }),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404"),
    });
  });

  it("renders the lab's own number, title, group and description", async () => {
    const lab = LABS[0];

    const ui = await LabPage({ params: Promise.resolve({ slug: lab.slug }) });
    const { container } = render(ui);

    expect(screen.getByRole("heading", { name: lab.title })).toBeInTheDocument();
    expect(container.textContent).toContain(lab.group);
    expect(screen.getByText(lab.description)).toBeInTheDocument();
  });

  /*
   * With the empty-progress stub, every lab after Lab 01 is not-started and
   * has an earlier lab to point to, so it renders as a future lab.
   */
  it("names the prerequisite and offers no Build action for a future lab", async () => {
    const futureLab = LABS[1];
    const prerequisite = LABS[0];

    const ui = await LabPage({ params: Promise.resolve({ slug: futureLab.slug }) });
    render(ui);

    expect(
      screen.getByText(
        new RegExp(`Complete Lab ${prerequisite.number}.*${prerequisite.title}`),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /build/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  /*
   * Lab 01 is the current lab, so its lesson is readable and it has content:
   * the page hands off to Focus Mode. It has no prerequisite either, so it
   * must never claim one.
   */
  it("renders Focus Mode for Lab 01 rather than a placeholder or a prerequisite", async () => {
    const lab01 = LABS[0];

    const ui = await LabPage({ params: Promise.resolve({ slug: lab01.slug }) });
    render(ui);

    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument();
    // Deliberately not pinned to a chunk count: Lab 01 gains chunks as the
    // lesson is authored, and this test is about which branch rendered.
    expect(screen.getByText(/^Step 1 of \d+$/)).toBeInTheDocument();
    expect(screen.queryByText("This lesson is not available yet.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Complete Lab/)).not.toBeInTheDocument();
  });

  /*
   * A future lab must not leak lesson content, whether or not one exists for
   * it — the prerequisite branch is checked before content is even looked up.
   */
  it("shows no lesson content on a future lab", async () => {
    const futureLab = LABS[1];

    const ui = await LabPage({ params: Promise.resolve({ slug: futureLab.slug }) });
    render(ui);

    expect(screen.queryByRole("heading", { name: "The problem" })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Step \d+ of \d+$/)).not.toBeInTheDocument();
  });
});
