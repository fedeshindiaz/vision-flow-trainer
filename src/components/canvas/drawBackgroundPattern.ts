import type { BackgroundConfig, Direction } from "../../types";
import { clamp, getDirectionSymbol, vectorFor } from "../../utils";

export interface BackgroundPhaseOffset {
  x: number;
  y: number;
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, density: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(15,23,42,0.08)";

  for (let x = 0; x <= width; x += density) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += density) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function getStripeAngle(direction: Direction) {
  if (direction === "top-right" || direction === "bottom-left") return -Math.PI / 4;
  if (direction === "top-left" || direction === "bottom-right" || direction === "multi") return Math.PI / 4;
  if (direction === "up" || direction === "down" || direction === "vertical") return Math.PI / 2;
  return 0;
}

function drawStripeSet(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  period: number,
  stripeSize: number,
  offsetX: number,
  offsetY: number,
  angle: number,
  color: string,
) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);
  ctx.translate(-width / 2, -height / 2);
  ctx.fillStyle = color;

  const projectedOffset = offsetX * Math.cos(angle) + offsetY * Math.sin(angle);
  const normalizedOffset = ((projectedOffset % period) + period) % period;
  const start = -width - height + normalizedOffset;
  const stripeWidth = getStripeWidth(period, stripeSize);

  for (let x = start; x < width * 2 + height; x += period) {
    ctx.fillRect(x, -height, stripeWidth, height * 3);
  }

  ctx.restore();
}

export function getStripeWidth(period: number, stripeSize: number) {
  return clamp(stripeSize, 4, Math.max(4, period * 0.92));
}

export function drawBackgroundPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BackgroundConfig,
  density: number,
  stripeSize: number,
  elapsed: number,
  frequencyHz: number,
  phaseOffset?: BackgroundPhaseOffset,
) {
  const period = clamp(density, 24, 180);
  const vector = vectorFor(config.direction);
  const speedPx = period * Math.max(0.05, frequencyHz);
  let offsetX = phaseOffset?.x ?? vector.x * speedPx * elapsed;
  let offsetY = phaseOffset?.y ?? vector.y * speedPx * elapsed;
  const dark = "rgba(15,23,42,0.76)";
  const light = "rgba(248,250,252,0.98)";

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  if (!config.enabled || config.type === "none") return;

  if (config.type === "grid") {
    drawGrid(ctx, width, height, period);
    return;
  }

  if (config.direction === "jiggle") {
    const step = Math.floor(elapsed * 20);
    offsetX = Math.sin(step * 12.9898) * 5;
    offsetY = Math.cos(step * 78.233) * 5;
  }

  const startX = -period * 3 + ((offsetX % period) + period) % period;
  const startY = -period * 3 + ((offsetY % period) + period) % period;

  if (config.type === "checkerboard") {
    const warp =
      config.direction === "warp" ? 1 + Math.sin(elapsed * Math.PI * 2 * frequencyHz) * 0.06 : 1;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(config.direction === "warp" ? Math.sin(elapsed * 2) * 0.025 : 0);
    ctx.scale(warp, warp);
    ctx.translate(-width / 2, -height / 2);

    for (let y = startY; y < height + period * 3; y += period) {
      for (let x = startX; x < width + period * 3; x += period) {
        const ix = Math.floor((x - startX) / period);
        const iy = Math.floor((y - startY) / period);
        ctx.fillStyle = (ix + iy) % 2 === 0 ? dark : "rgba(255,255,255,0.96)";
        ctx.fillRect(x, y, period, period);
      }
    }

    ctx.restore();
    return;
  }

  if (config.type === "arrows" || config.type === "letterV") {
    const symbol = config.type === "letterV" ? "V" : getDirectionSymbol(config.direction);

    ctx.fillStyle = dark;
    ctx.font = `900 ${Math.round(period * 0.9)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = startY; y < height + period * 3; y += period) {
      for (let x = startX; x < width + period * 3; x += period) {
        ctx.fillText(symbol, x, y);
      }
    }

    return;
  }

  if (config.type === "intersectingStripes") {
    drawStripeSet(ctx, width, height, period, stripeSize, offsetX, offsetY, Math.PI / 4, dark);
    drawStripeSet(ctx, width, height, period, stripeSize, -offsetX, offsetY, -Math.PI / 4, "rgba(15,23,42,0.42)");
    return;
  }

  if (config.type === "divergentStripes" || config.type === "convergentStripes") {
    const wave = (Math.sin(elapsed * Math.PI * 2 * Math.max(0.1, frequencyHz)) + 1) / 2;
    const scale = config.type === "divergentStripes" ? 0.92 + wave * 0.18 : 1.1 - wave * 0.18;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
    drawStripeSet(
      ctx,
      width,
      height,
      period,
      stripeSize,
      offsetX,
      offsetY,
      ["up", "down"].includes(config.direction) ? Math.PI / 2 : 0,
      dark,
    );
    ctx.restore();
    return;
  }

  drawStripeSet(ctx, width, height, period, stripeSize, offsetX, offsetY, getStripeAngle(config.direction), dark);
}
