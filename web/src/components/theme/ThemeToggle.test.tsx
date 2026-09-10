import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme/theme";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("<ThemeToggle />", () => {
  it("exposes the options as one named group", () => {
    renderToggle();
    expect(screen.getByRole("group", { name: "Appearance" })).toBeInTheDocument();
  });

  /*
   * Arrow-key navigation and roving focus come from the browser's native radio
   * behaviour, which is only available to real <input type="radio"> elements
   * sharing one name. Asserting the structure asserts the keyboard contract;
   * asserting the key presses themselves would only be testing jsdom.
   */
  it("uses native radio inputs sharing a single group name", () => {
    renderToggle();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    for (const radio of radios) {
      expect(radio.tagName).toBe("INPUT");
      expect(radio).toHaveAttribute("type", "radio");
    }
    const names = new Set(radios.map((radio) => radio.getAttribute("name")));
    expect(names.size).toBe(1);
  });

  it("defaults to System", () => {
    renderToggle();
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
  });

  it("selects a preference, persists it and applies it to the document", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "System" })).not.toBeChecked();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("keeps every option reachable by label text", () => {
    renderToggle();
    for (const label of ["Light", "Dark", "System"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });
});
