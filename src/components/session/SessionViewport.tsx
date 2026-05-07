import type { RefObject } from "react";
import type { BackgroundConfig, ObjectiveConfig, Protocol } from "../../types";
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
}: SessionViewportProps) {
  return (
    <div className="viewport-shell" ref={focusHostRef}>
      <div className="viewport" onDoubleClick={focusMode ? onExitFocusMode : undefined}>
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
      </div>
    </div>
  );
}
