import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LABS, labHref } from "@/lib/course/catalog";
import { FeaturedLabCard } from "./FeaturedLabCard";

const LAB = LABS[0];

describe("<FeaturedLabCard />", () => {
  it("renders the lab's number, title and description", () => {
    const { container } = render(<FeaturedLabCard lab={LAB} />);

    expect(container.textContent).toContain(`Lab ${LAB.number} of ${LABS.length}`);
    expect(screen.getByText(LAB.title)).toBeInTheDocument();
    expect(screen.getByText(LAB.description)).toBeInTheDocument();
  });

  /*
   * The destination is a real per-lab route today (`labHref()` resolves to
   * `/labs/<slug>`), but the lab identity still has to live in the
   * accessible name for it to be conveyed the same way to assistive tech.
   */
  it("exposes exactly one Continue link naming the lab number and title", () => {
    render(<FeaturedLabCard lab={LAB} />);

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
    render(<FeaturedLabCard lab={LAB} />);
    const link = screen.getByRole("link");

    expect(link).toHaveTextContent("Continue");
    expect(link.getAttribute("aria-label")).toMatch(/^Continue\b/);
  });

  it("sends the learner to labHref(lab)", () => {
    render(<FeaturedLabCard lab={LAB} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", labHref(LAB));
  });

  /*
   * Position, never a percentage: no persistence exists yet, so any
   * completion figure would be invented. This pins that.
   */
  it("shows position in the course and no percentage or progress bar", () => {
    const { container } = render(<FeaturedLabCard lab={LAB} />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
  });
});
