import type { SVGProps } from "react";

export type DockIconName = "home" | "labs" | "notes" | "kaz" | "settings" | "admin";

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

/** Icons are decorative; the link text carries the accessible name. */
const ICONS: Record<DockIconName, React.ReactElement> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3.5v-4.5h3V20H17a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  labs: (
    <>
      <path d="M9.5 3v5.2L4.8 16.4A2.4 2.4 0 0 0 6.9 20h10.2a2.4 2.4 0 0 0 2.1-3.6L14.5 8.2V3" />
      <path d="M8.5 3h7" />
      <path d="M7.4 14h9.2" />
    </>
  ),
  notes: (
    <>
      <path d="M6 3.75h9.5L19 7.25V20a.75.75 0 0 1-.75.75H6A.75.75 0 0 1 5.25 20V4.5A.75.75 0 0 1 6 3.75Z" />
      <path d="M15 3.9v3.6h3.6" />
      <path d="M8.5 12h7M8.5 16h4.5" />
    </>
  ),
  kaz: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M8.4 10.2a4.4 4.4 0 0 1 4.6-1.9" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  settings: (
    <>
      <path d="M5 8h9M17.5 8H19M5 16h2.5M11 16h8" />
      <circle cx="15.5" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3.5 19 6v5.6c0 4-2.8 7.3-7 8.9-4.2-1.6-7-4.9-7-8.9V6l7-2.5Z" />
      <path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
    </>
  ),
};

export function DockIcon({
  name,
  className,
}: {
  name: DockIconName;
  className?: string;
}) {
  return (
    <svg {...baseProps} className={className}>
      {ICONS[name]}
    </svg>
  );
}
