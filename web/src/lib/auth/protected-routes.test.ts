import { describe, expect, it } from "vitest";
import { isProtectedPath, PUBLIC_PATHS, SIGN_IN_PATH } from "./protected-routes";

describe("SIGN_IN_PATH / PUBLIC_PATHS", () => {
  it("declares /sign-in as the sign-in path", () => {
    expect(SIGN_IN_PATH).toBe("/sign-in");
  });

  it("lists sign-in as the only public path", () => {
    expect(PUBLIC_PATHS).toEqual(["/sign-in"]);
  });
});

describe("isProtectedPath", () => {
  it("does not protect the sign-in page itself", () => {
    expect(isProtectedPath("/sign-in")).toBe(false);
  });

  it.each(["/", "/labs", "/notes", "/kaz", "/settings", "/admin"])(
    "protects %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  it("protects nested paths under a protected route", () => {
    expect(isProtectedPath("/labs/03/lesson-2")).toBe(true);
    expect(isProtectedPath("/admin/invites")).toBe(true);
  });

  it("protects an unknown path by default (default deny)", () => {
    expect(isProtectedPath("/some-future-route")).toBe(true);
  });

  it("does not treat a path merely sharing the sign-in prefix as public", () => {
    expect(isProtectedPath("/sign-in-extra")).toBe(true);
  });
});
