import { Icon } from "../ui";

interface SessionControlsProps {
  running: boolean;
  playLabel: string;
  skipLabel: string;
  skipDisabled: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export function SessionControls({
  running,
  playLabel,
  skipLabel,
  skipDisabled,
  onPlayPause,
  onSkip,
  onReset,
}: SessionControlsProps) {
  return (
    <div className="session-controls">
      <button type="button" className="primary-action" onClick={onPlayPause}>
        <Icon name={running ? "pause" : "play"} /> {playLabel}
      </button>
      <button type="button" className="secondary-action" disabled={skipDisabled} onClick={onSkip}>
        <Icon name="skip" /> {skipLabel}
      </button>
      <button type="button" className="secondary-action" onClick={onReset}>
        <Icon name="reset" /> Reset
      </button>
    </div>
  );
}
