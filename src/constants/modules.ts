import type { BackgroundType, Direction, ObjectiveMode } from "../types";

export const MODULES = {
  OPTOKINETIC: "OPTOKINETIC",
  VOR_X2: "VOR_X2",
  SMOOTH_PURSUIT: "SMOOTH_PURSUIT",
  CORRECTIVE_SACCADES: "CORRECTIVE_SACCADES",
  FIXED_TARGET: "FIXED_TARGET",
} as const;

export const APP_NAME = "ONUr";
export const APP_SUBTITLE = "Otoneuro Uruguay Rehabilitación";
export const APP_ICON_SRC = "/onur-icon.png";

export const protocolCategories = [
  "Todos",
  "RVO x1",
  "RVO x2",
  "Optocinético",
  "Sacadas correctivas",
  "Guiados",
] as const;

export const backgroundTypes: Array<{ key: BackgroundType; label: string }> = [
  { key: "none", label: "Fondo liso" },
  { key: "grid", label: "Grilla" },
  { key: "stripes", label: "Franjas" },
  { key: "checkerboard", label: "Ajedrez" },
  { key: "arrows", label: "Flechas" },
  { key: "letterV", label: "Letra V" },
  { key: "divergentStripes", label: "Divergente" },
  { key: "convergentStripes", label: "Convergente" },
  { key: "intersectingStripes", label: "Intersección" },
];

export const directionTypes: Array<{ key: Direction; label: string }> = [
  { key: "right", label: "→" },
  { key: "left", label: "←" },
  { key: "up", label: "↑" },
  { key: "down", label: "↓" },
  { key: "top-left", label: "↖" },
  { key: "top-right", label: "↗" },
  { key: "bottom-left", label: "↙" },
  { key: "bottom-right", label: "↘" },
  { key: "jiggle", label: "Jiggle" },
  { key: "warp", label: "Warp" },
];

export const backgroundDirectionTypes: Array<{ key: Direction; label: string }> = [
  { key: "center", label: "Fijo" },
  ...directionTypes,
];

export const objectiveModes: Array<{ key: ObjectiveMode; label: string }> = [
  { key: "none", label: "Sin objetivo" },
  { key: "fixed", label: "Fijo" },
  { key: "moving", label: "Móvil" },
  { key: "smooth", label: "Lissajous" },
  { key: "saccade", label: "Sacadas" },
];

export const iconMap = {
  sound: "🔊",
  close: "✖",
  shield: "🛡️",
  play: "▶",
  pause: "⏸",
  skip: "⏭",
  reset: "↻",
  target: "◎",
  bg: "▦",
  mix: "▣",
  screen: "▣",
  cast: "▱",
} as const;
