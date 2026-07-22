// Evaluates a navigation against the configured rules and decides whether to
// redirect it to the blocked page. The decision (`decideNavigation`) is pure so
// it can be unit-tested and reused by the periodic re-block sweep; the listener
// installer performs the chrome I/O.

import { evaluateSchedule } from "./schedule-gate.js";

import { loadPackagedRules } from "../config/packaged-rules.js";
import { isInternalUrl } from "../domain/domain-of-url.js";
import { findMatchingRule, type SiteRule } from "../domain/site-rules.js";
import { blockedPageUrl, type BlockedParams } from "../shared/block-reason.js";

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

/** Redirects a tab to the blocked page for the given decision. */
async function applyDecision(tabId: number, decision: NavigationDecision): Promise<void> {
  if (decision.action !== "redirect") return;

  await chrome.tabs.update(tabId, { url: blockedPageUrl(decision.params) });
}

export function installNavigationRouter(): void {
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return; // main frame only

    const rules = await loadPackagedRules();
    const decision = decideNavigation({ url: details.url, now: new Date(), rules });

    await applyDecision(details.tabId, decision);
  });
}

/** Re-evaluates a single already-open tab (used by the expiry sweep). */
export async function reevaluateTab(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id === undefined || tab.url === undefined) return;

  const rules = await loadPackagedRules();
  const decision = decideNavigation({ url: tab.url, now: new Date(), rules });
  
  await applyDecision(tab.id, decision);
}
