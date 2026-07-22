import { describe, expect, it } from "vitest";
import {
  currentWindowEnd,
  isWithinAllowedWindow,
  nextOpening,
  parseTimeOfDay,
  type UsageWindow,
} from "./usage-window.js";

// 2026-07-20 is a Monday (getDay() === 1).
const MONDAY_9AM = new Date(2026, 6, 20, 9, 0);
const MONDAY_NOON = new Date(2026, 6, 20, 12, 0);
const MONDAY_6PM = new Date(2026, 6, 20, 18, 0);

const weekdayMornings: UsageWindow[] = [
  { days: [1, 2, 3, 4, 5], start: "09:00", end: "11:00" },
];

describe("parseTimeOfDay", () => {
  it("parses valid times", () => {
    expect(parseTimeOfDay("09:30")).toBe(570);
    expect(parseTimeOfDay("00:00")).toBe(0);
  });

  it("rejects malformed or out-of-range values", () => {
    expect(parseTimeOfDay("24:00")).toBeNull();
    expect(parseTimeOfDay("9:5")).toBeNull();
    expect(parseTimeOfDay("nope")).toBeNull();
  });
});

describe("isWithinAllowedWindow", () => {
  it("is true inside a window on an allowed day", () => {
    expect(isWithinAllowedWindow(MONDAY_9AM, weekdayMornings)).toBe(true);
  });

  it("is false at the exclusive end of the window", () => {
    const elevenAm = new Date(2026, 6, 20, 11, 0);
    expect(isWithinAllowedWindow(elevenAm, weekdayMornings)).toBe(false);
  });

  it("is false outside the window", () => {
    expect(isWithinAllowedWindow(MONDAY_NOON, weekdayMornings)).toBe(false);
  });

  it("is false on a day not listed", () => {
    const sunday = new Date(2026, 6, 19, 10, 0);
    expect(isWithinAllowedWindow(sunday, weekdayMornings)).toBe(false);
  });

  it("ignores inverted windows", () => {
    const inverted: UsageWindow[] = [{ days: [1], start: "11:00", end: "09:00" }];
    expect(isWithinAllowedWindow(MONDAY_9AM, inverted)).toBe(false);
  });
});

describe("nextOpening", () => {
  it("returns today's later window when one is still ahead", () => {
    const evening: UsageWindow[] = [{ days: [1], start: "20:00", end: "22:00" }];
    const opening = nextOpening(MONDAY_6PM, evening);
    expect(opening).toEqual(new Date(2026, 6, 20, 20, 0));
  });

  it("rolls over to the next allowed day when today has passed", () => {
    const opening = nextOpening(MONDAY_NOON, weekdayMornings);
    expect(opening).toEqual(new Date(2026, 6, 21, 9, 0));
  });

  it("returns null when there are no valid windows", () => {
    expect(nextOpening(MONDAY_NOON, [])).toBeNull();
  });
});

describe("currentWindowEnd", () => {
  it("returns the closing time while inside a window", () => {
    expect(currentWindowEnd(MONDAY_9AM, weekdayMornings)).toEqual(
      new Date(2026, 6, 20, 11, 0),
    );
  });

  it("returns null when outside every window", () => {
    expect(currentWindowEnd(MONDAY_NOON, weekdayMornings)).toBeNull();
  });
});
