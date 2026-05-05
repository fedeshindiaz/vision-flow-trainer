import { useState, type ReactNode } from "react";
import { Icon, SliderControl, Stepper } from "../ui";

interface ParameterPanelProps {
  frequencyHz: number;
  amplitude: number;
  targetSize: number;
  density: number;
  duration: number;
  sets: number;
  rest: number;
  onFrequencyChange: (value: number) => void;
  onAmplitudeChange: (value: number) => void;
  onTargetSizeChange: (value: number) => void;
  onDensityChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onSetsChange: (value: number) => void;
  onRestChange: (value: number) => void;
  durationLocked?: boolean;
  setsLocked?: boolean;
  restLocked?: boolean;
  children: ReactNode;
}

export function ParameterPanel({
  frequencyHz,
  amplitude,
  targetSize,
  density,
  duration,
  sets,
  rest,
  onFrequencyChange,
  onAmplitudeChange,
  onTargetSizeChange,
  onDensityChange,
  onDurationChange,
  onSetsChange,
  onRestChange,
  durationLocked,
  setsLocked,
  restLocked,
  children,
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
          className="collapse-button text-collapse-button"
          aria-expanded={expanded}
          aria-controls="parameter-panel-body"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Ocultar" : "Ajustes"}
        </button>
      </div>

      {children}

      {expanded && (
        <div className="panel-body parameter-settings" id="parameter-panel-body">
          <div className="split-grid">
            <Stepper label="Series" value={sets} unit="" min={1} max={8} step={1} disabled={setsLocked} onChange={onSetsChange} />
            <Stepper label="Descanso" value={rest} unit="s" min={10} max={120} step={5} disabled={restLocked} onChange={onRestChange} />
          </div>

          <SliderControl label="Frecuencia / velocidad" value={frequencyHz} min={0.1} max={3} step={0.1} unit=" Hz" onChange={onFrequencyChange} />
          <SliderControl label="Amplitud" value={amplitude} min={10} max={80} step={5} unit=" %" onChange={onAmplitudeChange} />
          <SliderControl label="Duración" value={duration} min={10} max={180} step={5} unit=" s" disabled={durationLocked} onChange={onDurationChange} />
          <SliderControl label="Tamaño objetivo" value={targetSize} min={10} max={90} step={5} unit=" px" onChange={onTargetSizeChange} />
          <SliderControl label="Densidad fondo" value={density} min={24} max={96} step={4} unit=" px" onChange={onDensityChange} />
        </div>
      )}
    </section>
  );
}
