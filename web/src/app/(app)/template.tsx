import { PageTransition } from "@/components/shell/PageTransition";

/**
 * A template remounts on every navigation, which is what gives each page its
 * enter transition. A layout would not.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
