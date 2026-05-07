import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { BackgroundConfig, ObjectiveConfig, Protocol } from "../../types";
import { Icon } from "../ui";
import { VisualCanvas } from "../canvas/VisualCanvas";

interface SessionViewportProps {
  focusHostRef: RefObject<HTMLDivElement>;
  focusMode: boolean;
  selectedProtocol: Protocol;
  background: BackgroundConfig;
  objective: ObjectiveConfig;
  frequencyHz: number;
  amplitude: number;
  targetSize: number;
  density: number;
  stripeSize: number;
  resetKey: number;
  visualRunning: boolean;
  tempoStartedAtMs: number | null;
  tempoAccumulatedElapsedMs: number;
  onExitFocusMode: () => void;
  isAppleEnvironment: boolean;
  isAppleTouchEnvironment: boolean;
  running: boolean;
  playLabel: string;
  onPlayPause: () => void;
  onReset: () => void;
  onAppleSafeExit: () => void;
}

export function SessionViewport({
  focusHostRef,
  focusMode,
  selectedProtocol,
  background,
  objective,
  frequencyHz,
  amplitude,
  targetSize,
  density,
  stripeSize,
  resetKey,
  visualRunning,
  tempoStartedAtMs,
  tempoAccumulatedElapsedMs,
  onExitFocusMode,
  isAppleEnvironment,
  isAppleTouchEnvironment,
  running,
  playLabel,
  onPlayPause,
  onReset,
  onAppleSafeExit,
}: SessionViewportProps) {
  const [appleControlsVisible, setAppleControlsVisible] = useState(true);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const controlsTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const appleSafeSessionActive = focusMode && isAppleEnvironment;

  const clearControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const revealAppleControls = useCallback(() => {
    if (!appleSafeSessionActive) return;

    clearControlsTimer();
    setAppleControlsVisible(true);

    if (visualRunning) {
      controlsTimerRef.current = window.setTimeout(() => setAppleControlsVisible(false), 3800);
    }
  }, [appleSafeSessionActive, clearControlsTimer, visualRunning]);

  useEffect(() => {
    if (!appleSafeSessionActive) {
      clearControlsTimer();
      clearLongPressTimer();
      setAppleControlsVisible(true);
      setExitConfirmVisible(false);
      return;
    }

    revealAppleControls();

    return () => {
      clearControlsTimer();
      clearLongPressTimer();
    };
  }, [appleSafeSessionActive, clearControlsTimer, clearLongPressTimer, revealAppleControls]);

  const handleViewportPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!appleSafeSessionActive) return;

      revealAppleControls();

      if (!isAppleTouchEnvironment || event.pointerType === "mouse" || (event.target as HTMLElement).closest("button")) {
        return;
      }

      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        setAppleControlsVisible(true);
        setExitConfirmVisible(true);
      }, 2000);
    },
    [appleSafeSessionActive, clearLongPressTimer, isAppleTouchEnvironment, revealAppleControls],
  );

  const handleExit = useCallback(() => {
    setExitConfirmVisible(false);
    onAppleSafeExit();
  }, [onAppleSafeExit]);

  const viewportClassName = `viewport ${appleSafeSessionActive ? "apple-safe-session" : ""} ${
    appleControlsVisible ? "apple-controls-visible" : ""
  }`;

  return (
    <div className="viewport-shell" ref={focusHostRef}>
      <div
        className={viewportClassName}
        onDoubleClick={focusMode && !appleSafeSessionActive ? onExitFocusMode : undefined}
        onPointerDown={handleViewportPointerDown}
        onPointerUp={clearLongPressTimer}
        onPointerCancel={clearLongPressTimer}
        onPointerLeave={clearLongPressTimer}
      >
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
          syncStartMs={tempoStartedAtMs}
          syncBaseElapsedMs={tempoAccumulatedElapsedMs}
        />

        <div className="viewport-label top">
          <span>
            {selectedProtocol.category}
            {selectedProtocol.sourceVideo ? ` - video ${selectedProtocol.sourceVideo}` : ""}
          </span>
          <strong>{selectedProtocol.name}</strong>
          <p>{selectedProtocol.cue}</p>
        </div>

        <div className="viewport-label bottom">
          <div>
            <span>Fondo</span>
            <strong>{background.enabled ? `${background.type} - ${background.direction}` : "Fondo liso"}</strong>
          </div>
          <div>
            <span>Objetivo</span>
            <strong>{objective.enabled ? `${objective.mode} - ${objective.direction}` : "Sin objetivo"}</strong>
          </div>
          <div>
            <span>Frecuencia</span>
            <strong>{frequencyHz.toFixed(1)} Hz</strong>
          </div>
        </div>

        {appleSafeSessionActive && (
          <>
            <button type="button" className="apple-safe-exit-button" onClick={handleExit}>
              <Icon name="close" /> Salir
            </button>

            {appleControlsVisible && (
              <div className="apple-session-controls">
                <button type="button" className="apple-session-control primary" onClick={onPlayPause}>
                  <Icon name={running ? "pause" : "play"} /> {playLabel}
                </button>
                <button type="button" className="apple-session-control" onClick={onReset}>
                  <Icon name="reset" /> Reset
                </button>
                <button type="button" className="apple-session-control" onClick={handleExit}>
                  <Icon name="close" /> Salir
                </button>
              </div>
            )}

            {exitConfirmVisible && (
              <div className="apple-exit-confirm" role="dialog" aria-modal="true" aria-label="Salida de emergencia">
                <strong>Salir del ejercicio</strong>
                <p>La sesion se pausa y vuelve a la configuracion.</p>
                <div>
                  <button type="button" className="apple-session-control primary" onClick={handleExit}>
                    Pausar y salir
                  </button>
                  <button type="button" className="apple-session-control" onClick={() => setExitConfirmVisible(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
