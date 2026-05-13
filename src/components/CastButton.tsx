import { useRef } from "react";
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

  const handleLauncherProxy = () => {
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
    <button
      type="button"
      className={`cast-control ${isConnected ? "cast-control-connected" : ""}`}
      title={lastError || statusLabel}
      onClick={handleLauncherProxy}
      aria-label={`Transmitir. ${statusLabel}`}
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
    </button>
  );
}
