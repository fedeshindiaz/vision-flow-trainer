import { describe, expect, it } from "vitest";
import { clamp, formatTime, vectorFor } from "../utils";

describe("utils", () => {
  it("clamps values into range", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("formats seconds as mm:ss", () => {
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(0)).toBe("00:00");
  });

  it("maps diagonal direction vectors", () => {
    expect(vectorFor("top-right")).toEqual({ x: 1, y: -1 });
    expect(vectorFor("bottom-left")).toEqual({ x: -1, y: 1 });
  });
});
