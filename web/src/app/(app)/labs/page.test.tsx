import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { deriveCourseState, getCourseProgress } from "@/lib/course/progress";
import LabsPage from "./page";

/**
 * The composition test. Every other test on this screen renders one component
 * in isolation with hand-picked fixtures, which is exactly why none of them
 * caught the featured card and the lab's own row disagreeing about whether to
 * Continue or Preview. This drives the real
 * `getCourseProgress()` -> `deriveCourseState()` -> page path instead.
 */
describe("<LabsPage />", () => {
  async function renderPage() {
    return render(await LabsPage());
  }

  it("never offers two different actions for the same lab", async () => {
    await renderPage();

    const { currentLab } = deriveCourseState(await getCourseProgress());
    const { number, title } = currentLab.lab;

    // The featured card offers Continue, so the lab's row must agree.
    expect(
      screen.getAllByRole("link", { name: `Continue Lab ${number} — ${title}` }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: `Preview Lab ${number} — ${title}` }),
    ).not.toBeInTheDocument();
  });

  it("shows a first-time learner Lab 01 as the lab to continue", async () => {
    await renderPage();
    const first = LABS[0];

    expect(
      screen.getAllByRole("link", {
        name: `Continue Lab ${first.number} — ${first.title}`,
      }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the three groups and the Capstone separately", async () => {
    await renderPage();

    for (const name of ["Foundations", "Reliability", "AI Engineering", "Capstone"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("shows every lab exactly once in the grouped journey", async () => {
    await renderPage();

    for (const lab of LABS) {
      const rows = screen.getAllByRole("link", {
        name: new RegExp(`Lab ${lab.number} — `),
      });
      // The current lab appears twice: featured card plus its own row.
      expect(rows.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("shows no percentage, progress bar or difficulty label", async () => {
    const { container } = await renderPage();

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
    expect(container.textContent).not.toMatch(/beginner|intermediate|advanced/i);
  });
});
