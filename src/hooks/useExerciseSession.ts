import { useCallback, useEffect, useMemo, useState } from "react";
import type { SharedExerciseState } from "../cast/castMessages";
import { protocols } from "../config/protocols";
import type { BackgroundConfig, ObjectiveConfig, Protocol, SessionState } from "../types";
import { clamp } from "../utils";

const initialProtocol = protocols.find((protocol) => protocol.id === "okn-1") ?? protocols[0];
const standardDefaults = {
  amplitude: 42,
  targetSize: 38,
  density: 96,
  stripeSize: 48,
  duration: 45,
  sets: 3,
  rest: 30,
};

function getInitialSet(setCount: number) {
  return setCount > 0 ? 1 : 0;
}

export function useExerciseSession() {
  const [selectedProtocolId, setSelectedProtocolId] = useState(initialProtocol.id);
  const [background, setBackground] = useState<BackgroundConfig>(initialProtocol.background);
  const [objective, setObjective] = useState<ObjectiveConfig>(initialProtocol.objective);
  const [frequencyHz, setFrequencyHz] = useState(initialProtocol.frequencyHz);
  const [amplitude, setAmplitude] = useState(standardDefaults.amplitude);
  const [targetSize, setTargetSize] = useState(standardDefaults.targetSize);
  const [density, setDensity] = useState(standardDefaults.density);
  const [stripeSize, setStripeSize] = useState(standardDefaults.stripeSize);
  const [duration, setDuration] = useState(standardDefaults.duration);
  const [sets, setSets] = useState(standardDefaults.sets);
  const [rest, setRest] = useState(standardDefaults.rest);
  const [running, setRunning] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [timeLeft, setTimeLeft] = useState(standardDefaults.duration);
  const [currentSet, setCurrentSet] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(initialProtocol.metronome);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [accumulatedElapsedMs, setAccumulatedElapsedMs] = useState(0);
  const [tempoStartedAtMs, setTempoStartedAtMs] = useState<number | null>(null);
  const [tempoAccumulatedElapsedMs, setTempoAccumulatedElapsedMs] = useState(0);

  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedProtocolId) ?? protocols[0];
  const visualRunning = running && sessionState === "playing";
  const metronomeActive = visualRunning && metronomeEnabled;
  const sessionLocked = sessionState === "playing" || sessionState === "resting";

  const resetVisualClock = useCallback(() => {
    setStartedAt(Date.now());
    setPausedAt(null);
    setAccumulatedElapsedMs(0);
    setTempoStartedAtMs(performance.now());
    setTempoAccumulatedElapsedMs(0);
  }, []);

  const stopVisualClock = useCallback(() => {
    setStartedAt(null);
    setPausedAt(null);
    setAccumulatedElapsedMs(0);
    setTempoStartedAtMs(null);
    setTempoAccumulatedElapsedMs(0);
  }, []);

  const pauseVisualClock = useCallback(() => {
    const now = Date.now();
    const tempoNow = performance.now();

    setAccumulatedElapsedMs((value) => (startedAt ? value + Math.max(0, now - startedAt) : value));
    setTempoAccumulatedElapsedMs((value) =>
      tempoStartedAtMs === null ? value : value + Math.max(0, tempoNow - tempoStartedAtMs),
    );
    setStartedAt(null);
    setTempoStartedAtMs(null);
    setPausedAt(now);
  }, [startedAt, tempoStartedAtMs]);

  const resumeVisualClock = useCallback(() => {
    setStartedAt(Date.now());
    setTempoStartedAtMs(performance.now());
    setPausedAt(null);
  }, []);

  const resetSession = () => {
    setRunning(false);
    setSessionState("idle");
    setCurrentSet(getInitialSet(sets));
    setTimeLeft(duration);
    setResetKey((value) => value + 1);
    stopVisualClock();
  };

  const applyProtocol = (protocol: Protocol) => {
    const shouldRestoreDefaults = Boolean(selectedProtocol.defaults) && !protocol.defaults;
    const nextAmplitude = protocol.defaults?.amplitude ?? (shouldRestoreDefaults ? standardDefaults.amplitude : amplitude);
    const nextTargetSize = protocol.defaults?.targetSize ?? (shouldRestoreDefaults ? standardDefaults.targetSize : targetSize);
    const nextDensity = protocol.defaults?.density ?? (shouldRestoreDefaults ? standardDefaults.density : density);
    const nextStripeSize = protocol.defaults?.stripeSize ?? (shouldRestoreDefaults ? standardDefaults.stripeSize : stripeSize);
    const nextDuration = protocol.defaults?.duration ?? (shouldRestoreDefaults ? standardDefaults.duration : duration);
    const nextSets = protocol.defaults?.sets ?? (shouldRestoreDefaults ? standardDefaults.sets : sets);
    const nextRest = protocol.defaults?.rest ?? (shouldRestoreDefaults ? standardDefaults.rest : rest);

    setSelectedProtocolId(protocol.id);
    setBackground(protocol.background);
    setObjective(protocol.objective);
    setFrequencyHz(protocol.frequencyHz);
    setAmplitude(nextAmplitude);
    setTargetSize(nextTargetSize);
    setDensity(nextDensity);
    setStripeSize(nextStripeSize);
    setDuration(nextDuration);
    setSets(nextSets);
    setRest(nextRest);
    setMetronomeEnabled(protocol.metronome);
    setRunning(false);
    setSessionState("idle");
    setCurrentSet(getInitialSet(nextSets));
    setTimeLeft(nextDuration);
    setResetKey((value) => value + 1);
    stopVisualClock();
  };

  const handlePlayPause = () => {
    if (sessionState === "idle" || sessionState === "done") {
      if (duration <= 0 || sets <= 0) {
        setRunning(false);
        setSessionState("idle");
        setCurrentSet(getInitialSet(sets));
        setTimeLeft(duration);
        stopVisualClock();
        return;
      }

      setCurrentSet(getInitialSet(sets));
      setTimeLeft(duration);
      setSessionState("playing");
      setRunning(true);
      setResetKey((value) => value + 1);
      resetVisualClock();
      return;
    }

    if (running) {
      if (sessionState === "playing") {
        pauseVisualClock();
      } else {
        setPausedAt(Date.now());
      }

      setRunning(false);
      return;
    }

    if (sessionState === "playing") {
      resumeVisualClock();
    } else {
      setPausedAt(null);
    }

    setRunning(true);
  };

  const handleSkip = () => {
    if (sessionState === "resting") {
      setCurrentSet((value) => clamp(value + 1, 1, sets));
      setTimeLeft(duration);
      setSessionState("playing");
      setRunning(true);
      setResetKey((value) => value + 1);
      resetVisualClock();
      return;
    }

    if (sessionState === "playing" && currentSet < sets) {
      setCurrentSet((value) => clamp(value + 1, 1, sets));
      setTimeLeft(duration);
      setResetKey((value) => value + 1);
      resetVisualClock();
      return;
    }

    if (sessionState === "playing") {
      setRunning(false);
      setSessionState("done");
      setTimeLeft(0);
      stopVisualClock();
    }
  };

  const handleFrequencyChange = (value: number) => {
    setFrequencyHz(value);

    if (visualRunning) {
      setResetKey((current) => current + 1);
      resetVisualClock();
    }
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);

    if (sessionState === "idle") {
      setTimeLeft(value);
    }
  };

  useEffect(() => {
    if (sessionState === "idle") setTimeLeft(duration);
  }, [duration, sessionState]);

  useEffect(() => {
    setCurrentSet((value) => (sets > 0 ? clamp(Math.max(1, value), 1, sets) : 0));
  }, [sets]);

  useEffect(() => {
    if (!running) return undefined;

    const id = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || timeLeft > 0) return;

    if (sessionState === "playing" && currentSet < sets) {
      setSessionState("resting");
      setTimeLeft(rest);
      stopVisualClock();
      return;
    }

    if (sessionState === "playing") {
      setRunning(false);
      setSessionState("done");
      setTimeLeft(0);
      stopVisualClock();
      return;
    }

    if (sessionState === "resting" && currentSet < sets) {
      setCurrentSet((value) => clamp(value + 1, 1, sets));
      setSessionState("playing");
      setTimeLeft(duration);
      setResetKey((value) => value + 1);
      resetVisualClock();
      return;
    }

    setRunning(false);
    setSessionState("done");
    setTimeLeft(0);
    stopVisualClock();
  }, [currentSet, duration, resetVisualClock, rest, running, sessionState, sets, stopVisualClock, timeLeft]);

  const playLabel =
    sessionState === "resting"
      ? running
        ? "Pausar descanso"
        : "Continuar"
      : running
        ? "Pausar"
        : sessionState === "done"
          ? "Repetir"
          : "Iniciar";
  const skipLabel = sessionState === "resting" ? "Saltar descanso" : sessionState === "playing" ? "Saltar serie" : "Saltar";
  const skipDisabled = sessionState === "idle" || sessionState === "done";

  const sharedState = useMemo<SharedExerciseState>(
    () => ({
      selectedProtocolId,
      selectedProtocolName: selectedProtocol.name,
      selectedProtocolCategory: selectedProtocol.category,
      background,
      objective,
      frequencyHz,
      amplitude,
      targetSize,
      density,
      stripeSize,
      duration,
      sets,
      rest,
      running,
      sessionState,
      timeLeft,
      currentSet,
      resetKey,
      metronomeEnabled,
      updatedAt: Date.now(),
      startedAt,
      pausedAt,
      accumulatedElapsedMs,
    }),
    [
      selectedProtocolId,
      selectedProtocol.name,
      selectedProtocol.category,
      background,
      objective,
      frequencyHz,
      amplitude,
      targetSize,
      density,
      stripeSize,
      duration,
      sets,
      rest,
      running,
      sessionState,
      timeLeft,
      currentSet,
      resetKey,
      metronomeEnabled,
      startedAt,
      pausedAt,
      accumulatedElapsedMs,
    ],
  );

  return {
    selectedProtocolId,
    selectedProtocol,
    background,
    objective,
    frequencyHz,
    amplitude,
    targetSize,
    density,
    stripeSize,
    duration,
    sets,
    rest,
    running,
    sessionState,
    timeLeft,
    currentSet,
    resetKey,
    metronomeEnabled,
    tempoStartedAtMs,
    tempoAccumulatedElapsedMs,
    visualRunning,
    metronomeActive,
    sessionLocked,
    playLabel,
    skipLabel,
    skipDisabled,
    sharedState,
    actions: {
      setBackground,
      setObjective,
      setFrequencyHz: handleFrequencyChange,
      setAmplitude,
      setTargetSize,
      setDensity,
      setStripeSize,
      setDuration: handleDurationChange,
      setSets,
      setRest,
      setMetronomeEnabled,
      resetSession,
      applyProtocol,
      handlePlayPause,
      handleSkip,
    },
  };
}
