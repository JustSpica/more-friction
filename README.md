# More-Friction

A highly customizable Chrome extension that adds *friction* to attention-draining sites, interrupting impulsive access.

## Features

- **YouTube Shorts removal.** The `youtube.com/shorts/*` route is redirected to the blocked page, and the Shorts shelves, feed items, sidebar entry, and search filter chip are hidden. Works across YouTube's single-page navigation, not only on full loads.
- **Usage-time windows.** Any configured domain is only reachable inside the time windows you declare. Outside them the tab is redirected to the blocked page showing when it reopens.
- **Re-block on expiry.** A one-minute alarm re-checks open tabs, so a window closing while a tab is open re-blocks it without a fresh navigation.
- **File-based configuration.** Rules are a JSON file bundled with the extension, authored directly in the internal shape; no options UI and no parsing layer.
- **No override, by design.** A block lifts only when its condition changes (the next window opens). There is no "continue anyway" button.
- **Bundler-free build.** `tsc` emits browser-ready ES modules. A small `copy-assets.mjs` places static files into `dist/`. Content scripts stay classic (import-free) and the service worker is an ES module.
- **Pure, tested core.** Time-window, domain-matching, and navigation-decision logic live in a chrome-free core covered by Vitest.

## Project layout

```text
.
├── manifest.json               # MV3 manifest (paths point into dist/)
├── package.json                # scripts and dev dependencies
├── tsconfig.json               # tsc: ES modules, strict, outDir dist/
├── vitest.config.ts            # test runner (jsdom for content scripts)
├── config/
│   └── friction-rules.json     # the rules you edit
├── rules/
│   └── youtube-shorts.json     # static declarativeNetRequest rule (Shorts route)
├── scripts/
│   └── copy-assets.mjs         # copies static files into dist/ after tsc
└── src/
    ├── domain/                 # pure logic — no chrome/DOM
    │   ├── usage-window.ts      #   time-window evaluation
    │   ├── domain-of-url.ts     #   URL/domain matching
    │   ├── site-rules.ts        #   SiteRule contract + rule lookup
    │   └── block-reason.ts      #   blocked-page reasons + query build/parse
    ├── application/            # pure use cases
    │   ├── schedule-gate.ts     #   allowed now? if not, when does it reopen?
    │   └── decide-navigation.ts #   allow vs redirect for a navigation
    ├── infrastructure/         # chrome/fetch adapters
    │   ├── packaged-rules.ts    #   loads config/friction-rules.json
    │   ├── navigation-router.ts #   intercepts navigations, applies the decision
    │   ├── schedule-reblock.ts  #   the expiry-sweep alarm
    │   └── blocked-url.ts       #   builds the blocked-page URL
    ├── ui/
    │   ├── content/            # youtube-shorts-hider.ts / .css
    │   ├── pages/blocked/      # blocked.html / .css / .ts
    │   └── assets/             # images used by pages
    └── main/
        └── service-worker.ts   # composition root (installs the adapters)
```

`npm run build` compiles `src/` into `dist/` (git-ignored) and copies the static files next to it, so the `dist/` tree mirrors `src/` plus `manifest.json`, `config/`, and `rules/`. Imports only point inward — `ui`/`main` → `infrastructure` → `application` → `domain` — and `domain/` depends on nothing outside itself.

## Requirements

- Chrome or Chromium with Manifest V3 support.
- Node.js 18+ to build the extension.

## Quick start

```bash
git clone <your-repo-url> more-friction
cd more-friction

npm install
npm run build      # tsc + copy static assets into dist/
```

Then load it unpacked:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.

Edit `config/friction-rules.json` to define your rules, run `npm run build` again, and press **Reload** on the extension card.

## Configuration

### Rules file (`config/friction-rules.json`)

The file is a JSON array of rules, each attaching friction mechanisms to a registrable domain. It is read on service-worker start, so **reload the extension after editing it**.

```json
[
  {
    "domain": "reddit.com",
    "schedule": {
      "enabled": true,
      "windows": [
        { "days": [1, 2, 3, 4, 5], "start": "12:00", "end": "13:00" },
        { "days": [0, 6], "start": "10:00", "end": "12:00" }
      ]
    }
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `domain` | string | Registrable domain, e.g. `youtube.com`. Matches subdomains (`www.`, `m.`, `music.`) too. |
| `schedule.enabled` | boolean | When `false`, the schedule is ignored. |
| `schedule.windows` | array | Time ranges during which the domain is allowed. Outside every window it is blocked. |

### Usage windows

Each window is `{ "days": [...], "start": "HH:MM", "end": "HH:MM" }`.

- **`days`** — day numbers, `0 = Sunday` … `6 = Saturday`.
- **`start` / `end`** — 24-hour `HH:MM`. `start` is inclusive, `end` is exclusive.
- Windows **do not cross midnight** (`start` must be earlier than `end`). Model an overnight range as two windows on the relevant days.

## Development

```bash
npm install          # install dev dependencies
npm run build        # tsc + copy static assets into dist/
npm run watch        # recompile TypeScript on change (static files need a full build)
npm test             # run the Vitest suite once
npm run typecheck    # tsc --noEmit
```

After building, reload the extension in `chrome://extensions`. `dist/` is git-ignored — the source of truth is `src/` plus `config/`, `rules/`, and `manifest.json`.

## Design notes

- **Layered by responsibility.** The pure decision logic (`domain/`, `application/`) is unit-tested and free of `chrome`/DOM. All I/O lives in `infrastructure/`, `ui/`, and `main/`.
- **Configuration is a file, not a UI.** Rules are authored directly in `config/friction-rules.json` and consumed as-is. Editing means editing the file and reloading.
- **No bundler.** Because content scripts run as classic scripts, they stay self-contained (no `import`/`export`). The service worker is declared as an ES module. `tsc` preserves the `src/` layout under `dist/`.
- **Blocked page path.** The blocked page is referenced from three places that must stay in sync when moved: the DNR rule's `extensionPath`, `web_accessible_resources` in the manifest, and `infrastructure/blocked-url.ts`.