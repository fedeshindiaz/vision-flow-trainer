import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { SharedExerciseState } from "../cast/castMessages";
import { protocols } from "../config/protocols";
import type { BackgroundConfig, ObjectiveConfig, Protocol, SessionState } from "../types";
import { clamp } from "../utils";
import { useVisualClock } from "./useVisualClock";

const initialProtocol = protocols.find((protocol) => protocol.id === "guided-custom") ?? protocols[0];

const standardDefaults = {
  amplitude: 42,
  targetSize: 38,
  density: 96,
  stripeSize: 48,
  duration: 45,
  sets: 3,
  rest: 30,
};

interface ExerciseSessionConfig {
  selectedProtocolId: string;
  background: BackgroundConfig;
  objective: ObjectiveConfig;
  frequencyHz: number;
  amplitude: number;
  targetSize: number;
  density: number;
  stripeSize: number;
  duration: number;
  sets: number;
  rest: number;
  metronomeEnabled: boolean;
}

interface ExerciseSessionState extends ExerciseSessionConfig {
  running: boolean;
  sessionState: SessionState;
  timeLeft: number;
  currentSet: number;
  resetKey: number;
}

type NumericConfigKey =
  | "frequencyHz"
  | "amplitude"
  | "targetSize"
  | "density"
  | "stripeSize"
  | "duration"
  | "sets"
  | "rest";

type SessionAction =
  | { type: "SET_BACKGROUND"; value: BackgroundConfig }
  | { type: "SET_OBJECTIVE"; value: ObjectiveConfig }
  | { type: "SET_NUMBER"; key: NumericConfigKey; value: number }
  | { type: "SET_METRONOME"; value: boolean }
  | { type: "RESET_SESSION" }
  | { type: "APPLY_PROTOCOL"; protocol: Protocol }
  | { type: "PLAY_PAUSE" }
  | { type: "SKIP" }
  | { type: "TICK" }
  | { type: "START_REST" }
  | { type: "FINISH_SESSION" }
  | { type: "FINISH_REST" };

function getInitialSet(setCount: number) {
  return setCount > 0 ? 1 : 0;
}

function createInitialState(): ExerciseSessionState {
  const protocol = initialProtocol;
  const duration = protocol.defaults?.duration ?? standardDefaults.duration;
  const sets = protocol.defaults?.sets ?? standardDefaults.sets;

  return {
    selectedProtocolId: protocol.id,
    background: protocol.background,
    objective: protocol.objective,
    frequencyHz: protocol.frequencyHz,
    amplitude: protocol.defaults?.amplitude ?? standardDefaults.amplitude,
    targetSize: protocol.defaults?.targetSize ?? standardDefaults.targetSize,
    density: protocol.defaults?.density ?? standardDefaults.density,
    stripeSize: protocol.defaults?.stripeSize ?? standardDefaults.stripeSize,
    duration,
    sets,
    rest: protocol.defaults?.rest ?? standardDefaults.rest,
    metronomeEnabled: protocol.metronome,
    running: false,
    sessionState: "idle",
    timeLeft: duration,
    currentSet: getInitialSet(sets),
    resetKey: 0,
  };
}

