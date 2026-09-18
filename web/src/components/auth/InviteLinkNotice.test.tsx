import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InviteLinkNotice, readInviteLanding } from "./InviteLinkNotice";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("readInviteLanding", () => {
  it("recognises an accepted invite", () => {
    expect(readInviteLanding("#access_token=x&refresh_token=y&type=invite")).toBe("accepted");
  });

  it("recognises a used or expired link", () => {
    expect(readInviteLanding("#error=access_denied&error_code=otp_expired")).toBe("failed");
  });

  it("ignores anything else", () => {
    expect(readInviteLanding("")).toBe("none");
    expect(readInviteLanding("#access_token=x&type=recovery")).toBe("none");
  });
});

describe("<InviteLinkNotice />", () => {
  /*
   * An accepted invite puts a live session in the URL. AEP does not use it,
   * and it must not stay in the address bar or the history entry.
   */
  it("removes the session from the address bar and tells the learner to request a code", () => {
    window.history.replaceState(null, "", "/sign-in#access_token=x&refresh_token=y&type=invite");

    render(<InviteLinkNotice />);

    expect(screen.getByRole("status")).toHaveTextContent(/Invite accepted/);
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/sign-in");
  });

  it("renders nothing on a normal visit", () => {
    window.history.replaceState(null, "", "/sign-in");

    const { container } = render(<InviteLinkNotice />);

    expect(container).toBeEmptyDOMElement();
  });
});
