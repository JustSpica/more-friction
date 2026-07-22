// URL/domain helpers shared by the navigation rules. Pure logic.
// Rule matching is suffix-based against a configured registrable domain
// (e.g. "youtube.com"), so subdomains like www./m./music.youtube.com all match
// without needing the full Public Suffix List.

export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** True when the URL's host equals `ruleDomain` or is a subdomain of it. */
export function matchesDomain(url: string, ruleDomain: string): boolean {
  const host = hostnameOf(url);

  if (host === null) return false;

  const domain = ruleDomain.toLowerCase().replace(/^www\./, "");
  
  return host === domain || host.endsWith(`.${domain}`);
}

/** True for pages that must never be gated (extension pages, browser UI). */
export function isInternalUrl(url: string): boolean {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://") ||
    url.startsWith("devtools://")
  );
}
