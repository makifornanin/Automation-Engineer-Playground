import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";
import { getVisibleNavItems, isNavItemActive } from "./nav";

describe("isNavItemActive", () => {
  it("matches Home only on the exact root path", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/labs")).toBe(false);
    expect(isNavItemActive("/", "/notes")).toBe(false);
  });

  it("matches a section on its own path", () => {
    expect(isNavItemActive("/labs", "/labs")).toBe(true);
  });

  it("matches a section on nested paths", () => {
    expect(isNavItemActive("/labs", "/labs/03/lesson-2")).toBe(true);
    expect(isNavItemActive("/notes", "/notes/lab-01")).toBe(true);
  });

  it("does not match a sibling path that merely shares a prefix", () => {
    expect(isNavItemActive("/labs", "/labs-archive")).toBe(false);
    expect(isNavItemActive("/admin", "/administration")).toBe(false);
  });

  it("tolerates a trailing slash", () => {
    expect(isNavItemActive("/labs", "/labs/")).toBe(true);
  });
});

describe("getVisibleNavItems", () => {
  it("gives a student four items and no Admin", () => {
    const items = getVisibleNavItems("student");
    expect(items).toHaveLength(4);
    expect(items.map((item) => item.href)).toEqual(["/", "/labs", "/notes", "/settings"]);
  });

  /*
   * Kaz V2: she is a companion inside the lesson, not a destination. A dock
   * item would lead to a second Kaz with no idea which step the learner is on.
   */
  it("never offers Kaz as a destination", () => {
    for (const role of ["student", "admin"] as const) {
      expect(getVisibleNavItems(role).map((item) => item.href)).not.toContain("/kaz");
    }
  });

  it("gives an admin five items with Admin last", () => {
    const items = getVisibleNavItems("admin");
    expect(items).toHaveLength(5);
    expect(items.map((item) => item.href)).toEqual([
      "/",
      "/labs",
      "/notes",
      "/settings",
      "/admin",
    ]);
    expect(items[items.length - 1]?.label).toBe("Admin");
  });

  it("keeps the shared order stable between roles", () => {
    const studentOrder = getVisibleNavItems("student").map((item) => item.href);
    const adminOrder = getVisibleNavItems("admin")
      .map((item) => item.href)
      .filter((href) => href !== "/admin");
    expect(adminOrder).toEqual(studentOrder);
  });

  it("declares exactly one admin-only item in the source list", () => {
    expect(NAV_ITEMS.filter((item) => item.adminOnly)).toHaveLength(1);
  });
});
