import { useCallback, useEffect, useMemo, useState } from "react";
import type { SharedExerciseState } from "../cast/castMessages";
import { protocols } from "../config/protocols";
import type { BackgroundConfig, ObjectiveConfig, Protocol, SessionState } from "../types";
import { clamp } from "../utils";

const initialProtocol = protocols.find((protocol) => protocol.id === "okn-1") ?? protocols[0];

export function useExerciseSession() {
  const [selectedProtocolId, setSelectedProtocolId] = useState(initialProtocol.id);
  const [background, setBackground] = useState<BackgroundConfig>(initialProtocol.background);
  const [objective, setObjective] = useState<ObjectiveConfig>(initialProtocol.objective);
  const [frequencyHz, setFrequencyHz] = useState(initialProtocol.frequencyHz);
  const [amplitude, setAmplitude] = useState(42);
  const [targetSize, setTargetSize] = useState(38);
  const [density, setDensity] = useState(96);
  const [stripeSize, setStripeSize] = useState(48);
  const [duration, setDuration] = useState(45);
  const [sets, setSets] = useState(3);
  const [rest, setRest] = useState(30);
  const [running, setRunning] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentSet, setCurrentSet] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(initialProtocol.metronome);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [accumulatedElapsedMs, setAccumulatedElapsedMs] = useState(0);

  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedProtocolId) ?? protocols[0];
  const visualRunning = running && sessionState === "playing";
  const metronomeActive = visualRunning && metronomeEnabled;
  const sessionLocked = sessionState === "playing" || sessionState === "resting";

  const resetVisualClock = useCallback(() => {
    setStartedAt(Date.now());
    setPausedAt(null);
    setAccumulatedElapsedMs(0);
  }, []);

  const stopVisualClock = useCallback(() => {
    setStartedAt(null);
    setPausedAt(null);
    setAccumulatedElapsedMs(0);
  }, []);

  const pauseVisualClock = useCallback(() => {
    const now = Date.now();

    setAccumulatedElapsedMs((value) => (startedAt ? value + Math.max(0, now - startedAt) : value));
    setStartedAt(null);
    setPausedAt(now);
  }, [startedAt]);

  const resumeVisualClock = useCallback(() => {
    setStartedAt(Date.now());
    setPausedAt(null);
  }, []);

  const resetSession = () => {
    setRunning(false);
    setSessionState("idle");
    setCurrentSet(1);
    setTimeLeft(duration);
    setResetKey((value) => value + 1);
    stopVisualClock();
  };

  const applyProtocol = (protocol: Protocol) => {
    setSelectedProtocolId(protocol.id);
    setBackground(protocol.background);
    setObjective(protocol.objective);
    setFrequencyHz(protocol.frequencyHz);
    setMetronomeEnabled(protocol.metronome);
    setRunning(false);
    setSessionState("idle");
    setCurrentSet(1);
    setTimeLeft(duration);
    setResetKey((value) => value + 1);
    stopVisualClock();
  };

  const handlePlayPause = () => {
    if (sessionState === "idle" || sessionState === "done") {
      setCurrentSet(1);
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
    setCurrentSet((value) => clamp(value, 1, sets));
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
