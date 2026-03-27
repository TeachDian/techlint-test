import { describe, expect, it } from "vitest";
import { getExpiryState, toDateTimeLocalValue, toIsoFromDateTimeLocalValue } from "@client/lib/date";

describe("date helpers", () => {
  it("marks overdue tasks correctly", () => {
    const state = getExpiryState("2026-03-27T09:00:00.000Z", new Date("2026-03-27T12:00:00.000Z"));

    expect(state.tone).toBe("overdue");
    expect(state.isOverdue).toBe(true);
  });

  it("marks due-soon tasks inside the warning window", () => {
    const state = getExpiryState("2026-03-28T08:00:00.000Z", new Date("2026-03-27T12:00:00.000Z"));

    expect(state.tone).toBe("warning");
    expect(state.isNearExpiry).toBe(true);
  });

  it("round-trips datetime-local values", () => {
    const source = "2026-04-01T08:45:00.000Z";
    const localValue = toDateTimeLocalValue(source);
    const isoValue = toIsoFromDateTimeLocalValue(localValue);

    expect(isoValue).not.toBeNull();
    expect(typeof isoValue).toBe("string");
  });
});
