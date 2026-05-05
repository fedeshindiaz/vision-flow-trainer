import { getBeatIntervalMs } from "../../utils/timing";
import { Icon, ToggleButton } from "../ui";

interface MetronomeCardProps {
  active: boolean;
  frequencyHz: number;
  soundEnabled: boolean;
  metronomeEnabled: boolean;
  beat: number;
  onToggleSound: () => void;
  onToggleMetronome: () => void;
}

export function MetronomeCard({
  active,
  frequencyHz,
  soundEnabled,
  metronomeEnabled,
  beat,
  onToggleSound,
  onToggleMetronome,
}: MetronomeCardProps) {
  const bpm = Math.round(frequencyHz * 60);
  const intervalMs = Math.round(getBeatIntervalMs(frequencyHz));

  return (
    <div className="metronome-card">
      <div className="metronome-main">
        <div>
          <span className="eyebrow">Metrónomo</span>
          <strong>{frequencyHz.toFixed(1)} Hz</strong>
          <p>
            {bpm} BPM · {intervalMs} ms/click
          </p>
        </div>
        <button type="button" className={`sound-button ${soundEnabled ? "enabled" : ""}`} onClick={onToggleSound}>
          <Icon name="sound" /> Sonido {soundEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="beat-row">
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} className={active && beat % 4 === index ? "beat active" : "beat"} />
        ))}
      </div>

      <div className="metronome-toggle">
        <ToggleButton active={metronomeEnabled} onClick={onToggleMetronome}>
          {metronomeEnabled ? "Metrónomo ON" : "Metrónomo OFF"}
        </ToggleButton>
        <p>Intervalo = 1 / Hz. El movimiento lineal cambia de extremo en cada click.</p>
      </div>
    </div>
  );
}
