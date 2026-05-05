import { useRef } from "react";
import type { BackgroundConfig, ObjectiveConfig } from "../../types";
import { useCanvasRenderer } from "../../hooks/useCanvasRenderer";
import { drawBackgroundPattern } from "./drawBackgroundPattern";
import { drawObjective } from "./drawObjective";
import { getBackgroundElapsed } from "./getBackgroundElapsed";

interface VisualCanvasProps {
  running: boolean;
  resetKey: number;
  background: BackgroundConfig;
  objective: ObjectiveConfig;
  frequencyHz: number;
  amplitude: number;
  targetSize: number;
  density: number;
  stripeSize: number;
  syncElapsedMs?: number;
  syncStartMs?: number | null;
  syncBaseElapsedMs?: number;
}

export function VisualCanvas({
  running,
  resetKey,
  background,
  objective,
  frequencyHz,
  amplitude,
  targetSize,
  density,
  stripeSize,
  syncElapsedMs = 0,
  syncStartMs = null,
  syncBaseElapsedMs = 0,
}: VisualCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useCanvasRenderer(
    canvasRef,
    hostRef,
    running,
    resetKey,
    (ctx, width, height, elapsed) => {
      const backgroundElapsed = getBackgroundElapsed(background, objective, elapsed);

      drawBackgroundPattern(ctx, width, height, background, density, stripeSize, backgroundElapsed, frequencyHz);
      drawObjective(ctx, width, height, objective, elapsed, frequencyHz, amplitude, targetSize);
    },
    syncElapsedMs / 1000,
    syncStartMs,
    syncBaseElapsedMs / 1000,
  );

  return (
    <div ref={hostRef} className="visual-canvas-host">
      <canvas ref={canvasRef} className="visual-canvas" />
    </div>
  );
}
