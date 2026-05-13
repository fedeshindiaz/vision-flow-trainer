import { useEffect, useMemo, useRef } from "react";
import type { BackgroundConfig, ObjectiveConfig } from "../../types";
import { useCanvasRenderer } from "../../hooks/useCanvasRenderer";
import { drawBackgroundPattern } from "./drawBackgroundPattern";
import { drawObjective } from "./drawObjective";
import { clamp, vectorFor } from "../../utils";

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
  const backgroundPhaseRef = useRef({ x: 0, y: 0 });
  const stillFrameKey = useMemo(
    () =>
      [
        background.enabled,
        background.type,
        background.direction,
        objective.enabled,
        objective.mode,
        objective.direction,
        frequencyHz,
        amplitude,
        targetSize,
        density,
        stripeSize,
        syncElapsedMs,
        syncStartMs ?? "local",
        syncBaseElapsedMs,
      ].join("|"),
    [
      amplitude,
      background.direction,
      background.enabled,
      background.type,
      density,
      frequencyHz,
      objective.direction,
      objective.enabled,
      objective.mode,
      stripeSize,
      syncBaseElapsedMs,
      syncElapsedMs,
      syncStartMs,
      targetSize,
    ],
  );

  useEffect(() => {
    backgroundPhaseRef.current = { x: 0, y: 0 };
  }, [resetKey]);

  useCanvasRenderer(
    canvasRef,
    hostRef,
    running,
    resetKey,
    (ctx, width, height, elapsed, backgroundElapsed, deltaSeconds) => {
      if (background.enabled && background.type !== "none" && deltaSeconds > 0) {
        const period = clamp(density, 24, 180);
        const speedPx = period * Math.max(0.05, frequencyHz);
        const vector = vectorFor(background.direction);

        backgroundPhaseRef.current = {
          x: backgroundPhaseRef.current.x + vector.x * speedPx * deltaSeconds,
          y: backgroundPhaseRef.current.y + vector.y * speedPx * deltaSeconds,
        };
      }

      drawBackgroundPattern(
        ctx,
        width,
        height,
        background,
        density,
        stripeSize,
        backgroundElapsed,
        frequencyHz,
        backgroundPhaseRef.current,
      );
      drawObjective(ctx, width, height, objective, elapsed, frequencyHz, amplitude, targetSize);
    },
    syncElapsedMs / 1000,
    syncStartMs,
    syncBaseElapsedMs / 1000,
    stillFrameKey,
  );

  return (
    <div ref={hostRef} className="visual-canvas-host">
      <canvas ref={canvasRef} className="visual-canvas" />
    </div>
  );
}
