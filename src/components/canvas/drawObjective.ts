import type { Direction, ObjectiveConfig } from "../../types";
import { getBeatIndex, getBeatSyncedLinearFactor } from "../../utils/timing";

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill = "#ef4444",
  label = "X",
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.shadowColor = fill;
  ctx.shadowBlur = 22;
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.font = `900 ${Math.max(12, size * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

export function getSaccadePositions(
  width: number,
  height: number,
  amplitude: number,
  direction: Direction,
  targetSize = 0,
) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = targetSize / 2 + 10;
  const ax = Math.max(0, Math.min((width * amplitude) / 210, width / 2 - radius));
  const ay = Math.max(0, Math.min((height * amplitude) / 240, height / 2 - radius));

  const pairs: Partial<Record<Direction, Array<{ x: number; y: number }>>> = {
    left: [
      { x: cx + ax, y: cy },
      { x: cx - ax, y: cy },
    ],
    right: [
      { x: cx - ax, y: cy },
      { x: cx + ax, y: cy },
    ],
    up: [
      { x: cx, y: cy + ay },
      { x: cx, y: cy - ay },
    ],
    down: [
      { x: cx, y: cy - ay },
      { x: cx, y: cy + ay },
    ],
    "top-left": [
      { x: cx + ax, y: cy + ay },
      { x: cx - ax, y: cy - ay },
    ],
    "top-right": [
      { x: cx - ax, y: cy + ay },
      { x: cx + ax, y: cy - ay },
    ],
    "bottom-left": [
      { x: cx + ax, y: cy - ay },
      { x: cx - ax, y: cy + ay },
    ],
    "bottom-right": [
      { x: cx - ax, y: cy - ay },
      { x: cx + ax, y: cy + ay },
    ],
    jiggle: [
      { x: cx - ax, y: cy },
      { x: cx + ax, y: cy },
      { x: cx, y: cy - ay },
      { x: cx, y: cy + ay },
    ],
    warp: [
      { x: cx - ax, y: cy - ay },
      { x: cx + ax, y: cy + ay },
    ],
    multi: [
      { x: cx - ax, y: cy - ay },
      { x: cx + ax, y: cy - ay },
      { x: cx + ax, y: cy + ay },
      { x: cx - ax, y: cy + ay },
      { x: cx, y: cy },
    ],
  };

  return pairs[direction] ?? [
    { x: cx - ax, y: cy },
    { x: cx + ax, y: cy },
  ];
}

export function drawObjective(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ObjectiveConfig,
  elapsed: number,
  frequencyHz: number,
  amplitude: number,
  size: number,
) {
  if (!config.enabled || config.mode === "none") return;

  const cx = width / 2;
  const cy = height / 2;
  const safeSize = Math.max(8, Math.min(size, Math.max(8, Math.min(width, height) - 24)));
  const radius = safeSize / 2 + 10;
  const ax = Math.max(0, Math.min((width * amplitude) / 230, width / 2 - radius));
  const ay = Math.max(0, Math.min((height * amplitude) / 260, height / 2 - radius));
  const phaseAngle = Math.PI * 2 * frequencyHz * elapsed;
  let x = cx;
  let y = cy;
  let fill = "#ef4444";
  let label = "X";

  if (config.mode === "fixed") {
    x = cx;
    y = cy;
  }

  if (config.mode === "moving") {
    if (config.direction === "lissajous") {
      x = cx + Math.sin(phaseAngle) * ax;
      y = cy + Math.sin(phaseAngle * 2) * ay * 0.72;
    } else {
      const axis = axisForLinearDirection(config.direction);
      const beatSyncedFactor = getBeatSyncedLinearFactor(elapsed, frequencyHz);

      x = cx + beatSyncedFactor * ax * axis.x;
      y = cy + beatSyncedFactor * ay * axis.y;
    }
  }

  if (config.mode === "smooth") {
    fill = "#16a34a";
    label = "•";
    x = cx + Math.sin(phaseAngle) * ax;
    y = cy + Math.sin(phaseAngle * 2) * ay * 0.72;
  }

  if (config.mode === "saccade") {
    const stepIndex = getBeatIndex(elapsed, frequencyHz);

    if (config.direction === "lissajous") {
      const pos = getRandomSaccadePosition(stepIndex, cx, cy, ax, ay);
      x = pos.x;
      y = pos.y;
    } else {
      const positions = getSaccadePositions(width, height, amplitude, config.direction, safeSize);
      const index = stepIndex % positions.length;
      x = positions[index].x;
      y = positions[index].y;
    }
  }

  drawTarget(ctx, x, y, safeSize, fill, label);
}

function axisForLinearDirection(direction: Direction) {
  const axes: Partial<Record<Direction, { x: number; y: number }>> = {
    right: { x: 1, y: 0 },
    left: { x: -1, y: 0 },
    horizontal: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    up: { x: 0, y: -1 },
    vertical: { x: 0, y: 1 },
    "top-left": { x: -1, y: -1 },
    "top-right": { x: 1, y: -1 },
    "bottom-left": { x: -1, y: 1 },
    "bottom-right": { x: 1, y: 1 },
  };

  return axes[direction] ?? { x: 1, y: 0 };
}

const randomCache = new Map<number, { x: number; y: number }>();

function getRandomSaccadePosition(step: number, cx: number, cy: number, ax: number, ay: number) {
  const cached = randomCache.get(step);
  if (cached) return cached;

  if (randomCache.size > 32) randomCache.clear();

  const pos = {
    x: cx + (Math.random() * 2 - 1) * ax,
    y: cy + (Math.random() * 2 - 1) * ay,
  };

  randomCache.set(step, pos);

  return pos;
}
