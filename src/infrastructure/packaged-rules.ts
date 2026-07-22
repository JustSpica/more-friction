// Loads config/friction-rules.json (authored directly in the SiteRule shape, so
// consumed as-is). Memoized for the worker's lifetime; edits take effect on the
// next worker start.

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
