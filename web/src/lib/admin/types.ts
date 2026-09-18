/**
 * Result of one Admin action, shown next to the control that ran it. Plain
 * words only: no Supabase error text, no ids, nothing about another account
 * beyond what the admin already sees in the list.
 */
export type AdminActionState =
  | { status: "idle" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export const IDLE_ADMIN_ACTION_STATE: AdminActionState = { status: "idle" };

export const ADMIN_MESSAGE = {
  not_allowed: "Only an admin can do this.",
  not_configured: "Admin is not configured on this server.",
  invalid_email: "Enter a valid email address.",
  invalid_learner: "That learner could not be found. Refresh the page.",
  invite_sent: "Invite sent. They accept it from the email, then sign in with a code.",
  already_active: "That email already has access. They can sign in with a code.",
  email_limit: "Supabase's email limit has been reached. Try again later.",
  invite_failed: "The invite was not sent. Try again.",
  resend_sent: "Invite sent again. The earlier link no longer works.",
  resend_not_needed: "This learner has already accepted. They sign in with a code.",
  resend_revoked: "Restore this learner's access before sending an invite.",
  revoked: "Access revoked. Their progress and notes are kept.",
  already_revoked: "Access was already revoked.",
  restored: "Access restored. They can sign in with a code again.",
  not_revoked: "This learner already has access.",
  self: "You cannot revoke your own access.",
  admin_target: "Admin accounts are managed in Supabase, not here.",
  action_failed: "That did not work. Try again.",
} as const;
