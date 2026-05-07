import { createContext, useContext } from "react";

export type CastSdkStatus = "not_configured" | "disabled" | "loading" | "available" | "unavailable" | "error";

export interface CastSessionLike {
  addMessageListener?: (namespace: string, listener: (namespace: string, message: unknown) => void) => void;
  removeMessageListener?: (namespace: string, listener: (namespace: string, message: unknown) => void) => void;
  sendMessage?: (namespace: string, data: unknown) => Promise<unknown>;
  endSession?: (stopCasting: boolean) => Promise<unknown>;
  getSessionId?: () => string;
  getSessionObj?: () => Record<string, unknown>;
}

export interface CastContextLike {
  setOptions: (options: { receiverApplicationId: string; autoJoinPolicy?: string }) => void;
  getCastState?: () => string;
  getCurrentSession?: () => CastSessionLike | null;
  requestSession?: () => Promise<unknown>;
  addEventListener?: (eventType: string, listener: (event: Record<string, unknown>) => void) => void;
  removeEventListener?: (eventType: string, listener: (event: Record<string, unknown>) => void) => void;
}

export interface CastDebugInfo {
  sdkScriptPresent: boolean;
  sdkScriptLoaded: boolean;
  gCastApiAvailable: boolean | null;
  castFrameworkAvailable: boolean;
  setOptionsAppId: string;
  setOptionsCallCount: number;
  autoJoinPolicy?: string;
  lastInitializationError: string;
}

export interface CastProviderValue {
  appId: string;
  sdkStatus: CastSdkStatus;
  castState: string;
  sessionState: string;
  currentSession: CastSessionLike | null;
  castContext: CastContextLike | null;
  debugInfo: CastDebugInfo;
  isConfigured: boolean;
  isConnected: boolean;
  requestSession: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const CastContext = createContext<CastProviderValue | null>(null);

export function useCastContext() {
  const value = useContext(CastContext);

  if (!value) {
    throw new Error("useCastContext must be used inside CastProvider");
  }

  return value;
}
