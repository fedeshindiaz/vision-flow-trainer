import { describe, expect, it } from "vitest";
import {
  getBeatIndex,
  getNextBeatAtMs,
  getBeatIntervalMs,
  getBeatIntervalSeconds,
  getBeatSyncedLinearFactor,
  getNextBeatElapsedMs,
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

  it("derives movement steps from the same beat grid", () => {
    expect(getBeatIndex(0, 1)).toBe(0);
    expect(getBeatIndex(0.999, 1)).toBe(0);
    expect(getBeatIndex(1, 1)).toBe(1);
    expect(getBeatIndex(0.5, 2)).toBe(1);
    expect(getNextBeatElapsedMs(0, 1)).toBeCloseTo(1000, 6);
    expect(getNextBeatElapsedMs(1200, 1)).toBeCloseTo(2000, 6);
    expect(getNextBeatElapsedMs(250, 2)).toBeCloseTo(500, 6);
  });

  it("anchors scheduled audio beats to the visual movement clock", () => {
    expect(getNextBeatAtMs(1000, 0, 1000, 1)).toBeCloseTo(2000, 6);
    expect(getNextBeatAtMs(1000, 0, 1499, 1)).toBeCloseTo(2000, 6);
    expect(getNextBeatAtMs(1000, 0, 1500, 2)).toBeCloseTo(2000, 6);
    expect(getNextBeatAtMs(3000, 1250, 3250, 1)).toBeCloseTo(3750, 6);
    expect(getNextBeatAtMs(null, 0, 5000, 2)).toBeCloseTo(5500, 6);
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
