import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error("REDIRECT:" + url);
  }),
);

vi.mock("next/navigation", () => ({ redirect }));

import KazPage from "./page";

describe("the old Kaz page", () => {
  /*
   * Kaz V2 replaced the destination with a companion in the lesson. The route
   * stays as a redirect rather than a 404: it appears in recorded live evidence
   * and in the proxy's protected paths, and learners may have bookmarked it.
   */
  it("sends a visitor into the journey instead of showing a second Kaz", () => {
    expect(() => KazPage()).toThrow("REDIRECT:/labs");
    expect(redirect).toHaveBeenCalledWith("/labs");
  });
});
