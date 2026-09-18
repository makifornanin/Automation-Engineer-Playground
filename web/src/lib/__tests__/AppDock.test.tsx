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

  it("shows four items and no Admin for a student", () => {
    render(<AppDock role="student" />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
  });

  it("shows five items including Admin for an admin", () => {
    render(<AppDock role="admin" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
  });

  it("exposes every label as the link's accessible name", () => {
    render(<AppDock role="admin" />);
    for (const label of ["Home", "Labs", "Notes", "Settings", "Admin"]) {
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

  it("scopes the shared glass surface to the mobile capsule only", () => {
    const { container } = render(<AppDock role="student" />);
    const list = container.querySelector("ul");
    expect(list).not.toBeNull();
    const classNames = (list?.getAttribute("class") ?? "").split(/\s+/);
    expect(classNames).toContain("max-md:glass-surface");
    expect(classNames).not.toContain("glass-surface");
  });

  it("gives every dock link its own glass chip", () => {
    render(<AppDock role="admin" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("class")?.split(/\s+/)).toContain("glass-chip");
    }
  });

  it("marks exactly one link data-active, and it is the aria-current element", () => {
    mockPathname = "/labs/03/lesson-2";
    render(<AppDock role="student" />);
    const links = screen.getAllByRole("link");
    const active = links.filter((link) => link.getAttribute("data-active") === "true");
    const current = links.filter((link) => link.getAttribute("aria-current") === "page");
    expect(active).toHaveLength(1);
    expect(active[0]).toBe(current[0]);
  });

  it.each([
    ["/", "Home"],
    ["/labs/03/lesson-2", "Labs"],
  ])("marks %s active via data-active on %s", (path, label) => {
    mockPathname = path;
    render(<AppDock role="student" />);
    expect(
      screen.getByRole("link", { name: new RegExp(`^${label}`, "i") }),
    ).toHaveAttribute("data-active", "true");
  });

  it("keeps every dock label present as real text, not display:none", () => {
    render(<AppDock role="admin" />);
    for (const label of ["Home", "Labs", "Notes", "Settings", "Admin"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("exposes exactly one tab stop per nav item, not a phantom li stop", () => {
    // Motion auto-adds tabIndex="0" to the <li> because it carries whileTap.
    // The <a> is the real, natively-focusable target, so the <li> stop is a
    // duplicate: tabIndex={-1} keeps it out of the tab sequence without
    // touching whileTap.
    const { container } = render(<AppDock role="admin" />);
    const tabStops = container.querySelectorAll(
      '[tabindex]:not([tabindex="-1"]), a[href]',
    );
    expect(tabStops).toHaveLength(5);
  });

  it("keeps every dock <li> out of the tab sequence with tabindex=-1", () => {
    const { container } = render(<AppDock role="admin" />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(5);
    for (const item of items) {
      expect(item).toHaveAttribute("tabindex", "-1");
    }
  });
});
