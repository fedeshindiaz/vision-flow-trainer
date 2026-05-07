import { formatTime } from "../../utils";
import { InfoCard } from "../ui";
import { MetronomeCard } from "./MetronomeCard";

interface SessionMetricsProps {
  timeLeft: number;
  currentSet: number;
  sets: number;
  sessionState: "idle" | "playing" | "resting" | "done";
  metronomeActive: boolean;
  frequencyHz: number;
  soundEnabled: boolean;
  metronomeEnabled: boolean;
  beat: number;
  onToggleSound: () => void;
  onToggleMetronome: () => void;
}

export function SessionMetrics({
  timeLeft,
  currentSet,
  sets,
  sessionState,
  metronomeActive,
  frequencyHz,
  soundEnabled,
  metronomeEnabled,
  beat,
  onToggleSound,
  onToggleMetronome,
}: SessionMetricsProps) {
  return (
    <div className="status-grid">
      <InfoCard
        label="Cronometro"
        title={formatTime(timeLeft)}
        text={sessionState === "resting" ? "Descanso" : sessionState === "done" ? "Completado" : "Tiempo restante"}
      />
      <InfoCard label="Vueltas" title={`${currentSet}/${sets}`} text="Serie actual" />
      <MetronomeCard
        active={metronomeActive}
        frequencyHz={frequencyHz}
        soundEnabled={soundEnabled}
        metronomeEnabled={metronomeEnabled}
        beat={beat}
        onToggleSound={onToggleSound}
        onToggleMetronome={onToggleMetronome}
      />
    </div>
  );
}
