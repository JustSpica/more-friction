import { describe, expect, it } from "vitest";
import { hostnameOf, isInternalUrl, matchesDomain } from "./domain-of-url.js";
import { findMatchingRule, type SiteRule } from "./site-rules.js";

describe("hostnameOf", () => {
  it("lowercases and strips a leading www.", () => {
    expect(hostnameOf("https://WWW.YouTube.com/watch")).toBe("youtube.com");
  });

  it("returns null for invalid URLs", () => {
    expect(hostnameOf("not a url")).toBeNull();
  });
});

describe("matchesDomain", () => {
  it("matches the exact domain and its subdomains", () => {
    expect(matchesDomain("https://youtube.com/", "youtube.com")).toBe(true);
    expect(matchesDomain("https://m.youtube.com/", "youtube.com")).toBe(true);
    expect(matchesDomain("https://music.youtube.com/", "youtube.com")).toBe(true);
  });

  it("does not match unrelated domains that merely share a suffix word", () => {
    expect(matchesDomain("https://notyoutube.com/", "youtube.com")).toBe(false);
    expect(matchesDomain("https://youtube.com.evil.com/", "youtube.com")).toBe(false);
  });
});

describe("isInternalUrl", () => {
  it("flags browser and extension pages", () => {
    expect(isInternalUrl("chrome://extensions")).toBe(true);
    expect(isInternalUrl("chrome-extension://abc/blocked.html")).toBe(true);
    expect(isInternalUrl("https://youtube.com")).toBe(false);
  });
});

describe("findMatchingRule", () => {
  const rules: SiteRule[] = [
    { domain: "youtube.com" },
    { domain: "reddit.com", schedule: { enabled: true, windows: [] } },
  ];

  it("finds the rule whose domain matches the URL", () => {
    expect(findMatchingRule("https://m.youtube.com/feed", rules)?.domain).toBe(
      "youtube.com",
    );
  });

  it("returns undefined when no rule matches", () => {
    expect(findMatchingRule("https://example.com", rules)).toBeUndefined();
  });
});
