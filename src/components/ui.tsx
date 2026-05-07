import type { ReactNode } from "react";
import {
  Cast,
  ChevronDown,
  Circle,
  ClipboardList,
  Grid3X3,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  SkipForward,
  SlidersHorizontal,
  Target,
  Volume2,
  X,
} from "lucide-react";
import { clamp } from "../utils";

const iconComponents = {
  sound: Volume2,
  close: X,
  shield: Shield,
  play: Play,
  pause: Pause,
  skip: SkipForward,
  reset: RotateCcw,
  target: Target,
  bg: Grid3X3,
  mix: SlidersHorizontal,
  screen: Maximize2,
  cast: Cast,
  protocols: ClipboardList,
  plus: Plus,
  minus: Minus,
  chevronDown: ChevronDown,
} as const;

export type IconName = keyof typeof iconComponents;

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const IconComponent = iconComponents[name] ?? Circle;

  return (
    <span aria-hidden="true" className={`icon ${className}`}>
      <IconComponent strokeWidth={2.2} />
    </span>
  );
}

export function ToggleButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`chip ${active ? "chip-active" : ""}`}
    >
      {children}
    </button>
  );
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`control-card ${disabled ? "control-disabled" : ""}`}>
      <span className="control-row">
        <span>{label}</span>
        <strong>
          {Number(value).toFixed(step < 1 ? 1 : 0)}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const precision = getDecimalPrecision(step);
  const formattedValue = precision > 0 ? value.toFixed(precision) : String(value);
  const changeBy = (delta: number) => {
    const nextValue = clamp(value + delta, min, max);

    onChange(Number(nextValue.toFixed(precision)));
  };

  return (
    <div className={`stepper ${disabled ? "control-disabled" : ""}`}>
      <span className="stepper-label">{label}</span>
      <div className="stepper-body">
        <button type="button" disabled={disabled} onClick={() => changeBy(-step)}>
          <Icon name="minus" />
        </button>
        <strong>
          {formattedValue}
          <small>{unit}</small>
        </strong>
        <button type="button" disabled={disabled} onClick={() => changeBy(step)}>
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}

export function InfoCard({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="info-card">
      <span>{label}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function getDecimalPrecision(value: number) {
  const [, decimals = ""] = String(value).split(".");

  return decimals.length;
}
