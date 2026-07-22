// Configuration contract for friction rules. A SiteRule attaches mechanisms to
// a registrable domain.

import { matchesDomain } from "./domain-of-url.js";
import type { UsageWindow } from "./usage-window.js";

export interface ScheduleConfig {
  enabled: boolean;
  windows: UsageWindow[];
}

export interface SiteRule {
  domain: string; // Registrable domain, e.g. "youtube.com". Matched against subdomains too.
  schedule?: ScheduleConfig;
}

/** Returns the first rule whose domain matches the URL, if any. */
export function findMatchingRule(url: string, rules: SiteRule[]): SiteRule | undefined {
  return rules.find((rule) => matchesDomain(url, rule.domain));
}
