import type { UserRole } from "@/lib/session/types";
import { NAV_ITEMS, type NavItem } from "./nav-items";

/**
 * Admin visibility here is presentation only. It is NOT authorization —
 * see `src/app/(app)/admin/page.tsx`.
 */
export function getVisibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");
}

/**
 * Home matches its exact path only. Every other item also matches its nested
 * routes, but never a sibling that merely shares a string prefix
 * (`/labs` must not light up on `/labs-archive`).
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  const normalisedPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (href === "/") return normalisedPath === "/";
  return normalisedPath === href || normalisedPath.startsWith(`${href}/`);
}
