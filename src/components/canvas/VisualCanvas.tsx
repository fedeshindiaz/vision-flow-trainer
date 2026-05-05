import { useRef } from "react";
import type { BackgroundConfig, ObjectiveConfig } from "../../types";
import { useCanvasRenderer } from "../../hooks/useCanvasRenderer";
import { drawBackgroundPattern } from "./drawBackgroundPattern";
import { drawObjective } from "./drawObjective";

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
}: VisualCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useCanvasRenderer(canvasRef, hostRef, running, resetKey, (ctx, width, height, elapsed) => {
    drawBackgroundPattern(ctx, width, height, background, density, stripeSize, elapsed, frequencyHz);
    drawObjective(ctx, width, height, objective, elapsed, frequencyHz, amplitude, targetSize);
  });

  return (
    <div ref={hostRef} className="visual-canvas-host">
      <canvas ref={canvasRef} className="visual-canvas" />
    </div>
  );
}
