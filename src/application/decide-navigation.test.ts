import { describe, expect, it } from "vitest";

import { decideNavigation } from "./decide-navigation.js";

import type { SiteRule } from "../domain/site-rules.js";

// 2026-07-20 is a Monday (getDay() === 1).
const MONDAY_10AM = new Date(2026, 6, 20, 10, 0);
const MONDAY_NOON = new Date(2026, 6, 20, 12, 0);

const rules: SiteRule[] = [
  {
    domain: "reddit.com",
    schedule: {
      enabled: true,
      windows: [{ days: [1, 2, 3, 4, 5], start: "09:00", end: "11:00" }],
    },
  },
];

describe("decideNavigation", () => {
  it("allows URLs with no matching rule", () => {
    expect(
      decideNavigation({ url: "https://example.com", now: MONDAY_NOON, rules }),
    ).toEqual({ action: "allow" });
  });

  it("allows a scheduled domain inside its window", () => {
    expect(
      decideNavigation({ url: "https://reddit.com/r/all", now: MONDAY_10AM, rules }),
    ).toEqual({ action: "allow" });
  });

  it("redirects a scheduled domain outside its window", () => {
    const decision = decideNavigation({
      url: "https://old.reddit.com/",
      now: MONDAY_NOON,
      rules,
    });

    expect(decision.action).toBe("redirect");
    
    if (decision.action === "redirect") {
      expect(decision.params.reason).toBe("schedule");
      expect(decision.params.opensAt).toBe(new Date(2026, 6, 21, 9, 0).getTime());
    }
  });

  it("never gates internal extension/browser pages", () => {
    expect(
      decideNavigation({
        url: "chrome-extension://abc/blocked/blocked.html?reason=schedule",
        now: MONDAY_NOON,
        rules,
      }),
    ).toEqual({ action: "allow" });
  });
});
