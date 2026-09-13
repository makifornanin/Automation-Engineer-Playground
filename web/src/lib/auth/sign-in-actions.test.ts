import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_STATE } from "./sign-in-state";

const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockRedirect = vi.fn((url: string) => {
  // Mirrors real Next.js behaviour: redirect() throws, it never returns.
  throw new Error(`REDIRECT:${url}`);
});
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string, type?: string) => mockRevalidatePath(path, type),
}));

function buildClient() {
  return {
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  };
}

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  mockSignInWithOtp.mockReset();
  mockVerifyOtp.mockReset();
  mockCreateSupabaseServerClient.mockReset();
  mockRedirect.mockClear();
  mockRevalidatePath.mockClear();
});

describe("requestSignInCode", () => {
  it("REGRESSION: always calls signInWithOtp with shouldCreateUser: false — never deletable silently", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

    const { requestSignInCode } = await import("./sign-in-actions");
    await requestSignInCode(IDLE_STATE, formData({ email: "ada@example.com" }));

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ shouldCreateUser: false }),
      }),
    );
  });

  it("normalizes the email (trim + lowercase) before calling signInWithOtp", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

    const { requestSignInCode } = await import("./sign-in-actions");
    await requestSignInCode(IDLE_STATE, formData({ email: "  Ada@Example.COM  " }));

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ada@example.com" }),
    );
  });

  it("returns the code_sent state on success", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

    const { requestSignInCode } = await import("./sign-in-actions");
    const result = await requestSignInCode(IDLE_STATE, formData({ email: "ada@example.com" }));

    expect(result.status).toBe("code_sent");
    expect(Object.keys(result)).toEqual(["status"]);
  });

  it("returns invalid_input without calling Supabase when the email is malformed", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());

    const { requestSignInCode } = await import("./sign-in-actions");
    const result = await requestSignInCode(IDLE_STATE, formData({ email: "not-an-email" }));

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("invalid_input");
    }
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("REGRESSION: an enumeration-sensitive Supabase error still resolves as code_sent", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: { code: "user_not_found", status: 400, message: "No user found" },
    });

    const { requestSignInCode } = await import("./sign-in-actions");
    const result = await requestSignInCode(IDLE_STATE, formData({ email: "nobody@example.com" }));

    expect(result.status).toBe("code_sent");
  });

  it("maps a rate-limit error to the error state", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: { code: "over_email_send_rate_limit", status: 429, message: "slow down" },
    });

    const { requestSignInCode } = await import("./sign-in-actions");
    const result = await requestSignInCode(IDLE_STATE, formData({ email: "ada@example.com" }));

    expect(result.status).toBe("error");
  });

  it("yields the generic failure rather than throwing when the Supabase client is null", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(null);

    const { requestSignInCode } = await import("./sign-in-actions");
    const result = await requestSignInCode(IDLE_STATE, formData({ email: "ada@example.com" }));

    expect(result.status).toBe("error");
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("yields the generic failure rather than throwing when signInWithOtp itself rejects", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockSignInWithOtp.mockRejectedValue(new Error("network down"));

    const { requestSignInCode } = await import("./sign-in-actions");
    const result = await requestSignInCode(IDLE_STATE, formData({ email: "ada@example.com" }));

    expect(result.status).toBe("error");
  });
});

describe("verifySignInCode", () => {
  it("calls verifyOtp with type: 'email'", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });

    const { verifySignInCode } = await import("./sign-in-actions");
    await expect(
      verifySignInCode(IDLE_STATE, formData({ email: "ada@example.com", code: "123456" })),
    ).rejects.toThrow("REDIRECT:/");

    expect(mockVerifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ada@example.com", token: "123456", type: "email" }),
    );
  });

  it("revalidates the layout and redirects home on success", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });

    const { verifySignInCode } = await import("./sign-in-actions");
    await expect(
      verifySignInCode(IDLE_STATE, formData({ email: "ada@example.com", code: "123456" })),
    ).rejects.toThrow();

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("never returns the session/token data on success — only the redirect throw surfaces", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockVerifyOtp.mockResolvedValue({
      data: {
        user: { id: "user-1" },
        session: { access_token: "super-secret-at", refresh_token: "super-secret-rt" },
      },
      error: null,
    });

    const { verifySignInCode } = await import("./sign-in-actions");
    let caught: unknown;
    try {
      await verifySignInCode(IDLE_STATE, formData({ email: "ada@example.com", code: "123456" }));
    } catch (error) {
      caught = error;
    }

    expect(String(caught)).not.toContain("super-secret");
  });

  it("returns an error state for an incorrect/expired code, without redirecting", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "otp_expired", status: 401, message: "Token has expired" },
    });

    const { verifySignInCode } = await import("./sign-in-actions");
    const result = await verifySignInCode(
      IDLE_STATE,
      formData({ email: "ada@example.com", code: "000000" }),
    );

    expect(result.status).toBe("error");
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(Object.keys(result).sort()).toEqual(["code", "message", "status"]);
  });

  it("yields the generic failure rather than throwing when the Supabase client is null", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(null);

    const { verifySignInCode } = await import("./sign-in-actions");
    const result = await verifySignInCode(
      IDLE_STATE,
      formData({ email: "ada@example.com", code: "123456" }),
    );

    expect(result.status).toBe("error");
    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("REGRESSION: a missing/blank code reports a code-specific message, not the email one", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient());

    const { verifySignInCode } = await import("./sign-in-actions");
    const result = await verifySignInCode(
      IDLE_STATE,
      formData({ email: "ada@example.com", code: "   " }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("invalid_code");
      expect(result.message).not.toMatch(/email/i);
    }
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });
});
