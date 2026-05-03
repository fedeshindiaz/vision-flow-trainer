import { useEffect, useRef, useState } from "react";

interface Props {
  frequency: number; // Hz
  active: boolean;
}

const COUNT = 8;

export function Metronome({ frequency, active }: Props) {
  const [idx, setIdx] = useState(0);
  const freqRef = useRef(frequency);
  freqRef.current = frequency;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timeout: number;
    const tick = () => {
      if (cancelled) return;
      setIdx((i) => (i + 1) % COUNT);
      const interval = 1000 / Math.max(0.1, freqRef.current * 2); // beats per second = freq*2
      timeout = window.setTimeout(tick, interval);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: COUNT }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            i === idx && active ? "bg-accent" : "bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}
