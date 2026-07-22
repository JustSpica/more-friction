// Contract for the blocked page. Building/parsing the query string is pure and
// shared between the background (which redirects here) and blocked.ts (which
// renders). The chrome-dependent URL helper is the only part needing runtime.

export type BlockReason = "shorts" | "schedule";

const BLOCK_REASONS: readonly BlockReason[] = ["shorts", "schedule"];

export interface BlockedParams {
  reason: BlockReason;
  opensAt?: number;
}

function isBlockReason(value: string | null): value is BlockReason {
  return value !== null && (BLOCK_REASONS as readonly string[]).includes(value);
}

export function buildBlockedQuery(params: BlockedParams): string {
  const search = new URLSearchParams();
  search.set("reason", params.reason);

  if (params.opensAt !== undefined) search.set("opensAt", String(params.opensAt));

  return search.toString();
}

export function parseBlockedParams(search: string): BlockedParams {
  const params = new URLSearchParams(search);
  const reason = params.get("reason");
  const result: BlockedParams = {
    reason: isBlockReason(reason) ? reason : "schedule",
  };
  const rawOpensAt = params.get("opensAt");

  if (rawOpensAt !== null) {
    const opensAt = Number(rawOpensAt);
    if (Number.isFinite(opensAt)) result.opensAt = opensAt;
  }

  return result;
}

/** Absolute chrome-extension:// URL for the blocked page with the given params. */
export function blockedPageUrl(params: BlockedParams): string {
  const base = chrome.runtime.getURL("blocked/blocked.html");
  
  return `${base}?${buildBlockedQuery(params)}`;
}
