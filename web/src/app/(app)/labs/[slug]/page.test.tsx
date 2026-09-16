import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import LabPage from "./page";

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
   * Lab 01 has no prerequisite, so it must not claim one — it falls through
   * to the honest note instead.
   */
  it("gives Lab 01 the honest note rather than an invented prerequisite", async () => {
    const lab01 = LABS[0];

    const ui = await LabPage({ params: Promise.resolve({ slug: lab01.slug }) });
    render(ui);

    expect(screen.getByText("Lesson content arrives with Focus Mode.")).toBeInTheDocument();
    expect(screen.queryByText(/Complete Lab/)).not.toBeInTheDocument();
  });
});
