// Feature 1: removes YouTube Shorts. Runs as a classic content script at
// document_start, so it must stay self-contained (no imports).
//
// YouTube is a single-page app: most navigation happens via the History API,
// never as a network request. So the route block lives here (reacting to SPA
// navigation) rather than relying only on the declarativeNetRequest rule, which
// only fires on full page loads.
//
// Three responsibilities:
//   1. Redirect any /shorts route to the blocked page.
//   2. Hide Shorts shelves, feed items and sidebar entries (link-based).
//   3. Hide the "Shorts" search/home filter chip (text-based; it has no link).

// --- 1. Route block -------------------------------------------------------

function isShortsRoute(): boolean {
  return location.pathname === "/shorts" || location.pathname.startsWith("/shorts/");
}

let redirecting = false;
function enforceRoute(): void {
  if (redirecting || !isShortsRoute()) return;
  redirecting = true;
  location.replace(chrome.runtime.getURL("blocked/blocked.html?reason=shorts"));
}

// --- 2. Link-based hiding (shelves, feed items, sidebar) ------------------

const HIDEABLE_CONTAINERS = [
  "YTD-VIDEO-RENDERER",
  "YTD-GRID-VIDEO-RENDERER",
  "YTD-RICH-ITEM-RENDERER",
  "YTD-COMPACT-VIDEO-RENDERER",
  "YTD-REEL-SHELF-RENDERER",
  "YTD-RICH-SECTION-RENDERER",
  "YTD-GUIDE-ENTRY-RENDERER",
  "YTD-MINI-GUIDE-ENTRY-RENDERER",
];

function closestHideable(element: Element): Element | null {
  let current: Element | null = element;
  while (current) {
    if (HIDEABLE_CONTAINERS.includes(current.tagName)) return current;
    current = current.parentElement;
  }
  return null;
}

function markHidden(element: Element): void {
  if (!element.hasAttribute("data-mf-hidden")) {
    element.setAttribute("data-mf-hidden", "shorts");
  }
}

function hideShortsLinks(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="/shorts"]');
  for (const link of links) {
    const container = closestHideable(link);
    if (container) markHidden(container);
  }
}

// --- 3. Text-based hiding ------------------------------------------------
// Some Shorts surfaces have no /shorts link: search filter chips are pure
// filters, and the sidebar entry uses a yt-simple-endpoint (click handler, no
// href) identified only by its "Shorts" title. Match those by text. "Shorts"
// stays untranslated across locales, so an exact match is safe and precise.

function hideShortsChips(): void {
  const chips = document.querySelectorAll("yt-chip-cloud-chip-renderer");
  for (const chip of chips) {
    if (chip.hasAttribute("data-mf-hidden")) continue;
    if (chip.textContent?.trim().toLowerCase() === "shorts") markHidden(chip);
  }
}

function guideEntryLabel(entry: Element): string {
  const anchorTitle = entry.querySelector("a#endpoint")?.getAttribute("title");
  if (anchorTitle) return anchorTitle.trim().toLowerCase();
  return entry.querySelector(".title")?.textContent?.trim().toLowerCase() ?? "";
}

function hideShortsGuideEntries(): void {
  const entries = document.querySelectorAll(
    "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer",
  );
  for (const entry of entries) {
    if (entry.hasAttribute("data-mf-hidden")) continue;
    if (guideEntryLabel(entry) === "shorts") markHidden(entry);
  }
}

// --- Sweep orchestration --------------------------------------------------

function sweep(): void {
  enforceRoute();
  if (redirecting) return;
  hideShortsLinks();
  hideShortsChips();
  hideShortsGuideEntries();
}

let scheduled = false;
function scheduleSweep(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    sweep();
  });
}

function start(): void {
  sweep();
  // Catch SPA navigations promptly, plus any lazily rendered surfaces.
  document.addEventListener("yt-navigate-finish", scheduleSweep);
  window.addEventListener("popstate", scheduleSweep);
  new MutationObserver(scheduleSweep).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// Route block must run as early as possible; other hiding can wait for the DOM.
enforceRoute();
if (!redirecting) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
