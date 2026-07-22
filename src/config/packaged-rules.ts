// Loads the rules bundled with the extension (config/friction-rules.json). The
// file is authored directly in the internal SiteRule shape, so it is consumed
// as-is, no parser or validation layer. Editing rules means editing the file
// and reloading the extension.
//
// The result is memoized for the service worker's lifetime; a fresh worker
// start re-reads the file, which is when config changes take effect.

import type { SiteRule } from "../domain/site-rules.js";

const RULES_PATH = "config/friction-rules.json";

let cache: Promise<SiteRule[]> | null = null;

export function loadPackagedRules(): Promise<SiteRule[]> {
  cache ??= fetchPackagedRules();

  return cache;
}

async function fetchPackagedRules(): Promise<SiteRule[]> {
  try {
    const response = await fetch(chrome.runtime.getURL(RULES_PATH));

    if (!response.ok) return [];

    return (await response.json()) as SiteRule[];
  } catch (error) {
    console.error("more-friction: failed to load config/friction-rules.json", error);
    return [];
  }
}
