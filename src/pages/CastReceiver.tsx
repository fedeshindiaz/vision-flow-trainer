import { useEffect, useMemo, useRef, useState } from "react";
import { VisualCanvas } from "../components/canvas/VisualCanvas";
import {
  CAST_NAMESPACE,
  computeVisualElapsedMs,
  createCastMessage,
  normalizeCastMessage,
  sanitizeSharedExercisePatch,
  type ReceiverReadyPayload,
  type SharedExerciseState,
} from "../cast/castMessages";
import { protocols } from "../config/protocols";
import { formatTime } from "../utils";
import { useRouteHead } from "../hooks/useRouteHead";

const RECEIVER_SDK_URL = "https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js";
const initialProtocol = protocols.find((protocol) => protocol.id === "okn-1") ?? protocols[0];

interface ReceiverWindow extends Window {
  cast?: {
    framework?: {
      CastReceiverContext?: {
        getInstance: () => CastReceiverContextLike;
      };
    };
  };
}

interface CastReceiverContextLike {
  addCustomMessageListener: (namespace: string, listener: (event: CastCustomMessageEvent) => void) => void;
  sendCustomMessage: (namespace: string, senderId: string, message: unknown) => void;
  start: () => void;
}

interface CastCustomMessageEvent {
  data: unknown;
  senderId: string;
}

const defaultState: SharedExerciseState = {
  selectedProtocolId: initialProtocol.id,
  selectedProtocolName: initialProtocol.name,
  selectedProtocolCategory: initialProtocol.category,
  background: initialProtocol.background,
  objective: initialProtocol.objective,
  frequencyHz: initialProtocol.frequencyHz,
  amplitude: 42,
  targetSize: 38,
  density: 96,
  stripeSize: 48,
  duration: 45,
  sets: 3,
  rest: 30,
  running: false,
  sessionState: "idle",
  timeLeft: 45,
  currentSet: 1,
  resetKey: 0,
  metronomeEnabled: initialProtocol.metronome,
  updatedAt: Date.now(),
  startedAt: null,
  pausedAt: null,
  accumulatedElapsedMs: 0,
};

export default function CastReceiver() {
  useRouteHead({
    title: "ONUr | Receptor de Entrenamiento (Cast)",
    description:
      "Pantalla receptora Google Cast de ONUr: muestra los estímulos visuales del protocolo en curso enviados desde el dispositivo del terapeuta.",
    canonicalPath: "/cast-receiver",
    robots: "noindex,follow",
  });
  const [sharedState, setSharedState] = useState<SharedExerciseState>(defaultState);
  const [receiverStatus, setReceiverStatus] = useState<ReceiverReadyPayload["status"]>("waiting");
  const [receiverReady, setReceiverReady] = useState(false);
  const [receiverError, setReceiverError] = useState("");
  const receiverStatusRef = useRef(receiverStatus);

  receiverStatusRef.current = receiverStatus;

  useEffect(() => {
    const receiverWindow = window as ReceiverWindow;
    let cancelled = false;

    const startReceiver = () => {
      if (cancelled) return;

      const context = receiverWindow.cast?.framework?.CastReceiverContext?.getInstance();

      if (!context) {
        setReceiverError("Google Cast Receiver SDK no disponible.");
        return;
      }

      const sendStatus = (senderId: string, status: ReceiverReadyPayload["status"]) => {
        context.sendCustomMessage(
          CAST_NAMESPACE,
          senderId,
          createCastMessage("RECEIVER_READY", { status, version: "onur-cast-1" }),
        );
      };

      context.addCustomMessageListener(CAST_NAMESPACE, (event) => {
        const message = normalizeCastMessage(event.data);

        if (!message) {
          context.sendCustomMessage(
            CAST_NAMESPACE,
            event.senderId,
            createCastMessage("ERROR", { code: "INVALID_MESSAGE", message: "Mensaje Cast invalido." }),
          );
          return;
        }

        if (message.type === "PING") {
          context.sendCustomMessage(
            CAST_NAMESPACE,
            event.senderId,
            createCastMessage("PONG", { timestamp: Date.now(), status: receiverStatusRef.current }),
          );
          return;
        }

        if (message.type === "INIT_STATE") {
          const patch = sanitizeSharedExercisePatch(message.payload);

          if (patch) {
            setSharedState((current) => ({ ...current, ...patch, updatedAt: Date.now() }));
            setReceiverStatus(patch.sessionState === "playing" ? "playing" : "connected");
            sendStatus(event.senderId, patch.sessionState === "playing" ? "playing" : "connected");
          }

          return;
        }

        if (
          message.type === "PATCH_STATE" ||
          message.type === "PLAY" ||
          message.type === "PAUSE" ||
          message.type === "RESET" ||
          message.type === "SKIP" ||
          message.type === "SET_PROTOCOL" ||
          message.type === "SET_BACKGROUND" ||
          message.type === "SET_OBJECTIVE" ||
          message.type === "SET_PARAMETER"
        ) {
          const patch = sanitizeSharedExercisePatch(message.payload);

          if (!patch) return;

          setSharedState((current) => ({ ...current, ...patch, updatedAt: Date.now() }));
          setReceiverStatus(patch.sessionState ? statusForPatch(patch.sessionState) : "connected");
        }
      });

      context.start();
      setReceiverReady(true);
      setReceiverStatus("waiting");
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${RECEIVER_SDK_URL}"]`);

    if (receiverWindow.cast?.framework?.CastReceiverContext) {
      startReceiver();
      return undefined;
    }

    const script = existingScript ?? document.createElement("script");
    script.src = RECEIVER_SDK_URL;
    script.async = true;
    script.onload = startReceiver;
    script.onerror = () => {
      if (!cancelled) setReceiverError("No se pudo cargar Google Cast Receiver SDK.");
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const visualRunning = sharedState.running && sharedState.sessionState === "playing";
  const visualElapsedMs = useMemo(() => computeVisualElapsedMs(sharedState), [sharedState]);
  const overlayStatus = receiverError || (receiverReady ? labelForStatus(receiverStatus) : "Esperando control...");
  const showOverlay = Boolean(receiverError) || sharedState.sessionState !== "playing";

  return (
    <main className="cast-receiver-page">
      <VisualCanvas
        running={visualRunning}
        resetKey={sharedState.resetKey}
        background={sharedState.background}
        objective={sharedState.objective}
        frequencyHz={sharedState.frequencyHz}
        amplitude={sharedState.amplitude}
        targetSize={sharedState.targetSize}
        density={sharedState.density}
        stripeSize={sharedState.stripeSize}
        syncElapsedMs={visualElapsedMs}
      />

      {showOverlay && (
        <div className="cast-receiver-overlay" aria-live="polite">
          <span>{overlayStatus}</span>
          <strong>{sharedState.selectedProtocolName}</strong>
          <p>
          {formatTime(sharedState.timeLeft)} · serie {sharedState.currentSet}/{sharedState.sets}
          </p>
        </div>
      )}
    </main>
  );
}

function statusForPatch(status: SharedExerciseState["sessionState"]): ReceiverReadyPayload["status"] {
  if (status === "playing") return "playing";
  if (status === "resting") return "resting";
  if (status === "done") return "done";
  return "connected";
}

function labelForStatus(status: ReceiverReadyPayload["status"]) {
  if (status === "playing") return "Ejercicio";
  if (status === "resting") return "Descanso";
  if (status === "done") return "Completado";
  if (status === "connected") return "Conectado";
  return "Esperando control...";
}
