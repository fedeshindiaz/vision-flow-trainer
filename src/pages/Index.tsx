import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles.css";
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
import { playMetronomeClick, useMetronome } from "../hooks/useMetronome";
import type { BackgroundConfig, ObjectiveConfig, Protocol, SessionState } from "../types";
import { clamp, formatTime } from "../utils";

const initialProtocol = protocols.find((protocol) => protocol.id === "okn-1") ?? protocols[0];

export default function Index() {
  const [protocolCategory, setProtocolCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selectedProtocolId, setSelectedProtocolId] = useState(initialProtocol.id);
  const [background, setBackground] = useState<BackgroundConfig>(initialProtocol.background);
  const [objective, setObjective] = useState<ObjectiveConfig>(initialProtocol.objective);
  const [frequencyHz, setFrequencyHz] = useState(initialProtocol.frequencyHz);
  const [amplitude, setAmplitude] = useState(42);
  const [targetSize, setTargetSize] = useState(38);
  const [density, setDensity] = useState(48);
  const [duration, setDuration] = useState(45);
  const [sets, setSets] = useState(3);
  const [rest, setRest] = useState(30);
  const [running, setRunning] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentSet, setCurrentSet] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [focusFeedback, setFocusFeedback] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(initialProtocol.metronome);
  const [showSafety, setShowSafety] = useState(false);
  const focusHostRef = useRef<HTMLDivElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const fullscreenWasActiveRef = useRef(false);

  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedProtocolId) ?? protocols[0];

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

  const visualRunning = running && sessionState === "playing";
  const metronomeActive = visualRunning && metronomeEnabled;
  const beat = useMetronome(metronomeActive, frequencyHz, soundEnabled);
  const sessionLocked = sessionState === "playing" || sessionState === "resting";

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

  const resetSession = () => {
    setRunning(false);
    setSessionState("idle");
    setCurrentSet(1);
    setTimeLeft(duration);
    setResetKey((value) => value + 1);
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
  };

  const handleCategoryChange = (category: string) => {
    setProtocolCategory(category);
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
      return;
    }

    if (sessionState === "playing") {
      setRunning(false);
      setSessionState("done");
      setTimeLeft(0);
      return;
    }

    if (sessionState === "resting" && currentSet < sets) {
      setCurrentSet((value) => clamp(value + 1, 1, sets));
      setSessionState("playing");
      setTimeLeft(duration);
      setResetKey((value) => value + 1);
      return;
    }

    setRunning(false);
    setSessionState("done");
    setTimeLeft(0);
  }, [running, timeLeft, sessionState, currentSet, sets, rest, duration]);

  const handlePlayPause = () => {
    if (sessionState === "idle" || sessionState === "done") {
      setCurrentSet(1);
      setTimeLeft(duration);
      setSessionState("playing");
      setRunning(true);
      setResetKey((value) => value + 1);
      return;
    }

    setRunning((value) => !value);
  };

  const handleSkip = () => {
    if (sessionState === "resting") {
      setCurrentSet((value) => clamp(value + 1, 1, sets));
      setTimeLeft(duration);
      setSessionState("playing");
      setRunning(true);
      setResetKey((value) => value + 1);
      return;
    }

    if (sessionState === "playing" && currentSet < sets) {
      setCurrentSet((value) => clamp(value + 1, 1, sets));
      setTimeLeft(duration);
      setResetKey((value) => value + 1);
      return;
    }

    if (sessionState === "playing") {
      setRunning(false);
      setSessionState("done");
      setTimeLeft(0);
    }
  };

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

  const handleToggleSound = () => {
    const next = !soundEnabled;

    if (next) playMetronomeClick();

    setSoundEnabled(next);
  };

  const viewport = (
    <div className="viewport-shell" ref={focusHostRef}>
      {focusMode && (
        <button type="button" onClick={exitFocusMode} className="focus-exit">
          <Icon name="close" /> Salir
        </button>
      )}

      <div className="viewport">
        <VisualCanvas
          running={visualRunning}
          resetKey={resetKey}
          background={background}
          objective={objective}
          frequencyHz={frequencyHz}
          amplitude={amplitude}
          targetSize={targetSize}
          density={density}
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

  return (
    <div className={`app-shell ${focusMode ? "is-focus-mode" : ""}`}>
      {focusFeedback && <div className="app-feedback" role="status">{focusFeedback}</div>}

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

            <BackgroundPanel background={background} onChange={setBackground} />
            <ObjectivePanel objective={objective} onChange={setObjective} />
            <ParameterPanel
              frequencyHz={frequencyHz}
              amplitude={amplitude}
              targetSize={targetSize}
              density={density}
              duration={duration}
              sets={sets}
              rest={rest}
              onFrequencyChange={setFrequencyHz}
              onAmplitudeChange={setAmplitude}
              onTargetSizeChange={setTargetSize}
              onDensityChange={setDensity}
              onDurationChange={setDuration}
              onSetsChange={setSets}
              onRestChange={setRest}
              durationLocked={sessionLocked}
              setsLocked={sessionLocked}
              restLocked={sessionState === "resting"}
            >
              <SessionControls
                running={running}
                playLabel={playLabel}
                skipLabel={skipLabel}
                skipDisabled={skipDisabled}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
                onReset={resetSession}
              />
            </ParameterPanel>
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
                onToggleMetronome={() => setMetronomeEnabled((value) => !value)}
              />
            </div>
          </section>
        </main>
      </div>

      {showSafety && <SafetyModal onClose={() => setShowSafety(false)} />}
    </div>
  );
}
