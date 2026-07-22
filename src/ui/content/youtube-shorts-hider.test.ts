// @vitest-environment jsdom
import { describe, expect, it, beforeAll } from "vitest";

// The content script marks Shorts containers on import (initial synchronous
// sweep). Build a YouTube-like DOM before importing it, then assert the
// decision. Observer/rAF paths are exercised indirectly by the same logic.
describe("youtube-shorts-hider", () => {
  beforeAll(async () => {
    // jsdom has no requestAnimationFrame; the observer's scheduled sweep would
    // otherwise throw during teardown. Browsers always provide it.
    globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) =>
      setTimeout(() => cb(0), 0) as unknown as number);
    document.body.innerHTML = `
      <ytd-video-renderer id="short"><a href="/shorts/abc123">short</a></ytd-video-renderer>
      <ytd-video-renderer id="video"><a href="/watch?v=xyz">normal</a></ytd-video-renderer>
      <ytd-guide-entry-renderer id="nav-shorts"><a id="endpoint" title="Shorts"><yt-formatted-string class="title">Shorts</yt-formatted-string></a></ytd-guide-entry-renderer>
      <ytd-guide-entry-renderer id="nav-home"><a id="endpoint" title="Início"><yt-formatted-string class="title">Início</yt-formatted-string></a></ytd-guide-entry-renderer>
      <yt-chip-cloud-chip-renderer id="chip-shorts"> Shorts </yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer id="chip-all">Todos</yt-chip-cloud-chip-renderer>
    `;
    await import("./youtube-shorts-hider.js");
  });

  it("hides feed items linking to a short", () => {
    expect(document.getElementById("short")?.getAttribute("data-mf-hidden")).toBe(
      "shorts",
    );
  });

  it("leaves normal video items untouched", () => {
    expect(document.getElementById("video")?.hasAttribute("data-mf-hidden")).toBe(
      false,
    );
  });

  it("hides the sidebar Shorts entry by its title (no href on the anchor)", () => {
    expect(
      document.getElementById("nav-shorts")?.getAttribute("data-mf-hidden"),
    ).toBe("shorts");
    expect(
      document.getElementById("nav-home")?.hasAttribute("data-mf-hidden"),
    ).toBe(false);
  });

  it("hides the Shorts filter chip, which has no /shorts link, by its text", () => {
    expect(
      document.getElementById("chip-shorts")?.getAttribute("data-mf-hidden"),
    ).toBe("shorts");
    expect(
      document.getElementById("chip-all")?.hasAttribute("data-mf-hidden"),
    ).toBe(false);
  });
});
