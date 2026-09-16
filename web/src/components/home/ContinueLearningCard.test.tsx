import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LABS, labHref } from "@/lib/course/catalog";
import { ContinueLearningCard } from "./ContinueLearningCard";

const LAB = LABS[0];

describe("<ContinueLearningCard />", () => {
  /*
   * The destination is generic today — `labHref()` resolves every lab to
   * `/labs` — so the lab identity has to live in the accessible name or it
   * is not conveyed to assistive tech at all.
   */
  it("exposes exactly one Continue link naming the lab number and title", () => {
    render(<ContinueLearningCard lab={LAB} />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(
      screen.getByRole("link", {
        name: `Continue Lab ${LAB.number} — ${LAB.title}`,
      }),
    ).toBeInTheDocument();
  });

  /*
   * WCAG 2.5.3 Label in Name: the visible label must be contained in the
   * accessible name, or a speech-input user cannot activate the control by
   * saying the word they can see.
   */
  it("keeps the visible text a prefix of the accessible name", () => {
    render(<ContinueLearningCard lab={LAB} />);
    const link = screen.getByRole("link");

    expect(link).toHaveTextContent("Continue");
    expect(link.getAttribute("aria-label")).toMatch(/^Continue\b/);
  });

  it("sends the learner to whatever the catalog seam resolves", () => {
    render(<ContinueLearningCard lab={LAB} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", labHref(LAB));
  });

  /*
   * Position, never a percentage: no persistence exists yet, so any
   * completion figure would be invented. This pins that.
   */
  it("shows position in the course and no percentage or progress bar", () => {
    const { container } = render(<ContinueLearningCard lab={LAB} />);

    expect(
      screen.getByText(`Lab ${LAB.number} of ${LABS.length}`),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
  });
});
