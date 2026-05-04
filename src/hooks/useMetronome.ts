import { useEffect, useRef, useState } from "react";

type WebAudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export function useMetronome(active: boolean, frequencyHz: number, soundEnabled: boolean) {
  const [beat, setBeat] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!active || frequencyHz <= 0) return undefined;

    const intervalMs = 1000 / frequencyHz;

    const click = () => {
      setBeat((value) => value + 1);

      if (!soundEnabled) return;

      try {
        const AudioContextClass = window.AudioContext || (window as WebAudioWindow).webkitAudioContext;
        if (!AudioContextClass) return;

        audioCtxRef.current ??= new AudioContextClass();
        const ctx = audioCtxRef.current;

        if (ctx.state === "suspended") void ctx.resume();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.frequency.value = 880;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.08);
      } catch {
        // Browsers may block audio until an explicit user gesture.
      }
    };

    click();
    const id = window.setInterval(click, intervalMs);

    return () => window.clearInterval(id);
  }, [active, frequencyHz, soundEnabled]);

  return beat;
}
