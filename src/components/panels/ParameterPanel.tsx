import { useState } from "react";
import { Icon, Stepper } from "../ui";

interface ParameterPanelProps {
  frequencyHz: number;
  amplitude: number;
  targetSize: number;
  density: number;
  stripeSize: number;
  duration: number;
  sets: number;
  rest: number;
  onFrequencyChange: (value: number) => void;
  onAmplitudeChange: (value: number) => void;
  onTargetSizeChange: (value: number) => void;
  onDensityChange: (value: number) => void;
  onStripeSizeChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onSetsChange: (value: number) => void;
  onRestChange: (value: number) => void;
  durationLocked?: boolean;
  setsLocked?: boolean;
  restLocked?: boolean;
}

export function ParameterPanel({
  frequencyHz,
  amplitude,
  targetSize,
  density,
  stripeSize,
  duration,
  sets,
  rest,
  onFrequencyChange,
  onAmplitudeChange,
  onTargetSizeChange,
  onDensityChange,
  onStripeSizeChange,
  onDurationChange,
  onSetsChange,
  onRestChange,
  durationLocked,
  setsLocked,
  restLocked,
}: ParameterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = `${sets} series · ${rest}s descanso · ${duration}s · ${frequencyHz.toFixed(1)} Hz`;

  return (
    <section className="panel parameter-panel collapsible-panel">
      <div className="panel-header compact-panel-header">
        <button
          type="button"
          className="panel-title-button"
          aria-expanded={expanded}
          aria-controls="parameter-panel-body"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="panel-title-main">
            <Icon name="mix" /> Parámetros
          </span>
          <span className="panel-summary">{summary}</span>
        </button>

        <button
          type="button"
          className="collapse-button"
          aria-label={expanded ? "Ocultar parámetros" : "Mostrar parámetros"}
          aria-expanded={expanded}
          aria-controls="parameter-panel-body"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "-" : "+"}
        </button>
      </div>

      {expanded && (
        <div className="panel-body parameter-settings" id="parameter-panel-body">
          <div className="split-grid">
            <Stepper label="Series" value={sets} unit="" min={1} max={8} step={1} disabled={setsLocked} onChange={onSetsChange} />
            <Stepper label="Descanso" value={rest} unit="s" min={10} max={120} step={5} disabled={restLocked} onChange={onRestChange} />
          </div>

          <div className="split-grid">
            <Stepper label="Frecuencia" value={frequencyHz} unit="Hz" min={0.1} max={3} step={0.1} onChange={onFrequencyChange} />
            <Stepper label="Amplitud" value={amplitude} unit="%" min={10} max={80} step={5} onChange={onAmplitudeChange} />
          </div>

          <div className="split-grid">
            <Stepper label="Duración" value={duration} unit="s" min={10} max={180} step={5} disabled={durationLocked} onChange={onDurationChange} />
            <Stepper label="Tamaño objeto" value={targetSize} unit="px" min={10} max={90} step={5} onChange={onTargetSizeChange} />
          </div>

          <div className="split-grid">
            <Stepper label="Separación fondo" value={density} unit="px" min={32} max={180} step={4} onChange={onDensityChange} />
            <Stepper label="Tamaño franjas" value={stripeSize} unit="px" min={4} max={120} step={4} onChange={onStripeSizeChange} />
          </div>
        </div>
      )}
    </section>
  );
}
