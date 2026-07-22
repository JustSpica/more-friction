// Usage time windows: whether "now" is inside an allowed window and when the
// next one opens/closes. Windows never cross midnight (start < end);
// model overnight ranges as two windows.

/** Day of week as returned by `Date.prototype.getDay()` (0 = Sunday). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface UsageWindow {
  days: Weekday[]; // Days on which this window applies.
  start: string; // Inclusive start, "HH:MM" 24h.
  end: string; // Exclusive end, "HH:MM" 24h.
}

const MINUTES_PER_DAY = 24 * 60;

/** Parses "HH:MM" into minutes since midnight, or null when malformed. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^([0-9]{1,2}):([0-9]{2})$/.exec(value);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWithinAllowedWindow(now: Date, windows: UsageWindow[]): boolean {
  const weekday = now.getDay() as Weekday;
  const minuteNow = minutesOfDay(now);

  return windows.some((window) => {
    if (!window.days.includes(weekday)) return false;

    const start = parseTimeOfDay(window.start);
    const end = parseTimeOfDay(window.end);

    if (start === null || end === null || start >= end) return false;

    return minuteNow >= start && minuteNow < end;
  });
}

/**
 * Returns the next moment a window opens at or after `now`, scanning up to a
 * week ahead. Returns null when there are no valid windows.
 */
export function nextOpening(now: Date, windows: UsageWindow[]): Date | null {
  const minuteNow = minutesOfDay(now);
  const weekdayNow = now.getDay();
  let best: Date | null = null;

  for (let offset = 0; offset <= 7; offset += 1) {
    const weekday = ((weekdayNow + offset) % 7) as Weekday;

    for (const window of windows) {
      if (!window.days.includes(weekday)) continue;

      const start = parseTimeOfDay(window.start);
      const end = parseTimeOfDay(window.end);

      if (start === null || end === null || start >= end) continue;

      // Skip windows that start today but have already begun/passed.
      if (offset === 0 && start <= minuteNow) continue;

      const candidate = new Date(now);
      candidate.setHours(0, 0, 0, 0);
      candidate.setDate(candidate.getDate() + offset);
      candidate.setMinutes(start);

      if (best === null || candidate < best) best = candidate;
    }
  }
  
  return best;
}

/**
 * Returns when the currently-open window closes, or null when `now` is not
 * inside any window. Used to schedule re-blocking of open tabs.
 */
export function currentWindowEnd(now: Date, windows: UsageWindow[]): Date | null {
  const weekday = now.getDay() as Weekday;
  const minuteNow = minutesOfDay(now);
  let earliestEnd: number | null = null;

  for (const window of windows) {
    if (!window.days.includes(weekday)) continue;

    const start = parseTimeOfDay(window.start);
    const end = parseTimeOfDay(window.end);

    if (start === null || end === null || start >= end) continue;
    if (minuteNow < start || minuteNow >= end) continue;
    if (earliestEnd === null || end < earliestEnd) earliestEnd = end;
  }

  if (earliestEnd === null) return null;
  
  const close = new Date(now);
  close.setHours(0, 0, 0, 0);
  close.setMinutes(Math.min(earliestEnd, MINUTES_PER_DAY));

  return close;
}
