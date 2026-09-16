import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import { LAB_GROUPS } from "@/lib/course/groups";
import type { LabWithStatus } from "@/lib/course/progress";
import { LabGroupSection } from "./LabGroupSection";

const GROUP = LAB_GROUPS[0];

const ROWS: LabWithStatus[] = [
  { lab: LABS[0], status: "completed" },
  { lab: LABS[1], status: "in-progress" },
  { lab: LABS[2], status: "not-started" },
];

/** LABS[1] is the in-progress row, so it is also the current lab here. */
const CURRENT_SLUG = LABS[1].slug;

describe("<LabGroupSection />", () => {
  it("renders the group heading and framing line verbatim", () => {
    render(<LabGroupSection group={GROUP} labs={ROWS} currentLabSlug={CURRENT_SLUG} />);

    expect(screen.getByRole("heading", { name: GROUP.name })).toBeInTheDocument();
    expect(screen.getByText(GROUP.framing)).toBeInTheDocument();
  });

  it("renders completed, current and preview distinguishably", () => {
    render(<LabGroupSection group={GROUP} labs={ROWS} currentLabSlug={CURRENT_SLUG} />);

    expect(screen.getByText(/· Completed/)).toBeInTheDocument();
    expect(screen.getByText(/· Current/)).toBeInTheDocument();
    expect(screen.getByText(/· Preview/)).toBeInTheDocument();
  });

  /*
   * The defect this guards: with no persisted progress every lab is
   * "not-started", including the one the featured card offers. Deriving the
   * row from status alone rendered that lab as "Preview" directly beneath a
   * "Continue" card — two links, opposing verbs, one destination.
   */
  it("shows a not-started lab as Current when it is the lab being continued", () => {
    const rows: LabWithStatus[] = [
      { lab: LABS[0], status: "not-started" },
      { lab: LABS[1], status: "not-started" },
    ];
    render(<LabGroupSection group={GROUP} labs={rows} currentLabSlug={LABS[0].slug} />);

    expect(screen.getByText(/· Current/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `Continue Lab ${LABS[0].number} — ${LABS[0].title}`,
      }),
    ).toBeInTheDocument();

    // The other not-started lab is untouched by this and stays a preview.
    expect(
      screen.getByRole("link", {
        name: `Preview Lab ${LABS[1].number} — ${LABS[1].title}`,
      }),
    ).toBeInTheDocument();
  });

  it("gives a future (not-started) lab a Preview action, not a Continue link", () => {
    render(<LabGroupSection group={GROUP} labs={ROWS} currentLabSlug={CURRENT_SLUG} />);
    const futureLab = LABS[2];

    expect(
      screen.getByRole("link", {
        name: `Preview Lab ${futureLab.number} — ${futureLab.title}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: new RegExp(`^Continue Lab ${futureLab.number}\\b`),
      }),
    ).not.toBeInTheDocument();
  });

  it("gives the current (in-progress) lab a Continue action", () => {
    render(<LabGroupSection group={GROUP} labs={ROWS} currentLabSlug={CURRENT_SLUG} />);
    const currentLab = LABS[1];

    expect(
      screen.getByRole("link", {
        name: `Continue Lab ${currentLab.number} — ${currentLab.title}`,
      }),
    ).toBeInTheDocument();
  });

  /* A real Vision §16 guard: difficulty labels are ruled out everywhere. */
  it("never shows a difficulty label", () => {
    const { container } = render(
      <LabGroupSection group={GROUP} labs={ROWS} currentLabSlug={CURRENT_SLUG} />,
    );

    expect(container.textContent).not.toMatch(/beginner|intermediate|advanced/i);
  });
});
