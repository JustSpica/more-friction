// Feature 4 decision: is the domain allowed right now, and if not, when does it
// reopen? Pure (composes usage-window); the router performs the redirect.

import type { ScheduleConfig } from "../domain/site-rules.js";
import { isWithinAllowedWindow, nextOpening } from "../domain/usage-window.js";

export interface ScheduleDecision {
  blocked: boolean;
  opensAt: number | null; // Epoch ms of the next opening when blocked, null when unknown.
}

export function evaluateSchedule(schedule: ScheduleConfig, now: Date): ScheduleDecision {
  if (!schedule.enabled) return { blocked: false, opensAt: null };

  if (isWithinAllowedWindow(now, schedule.windows)) {
    return { blocked: false, opensAt: null };
  }

  const opening = nextOpening(now, schedule.windows);
  
  return { blocked: true, opensAt: opening ? opening.getTime() : null };
}
