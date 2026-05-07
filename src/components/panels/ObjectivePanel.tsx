import { memo, useEffect, useRef, useState } from "react";
import { directionTypes, objectiveModes } from "../../constants/modules";
import type { Direction, ObjectiveConfig, ObjectiveMode } from "../../types";
import { Icon, ToggleButton } from "../ui";

const objectiveDirections: Array<{ key: Direction; label: string }> = [
  ...directionTypes.slice(0, 8),
  { key: "lissajous", label: "∞" },
  { key: "center", label: "Centro" },
];

export const ObjectivePanel = memo(function ObjectivePanel({
  objective,
  onChange,
}: {
  objective: ObjectiveConfig;
  onChange: (objective: ObjectiveConfig) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lastObjectiveModeRef = useRef<ObjectiveMode>("fixed");
  const summary = objective.enabled ? `${objective.mode} · ${objective.direction}` : "Sin objetivo";

  useEffect(() => {
    if (objective.enabled && objective.mode !== "none") {
      lastObjectiveModeRef.current = objective.mode;
    }
  }, [objective.enabled, objective.mode]);

  return (
    <section className="panel collapsible-panel">
      <div className="panel-header compact-panel-header">
        <button
          type="button"
          className="panel-title-button"
          aria-expanded={expanded}
          aria-controls="objective-panel-body"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="panel-title-main">
            <Icon name="target" /> Objetivo
          </span>
          <span className="panel-summary">{summary}</span>
        </button>

        <div className="panel-actions">
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
          <button
            type="button"
            className="collapse-button"
            aria-label={expanded ? "Ocultar objetivo" : "Mostrar objetivo"}
            aria-expanded={expanded}
            aria-controls="objective-panel-body"
            onClick={() => setExpanded((value) => !value)}
          >
            <Icon name="chevronDown" className={`collapse-icon ${expanded ? "open" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="panel-body" id="objective-panel-body">
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
        </div>
      )}
    </section>
  );
});