function exerciseSessionReducer(state: ExerciseSessionState, action: SessionAction): ExerciseSessionState {
  switch (action.type) {
    case "SET_BACKGROUND":
      return { ...state, background: action.value };
    case "SET_OBJECTIVE":
      return { ...state, objective: action.value };
    case "SET_METRONOME":
      return { ...state, metronomeEnabled: action.value };
    case "SET_NUMBER": {
      if (action.key === "frequencyHz") {
        return { ...state, frequencyHz: action.value };
      }

      if (action.key === "duration") {
        return {
          ...state,
          duration: action.value,
          timeLeft: state.sessionState === "idle" ? action.value : state.timeLeft,
        };
      }

      if (action.key === "sets") {
        return {
          ...state,
          sets: action.value,
          currentSet: action.value > 0 ? clamp(Math.max(1, state.currentSet), 1, action.value) : 0,
        };
      }

      return { ...state, [action.key]: action.value };
    }
    case "RESET_SESSION":
      return {
        ...state,
        running: false,
        sessionState: "idle",
        currentSet: getInitialSet(state.sets),
        timeLeft: state.duration,
        resetKey: state.resetKey + 1,
      };
    case "APPLY_PROTOCOL": {
      const previousProtocol = protocols.find((protocol) => protocol.id === state.selectedProtocolId);
      const shouldRestoreDefaults = Boolean(previousProtocol?.defaults) && !action.protocol.defaults;
      const nextDuration = action.protocol.defaults?.duration ?? (shouldRestoreDefaults ? standardDefaults.duration : state.duration);
      const nextSets = action.protocol.defaults?.sets ?? (shouldRestoreDefaults ? standardDefaults.sets : state.sets);

      return {
        ...state,
        selectedProtocolId: action.protocol.id,
        background: action.protocol.background,
        objective: action.protocol.objective,
        frequencyHz: action.protocol.frequencyHz,
        amplitude: action.protocol.defaults?.amplitude ?? (shouldRestoreDefaults ? standardDefaults.amplitude : state.amplitude),
        targetSize: action.protocol.defaults?.targetSize ?? (shouldRestoreDefaults ? standardDefaults.targetSize : state.targetSize),
        density: action.protocol.defaults?.density ?? (shouldRestoreDefaults ? standardDefaults.density : state.density),
        stripeSize: action.protocol.defaults?.stripeSize ?? (shouldRestoreDefaults ? standardDefaults.stripeSize : state.stripeSize),
        duration: nextDuration,
        sets: nextSets,
        rest: action.protocol.defaults?.rest ?? (shouldRestoreDefaults ? standardDefaults.rest : state.rest),
        metronomeEnabled: action.protocol.metronome,
        running: false,
        sessionState: "idle",
        currentSet: getInitialSet(nextSets),
        timeLeft: nextDuration,
        resetKey: state.resetKey + 1,
      };
    }
    case "PLAY_PAUSE": {
      if (state.sessionState === "idle" || state.sessionState === "done") {
        if (state.duration <= 0 || state.sets <= 0) {
          return {
            ...state,
            running: false,
            sessionState: "idle",
            currentSet: getInitialSet(state.sets),
            timeLeft: state.duration,
          };
        }

        return {
          ...state,
          currentSet: getInitialSet(state.sets),
          timeLeft: state.duration,
          sessionState: "playing",
          running: true,
          resetKey: state.resetKey + 1,
        };
      }

      return { ...state, running: !state.running };
    }
    case "SKIP":
      if (state.sessionState === "resting") {
        return {
          ...state,
          currentSet: clamp(state.currentSet + 1, 1, state.sets),
          timeLeft: state.duration,
          sessionState: "playing",
          running: true,
          resetKey: state.resetKey + 1,
        };
      }

      if (state.sessionState === "playing" && state.currentSet < state.sets) {
        return {
          ...state,
          currentSet: clamp(state.currentSet + 1, 1, state.sets),
          timeLeft: state.duration,
          resetKey: state.resetKey + 1,
        };
      }

      if (state.sessionState === "playing") {
        return { ...state, running: false, sessionState: "done", timeLeft: 0 };
      }

      return state;
    case "TICK":
      return state.running ? { ...state, timeLeft: Math.max(0, state.timeLeft - 1) } : state;
    case "START_REST":
      return { ...state, sessionState: "resting", timeLeft: state.rest };
    case "FINISH_SESSION":
      return { ...state, running: false, sessionState: "done", timeLeft: 0 };
    case "FINISH_REST":
      return {
        ...state,
        currentSet: clamp(state.currentSet + 1, 1, state.sets),
        sessionState: "playing",
        timeLeft: state.duration,
        resetKey: state.resetKey + 1,
      };
    default:
      return state;
  }
}

