import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useExerciseSession } from "../hooks/useExerciseSession";

describe("useExerciseSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts from the zeroed manual exercise template", () => {
    const { result } = renderHook(() => useExerciseSession());

    expect(result.current.selectedProtocol.id).toBe("guided-custom");
    expect(result.current.background.enabled).toBe(false);
    expect(result.current.objective.enabled).toBe(false);
    expect(result.current.frequencyHz).toBe(0.1);
    expect(result.current.amplitude).toBe(0);
    expect(result.current.targetSize).toBe(0);
    expect(result.current.density).toBe(0);
    expect(result.current.stripeSize).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(result.current.sets).toBe(0);
    expect(result.current.rest).toBe(0);
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.currentSet).toBe(0);
    expect(result.current.metronomeEnabled).toBe(false);
  });

  it("does not restore manual changes after remount", () => {
    const first = renderHook(() => useExerciseSession());

    act(() => {
      first.result.current.actions.setDuration(90);
      first.result.current.actions.setSets(4);
      first.result.current.actions.setFrequencyHz(1.6);
    });

    expect(first.result.current.duration).toBe(90);
    first.unmount();

    const second = renderHook(() => useExerciseSession());

    expect(second.result.current.duration).toBe(0);
    expect(second.result.current.sets).toBe(0);
    expect(second.result.current.frequencyHz).toBe(0.1);
    expect(second.result.current.sessionState).toBe("idle");
    expect(second.result.current.running).toBe(false);
    expect(second.result.current.timeLeft).toBe(0);
  });

  it("resets the timer when duration changes while idle", () => {
    const { result } = renderHook(() => useExerciseSession());

    act(() => {
      result.current.actions.setDuration(30);
    });

    expect(result.current.duration).toBe(30);
    expect(result.current.timeLeft).toBe(30);
  });
});
