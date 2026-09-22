import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DockItem } from "./DockItem";

const status = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/link")>()),
  useLinkStatus: () => status,
}));

describe("Dock pending navigation", () => {
  it("shows and clears feedback while preserving the destination's accessible name", () => {
    const props = {
      item: { href: "/labs", label: "Labs", description: "Learning journey", icon: "labs" as const },
      active: false, scale: 1, reducedMotion: true,
      onMagnify: () => {}, onRelease: () => {},
    };
    const { rerender } = render(<DockItem {...props} />);
    expect(screen.queryByText("Opening…")).not.toBeInTheDocument();
    status.pending = true;
    rerender(<DockItem {...props} />);
    expect(screen.getByRole("link", { name: "Labs" })).toBeInTheDocument();
    expect(screen.getByText("Opening…")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Opening…");
    status.pending = false;
    rerender(<DockItem {...props} />);
    expect(screen.queryByText("Opening…")).not.toBeInTheDocument();
  });
});
