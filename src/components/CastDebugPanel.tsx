import { useMemo, useState } from "react";
import { useCastContext } from "../cast/castContext";

interface CastDebugPanelProps {
  statusLabel: string;
  senderLastError?: string;
}

export function CastDebugPanel({ statusLabel, senderLastError = "" }: CastDebugPanelProps) {
  const cast = useCastContext();
  const [requestResult, setRequestResult] = useState("");
  const visible = useMemo(() => {
    if (typeof window === "undefined") return false;

    return import.meta.env.DEV || new URLSearchParams(window.location.search).get("castDebug") === "1";
  }, []);

  const sessionObj = cast.currentSession?.getSessionObj?.();
  const sessionAppId = getString(sessionObj, "appId") || getString(sessionObj, "receiverApplicationId") || "";
  const sessionId = cast.currentSession?.getSessionId?.() || getString(sessionObj, "sessionId") || "";

  if (!visible) return null;

  const rows = [
    ["appId", cast.appId || "(empty)"],
    ["isConfigured", String(cast.isConfigured)],
    ["statusLabel", statusLabel],
    ["sdkStatus", cast.sdkStatus],
    ["sdkScriptPresent", String(cast.debugInfo.sdkScriptPresent)],
    ["sdkScriptLoaded", String(cast.debugInfo.sdkScriptLoaded)],
    ["gCastApiAvailable", String(cast.debugInfo.gCastApiAvailable)],
    ["cast.framework", String(cast.debugInfo.castFrameworkAvailable)],
    ["setOptions appId", cast.debugInfo.setOptionsAppId || "(not called)"],
    ["setOptions calls", String(cast.debugInfo.setOptionsCallCount)],
    ["autoJoinPolicy", cast.debugInfo.autoJoinPolicy || "(empty)"],
    ["castState", cast.castState],
    ["sessionState", cast.sessionState],
    ["currentSession", cast.currentSession ? "yes" : "no"],
    ["currentSession appId", sessionAppId || "(empty)"],
    ["currentSession id", sessionId || "(empty)"],
    ["initError", cast.debugInfo.lastInitializationError || "(none)"],
    ["senderError", senderLastError || "(none)"],
    ["requestSession", requestResult || "(not tested)"],
  ];

  const handleRequestSession = async () => {
    setRequestResult("requesting...");
    console.info("[ONUr Cast debug] requestSession start", {
      appId: cast.appId,
      sdkStatus: cast.sdkStatus,
      castState: cast.castState,
      sessionState: cast.sessionState,
    });

    try {
      await cast.requestSession();
      setRequestResult("OK");
      console.info("[ONUr Cast debug] requestSession OK");
    } catch (error) {
      const normalized = stringifyUnknown(error);
      setRequestResult(normalized);
      console.error("[ONUr Cast debug] requestSession failed", error);
    }
  };

  return (
    <aside className="cast-debug-panel" aria-label="Diagnostico Google Cast">
      <div className="cast-debug-header">
        <strong>Cast debug</strong>
        <button type="button" onClick={handleRequestSession}>
          Test requestSession
        </button>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function getString(record: unknown, key: string) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "";

  const value = (record as Record<string, unknown>)[key];

  return typeof value === "string" ? value : "";
}

function stringifyUnknown(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
