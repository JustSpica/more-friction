// Service worker entry point and composition root. Installs the navigation
// router and the re-block sweep at top level so the listeners survive restarts.

import { installNavigationRouter } from "../infrastructure/navigation-router.js";
import { installScheduleReblock } from "../infrastructure/schedule-reblock.js";

installNavigationRouter();
installScheduleReblock();

chrome.runtime.onInstalled.addListener(() => {
  console.info("more-friction: installed");
});
