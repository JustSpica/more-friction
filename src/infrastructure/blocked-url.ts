// Builds the absolute chrome-extension:// URL for the blocked page, the only
// chrome-coupled part of the blocked-page contract, kept out of domain/.

import { buildBlockedQuery, type BlockedParams } from "../domain/block-reason.js";

const BLOCKED_PAGE = "ui/pages/blocked/blocked.html";

export function blockedPageUrl(params: BlockedParams): string {
  const base = chrome.runtime.getURL(BLOCKED_PAGE);
  return `${base}?${buildBlockedQuery(params)}`;
}
