import { useCallback, useEffect, useRef, useState } from "react";
import { supportsFullscreenApi } from "../utils/deviceDetection";

export function useFocusMode({ isAppleEnvironment = false }: { isAppleEnvironment?: boolean } = {}) {
  const [focusMode, setFocusMode] = useState(false);
  const [focusFeedback, setFocusFeedback] = useState("");
  const focusHostRef = useRef<HTMLDivElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const fullscreenWasActiveRef = useRef(false);

  const showFocusFeedback = useCallback((message: string) => {
    setFocusFeedback(message);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => setFocusFeedback(""), 3500);
  }, []);

  const exitFocusMode = useCallback(async () => {
    setFocusMode(false);

    if (!document.fullscreenElement || !document.exitFullscreen) return;

    try {
      await document.exitFullscreen();
    } catch {
      showFocusFeedback("No se pudo salir de pantalla completa. Usa Esc si el navegador lo requiere.");
    }
  }, [showFocusFeedback]);

  const enterFocusMode = useCallback(async () => {
    setFocusMode(true);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const target = focusHostRef.current;

    if (!supportsFullscreenApi(target)) {
      showFocusFeedback(
        isAppleEnvironment
          ? "Modo seguro Apple activo. Salir queda visible aunque fullscreen no este disponible."
          : "Modo pantalla interno activo. El navegador no ofrece fullscreen real.",
      );
      return;
    }

    try {
      await target.requestFullscreen();
      fullscreenWasActiveRef.current = true;
    } catch {
      showFocusFeedback(
        isAppleEnvironment
          ? "Modo seguro Apple activo. Fullscreen fue bloqueado por el navegador."
          : "Modo pantalla interno activo. El navegador bloqueo fullscreen real.",
      );
    }
  }, [isAppleEnvironment, showFocusFeedback]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeElement = document.fullscreenElement;

      if (activeElement === focusHostRef.current) {
        fullscreenWasActiveRef.current = true;
        return;
      }

      if (!activeElement && fullscreenWasActiveRef.current) {
        fullscreenWasActiveRef.current = false;
        setFocusMode(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!focusMode) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void exitFocusMode();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exitFocusMode, focusMode]);

  return {
    focusMode,
    focusFeedback,
    focusHostRef,
    enterFocusMode,
    exitFocusMode,
  };
}
