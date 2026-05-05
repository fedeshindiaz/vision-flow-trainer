import { useEffect, useRef } from "react";
import { directionTypes, objectiveModes } from "../../constants/modules";
import type { Direction, ObjectiveConfig, ObjectiveMode } from "../../types";
import { Icon, ToggleButton } from "../ui";

const objectiveDirections: Array<{ key: Direction; label: string }> = [
  ...directionTypes.slice(0, 8),
  { key: "lissajous", label: "∞" },
  { key: "center", label: "Centro" },
];

export function ObjectivePanel({
  objective,
  onChange,
}: {
  objective: ObjectiveConfig;
  onChange: (objective: ObjectiveConfig) => void;
}) {
  const lastObjectiveModeRef = useRef<ObjectiveMode>("fixed");

  useEffect(() => {
    if (objective.enabled && objective.mode !== "none") {
      lastObjectiveModeRef.current = objective.mode;
    }
  }, [objective.enabled, objective.mode]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          <Icon name="target" /> Objetivo
        </h2>
        <ToggleButton
          active={objective.enabled}
          onClick={() =>
            onChange({
              ...objective,
              enabled: !objective.enabled,
              mode: !objective.enabled && objective.mode === "none" ? lastObjectiveModeRef.current : objective.mode,
            })
          }
        >
          {objective.enabled ? "ON" : "OFF"}
        </ToggleButton>
      </div>

      <div className="chip-grid three">
        {objectiveModes.map((mode) => (
          <ToggleButton
            key={mode.key}
            active={objective.mode === mode.key}
            onClick={() => onChange({ ...objective, enabled: mode.key !== "none", mode: mode.key })}
          >
            {mode.label}
          </ToggleButton>
        ))}
      </div>

      <div className="chip-grid five">
        {objectiveDirections.map((direction) => (
          <ToggleButton
            key={direction.key}
            active={objective.direction === direction.key}
            onClick={() =>
              onChange({
                ...objective,
                enabled: true,
                mode: objective.mode === "none" ? "fixed" : objective.mode,
                direction: direction.key,
              })
            }
          >
            {direction.label}
          </ToggleButton>
        ))}
      </div>

      {objective.enabled && objective.mode === "fixed" && (
        <p className="panel-note">En objetivo fijo la dirección solo describe el protocolo; el punto queda centrado.</p>
      )}
    </section>
  );
}
