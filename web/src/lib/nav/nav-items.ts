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
 * Navigation items from Vision §12. Capstone is deliberately absent: it appears
 * at the end of Labs when unlocked rather than taking a permanent dock slot.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", description: "Your starting point", icon: "home" },
  { href: "/labs", label: "Labs", description: "The learning journey", icon: "labs" },
  { href: "/notes", label: "Notes", description: "Your learning notebook", icon: "notes" },
  { href: "/kaz", label: "Kaz", description: "Your AEP teacher", icon: "kaz" },
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
