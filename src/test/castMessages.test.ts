import { describe, expect, it } from "vitest";
import {
  CAST_NAMESPACE,
  computeVisualElapsedMs,
  createCastMessage,
  normalizeCastMessage,
  sanitizeSharedExercisePatch,
} from "../cast/castMessages";

describe("castMessages", () => {
  it("uses the ONUr custom namespace", () => {
    expect(CAST_NAMESPACE).toBe("urn:x-cast:com.onur.visionflow");
  });

  it("normalizes valid messages and rejects invalid ones", () => {
    const message = createCastMessage("PING", { timestamp: 123 });

    expect(normalizeCastMessage(JSON.stringify(message))?.type).toBe("PING");
    expect(normalizeCastMessage({ type: "NOPE" })).toBeNull();
  });

  it("sanitizes shared state patches defensively", () => {
    expect(
      sanitizeSharedExercisePatch({
        frequencyHz: 1.5,
        sessionState: "playing",
        startedAt: null,
        ignored: "x",
      }),
    ).toEqual({ frequencyHz: 1.5, sessionState: "playing", startedAt: null });
  });

  it("computes receiver visual elapsed from sender timestamps", () => {
    const elapsed = computeVisualElapsedMs({
      running: true,
      sessionState: "playing",
      startedAt: Date.now() - 500,
      accumulatedElapsedMs: 1000,
    });

    expect(elapsed).toBeGreaterThanOrEqual(1400);
  });
});
