import type { Direction } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function formatTime(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function vectorFor(key: Direction) {
  const map: Partial<Record<Direction, { x: number; y: number }>> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    horizontal: { x: 1, y: 0 },
    vertical: { x: 0, y: 1 },
    "top-left": { x: -1, y: -1 },
    "top-right": { x: 1, y: -1 },
    "bottom-left": { x: -1, y: 1 },
    "bottom-right": { x: 1, y: 1 },
    jiggle: { x: 1, y: 0 },
    warp: { x: 1, y: 1 },
    multi: { x: 1, y: 1 },
  };

  return map[key] ?? { x: 1, y: 0 };
}

export function getDirectionSymbol(direction: Direction) {
  const symbols: Partial<Record<Direction, string>> = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    "top-left": "↖",
    "top-right": "↗",
    "bottom-left": "↙",
    "bottom-right": "↘",
    jiggle: "↔",
    warp: "⟳",
    multi: "✳",
  };

  return symbols[direction] ?? "→";
}
