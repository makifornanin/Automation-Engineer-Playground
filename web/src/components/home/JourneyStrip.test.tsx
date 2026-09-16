import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LABS } from "@/lib/course/catalog";
import type { LabWithStatus } from "@/lib/course/progress";
import { JourneyStrip } from "./JourneyStrip";

const ALL_NOT_STARTED: readonly LabWithStatus[] = LABS.map((lab) => ({
  lab,
  status: "not-started",
}));

describe("<JourneyStrip />", () => {
  it("renders exactly ten list items", () => {
    render(<JourneyStrip labs={ALL_NOT_STARTED} capstoneStatus="locked" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
  });

  it("gives assistive tech the lab number, title and status together", () => {
    render(<JourneyStrip labs={ALL_NOT_STARTED} capstoneStatus="locked" />);
    expect(
      screen.getByText("Lab 01, Data Mapping and Transformation, not started"),
    ).toBeInTheDocument();
  });

  it("reflects each status in the assistive text", () => {
    const mixed: readonly LabWithStatus[] = LABS.map((lab, index) => ({
      lab,
      status: index === 0 ? "completed" : index === 1 ? "in-progress" : "not-started",
    }));
    render(<JourneyStrip labs={mixed} capstoneStatus="locked" />);

    expect(screen.getByText(/Lab 01,.*, completed/)).toBeInTheDocument();
    expect(screen.getByText(/Lab 02,.*, in progress/)).toBeInTheDocument();
  });

  it("hides the decorative number and glyph from assistive tech", () => {
    render(<JourneyStrip labs={ALL_NOT_STARTED} capstoneStatus="locked" />);
    for (const item of screen.getAllByRole("listitem")) {
      expect(item.querySelector("[aria-hidden]")).not.toBeNull();
    }
  });

  it("renders the Capstone as text outside the numbered strip", () => {
    render(<JourneyStrip labs={ALL_NOT_STARTED} capstoneStatus="locked" />);

    const list = screen.getByRole("list");
    expect(list).not.toHaveTextContent("Capstone");
    expect(screen.getByText(/Capstone/)).toBeInTheDocument();
  });

  it("describes the Capstone as locked when it is locked", () => {
    render(<JourneyStrip labs={ALL_NOT_STARTED} capstoneStatus="locked" />);
    expect(screen.getByText(/Capstone/)).toHaveTextContent(/locked/i);
  });

  it("describes the Capstone as unlocked once it no longer reports locked", () => {
    render(<JourneyStrip labs={ALL_NOT_STARTED} capstoneStatus="not-started" />);
    expect(screen.getByText(/Capstone/)).toHaveTextContent(/unlocked/i);
  });
});
