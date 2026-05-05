import { useEffect, useRef, useState } from "react";

type WebAudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

// Singleton AudioContext: avoids creating overlapping contexts as parameters change.
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

export function playMetronomeClick() {
  const ctx = getCtx();

  if (!ctx) return null;

  try {
    if (ctx.state === "suspended") void ctx.resume();

    const t = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.08);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  } catch {
    // Browsers may block audio until an explicit user gesture.
  }

  return ctx;
}

export function useMetronome(active: boolean, frequencyHz: number, soundEnabled: boolean) {
  const [beat, setBeat] = useState(0);
  const freqRef = useRef(frequencyHz);
  const soundRef = useRef(soundEnabled);

  freqRef.current = frequencyHz;
  soundRef.current = soundEnabled;

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let timerId: number | undefined;
    let nextTime = performance.now();

    const tick = () => {
      if (cancelled) return;

      if (soundRef.current) playMetronomeClick();
      setBeat((value) => value + 1);

      const frequency = Math.max(0.1, freqRef.current);
      const interval = 1000 / frequency;
      nextTime += interval;

      const now = performance.now();
      if (now - nextTime > interval * 2) {
        nextTime = now + interval;
      }

      timerId = window.setTimeout(tick, Math.max(0, nextTime - performance.now()));
    };

    tick();

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [active]);

  return beat;
}
