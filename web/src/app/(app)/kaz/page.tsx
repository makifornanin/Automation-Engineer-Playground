import { redirect } from "next/navigation";

/**
 * Kaz no longer has a destination of her own.
 *
 * Kaz V2 makes her a floating companion inside the lesson, where the problem
 * actually is (Kaz design §11, amended Vision §12). A separate page would be a
 * second Kaz competing with the panel, and a page that only describes what she
 * can do is worse than the companion itself.
 *
 * This route stays as a redirect rather than being deleted: `/kaz` appears in
 * recorded live evidence and in the proxy's protected-path checks, and a 404
 * would quietly invalidate both. Learners who bookmarked it land in the
 * journey, where Kaz is one click away on any lesson.
 */
export default function KazPage() {
  redirect("/labs");
}
