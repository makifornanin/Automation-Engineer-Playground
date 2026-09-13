import { describe, expect, it } from "vitest";
import { CODE_SENT_STATE, IDLE_STATE, toRequestCodeState, toSignInError } from "./sign-in-state";

/**
 * Pure module: nothing here imports `@supabase/auth-js`. Every "error" this
 * file is given is a plain object literal duck-typed as
 * `{ code?: string; status?: number }`, proving `toSignInError` never
 * actually needs the real Supabase error class.
 */
function authError(code: string, message = "raw supabase message"): unknown {
  return { code, status: 400, message };
}

describe("toSignInError — account-enumeration invariant", () => {
  /**
   * REGRESSION: AEP is invite-only. `shouldCreateUser: false` means an
   * uninvited email produces one of these three codes instead of silently
   * creating an account. If any of them ever became distinguishable from a
   * genuine "check your email" success, the sign-in form would become an
   * oracle for "is this address invited?" — exactly what invite-only access
   * is supposed to prevent. This test is written before the mapping exists
   * and must fail until `toSignInError` special-cases all three.
   */
  it.each(["otp_disabled", "signup_disabled", "user_not_found"])(
    "%s resolves to the exact same state reference as a real success",
    (code) => {
      const result = toSignInError(authError(code));
      expect(result).toBe(CODE_SENT_STATE);
    },
  );
});

describe("toSignInError — mapped failure codes", () => {
  it("maps otp_expired to an error state distinct from success", () => {
    const result = toSignInError(authError("otp_expired"));
    expect(result.status).toBe("error");
    expect(result).not.toBe(CODE_SENT_STATE);
  });

  it("maps over_email_send_rate_limit to an error state", () => {
    const result = toSignInError(authError("over_email_send_rate_limit"));
    expect(result.status).toBe("error");
  });

  it("maps over_request_rate_limit to an error state", () => {
    const result = toSignInError(authError("over_request_rate_limit"));
    expect(result.status).toBe("error");
  });

  it("gives over_email_send_rate_limit and over_request_rate_limit the same error code", () => {
    const a = toSignInError(authError("over_email_send_rate_limit"));
    const b = toSignInError(authError("over_request_rate_limit"));
    expect(a.status).toBe("error");
    expect(b.status).toBe("error");
    if (a.status === "error" && b.status === "error") {
      expect(a.code).toBe(b.code);
    }
  });

  it("maps validation_failed to an error state", () => {
    const result = toSignInError(authError("validation_failed"));
    expect(result.status).toBe("error");
  });

  it("maps an unrecognized error code to the generic error state", () => {
    const result = toSignInError(authError("email_address_invalid"));
    expect(result.status).toBe("error");
  });
});

describe("toSignInError — hostile / malformed input, never throws", () => {
  it("handles a thrown non-Error value (a plain string)", () => {
    expect(() => toSignInError("boom")).not.toThrow();
    expect(toSignInError("boom").status).toBe("error");
  });

  it("handles null without throwing (the null-client path)", () => {
    expect(() => toSignInError(null)).not.toThrow();
    expect(toSignInError(null).status).toBe("error");
  });

  it("handles undefined without throwing", () => {
    expect(() => toSignInError(undefined)).not.toThrow();
    expect(toSignInError(undefined).status).toBe("error");
  });

  it("handles a number without throwing", () => {
    expect(() => toSignInError(42)).not.toThrow();
  });

  it("handles a real Error instance with no code/status", () => {
    const result = toSignInError(new Error("network down"));
    expect(result.status).toBe("error");
  });

  it("handles an object with a non-string code", () => {
    const result = toSignInError({ code: 500 });
    expect(result.status).toBe("error");
  });
});

