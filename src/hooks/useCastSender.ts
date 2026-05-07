import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCastContext } from "../cast/castContext";
import {
  CAST_NAMESPACE,
  createCastMessage,
  createStatePatch,
  normalizeCastMessage,
  type CastErrorPayload,
  type CastMessageType,
  type ReceiverReadyPayload,
  type SharedExercisePatch,
  type SharedExerciseState,
} from "../cast/castMessages";

export function useCastSender(sharedState: SharedExerciseState) {
  const cast = useCastContext();
  const latestStateRef = useRef(sharedState);
  const lastSentStateRef = useRef<SharedExerciseState | null>(null);
  const [receiverStatus, setReceiverStatus] = useState<ReceiverReadyPayload | null>(null);
  const [lastError, setLastError] = useState("");

  latestStateRef.current = sharedState;

  const sendMessage = useCallback(
    async (type: CastMessageType, payload?: unknown) => {
      if (!cast.currentSession?.sendMessage || !cast.isConnected) return false;

      try {
        await cast.currentSession.sendMessage(CAST_NAMESPACE, createCastMessage(type, payload));
        return true;
      } catch {
        setLastError("No se pudo enviar el mensaje Cast.");
        return false;
      }
    },
    [cast.currentSession, cast.isConnected],
  );

  const sendPatch = useCallback(
    async (patch: SharedExercisePatch) => {
      if (!Object.keys(patch).length) return false;
      return sendMessage("PATCH_STATE", patch);
    },
    [sendMessage],
  );

  useEffect(() => {
    if (!cast.currentSession?.addMessageListener || !cast.isConnected) return undefined;

    const handleReceiverMessage = (_namespace: string, message: unknown) => {
      const normalized = normalizeCastMessage(message);

      if (!normalized) return;

      if (normalized.type === "RECEIVER_READY" && normalized.payload && typeof normalized.payload === "object") {
        setReceiverStatus(normalized.payload as ReceiverReadyPayload);
        setLastError("");
      }

      if (normalized.type === "PONG" && normalized.payload && typeof normalized.payload === "object") {
        setReceiverStatus((current) => current ?? { status: "connected", version: "unknown" });
      }

      if (normalized.type === "ERROR" && normalized.payload && typeof normalized.payload === "object") {
        const payload = normalized.payload as CastErrorPayload;
        setLastError(payload.message || "El receiver Cast reporto un error.");
      }
    };

    cast.currentSession.addMessageListener(CAST_NAMESPACE, handleReceiverMessage);
    void sendMessage("INIT_STATE", latestStateRef.current).then((sent) => {
      if (sent) lastSentStateRef.current = latestStateRef.current;
    });

    return () => {
      cast.currentSession?.removeMessageListener?.(CAST_NAMESPACE, handleReceiverMessage);
    };
  }, [cast.currentSession, cast.isConnected, sendMessage]);

  useEffect(() => {
    if (!cast.isConnected) {
      lastSentStateRef.current = null;
      setReceiverStatus(null);
      return undefined;
    }

    const id = window.setTimeout(() => {
      const patch = createStatePatch(lastSentStateRef.current, latestStateRef.current);

      void sendPatch(patch).then((sent) => {
        if (sent) lastSentStateRef.current = latestStateRef.current;
      });
    }, 90);

    return () => window.clearTimeout(id);
  }, [cast.isConnected, sendPatch, sharedState]);

  useEffect(() => {
    if (!cast.isConnected || !sharedState.running) return undefined;

    const id = window.setInterval(() => {
      const state = { ...latestStateRef.current, updatedAt: Date.now() };
      void sendMessage("PATCH_STATE", state).then((sent) => {
        if (sent) lastSentStateRef.current = state;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [cast.isConnected, sendMessage, sharedState.running]);

  const statusLabel = useMemo(() => {
    if (!cast.isConfigured) return "Cast no configurado";
    if (cast.sdkStatus === "loading") return "Cargando";
    if (cast.sdkStatus === "error") return "Error SDK";
    if (cast.sdkStatus === "unavailable") return "SDK no disponible";
    if (cast.isConnected) return "Transmitiendo";
    if (cast.castState === "CONNECTING") return "Conectando";
    if (cast.castState === "NO_DEVICES_AVAILABLE") return "Sin receptor compatible";
    if (cast.sdkStatus === "available") return "Disponible";
    return "No disponible";
  }, [cast.castState, cast.isConfigured, cast.isConnected, cast.sdkStatus]);

  return {
    ...cast,
    statusLabel,
    receiverStatus,
    lastError,
    sendCommand: sendMessage,
  };
}
