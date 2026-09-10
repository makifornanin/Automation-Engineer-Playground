import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppDock } from "@/components/dock/AppDock";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  mockPathname = "/";
});

describe("<AppDock />", () => {
  it("renders a single primary navigation landmark", () => {
    render(<AppDock role="student" />);
    const navs = screen.getAllByRole("navigation");
    expect(navs).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("shows five items and no Admin for a student", () => {
    render(<AppDock role="student" />);
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
  });

  it("shows six items including Admin for an admin", () => {
    render(<AppDock role="admin" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
  });

  it("exposes every label as the link's accessible name", () => {
    render(<AppDock role="admin" />);
    for (const label of ["Home", "Labs", "Notes", "Kaz", "Settings", "Admin"]) {
      expect(
        screen.getByRole("link", { name: new RegExp(`^${label}`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("marks exactly one link as the current page", () => {
    mockPathname = "/labs/03/lesson-2";
    render(<AppDock role="student" />);
    const current = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Labs");
  });

  it("marks Home as current on the root path only", () => {
    render(<AppDock role="student" />);
    expect(screen.getByRole("link", { name: /^home/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /^labs/i })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
