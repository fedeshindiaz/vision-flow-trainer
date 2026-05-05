import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CastContext, type CastContextLike, type CastProviderValue, type CastSdkStatus, type CastSessionLike } from "./castContext";

const CAST_SENDER_SDK_URL = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

interface CastWindow extends Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  cast?: {
    framework?: {
      CastContext?: {
        getInstance: () => CastContextLike;
      };
      CastContextEventType?: {
        CAST_STATE_CHANGED?: string;
        SESSION_STATE_CHANGED?: string;
      };
    };
  };
  chrome?: {
    cast?: {
      AutoJoinPolicy?: {
        ORIGIN_SCOPED?: string;
      };
    };
  };
}

export function CastProvider({ children }: { children: ReactNode }) {
  const appId = (import.meta.env.VITE_CAST_APP_ID as string | undefined)?.trim() ?? "";
  const isReceiverRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/cast-receiver");
  const [sdkStatus, setSdkStatus] = useState<CastSdkStatus>(isReceiverRoute ? "disabled" : appId ? "loading" : "not_configured");
  const [castState, setCastState] = useState("UNKNOWN");
  const [sessionState, setSessionState] = useState("NO_SESSION");
  const [currentSession, setCurrentSession] = useState<CastSessionLike | null>(null);
  const [castContext, setCastContext] = useState<CastContextLike | null>(null);
  const initializedRef = useRef(false);
  const removeListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isReceiverRoute) {
      setSdkStatus("disabled");
      return undefined;
    }

    if (!appId) {
      setSdkStatus("not_configured");
      return undefined;
    }

    const castWindow = window as CastWindow;
    let cancelled = false;

    const initializeCast = (isAvailable: boolean) => {
      if (cancelled) return;

      if (!isAvailable || !castWindow.cast?.framework?.CastContext) {
        setSdkStatus("unavailable");
        return;
      }

      try {
        const context = castWindow.cast.framework.CastContext.getInstance();
        context.setOptions({
          receiverApplicationId: appId,
          autoJoinPolicy: castWindow.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED,
        });

        setCastContext(context);
        setCastState(context.getCastState?.() ?? "UNKNOWN");
        setCurrentSession(context.getCurrentSession?.() ?? null);
        setSdkStatus("available");
        initializedRef.current = true;

        const eventTypes = castWindow.cast.framework.CastContextEventType;
        const castStateEvent = eventTypes?.CAST_STATE_CHANGED ?? "caststatechanged";
        const sessionStateEvent = eventTypes?.SESSION_STATE_CHANGED ?? "sessionstatechanged";

        const handleCastState = (event: Record<string, unknown>) => {
          setCastState(typeof event.castState === "string" ? event.castState : context.getCastState?.() ?? "UNKNOWN");
        };

        const handleSessionState = (event: Record<string, unknown>) => {
          setSessionState(typeof event.sessionState === "string" ? event.sessionState : "UNKNOWN");
          setCurrentSession(context.getCurrentSession?.() ?? null);
        };

        removeListenersRef.current?.();
        context.addEventListener?.(castStateEvent, handleCastState);
        context.addEventListener?.(sessionStateEvent, handleSessionState);
        removeListenersRef.current = () => {
          context.removeEventListener?.(castStateEvent, handleCastState);
          context.removeEventListener?.(sessionStateEvent, handleSessionState);
        };
      } catch {
        setSdkStatus("error");
      }

      return undefined;
    };

    if (initializedRef.current && castWindow.cast?.framework?.CastContext) {
      initializeCast(true);
      return undefined;
    }

    const previousCallback = castWindow.__onGCastApiAvailable;
    castWindow.__onGCastApiAvailable = (isAvailable: boolean) => {
      previousCallback?.(isAvailable);
      initializeCast(isAvailable);
    };

    let script = document.querySelector<HTMLScriptElement>(`script[src="${CAST_SENDER_SDK_URL}"]`);

    if (!script) {
      script = document.createElement("script");
      script.src = CAST_SENDER_SDK_URL;
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setSdkStatus("error");
      };
      document.head.appendChild(script);
    } else if (castWindow.cast?.framework?.CastContext) {
      initializeCast(true);
    }

    return () => {
      cancelled = true;
      removeListenersRef.current?.();
      removeListenersRef.current = null;

      if (castWindow.__onGCastApiAvailable === previousCallback) return;
      castWindow.__onGCastApiAvailable = previousCallback;
    };
  }, [appId, isReceiverRoute]);

  const value = useMemo<CastProviderValue>(() => {
    const isConnected = Boolean(currentSession) && ["SESSION_STARTED", "SESSION_RESUMED"].includes(sessionState);

    return {
      appId,
      sdkStatus,
      castState,
      sessionState,
      currentSession,
      castContext,
      isConfigured: Boolean(appId),
      isConnected,
      requestSession: async () => {
        if (!castContext?.requestSession) return;
        await castContext.requestSession();
      },
      disconnect: async () => {
        if (!currentSession?.endSession) return;
        await currentSession.endSession(true);
      },
    };
  }, [appId, castContext, castState, currentSession, sdkStatus, sessionState]);

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}
