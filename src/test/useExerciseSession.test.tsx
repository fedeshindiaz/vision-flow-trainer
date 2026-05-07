import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useExerciseSession } from "../hooks/useExerciseSession";

describe("useExerciseSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists configuration but starts with an idle session after remount", () => {
    const first = renderHook(() => useExerciseSession());

    act(() => {
      first.result.current.actions.setDuration(90);
      first.result.current.actions.setSets(4);
      first.result.current.actions.setFrequencyHz(1.6);
      first.result.current.actions.handlePlayPause();
    });

    expect(first.result.current.sessionState).toBe("playing");
    first.unmount();

    const second = renderHook(() => useExerciseSession());

    expect(second.result.current.duration).toBe(90);
    expect(second.result.current.sets).toBe(4);
    expect(second.result.current.frequencyHz).toBe(1.6);
    expect(second.result.current.sessionState).toBe("idle");
    expect(second.result.current.running).toBe(false);
    expect(second.result.current.timeLeft).toBe(90);
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
