import { describe, expect, it } from "vitest";
import { evaluateSchedule } from "./schedule-gate.js";
import type { ScheduleConfig } from "../domain/site-rules.js";

// 2026-07-20 is a Monday (getDay() === 1).
const MONDAY_10AM = new Date(2026, 6, 20, 10, 0);
const MONDAY_NOON = new Date(2026, 6, 20, 12, 0);

const mornings: ScheduleConfig = {
  enabled: true,
  windows: [{ days: [1, 2, 3, 4, 5], start: "09:00", end: "11:00" }],
};

describe("evaluateSchedule", () => {
  it("allows access inside an allowed window", () => {
    expect(evaluateSchedule(mornings, MONDAY_10AM)).toEqual({
      blocked: false,
      opensAt: null,
    });
  });

  it("blocks outside the window and reports the next opening", () => {
    const decision = evaluateSchedule(mornings, MONDAY_NOON);
    expect(decision.blocked).toBe(true);
    expect(decision.opensAt).toBe(new Date(2026, 6, 21, 9, 0).getTime());
  });

  it("never blocks when the schedule is disabled", () => {
    const disabled: ScheduleConfig = { ...mornings, enabled: false };
    expect(evaluateSchedule(disabled, MONDAY_NOON).blocked).toBe(false);
  });
});