describe("toSignInError — never leaks the raw Supabase message", () => {
  it("does not include error.message text in the mapped message for a mapped code", () => {
    const result = toSignInError(authError("otp_expired", "SECRET_INTERNAL_DETAIL"));
    if (result.status === "error") {
      expect(result.message).not.toContain("SECRET_INTERNAL_DETAIL");
    }
  });

  it("does not include error.message text for an unrecognized code", () => {
    const result = toSignInError(authError("some_new_code_we_do_not_know", "SECRET_INTERNAL_DETAIL"));
    if (result.status === "error") {
      expect(result.message).not.toContain("SECRET_INTERNAL_DETAIL");
    }
  });

  it("does not include error.message text for a thrown Error", () => {
    const result = toSignInError(new Error("SECRET_INTERNAL_DETAIL"));
    if (result.status === "error") {
      expect(result.message).not.toContain("SECRET_INTERNAL_DETAIL");
    }
  });
});

describe("toRequestCodeState — request-code step is uniform for every Supabase outcome", () => {
  /**
   * GoTrue rejects an unknown address without dispatching mail. An
   * *invited* address does dispatch, so only it can hit a rate limit or a
   * mail-provider failure. If the request step ever distinguished those
   * from success, "Something went wrong" would mean "this address is
   * invited". The codes below are the three pre-existing enumeration codes;
   * `over_email_send_rate_limit`, which counts mail actually dispatched and
   * so is genuinely invited-only (the second oracle);
   * `over_request_rate_limit`, covered defensively rather than because it is
   * known to be address-gated — it is generally an IP/volume throttle; and
   * stand-ins for delivery-side failures AEP cannot enumerate in advance.
   * Covering all of them regardless of category is the point: this is a
   * blanket policy, not an allow-list.
   *
   * The `hook_*` names are retained deliberately: they are arbitrary
   * unknown-code fixtures, and the point of the test is that the policy
   * holds for codes this file has never seen. They do not imply any hook is
   * in use — AEP V1 uses Supabase email delivery directly.
   */
  it.each([
    "otp_disabled",
    "signup_disabled",
    "user_not_found",
    "over_email_send_rate_limit",
    "over_request_rate_limit",
    "unexpected_failure",
    "hook_timeout",
    "hook_timeout_after_retry",
    "hook_payload_invalid_state",
    "some_future_code_nobody_has_seen_yet",
  ])("%s resolves to the exact same state reference as a real success", (code) => {
    const result = toRequestCodeState({ code, status: 400, message: "raw supabase message" });
    expect(result).toBe(CODE_SENT_STATE);
  });

  it("resolves null to CODE_SENT_STATE", () => {
    expect(toRequestCodeState(null)).toBe(CODE_SENT_STATE);
  });

  it("resolves undefined to CODE_SENT_STATE", () => {
    expect(toRequestCodeState(undefined)).toBe(CODE_SENT_STATE);
  });

  it("resolves a thrown Error to CODE_SENT_STATE", () => {
    expect(toRequestCodeState(new Error("network down"))).toBe(CODE_SENT_STATE);
  });

  it("resolves a bare string to CODE_SENT_STATE", () => {
    expect(toRequestCodeState("boom")).toBe(CODE_SENT_STATE);
  });

  it("resolves a number to CODE_SENT_STATE", () => {
    expect(toRequestCodeState(42)).toBe(CODE_SENT_STATE);
  });

  it("resolves an object with a non-string code to CODE_SENT_STATE", () => {
    expect(toRequestCodeState({ code: 500 })).toBe(CODE_SENT_STATE);
  });

  it("never throws for any input", () => {
    for (const input of [null, undefined, "boom", 42, new Error("x"), { code: 500 }, {}]) {
      expect(() => toRequestCodeState(input)).not.toThrow();
    }
  });
});

describe("SignInState shape", () => {
  it("IDLE_STATE has no extra fields", () => {
    expect(Object.keys(IDLE_STATE)).toEqual(["status"]);
  });

  it("CODE_SENT_STATE has no extra fields", () => {
    expect(Object.keys(CODE_SENT_STATE)).toEqual(["status"]);
  });

  it("an error state carries only status/code/message — nothing session-shaped", () => {
    const result = toSignInError(authError("otp_expired"));
    expect(Object.keys(result).sort()).toEqual(["code", "message", "status"]);
  });
});
