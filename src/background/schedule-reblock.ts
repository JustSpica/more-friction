// Feature 4, second half: re-block tabs whose allowed window closes while they
// are still open. A one-minute alarm sweeps open tabs and reuses the navigation
// decision, so an expiring window redirects the page without a fresh navigation.

import { reevaluateTab } from "./navigation-router.js";

const SWEEP_ALARM = "more-friction:schedule-sweep";

async function sweepOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: ["*://*/*"] });
  
  await Promise.all(tabs.map((tab) => reevaluateTab(tab)));
}

export function installScheduleReblock(): void {
  chrome.alarms.create(SWEEP_ALARM, { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SWEEP_ALARM) void sweepOpenTabs();
  });
}
