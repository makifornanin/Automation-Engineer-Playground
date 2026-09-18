import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { allowKazMessage, KAZ_MAX_PER_MINUTE, resetKazThrottle } from "./kaz-throttle";

beforeEach(() => {
  resetKazThrottle();
});

describe("allowKazMessage", () => {
  it("allows a first message and refuses an immediate second", () => {
    expect(allowKazMessage("learner-1", 0)).toBe(true);
    expect(allowKazMessage("learner-1", 500)).toBe(false);
  });

  it("allows the next message once the interval has passed", () => {
    expect(allowKazMessage("learner-1", 0)).toBe(true);
    expect(allowKazMessage("learner-1", 3_000)).toBe(true);
  });

  it("caps a burst inside one minute", () => {
    let now = 0;
    let allowed = 0;
    for (let i = 0; i < KAZ_MAX_PER_MINUTE + 4; i += 1) {
      if (allowKazMessage("learner-1", now)) allowed += 1;
      now += 3_100;
    }

    expect(allowed).toBe(KAZ_MAX_PER_MINUTE);
  });

  it("counts each learner separately", () => {
    expect(allowKazMessage("learner-1", 0)).toBe(true);
    expect(allowKazMessage("learner-2", 0)).toBe(true);
  });

  it("lets the minute roll over", () => {
    let now = 0;
    for (let i = 0; i < KAZ_MAX_PER_MINUTE; i += 1) {
      allowKazMessage("learner-1", now);
      now += 3_100;
    }
    expect(allowKazMessage("learner-1", now)).toBe(false);
    expect(allowKazMessage("learner-1", now + 61_000)).toBe(true);
  });
});
