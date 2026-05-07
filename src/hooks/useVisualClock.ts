import { useCallback, useState } from "react";

export interface VisualClockState {
  startedAt: number | null;
  pausedAt: number | null;
  accumulatedElapsedMs: number;
  tempoStartedAtMs: number | null;
  tempoAccumulatedElapsedMs: number;
}

const stoppedClock: VisualClockState = {
  startedAt: null,
  pausedAt: null,
  accumulatedElapsedMs: 0,
  tempoStartedAtMs: null,
  tempoAccumulatedElapsedMs: 0,
};

export function useVisualClock() {
  const [clock, setClock] = useState<VisualClockState>(stoppedClock);

  const resetVisualClock = useCallback(() => {
    setClock({
      startedAt: Date.now(),
      pausedAt: null,
      accumulatedElapsedMs: 0,
      tempoStartedAtMs: performance.now(),
      tempoAccumulatedElapsedMs: 0,
    });
  }, []);

  const stopVisualClock = useCallback(() => {
    setClock(stoppedClock);
  }, []);

  const pauseVisualClock = useCallback(() => {
    const now = Date.now();
    const tempoNow = performance.now();

    setClock((current) => ({
      startedAt: null,
      pausedAt: now,
      accumulatedElapsedMs: current.startedAt
        ? current.accumulatedElapsedMs + Math.max(0, now - current.startedAt)
        : current.accumulatedElapsedMs,
      tempoStartedAtMs: null,
      tempoAccumulatedElapsedMs:
        current.tempoStartedAtMs === null
          ? current.tempoAccumulatedElapsedMs
          : current.tempoAccumulatedElapsedMs + Math.max(0, tempoNow - current.tempoStartedAtMs),
    }));
  }, []);

  const resumeVisualClock = useCallback(() => {
    setClock((current) => ({
      ...current,
      startedAt: Date.now(),
      pausedAt: null,
      tempoStartedAtMs: performance.now(),
    }));
  }, []);

  return {
    clock,
    resetVisualClock,
    stopVisualClock,
    pauseVisualClock,
    resumeVisualClock,
  };
}
