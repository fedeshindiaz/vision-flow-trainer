import { describe, expect, it } from "vitest";
import { getStripeWidth } from "../components/canvas/drawBackgroundPattern";
import { getBackgroundElapsed } from "../components/canvas/getBackgroundElapsed";

describe("background stripe sizing", () => {
  it("uses stripe size independently from stripe spacing", () => {
    expect(getStripeWidth(96, 48)).toBe(48);
    expect(getStripeWidth(160, 80)).toBe(80);
  });

  it("keeps stripe width inside the repeat period", () => {
    expect(getStripeWidth(48, 120)).toBeCloseTo(44.16, 2);
    expect(getStripeWidth(96, 1)).toBe(4);
  });
});

describe("background and objective independence", () => {
  it("keeps checkerboard time independent from saccade target jumps", () => {
    expect(
      getBackgroundElapsed(
        { enabled: true, type: "checkerboard", direction: "right" },
        { enabled: true, mode: "saccade", direction: "right" },
        12.5,
      ),
    ).toBe(12.5);
  });

  it("keeps animated backgrounds continuous across objective modes", () => {
    expect(
      getBackgroundElapsed(
        { enabled: true, type: "stripes", direction: "right" },
        { enabled: true, mode: "saccade", direction: "right" },
        12.5,
      ),
    ).toBe(12.5);
  });
});
