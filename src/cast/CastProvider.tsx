import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CastContext,
  type CastContextLike,
  type CastDebugInfo,
  type CastProviderValue,
  type CastSdkStatus,
  type CastSessionLike,
} from "./castContext";

const CAST_SENDER_SDK_URL = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

interface CastWindow extends Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  __ONUR_CAST_DEBUG__?: Record<string, unknown>;
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
  const appId = (import.meta.env.VITE_CAST_APP_ID as string | undefined)?.trim() || "410BB6F0";
  const isReceiverRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/cast-receiver");
  const [sdkStatus, setSdkStatus] = useState<CastSdkStatus>(isReceiverRoute ? "disabled" : appId ? "loading" : "not_configured");
  const [castState, setCastState] = useState("UNKNOWN");
  const [sessionState, setSessionState] = useState("NO_SESSION");
  const [currentSession, setCurrentSession] = useState<CastSessionLike | null>(null);
  const [castContext, setCastContext] = useState<CastContextLike | null>(null);
  const [debugInfo, setDebugInfo] = useState<CastDebugInfo>({
    sdkScriptPresent: false,
    sdkScriptLoaded: false,
    gCastApiAvailable: null,
    castFrameworkAvailable: false,
    setOptionsAppId: "",
    setOptionsCallCount: 0,
    autoJoinPolicy: undefined,
    lastInitializationError: "",
  });
  const initializedRef = useRef(false);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const debugEnabled =
    typeof window !== "undefined" &&
    (import.meta.env.DEV || new URLSearchParams(window.location.search).get("castDebug") === "1");

  useEffect(() => {
    if (isReceiverRoute) {
      setSdkStatus("disabled");
      return undefined;
    }

    if (!appId) {
      setSdkStatus("not_configured");
      setDebugInfo((current) => ({
        ...current,
        lastInitializationError: "Missing VITE_CAST_APP_ID and no Cast App ID fallback.",
      }));
      return undefined;
    }

    const castWindow = window as CastWindow;
    let cancelled = false;

    const initializeCast = (isAvailable: boolean) => {
      if (cancelled) return;

      const hasCastFramework = Boolean(castWindow.cast?.framework?.CastContext);
      setDebugInfo((current) => ({
        ...current,
        sdkScriptLoaded: true,
        gCastApiAvailable: isAvailable,
        castFrameworkAvailable: hasCastFramework,
        lastInitializationError: "",
      }));

      if (!isAvailable || !castWindow.cast?.framework?.CastContext) {
        setSdkStatus("unavailable");
        setDebugInfo((current) => ({
          ...current,
          lastInitializationError: isAvailable
            ? "Google Cast Sender SDK is available but cast.framework.CastContext is missing."
            : "window.__onGCastApiAvailable reported isAvailable=false.",
        }));
        return;
      }

      try {
        const context = castWindow.cast.framework.CastContext.getInstance();
        const autoJoinPolicy = castWindow.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED;

        context.setOptions({
          receiverApplicationId: appId,
          autoJoinPolicy,
        });
        setDebugInfo((current) => ({
          ...current,
          castFrameworkAvailable: true,
          setOptionsAppId: appId,
          setOptionsCallCount: current.setOptionsCallCount + 1,
          autoJoinPolicy,
          lastInitializationError: "",
        }));

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
      } catch (error) {
        const message = error instanceof Error ? error.message : "CastContext initialization failed.";
        setSdkStatus("error");
        setDebugInfo((current) => ({
          ...current,
          lastInitializationError: message,
        }));
      }

      return undefined;
    };

    if (initializedRef.current && castWindow.cast?.framework?.CastContext) {
      initializeCast(true);
      return undefined;
    }

    const previousCallback = castWindow.__onGCastApiAvailable;
    const handleGCastApiAvailable = (isAvailable: boolean) => {
      previousCallback?.(isAvailable);
      initializeCast(isAvailable);
    };
    castWindow.__onGCastApiAvailable = handleGCastApiAvailable;

    let script = document.querySelector<HTMLScriptElement>(`script[src="${CAST_SENDER_SDK_URL}"]`);
    const handleScriptLoad = () => {
      if (cancelled) return;
      script?.setAttribute("data-onur-cast-loaded", "true");
      setDebugInfo((current) => ({
        ...current,
        sdkScriptLoaded: true,
      }));
    };
    const handleScriptError = () => {
      if (cancelled) return;
      setSdkStatus("error");
      setDebugInfo((current) => ({
        ...current,
        lastInitializationError: "Failed to load Google Cast Sender SDK script.",
      }));
    };

    if (!script) {
      script = document.createElement("script");
      script.src = CAST_SENDER_SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    } else if (castWindow.cast?.framework?.CastContext) {
      initializeCast(true);
    }

    setDebugInfo((current) => ({
      ...current,
      sdkScriptPresent: true,
      sdkScriptLoaded:
        script?.getAttribute("data-onur-cast-loaded") === "true" ||
        Boolean(castWindow.cast?.framework?.CastContext),
      castFrameworkAvailable: Boolean(castWindow.cast?.framework?.CastContext),
    }));
    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", handleScriptError);

    return () => {
      cancelled = true;
      removeListenersRef.current?.();
      removeListenersRef.current = null;
      script?.removeEventListener("load", handleScriptLoad);
      script?.removeEventListener("error", handleScriptError);

      if (castWindow.__onGCastApiAvailable === handleGCastApiAvailable) {
        castWindow.__onGCastApiAvailable = previousCallback;
      }
    };
  }, [appId, isReceiverRoute]);

  useEffect(() => {
    if (!debugEnabled) return;

    const castWindow = window as CastWindow;
    const snapshot = {
      appId,
      isConfigured: Boolean(appId),
      sdkStatus,
      castState,
      sessionState,
      hasCurrentSession: Boolean(currentSession),
      debugInfo,
    };

    castWindow.__ONUR_CAST_DEBUG__ = snapshot;
    console.info("[ONUr Cast debug]", snapshot);
  }, [appId, castState, currentSession, debugEnabled, debugInfo, sdkStatus, sessionState]);

  const value = useMemo<CastProviderValue>(() => {
    const isConnected = Boolean(currentSession) && ["SESSION_STARTED", "SESSION_RESUMED"].includes(sessionState);

    return {
      appId,
      sdkStatus,
      castState,
      sessionState,
      currentSession,
      castContext,
      debugInfo,
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
  }, [appId, castContext, castState, currentSession, debugInfo, sdkStatus, sessionState]);

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}
