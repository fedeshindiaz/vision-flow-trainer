import { Icon } from "./ui";

interface CastButtonProps {
  statusLabel: string;
  isConfigured: boolean;
  sdkStatus: string;
  isConnected: boolean;
  lastError?: string;
}

export function CastButton({ statusLabel, isConfigured, sdkStatus, isConnected, lastError }: CastButtonProps) {
  const disabled = !isConfigured || sdkStatus === "loading" || sdkStatus === "error" || sdkStatus === "unavailable";

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
    <div className={`cast-control ${isConnected ? "cast-control-connected" : ""}`} title={lastError || statusLabel}>
      <google-cast-launcher className="cast-launcher" aria-label="Transmitir a Google Cast"></google-cast-launcher>
      <span className="cast-control-main">
        <Icon name="cast" /> Transmitir
      </span>
      <small>{statusLabel}</small>
    </div>
  );
}