export function useExerciseSession() {
  const [state, dispatch] = useReducer(exerciseSessionReducer, undefined, createInitialState);
  const { clock, resetVisualClock, stopVisualClock, pauseVisualClock, resumeVisualClock } = useVisualClock();
  const selectedProtocol = protocols.find((protocol) => protocol.id === state.selectedProtocolId) ?? protocols[0];
  const visualRunning = state.running && state.sessionState === "playing";
  const metronomeActive = visualRunning && state.metronomeEnabled;
  const sessionLocked = state.sessionState === "playing" || state.sessionState === "resting";

  useEffect(() => {
    if (!state.running) return undefined;

    const id = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => window.clearInterval(id);
  }, [state.running]);

  useEffect(() => {
    if (!state.running || state.timeLeft > 0) return;

    if (state.sessionState === "playing" && state.currentSet < state.sets) {
      stopVisualClock();
      dispatch({ type: "START_REST" });
      return;
    }

    if (state.sessionState === "playing") {
      stopVisualClock();
      dispatch({ type: "FINISH_SESSION" });
      return;
    }

    if (state.sessionState === "resting" && state.currentSet < state.sets) {
      resetVisualClock();
      dispatch({ type: "FINISH_REST" });
      return;
    }

    stopVisualClock();
    dispatch({ type: "FINISH_SESSION" });
  }, [
    resetVisualClock,
    state.currentSet,
    state.duration,
    state.rest,
    state.running,
    state.sessionState,
    state.sets,
    state.timeLeft,
    stopVisualClock,
  ]);

  const resetSession = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
    stopVisualClock();
  }, [stopVisualClock]);

  const applyProtocol = useCallback(
    (protocol: Protocol) => {
      dispatch({ type: "APPLY_PROTOCOL", protocol });
      stopVisualClock();
    },
    [stopVisualClock],
  );

  const handlePlayPause = useCallback(() => {
    const shouldStartFresh = state.sessionState === "idle" || state.sessionState === "done";

    if (shouldStartFresh) {
      if (state.duration <= 0 || state.sets <= 0) {
        stopVisualClock();
      } else {
        resetVisualClock();
      }
    } else if (state.running) {
      if (state.sessionState === "playing") pauseVisualClock();
    } else if (state.sessionState === "playing") {
      resumeVisualClock();
    }

    dispatch({ type: "PLAY_PAUSE" });
  }, [
    pauseVisualClock,
    resetVisualClock,
    resumeVisualClock,
    state.duration,
    state.running,
    state.sessionState,
    state.sets,
    stopVisualClock,
  ]);

  const handleSkip = useCallback(() => {
    if (state.sessionState === "resting" || (state.sessionState === "playing" && state.currentSet < state.sets)) {
      resetVisualClock();
    } else if (state.sessionState === "playing") {
      stopVisualClock();
    }

    dispatch({ type: "SKIP" });
  }, [resetVisualClock, state.currentSet, state.sessionState, state.sets, stopVisualClock]);

  const setNumber = useCallback(
    (key: NumericConfigKey, value: number) => {
      dispatch({ type: "SET_NUMBER", key, value });
    },
    [],
  );

  const setBackground = useCallback((value: BackgroundConfig) => dispatch({ type: "SET_BACKGROUND", value }), []);
  const setObjective = useCallback((value: ObjectiveConfig) => dispatch({ type: "SET_OBJECTIVE", value }), []);
  const setMetronomeEnabled = useCallback((value: boolean) => dispatch({ type: "SET_METRONOME", value }), []);
  const setFrequencyHz = useCallback((value: number) => setNumber("frequencyHz", value), [setNumber]);
  const setAmplitude = useCallback((value: number) => setNumber("amplitude", value), [setNumber]);
  const setTargetSize = useCallback((value: number) => setNumber("targetSize", value), [setNumber]);
  const setDensity = useCallback((value: number) => setNumber("density", value), [setNumber]);
  const setStripeSize = useCallback((value: number) => setNumber("stripeSize", value), [setNumber]);
  const setDuration = useCallback((value: number) => setNumber("duration", value), [setNumber]);
  const setSets = useCallback((value: number) => setNumber("sets", value), [setNumber]);
  const setRest = useCallback((value: number) => setNumber("rest", value), [setNumber]);

  const playLabel =
    state.sessionState === "resting"
      ? state.running
        ? "Pausar descanso"
        : "Continuar"
      : state.running
        ? "Pausar"
        : state.sessionState === "done"
          ? "Repetir"
          : "Iniciar";
  const skipLabel = state.sessionState === "resting" ? "Saltar descanso" : state.sessionState === "playing" ? "Saltar serie" : "Saltar";
  const skipDisabled = state.sessionState === "idle" || state.sessionState === "done";

  const sharedState = useMemo<SharedExerciseState>(
    () => ({
      selectedProtocolId: state.selectedProtocolId,
      selectedProtocolName: selectedProtocol.name,
      selectedProtocolCategory: selectedProtocol.category,
      background: state.background,
      objective: state.objective,
      frequencyHz: state.frequencyHz,
      amplitude: state.amplitude,
      targetSize: state.targetSize,
      density: state.density,
      stripeSize: state.stripeSize,
      duration: state.duration,
      sets: state.sets,
      rest: state.rest,
      running: state.running,
      sessionState: state.sessionState,
      timeLeft: state.timeLeft,
      currentSet: state.currentSet,
      resetKey: state.resetKey,
      metronomeEnabled: state.metronomeEnabled,
      updatedAt: Date.now(),
      startedAt: clock.startedAt,
      pausedAt: clock.pausedAt,
      accumulatedElapsedMs: clock.accumulatedElapsedMs,
    }),
    [clock, selectedProtocol.category, selectedProtocol.name, state],
  );

  const actions = useMemo(
    () => ({
      setBackground,
      setObjective,
      setFrequencyHz,
      setAmplitude,
      setTargetSize,
      setDensity,
      setStripeSize,
      setDuration,
      setSets,
      setRest,
      setMetronomeEnabled,
      resetSession,
      applyProtocol,
      handlePlayPause,
      handleSkip,
    }),
    [
      applyProtocol,
      handlePlayPause,
      handleSkip,
      resetSession,
      setAmplitude,
      setBackground,
      setDensity,
      setDuration,
      setFrequencyHz,
      setMetronomeEnabled,
      setObjective,
      setRest,
      setSets,
      setStripeSize,
      setTargetSize,
    ],
  );

  return {
    ...state,
    selectedProtocol,
    tempoStartedAtMs: clock.tempoStartedAtMs,
    tempoAccumulatedElapsedMs: clock.tempoAccumulatedElapsedMs,
    visualRunning,
    metronomeActive,
    sessionLocked,
    playLabel,
    skipLabel,
    skipDisabled,
    sharedState,
    actions,
  };
}
