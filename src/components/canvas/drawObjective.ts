import type { Direction, ObjectiveConfig } from "../../types";

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

export function getSaccadePositions(width: number, height: number, amplitude: number, direction: Direction) {
  const cx = width / 2;
  const cy = height / 2;
  const ax = (width * amplitude) / 210;
  const ay = (height * amplitude) / 240;

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
  const ax = (width * amplitude) / 230;
  const ay = (height * amplitude) / 260;
  const phaseAngle = Math.PI * 2 * frequencyHz * elapsed;
  const phase = Math.sin(phaseAngle);
  let x = cx;
  let y = cy;
  let fill = "#ef4444";
  let label = "X";

  if (config.mode === "moving") {
    if (config.direction === "lissajous") {
      x = cx + Math.sin(phaseAngle) * ax;
      y = cy + Math.sin(phaseAngle * 2) * ay * 0.72;
    } else if (["up", "down", "vertical"].includes(config.direction)) {
      y = cy + phase * ay;
    } else if (["top-left", "top-right", "bottom-left", "bottom-right"].includes(config.direction)) {
      x = cx + phase * ax * (config.direction.includes("left") ? -1 : 1);
      y = cy + phase * ay * (config.direction.includes("top") ? -1 : 1);
    } else {
      x = cx + phase * ax;
    }
  }

  if (config.mode === "smooth") {
    fill = "#16a34a";
    label = "•";
    x = cx + Math.sin(phaseAngle) * ax;
    y = cy + Math.sin(phaseAngle * 2) * ay * 0.72;
  }

  if (config.mode === "saccade") {
    const positions = getSaccadePositions(width, height, amplitude, config.direction);
    const index = Math.floor(elapsed * frequencyHz) % positions.length;
    x = positions[index].x;
    y = positions[index].y;
  }

  drawTarget(ctx, x, y, size, fill, label);
}
