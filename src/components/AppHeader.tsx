import { CastButton } from "./CastButton";
import { APP_ICON_SRC, APP_NAME, APP_SUBTITLE } from "../constants/modules";
import { Icon } from "./ui";

interface AppHeaderProps {
  version: string;
  castStatusLabel: string;
  castIsConfigured: boolean;
  castSdkStatus: string;
  castIsConnected: boolean;
  castLastError?: string;
  onSafety: () => void;
  onFocusMode: () => void;
}

export function AppHeader({
  version,
  castStatusLabel,
  castIsConfigured,
  castSdkStatus,
  castIsConnected,
  castLastError,
  onSafety,
  onFocusMode,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <img src={APP_ICON_SRC} alt={`${APP_NAME} icon`} />
        <div>
          <div className="brand-title-row">
            <h1>{APP_NAME}</h1>
            <span className="version-pill">v{version}</span>
          </div>
          <p>{APP_SUBTITLE}</p>
        </div>
      </div>
      <div className="header-actions">
        <CastButton
          statusLabel={castStatusLabel}
          isConfigured={castIsConfigured}
          sdkStatus={castSdkStatus}
          isConnected={castIsConnected}
          lastError={castLastError}
        />
        <button type="button" className="secondary-action" onClick={onSafety}>
          <Icon name="shield" /> Seguridad
        </button>
        <button type="button" className="dark-action" onClick={onFocusMode}>
          <Icon name="screen" /> Modo pantalla
        </button>
      </div>
    </header>
  );
}
