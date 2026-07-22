// Decides whether a navigation is allowed or must be redirected to the blocked
// page, given the URL, current time and rules. Pure; reused by the navigation
// listener and the re-block sweep.

import { evaluateSchedule } from "./schedule-gate.js";

import type { BlockedParams } from "../domain/block-reason.js";
import { isInternalUrl } from "../domain/domain-of-url.js";
import { findMatchingRule, type SiteRule } from "../domain/site-rules.js";

export interface NavigationFacts {
  url: string;
  now: Date;
  rules: SiteRule[];
}

export type NavigationDecision =
  | { action: "allow" }
  | { action: "redirect"; params: BlockedParams };

const ALLOW: NavigationDecision = { action: "allow" };

export function decideNavigation(facts: NavigationFacts): NavigationDecision {
  if (isInternalUrl(facts.url)) return ALLOW;

  const rule = findMatchingRule(facts.url, facts.rules);

  if (!rule) return ALLOW;

  if (rule.schedule) {
    const decision = evaluateSchedule(rule.schedule, facts.now);

    if (decision.blocked) {
      return {
        action: "redirect",
        params: { reason: "schedule", opensAt: decision.opensAt ?? undefined },
      };
    }
  }

  return ALLOW;
}
