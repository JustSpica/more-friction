import { describe, expect, it } from "vitest";
import { buildBlockedQuery, parseBlockedParams } from "./block-reason.js";

describe("blocked page params", () => {
  it("round-trips a schedule block with its opening time", () => {
    const query = buildBlockedQuery({ reason: "schedule", opensAt: 1_700_000_000_000 });
    expect(parseBlockedParams(query)).toEqual({
      reason: "schedule",
      opensAt: 1_700_000_000_000,
    });
  });

  it("omits opensAt when absent", () => {
    const query = buildBlockedQuery({ reason: "shorts" });
    expect(parseBlockedParams(query)).toEqual({ reason: "shorts" });
  });

  it("falls back to a known reason for unknown input", () => {
    expect(parseBlockedParams("reason=bogus").reason).toBe("schedule");
  });
});
