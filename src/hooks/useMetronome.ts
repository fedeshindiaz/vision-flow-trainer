import { useEffect, useRef, useState } from "react";
import {
  getBeatIntervalMs,
  getNextBeatAtMs,
  METRONOME_LOOKAHEAD_MS,
  METRONOME_SCHEDULE_AHEAD_MS,
} from "../utils/timing";

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

function scheduleMetronomeClick(ctx: AudioContext, time: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = Math.max(ctx.currentTime, time);

  oscillator.frequency.setValueAtTime(880, startTime);
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.055);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.07);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

function resumeContext(ctx: AudioContext) {
  if (ctx.state !== "suspended") return;
  void ctx.resume().catch(() => undefined);
}

export async function unlockMetronomeAudio() {
  const ctx = getCtx();

  if (!ctx) return null;

  try {
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    return null;
  }

  return ctx;
}

export function playMetronomeClick() {
  const ctx = getCtx();

  if (!ctx) return null;

  try {
    resumeContext(ctx);
    scheduleMetronomeClick(ctx, ctx.currentTime + 0.01);
  } catch {
    // Browsers may block audio until an explicit user gesture.
  }

  return ctx;
}

export function useMetronome(
  active: boolean,
  frequencyHz: number,
  soundEnabled: boolean,
  syncKey = 0,
  syncStartMs: number | null = null,
  syncBaseElapsedMs = 0,
) {
  const [beat, setBeat] = useState(0);
  const freqRef = useRef(frequencyHz);
  const soundRef = useRef(soundEnabled);

  freqRef.current = frequencyHz;
  soundRef.current = soundEnabled;

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    const getAlignedNextBeatAtMs = () =>
      getNextBeatAtMs(syncStartMs, syncBaseElapsedMs, performance.now(), freqRef.current);
    let nextBeatAtMs = getAlignedNextBeatAtMs();

    setBeat(0);

    const scheduleBeat = (beatAtMs: number) => {
      const delayMs = Math.max(0, beatAtMs - performance.now());

      window.setTimeout(() => {
        if (cancelled) return;

        setBeat((value) => value + 1);

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(8);
        }
      }, delayMs);

      if (!soundRef.current) return;

      const ctx = getCtx();

      if (!ctx) return;

      try {
        resumeContext(ctx);
        const audioDelaySeconds = Math.max(0, (beatAtMs - performance.now()) / 1000);
        scheduleMetronomeClick(ctx, ctx.currentTime + audioDelaySeconds);
      } catch {
        // Keep the visual beat running even when the browser blocks audio.
      }
    };

    const scheduler = () => {
      if (cancelled) return;

      const nowMs = performance.now();
      let intervalMs = getBeatIntervalMs(freqRef.current);

      if (nowMs - nextBeatAtMs > intervalMs * 2) {
        nextBeatAtMs = getAlignedNextBeatAtMs();
      }

      while (nextBeatAtMs <= nowMs + METRONOME_SCHEDULE_AHEAD_MS) {
        scheduleBeat(nextBeatAtMs);
        intervalMs = getBeatIntervalMs(freqRef.current);
        nextBeatAtMs += intervalMs;
      }
    };

    scheduler();
    const schedulerId = window.setInterval(scheduler, METRONOME_LOOKAHEAD_MS);

    return () => {
      cancelled = true;
      window.clearInterval(schedulerId);
    };
  }, [active, syncBaseElapsedMs, syncKey, syncStartMs]);

  return beat;
}
