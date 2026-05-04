import { useEffect, useRef, useState } from "react";

type WebAudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

// Singleton AudioContext: evita crear múltiples contextos al cambiar parámetros,
// que era una causa de "sonidos rotos" o solapados.
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  try {
    const Ctor = window.AudioContext || (window as WebAudioWindow).webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
  } catch {
    return null;
  }
  return sharedCtx;
}

export function useMetronome(active: boolean, frequencyHz: number, soundEnabled: boolean) {
  const [beat, setBeat] = useState(0);
  // Refs para que cambios de frecuencia/sonido no reinicien el loop y causen clicks dobles.
  const freqRef = useRef(frequencyHz);
  const soundRef = useRef(soundEnabled);

  freqRef.current = frequencyHz;
  soundRef.current = soundEnabled;

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let timerId: number | undefined;
    let nextTime = performance.now();

    const playClick = () => {
      if (!soundRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      try {
        if (ctx.state === "suspended") void ctx.resume();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = "sine";
        // Envelope con valores seguros (sin 0 absoluto en exponentialRamp)
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      } catch {
        // Audio bloqueado por el navegador hasta gesto del usuario.
      }
    };

    const tick = () => {
      if (cancelled) return;
      playClick();
      setBeat((v) => v + 1);

      const f = Math.max(0.1, freqRef.current);
      const interval = 1000 / f;
      nextTime += interval;
      const delay = Math.max(0, nextTime - performance.now());
      // Si nos retrasamos demasiado (ej: pestaña en background), resincronizar.
      if (performance.now() - nextTime > interval * 2) {
        nextTime = performance.now() + interval;
      }
      timerId = window.setTimeout(tick, delay);
    };

    tick();

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [active]);

  return beat;
}
