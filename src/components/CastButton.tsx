import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { Icon } from "./ui";

interface CastButtonProps {
  statusLabel: string;
  isConfigured: boolean;
  sdkStatus: string;
  isConnected: boolean;
  lastError?: string;
}

export function CastButton({ statusLabel, isConfigured, sdkStatus, isConnected, lastError }: CastButtonProps) {
  const launcherRef = useRef<HTMLElement | null>(null);
  const disabled = !isConfigured || sdkStatus === "loading" || sdkStatus === "error" || sdkStatus === "unavailable";

  const handleLauncherProxy = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === launcherRef.current) return;
    launcherRef.current?.click();
  };

  const handleLauncherKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    launcherRef.current?.click();
  };

  if (disabled) {
    return (
      <button type="button" className="cast-control cast-control-disabled" disabled title={lastError || statusLabel}>
        <span className="cast-control-main">
          <Icon name="cast" /> Transmitir
        </span>
        <small>{statusLabel}</small>
      </button>
    );
  }

  return (
    <div
      className={`cast-control ${isConnected ? "cast-control-connected" : ""}`}
      title={lastError || statusLabel}
      role="button"
      tabIndex={0}
      onClick={handleLauncherProxy}
      onKeyDown={handleLauncherKey}
    >
      <span className="cast-icon-stack" aria-hidden="true">
        <Icon name="cast" />
        <google-cast-launcher
          ref={launcherRef}
          className="cast-launcher-icon"
          aria-label="Transmitir a Google Cast"
        ></google-cast-launcher>
      </span>
      <span className="cast-control-main">Transmitir</span>
      <small>{statusLabel}</small>
    </div>
  );
}
