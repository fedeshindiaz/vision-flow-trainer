import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { CastDebugPanel } from "../components/CastDebugPanel";
import { BackgroundPanel } from "../components/panels/BackgroundPanel";
import { ObjectivePanel } from "../components/panels/ObjectivePanel";
import { ParameterPanel } from "../components/panels/ParameterPanel";
import { ProtocolPanel } from "../components/panels/ProtocolPanel";
import { SafetyModal } from "../components/SafetyModal";
import { SessionMetrics } from "../components/session/SessionMetrics";
import { SessionControls } from "../components/session/SessionControls";
import { SessionViewport } from "../components/session/SessionViewport";
import { protocols } from "../config/protocols";
import { useCastSender } from "../hooks/useCastSender";
import { useAppleSafeScrollLock } from "../hooks/useAppleSafeScrollLock";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useExerciseSession } from "../hooks/useExerciseSession";
import { useFocusMode } from "../hooks/useFocusMode";
import { playMetronomeClick, unlockMetronomeAudio, useMetronome } from "../hooks/useMetronome";
import type { BackgroundConfig, ObjectiveConfig, Protocol } from "../types";
import { getDeviceEnvironment } from "../utils/deviceDetection";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

export default function Index() {
  const session = useExerciseSession();
  const castSender = useCastSender(session.sharedState);
  const deviceEnvironment = useMemo(() => getDeviceEnvironment(), []);
  const { focusMode, focusFeedback, focusHostRef, enterFocusMode, exitFocusMode } = useFocusMode({
    isAppleEnvironment: deviceEnvironment.isAppleEnvironment,
  });
  const [protocolCategory, setProtocolCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 180);

  const {
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
    actions,
  } = session;
  const {
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
    resetSession: resetSessionAction,
    applyProtocol: applyProtocolAction,
    handlePlayPause: handlePlayPauseAction,
    handleSkip: handleSkipAction,
  } = actions;

  const visibleProtocols = useMemo(() => {
    const base =
      protocolCategory === "Todos"
        ? protocols
        : protocols.filter((protocol) => protocol.category === protocolCategory);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    if (!normalizedQuery) return base;

    return base.filter((protocol) => {
      const haystack = `${protocol.name} ${protocol.category} ${protocol.module} ${
        protocol.sourceVideo ?? ""
      } ${protocol.background.type} ${protocol.objective.mode} ${protocol.cue} ${protocol.head} ${protocol.eyes} ${protocol.level}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [debouncedQuery, protocolCategory]);

  const beat = useMetronome(
    metronomeActive,
    frequencyHz,
    soundEnabled,
    resetKey,
    tempoStartedAtMs,
    tempoAccumulatedElapsedMs,
  );

  const applyProtocol = useCallback(
    (protocol: Protocol) => {
      applyProtocolAction(protocol);
      void castSender.sendCommand("SET_PROTOCOL", {
        selectedProtocolId: protocol.id,
        selectedProtocolName: protocol.name,
        selectedProtocolCategory: protocol.category,
        background: protocol.background,
        objective: protocol.objective,
        frequencyHz: protocol.frequencyHz,
        metronomeEnabled: protocol.metronome,
      });
    },
    [applyProtocolAction, castSender],
  );

  const resetSession = useCallback(() => {
    resetSessionAction();
    void castSender.sendCommand("RESET", session.sharedState);
  }, [castSender, resetSessionAction, session.sharedState]);

  const handlePlayPause = useCallback(() => {
    const shouldEnterAppleSafeSession =
      deviceEnvironment.isAppleEnvironment && (sessionState === "idle" || sessionState === "done") && duration > 0 && sets > 0;

    handlePlayPauseAction();

    if (shouldEnterAppleSafeSession) {
      void enterFocusMode();
    }

    void castSender.sendCommand(running ? "PAUSE" : "PLAY", session.sharedState);
  }, [
    castSender,
    deviceEnvironment.isAppleEnvironment,
    duration,
    enterFocusMode,
    handlePlayPauseAction,
    running,
    session.sharedState,
    sessionState,
    sets,
  ]);

  const handleSkip = useCallback(() => {
    handleSkipAction();
    void castSender.sendCommand("SKIP", session.sharedState);
  }, [castSender, handleSkipAction, session.sharedState]);

  const handleCategoryChange = useCallback((category: string) => {
    setProtocolCategory(category);
  }, []);

  const handleBackgroundChange = useCallback(
    (value: BackgroundConfig) => {
      setBackground(value);
      void castSender.sendCommand("SET_BACKGROUND", { background: value, updatedAt: Date.now() });
    },
    [castSender, setBackground],
  );

  const handleObjectiveChange = useCallback(
    (value: ObjectiveConfig) => {
      setObjective(value);
      void castSender.sendCommand("SET_OBJECTIVE", { objective: value, updatedAt: Date.now() });
    },
    [castSender, setObjective],
  );

  const handleParameterChange = useCallback(
    (key: string, value: number) => {
      void castSender.sendCommand("SET_PARAMETER", { [key]: value, updatedAt: Date.now() });
    },
    [castSender],
  );

  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;

    if (next) {
      void unlockMetronomeAudio().then(() => playMetronomeClick());
    }

    setSoundEnabled(next);
  }, [soundEnabled]);

  const handleToggleMetronome = useCallback(() => {
    const next = !metronomeEnabled;
    setMetronomeEnabled(next);
    void castSender.sendCommand("SET_PARAMETER", {
      metronomeEnabled: next,
      updatedAt: Date.now(),
    });
  }, [castSender, metronomeEnabled, setMetronomeEnabled]);

  const handleAppleSafeExit = useCallback(() => {
    if (running) {
      handlePlayPauseAction();
      void castSender.sendCommand("PAUSE", session.sharedState);
    }

    void exitFocusMode();
  }, [castSender, exitFocusMode, handlePlayPauseAction, running, session.sharedState]);

  useAppleSafeScrollLock(focusMode && deviceEnvironment.isAppleEnvironment);

  useEffect(() => {
    if (!focusMode || !deviceEnvironment.isAppleEnvironment) return undefined;

    const handleAppleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      handleAppleSafeExit();
    };

    document.addEventListener("keydown", handleAppleEscape, { capture: true });

    return () => document.removeEventListener("keydown", handleAppleEscape, { capture: true });
  }, [deviceEnvironment.isAppleEnvironment, focusMode, handleAppleSafeExit]);

  const handleFrequencyChange = useCallback(
    (value: number) => {
      setFrequencyHz(value);
      handleParameterChange("frequencyHz", value);
    },
    [handleParameterChange, setFrequencyHz],
  );
  const handleAmplitudeChange = useCallback(
    (value: number) => {
      setAmplitude(value);
      handleParameterChange("amplitude", value);
    },
    [handleParameterChange, setAmplitude],
  );
  const handleTargetSizeChange = useCallback(
    (value: number) => {
      setTargetSize(value);
      handleParameterChange("targetSize", value);
    },
    [handleParameterChange, setTargetSize],
  );
  const handleDensityChange = useCallback(
    (value: number) => {
      setDensity(value);
      handleParameterChange("density", value);
    },
    [handleParameterChange, setDensity],
  );
  const handleStripeSizeChange = useCallback(
    (value: number) => {
      setStripeSize(value);
      handleParameterChange("stripeSize", value);
    },
    [handleParameterChange, setStripeSize],
  );
  const handleDurationChange = useCallback(
    (value: number) => {
      setDuration(value);
      handleParameterChange("duration", value);
    },
    [handleParameterChange, setDuration],
  );
  const handleSetsChange = useCallback(
    (value: number) => {
      setSets(value);
      handleParameterChange("sets", value);
    },
    [handleParameterChange, setSets],
  );
  const handleRestChange = useCallback(
    (value: number) => {
      setRest(value);
      handleParameterChange("rest", value);
    },
    [handleParameterChange, setRest],
  );

  const appFeedback = focusFeedback || castSender.lastError;

  return (
    <div className={`app-shell ${focusMode ? "is-focus-mode" : ""} ${deviceEnvironment.isAppleEnvironment ? "apple-environment" : ""}`}>
      {appFeedback && !focusMode && <div className="app-feedback" role="status">{appFeedback}</div>}

      <div className="app-frame">
        <AppHeader
          version={APP_VERSION}
          castStatusLabel={castSender.statusLabel}
          castIsConfigured={castSender.isConfigured}
          castSdkStatus={castSender.sdkStatus}
          castIsConnected={castSender.isConnected}
          castLastError={castSender.lastError}
          isAppleEnvironment={deviceEnvironment.isAppleEnvironment}
          onSafety={() => setShowSafety(true)}
          onFocusMode={enterFocusMode}
        />

        <main className="main-grid">
          <aside className="side-stack">
            <section className="panel session-panel" aria-label="Controles de sesion">
              <SessionControls
                running={running}
                playLabel={playLabel}
                skipLabel={skipLabel}
                skipDisabled={skipDisabled}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
                onReset={resetSession}
              />
            </section>

            <ProtocolPanel
              protocols={protocols}
              visibleProtocols={visibleProtocols}
              selectedProtocolId={selectedProtocolId}
              protocolCategory={protocolCategory}
              query={query}
              onCategoryChange={handleCategoryChange}
              onQueryChange={setQuery}
              onApplyProtocol={applyProtocol}
            />

            <ParameterPanel
              frequencyHz={frequencyHz}
              amplitude={amplitude}
              targetSize={targetSize}
              density={density}
              stripeSize={stripeSize}
              duration={duration}
              sets={sets}
              rest={rest}
              onFrequencyChange={handleFrequencyChange}
              onAmplitudeChange={handleAmplitudeChange}
              onTargetSizeChange={handleTargetSizeChange}
              onDensityChange={handleDensityChange}
              onStripeSizeChange={handleStripeSizeChange}
              onDurationChange={handleDurationChange}
              onSetsChange={handleSetsChange}
              onRestChange={handleRestChange}
              durationLocked={sessionLocked}
              setsLocked={sessionLocked}
              restLocked={sessionState === "resting"}
            />
            <BackgroundPanel background={background} onChange={handleBackgroundChange} />
            <ObjectivePanel objective={objective} onChange={handleObjectiveChange} />
          </aside>

          <section className="visual-stack">
            <SessionViewport
              focusHostRef={focusHostRef}
              focusMode={focusMode}
              selectedProtocol={selectedProtocol}
              background={background}
              objective={objective}
              frequencyHz={frequencyHz}
              amplitude={amplitude}
              targetSize={targetSize}
              density={density}
              stripeSize={stripeSize}
              resetKey={resetKey}
              visualRunning={visualRunning}
              tempoStartedAtMs={tempoStartedAtMs}
              tempoAccumulatedElapsedMs={tempoAccumulatedElapsedMs}
              onExitFocusMode={() => void exitFocusMode()}
              isAppleEnvironment={deviceEnvironment.isAppleEnvironment}
              isAppleTouchEnvironment={deviceEnvironment.isAppleTouchEnvironment}
              running={running}
              playLabel={playLabel}
              onPlayPause={handlePlayPause}
              onReset={resetSession}
              onAppleSafeExit={handleAppleSafeExit}
            />
            <SessionMetrics
              timeLeft={timeLeft}
              currentSet={currentSet}
              sets={sets}
              sessionState={sessionState}
              metronomeActive={metronomeActive}
              frequencyHz={frequencyHz}
              soundEnabled={soundEnabled}
              metronomeEnabled={metronomeEnabled}
              beat={beat}
              onToggleSound={handleToggleSound}
              onToggleMetronome={handleToggleMetronome}
            />
          </section>
        </main>
      </div>

      {showSafety && <SafetyModal onClose={() => setShowSafety(false)} />}
      <CastDebugPanel statusLabel={castSender.statusLabel} senderLastError={castSender.lastError} />
    </div>
  );
}
