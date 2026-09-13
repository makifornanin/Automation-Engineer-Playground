import { signOutAction } from "@/lib/auth/sign-out-action";

/**
 * Server Component — no `"use client"`, no JavaScript required to sign out.
 * A plain `<form action={signOutAction}>` posts to the server action
 * directly; a GET route handler at, say, `/sign-out` would let any page
 * trigger it with `<img src="/sign-out">`, which this form-based, POST-only
 * shape avoids.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-pill border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong"
      >
        Sign out
      </button>
    </form>
  );
}
