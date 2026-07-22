// Block reasons and the pure build/parse of the blocked page's query string,
// shared by the redirect builder and the page renderer. No chrome/DOM.

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
