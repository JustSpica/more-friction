// Service worker entry point. Wires the navigation router (feature 4: block
// access outside allowed windows) and the periodic re-block sweep (re-block
// tabs whose window closes while open). Listeners are registered at top level
// so they survive service worker restarts.

import { installNavigationRouter } from "./navigation-router.js";
import { installScheduleReblock } from "./schedule-reblock.js";

installNavigationRouter();
installScheduleReblock();

chrome.runtime.onInstalled.addListener(() => {
  console.info("more-friction: installed");
});
