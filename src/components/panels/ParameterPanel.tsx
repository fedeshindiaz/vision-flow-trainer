import type { ReactNode } from "react";
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
  children,
}: ParameterPanelProps) {
  return (
    <section className="panel parameter-panel">
      <h2>
        <Icon name="mix" /> Parámetros
      </h2>

      <div className="split-grid">
        <Stepper label="Series" value={sets} unit="" min={1} max={8} step={1} onChange={onSetsChange} />
        <Stepper label="Descanso" value={rest} unit="s" min={10} max={120} step={5} onChange={onRestChange} />
      </div>

      <SliderControl label="Frecuencia / velocidad" value={frequencyHz} min={0.1} max={3} step={0.1} unit=" Hz" onChange={onFrequencyChange} />
      <SliderControl label="Amplitud" value={amplitude} min={10} max={80} step={5} unit=" %" onChange={onAmplitudeChange} />
      <SliderControl label="Duración" value={duration} min={10} max={180} step={5} unit=" s" onChange={onDurationChange} />
      <SliderControl label="Tamaño objetivo" value={targetSize} min={10} max={90} step={5} unit=" px" onChange={onTargetSizeChange} />
      <SliderControl label="Densidad fondo" value={density} min={24} max={96} step={4} unit=" px" onChange={onDensityChange} />

      {children}
    </section>
  );
}
