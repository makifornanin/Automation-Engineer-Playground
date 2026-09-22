import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DockItem } from "./DockItem";

describe("Dock navigation", () => {
  it("keeps the destination and accessible name on an ordinary link", () => {
    const props = {
      item: { href: "/labs", label: "Labs", description: "Learning journey", icon: "labs" as const },
      active: false, scale: 1, reducedMotion: true,
      onMagnify: () => {}, onRelease: () => {},
    };
    const { rerender } = render(<DockItem {...props} />);
    const link = screen.getByRole("link", { name: "Labs" });
    expect(link).toHaveAttribute("href", "/labs");
    expect(link).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(<DockItem {...props} active />);
    expect(link).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
