"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Signs the learner out and redirects to `/sign-in`.
 *
 * `scope: "local"` is deliberate — auth-js defaults `signOut()` to `global`,
 * which revokes every session for that user on every device. A "Sign out"
 * button on one device must not silently kill the learner's sessions
 * elsewhere; `local` ends only the session this request is using.
 *
 * Fail-safe: `signOut()`'s own cookie cleanup runs through
 * `createSupabaseServerClient()`'s `setAll`, but that only happens if the
 * call succeeds. If it throws (network failure, already-revoked session),
 * the learner must still end up signed out from this app's point of view —
 * so every `sb-*` cookie is deleted directly below regardless of whether
 * `signOut()` succeeded, and the redirect always happens.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Fail-safe: fall through to the manual cookie cleanup and redirect
      // below regardless of why signOut() failed.
    }
  }

  await clearSupabaseAuthCookies();
  redirect("/sign-in");
}

/** Deletes every `sb-*` cookie directly, independent of whether the
 * Supabase client's own cleanup ran. Only the auth-cookie prefix is
 * targeted — an unrelated cookie (e.g. the theme preference) is left
 * alone. */
async function clearSupabaseAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }
}
