import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles.css";
import { CastButton } from "../components/CastButton";
import { VisualCanvas } from "../components/canvas/VisualCanvas";
import { BackgroundPanel } from "../components/panels/BackgroundPanel";
import { ObjectivePanel } from "../components/panels/ObjectivePanel";
import { ParameterPanel } from "../components/panels/ParameterPanel";
import { ProtocolPanel } from "../components/panels/ProtocolPanel";
import { SafetyModal } from "../components/SafetyModal";
import { MetronomeCard } from "../components/session/MetronomeCard";
import { SessionControls } from "../components/session/SessionControls";
import { Icon, InfoCard } from "../components/ui";
import { protocols } from "../config/protocols";
import { APP_ICON_SRC, APP_NAME, APP_SUBTITLE } from "../constants/modules";
import { useCastSender } from "../hooks/useCastSender";
import { useExerciseSession } from "../hooks/useExerciseSession";
import { playMetronomeClick, unlockMetronomeAudio, useMetronome } from "../hooks/useMetronome";
import type { BackgroundConfig, ObjectiveConfig, Protocol } from "../types";
import { formatTime } from "../utils";

export default function Index() {
  const session = useExerciseSession();
  const castSender = useCastSender(session.sharedState);
  const [protocolCategory, setProtocolCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [focusFeedback, setFocusFeedback] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const focusHostRef = useRef<HTMLDivElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const fullscreenWasActiveRef = useRef(false);

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
    visualRunning,
    metronomeActive,
    sessionLocked,
    playLabel,
    skipLabel,
    skipDisabled,
    actions,
  } = session;

  const visibleProtocols = useMemo(() => {
    const base =
      protocolCategory === "Todos"
        ? protocols
        : protocols.filter((protocol) => protocol.category === protocolCategory);
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return base;

    return base.filter((protocol) => {
      const haystack = `${protocol.name} ${protocol.category} ${protocol.module} ${
        protocol.sourceVideo ?? ""
      } ${protocol.background.type} ${protocol.objective.mode} ${protocol.cue} ${protocol.head} ${protocol.eyes} ${protocol.level}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [protocolCategory, query]);

  const beat = useMetronome(metronomeActive, frequencyHz, soundEnabled, resetKey);

  const showFocusFeedback = useCallback((message: string) => {
    setFocusFeedback(message);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => setFocusFeedback(""), 3500);
  }, []);

  const exitFocusMode = useCallback(async () => {
    setFocusMode(false);

    if (!document.fullscreenElement) return;

    try {
      await document.exitFullscreen();
    } catch {
      showFocusFeedback("No se pudo salir de pantalla completa. Usá Esc si el navegador lo requiere.");
    }
  }, [showFocusFeedback]);

  const enterFocusMode = useCallback(async () => {
    setFocusMode(true);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const target = focusHostRef.current;

    if (!target?.requestFullscreen) {
      showFocusFeedback("Modo pantalla interno activo. El navegador no ofrece fullscreen real.");
      return;
    }

    try {
      await target.requestFullscreen();
      fullscreenWasActiveRef.current = true;
    } catch {
      showFocusFeedback("Modo pantalla interno activo. El navegador bloqueó fullscreen real.");
    }
  }, [showFocusFeedback]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeElement = document.fullscreenElement;

      if (activeElement === focusHostRef.current) {
        fullscreenWasActiveRef.current = true;
        return;
      }

      if (!activeElement && fullscreenWasActiveRef.current) {
        fullscreenWasActiveRef.current = false;
        setFocusMode(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!focusMode) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void exitFocusMode();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exitFocusMode, focusMode]);

  const handleCategoryChange = (category: string) => {
    setProtocolCategory(category);
  };

  const applyProtocol = (protocol: Protocol) => {
    actions.applyProtocol(protocol);
    void castSender.sendCommand("SET_PROTOCOL", {
      selectedProtocolId: protocol.id,
      selectedProtocolName: protocol.name,
      selectedProtocolCategory: protocol.category,
      background: protocol.background,
      objective: protocol.objective,
      frequencyHz: protocol.frequencyHz,
      metronomeEnabled: protocol.metronome,
    });
  };

  const resetSession = () => {
    actions.resetSession();
    void castSender.sendCommand("RESET", session.sharedState);
  };

  const handlePlayPause = () => {
    actions.handlePlayPause();
    void castSender.sendCommand(running ? "PAUSE" : "PLAY", session.sharedState);
  };

  const handleSkip = () => {
    actions.handleSkip();
    void castSender.sendCommand("SKIP", session.sharedState);
  };

  const handleBackgroundChange = (value: BackgroundConfig) => {
    actions.setBackground(value);
    void castSender.sendCommand("SET_BACKGROUND", { background: value, updatedAt: Date.now() });
  };

  const handleObjectiveChange = (value: ObjectiveConfig) => {
    actions.setObjective(value);
    void castSender.sendCommand("SET_OBJECTIVE", { objective: value, updatedAt: Date.now() });
  };

  const handleParameterChange = (key: string, value: number) => {
    void castSender.sendCommand("SET_PARAMETER", { [key]: value, updatedAt: Date.now() });
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;

    if (next) {
      void unlockMetronomeAudio().then(() => playMetronomeClick());
    }

    setSoundEnabled(next);
  };

  const viewport = (
    <div className="viewport-shell" ref={focusHostRef}>
      <div className="viewport" onDoubleClick={focusMode ? () => void exitFocusMode() : undefined}>
        <VisualCanvas
          running={visualRunning}
          resetKey={resetKey}
          background={background}
          objective={objective}
          frequencyHz={frequencyHz}
          amplitude={amplitude}
          targetSize={targetSize}
          density={density}
          stripeSize={stripeSize}
        />

        <div className="viewport-label top">
          <span>
            {selectedProtocol.category}
            {selectedProtocol.sourceVideo ? ` · video ${selectedProtocol.sourceVideo}` : ""}
          </span>
          <strong>{selectedProtocol.name}</strong>
          <p>{selectedProtocol.cue}</p>
        </div>

        <div className="viewport-label bottom">
          <div>
            <span>Fondo</span>
            <strong>{background.enabled ? `${background.type} · ${background.direction}` : "Fondo liso"}</strong>
          </div>
          <div>
            <span>Objetivo</span>
            <strong>{objective.enabled ? `${objective.mode} · ${objective.direction}` : "Sin objetivo"}</strong>
          </div>
          <div>
            <span>Frecuencia</span>
            <strong>{frequencyHz.toFixed(1)} Hz</strong>
          </div>
        </div>
      </div>
    </div>
  );
  const appFeedback = focusFeedback || castSender.lastError;

  return (
    <div className={`app-shell ${focusMode ? "is-focus-mode" : ""}`}>
      {appFeedback && !focusMode && <div className="app-feedback" role="status">{appFeedback}</div>}

      <div className="app-frame">
        <header className="app-header">
          <div className="brand">
            <img src={APP_ICON_SRC} alt={`${APP_NAME} icon`} />
            <div>
              <h1>{APP_NAME}</h1>
              <p>{APP_SUBTITLE}</p>
            </div>
          </div>
          <div className="header-actions">
            <CastButton
              statusLabel={castSender.statusLabel}
              isConfigured={castSender.isConfigured}
              sdkStatus={castSender.sdkStatus}
              isConnected={castSender.isConnected}
              lastError={castSender.lastError}
            />
            <button type="button" className="secondary-action" onClick={() => setShowSafety(true)}>
              <Icon name="shield" /> Seguridad
            </button>
            <button type="button" className="dark-action" onClick={enterFocusMode}>
              <Icon name="screen" /> Modo pantalla
            </button>
          </div>
        </header>

        <main className="main-grid">
          <aside className="side-stack">
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

            <section className="panel session-panel" aria-label="Controles de sesión">
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

            <ParameterPanel
              frequencyHz={frequencyHz}
              amplitude={amplitude}
              targetSize={targetSize}
              density={density}
              stripeSize={stripeSize}
              duration={duration}
              sets={sets}
              rest={rest}
              onFrequencyChange={(value) => {
                actions.setFrequencyHz(value);
                handleParameterChange("frequencyHz", value);
              }}
              onAmplitudeChange={(value) => {
                actions.setAmplitude(value);
                handleParameterChange("amplitude", value);
              }}
              onTargetSizeChange={(value) => {
                actions.setTargetSize(value);
                handleParameterChange("targetSize", value);
              }}
              onDensityChange={(value) => {
                actions.setDensity(value);
                handleParameterChange("density", value);
              }}
              onStripeSizeChange={(value) => {
                actions.setStripeSize(value);
                handleParameterChange("stripeSize", value);
              }}
              onDurationChange={(value) => {
                actions.setDuration(value);
                handleParameterChange("duration", value);
              }}
              onSetsChange={(value) => {
                actions.setSets(value);
                handleParameterChange("sets", value);
              }}
              onRestChange={(value) => {
                actions.setRest(value);
                handleParameterChange("rest", value);
              }}
              durationLocked={sessionLocked}
              setsLocked={sessionLocked}
              restLocked={sessionState === "resting"}
            />
            <BackgroundPanel background={background} onChange={handleBackgroundChange} />
            <ObjectivePanel objective={objective} onChange={handleObjectiveChange} />
          </aside>

          <section className="visual-stack">
            {viewport}
            <div className="status-grid">
              <InfoCard
                label="Cronómetro"
                title={formatTime(timeLeft)}
                text={sessionState === "resting" ? "Descanso" : sessionState === "done" ? "Completado" : "Tiempo restante"}
              />
              <InfoCard label="Vueltas" title={`${currentSet}/${sets}`} text="Serie actual" />
              <MetronomeCard
                active={metronomeActive}
                frequencyHz={frequencyHz}
                soundEnabled={soundEnabled}
                metronomeEnabled={metronomeEnabled}
                beat={beat}
                onToggleSound={handleToggleSound}
                onToggleMetronome={() => {
                  actions.setMetronomeEnabled((value) => !value);
                  void castSender.sendCommand("SET_PARAMETER", {
                    metronomeEnabled: !metronomeEnabled,
                    updatedAt: Date.now(),
                  });
                }}
              />
            </div>
          </section>
        </main>
      </div>

      {showSafety && <SafetyModal onClose={() => setShowSafety(false)} />}
    </div>
  );
}
