import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppLoading from "./loading";

describe("App loading boundary", () => {
  it("announces a calm loading state without adding a focusable control", () => {
    render(<AppLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
