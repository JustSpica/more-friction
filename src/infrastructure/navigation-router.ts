// Chrome adapter for decideNavigation: on main-frame navigation, loads the
// rules, gets the decision, and redirects. reevaluateTab reuses it for the
// re-block sweep.

import {
  decideNavigation,
  type NavigationDecision,
} from "../application/decide-navigation.js";
import { loadPackagedRules } from "./packaged-rules.js";
import { blockedPageUrl } from "./blocked-url.js";

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
