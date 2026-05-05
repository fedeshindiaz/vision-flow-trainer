import type { ReactNode } from "react";
import { iconMap } from "../constants/modules";
import { clamp } from "../utils";

export function Icon({ name, className = "" }: { name: keyof typeof iconMap; className?: string }) {
  return (
    <span aria-hidden="true" className={`icon ${className}`}>
      {iconMap[name] || "•"}
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
  return (
    <div className={`stepper ${disabled ? "control-disabled" : ""}`}>
      <span className="stepper-label">{label}</span>
      <div className="stepper-body">
        <button type="button" disabled={disabled} onClick={() => onChange(clamp(value - step, min, max))}>
          −
        </button>
        <strong>
          {value}
          <small>{unit}</small>
        </strong>
        <button type="button" disabled={disabled} onClick={() => onChange(clamp(value + step, min, max))}>
          +
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
