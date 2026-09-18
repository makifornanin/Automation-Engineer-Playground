import type { DockIconName } from "@/components/dock/DockIcons";

export interface NavItem {
  href: string;
  label: string;
  /** Short description used as the link's accessible title on small screens. */
  description: string;
  icon: DockIconName;
  adminOnly?: boolean;
}

/**
 * Navigation items from Vision §12, amended twice by what the product learned.
 *
 * Capstone is deliberately absent: it appears at the end of Labs when unlocked
 * rather than taking a permanent dock slot.
 *
 * Kaz is absent too, since Kaz V2. §12 listed her as a dock destination, but
 * she is a companion, not a section: she rides along with the lesson as a
 * floating orb and answers about the step on screen. A dock item would lead to
 * a second, context-free Kaz — exactly the "two competing Kaz experiences" the
 * V2 direction rules out. `/kaz` redirects into the journey.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", description: "Your starting point", icon: "home" },
  { href: "/labs", label: "Labs", description: "The learning journey", icon: "labs" },
  { href: "/notes", label: "Notes", description: "Your learning notebook", icon: "notes" },
  {
    href: "/settings",
    label: "Settings",
    description: "Theme and preferences",
    icon: "settings",
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Owner tools",
    icon: "admin",
    adminOnly: true,
  },
];
