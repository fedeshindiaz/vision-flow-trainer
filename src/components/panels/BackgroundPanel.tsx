import { memo, useEffect, useRef, useState } from "react";
import { backgroundDirectionTypes, backgroundTypes } from "../../constants/modules";
import type { BackgroundConfig, BackgroundType } from "../../types";
import { Icon, ToggleButton } from "../ui";

export const BackgroundPanel = memo(function BackgroundPanel({
  background,
  onChange,
}: {
  background: BackgroundConfig;
  onChange: (background: BackgroundConfig) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lastBackgroundTypeRef = useRef<BackgroundType>("stripes");
  const directionLabel = background.direction === "center" ? "fijo" : background.direction;
  const summary = background.enabled ? `${background.type} · ${directionLabel}` : "Fondo liso";

  useEffect(() => {
    if (background.enabled && background.type !== "none") {
      lastBackgroundTypeRef.current = background.type;
    }
  }, [background.enabled, background.type]);

  return (
    <section className="panel collapsible-panel">
      <div className="panel-header compact-panel-header">
        <button
          type="button"
          className="panel-title-button"
          aria-expanded={expanded}
          aria-controls="background-panel-body"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="panel-title-main">
            <Icon name="bg" /> Fondo
          </span>
          <span className="panel-summary">{summary}</span>
        </button>

        <div className="panel-actions">
          <ToggleButton
            active={background.enabled}
            onClick={() =>
              onChange({
                ...background,
                enabled: !background.enabled,
                type: !background.enabled && background.type === "none" ? lastBackgroundTypeRef.current : background.type,
              })
            }
          >
            {background.enabled ? "ON" : "OFF"}
          </ToggleButton>
          <button
            type="button"
            className="collapse-button"
            aria-label={expanded ? "Ocultar fondo" : "Mostrar fondo"}
            aria-expanded={expanded}
            aria-controls="background-panel-body"
            onClick={() => setExpanded((value) => !value)}
          >
            <Icon name="chevronDown" className={`collapse-icon ${expanded ? "open" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="panel-body" id="background-panel-body">
          <div className="chip-grid three">
            {backgroundTypes.map((item) => {
              const nextDirection =
                item.key === "checkerboard" && background.type !== "checkerboard" ? "center" : background.direction;

              return (
                <ToggleButton
                  key={item.key}
                  active={background.type === item.key}
                  onClick={() =>
                    onChange({
                      ...background,
                      enabled: item.key !== "none",
                      type: item.key,
                      direction: nextDirection,
                    })
                  }
                >
                  {item.label}
                </ToggleButton>
              );
            })}
          </div>

          <div className="chip-grid five">
            {backgroundDirectionTypes.map((direction) => (
              <ToggleButton
                key={direction.key}
                active={background.direction === direction.key}
                onClick={() =>
                  onChange({
                    ...background,
                    enabled: true,
                    type: background.type === "none" ? "stripes" : background.type,
                    direction: direction.key,
                  })
                }
              >
                {direction.label}
              </ToggleButton>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
