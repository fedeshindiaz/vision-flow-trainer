import { describe, expect, it } from "vitest";
import { getStripeWidth } from "../components/canvas/drawBackgroundPattern";

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
