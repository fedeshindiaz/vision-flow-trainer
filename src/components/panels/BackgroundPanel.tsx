import { backgroundTypes, directionTypes } from "../../constants/modules";
import type { BackgroundConfig } from "../../types";
import { Icon, ToggleButton } from "../ui";

export function BackgroundPanel({
  background,
  onChange,
}: {
  background: BackgroundConfig;
  onChange: (background: BackgroundConfig) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          <Icon name="bg" /> Fondo
        </h2>
        <ToggleButton
          active={background.enabled}
          onClick={() =>
            onChange({
              ...background,
              enabled: !background.enabled,
              type: !background.enabled && background.type === "none" ? "stripes" : background.type,
            })
          }
        >
          {background.enabled ? "ON" : "OFF"}
        </ToggleButton>
      </div>

      <div className="chip-grid three">
        {backgroundTypes.map((item) => (
          <ToggleButton
            key={item.key}
            active={background.type === item.key}
            onClick={() => onChange({ ...background, enabled: item.key !== "none", type: item.key })}
          >
            {item.label}
          </ToggleButton>
        ))}
      </div>

      <div className="chip-grid five">
        {directionTypes.map((direction) => (
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
    </section>
  );
}
