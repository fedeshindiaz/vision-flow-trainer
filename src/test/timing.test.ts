import { describe, expect, it } from "vitest";
import {
  getBeatIntervalMs,
  getBeatIntervalSeconds,
  getBeatSyncedLinearFactor,
  getScheduledBeatTimes,
} from "../utils/timing";

describe("frequency timing", () => {
  it("maps Hz to deterministic beat intervals", () => {
    expect(getBeatIntervalSeconds(1)).toBeCloseTo(1, 6);
    expect(getBeatIntervalSeconds(2)).toBeCloseTo(0.5, 6);
    expect(getBeatIntervalSeconds(0.5)).toBeCloseTo(2, 6);
    expect(getBeatIntervalMs(2.5)).toBeCloseTo(400, 6);
  });

  it("schedules beats at 1 / Hz intervals", () => {
    expect(getScheduledBeatTimes(10, 2, 5)).toEqual([10, 10.5, 11, 11.5, 12]);
    expect(getScheduledBeatTimes(4, 1, 4)).toEqual([4, 5, 6, 7]);
  });

  it("syncs linear movement endpoints to metronome beats", () => {
    expect(getBeatSyncedLinearFactor(0, 1)).toBeCloseTo(-1, 6);
    expect(getBeatSyncedLinearFactor(0.5, 1)).toBeCloseTo(0, 6);
    expect(getBeatSyncedLinearFactor(1, 1)).toBeCloseTo(1, 6);
    expect(getBeatSyncedLinearFactor(2, 1)).toBeCloseTo(-1, 6);

    expect(getBeatSyncedLinearFactor(0.5, 2)).toBeCloseTo(1, 6);
    expect(getBeatSyncedLinearFactor(1, 2)).toBeCloseTo(-1, 6);
  });
});
