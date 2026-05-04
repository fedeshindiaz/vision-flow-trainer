export type ModuleId =
  | "OPTOKINETIC"
  | "VOR_X2"
  | "SMOOTH_PURSUIT"
  | "CORRECTIVE_SACCADES"
  | "FIXED_TARGET";

export type BackgroundType =
  | "none"
  | "grid"
  | "stripes"
  | "checkerboard"
  | "arrows"
  | "letterV"
  | "divergentStripes"
  | "convergentStripes"
  | "intersectingStripes";

export type Direction =
  | "right"
  | "left"
  | "up"
  | "down"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "horizontal"
  | "vertical"
  | "center"
  | "jiggle"
  | "warp"
  | "multi"
  | "lissajous";

export type ObjectiveMode = "none" | "fixed" | "moving" | "smooth" | "saccade";

export type SessionState = "idle" | "playing" | "resting" | "done";

export interface BackgroundConfig {
  enabled: boolean;
  type: BackgroundType;
  direction: Direction;
}

export interface ObjectiveConfig {
  enabled: boolean;
  mode: ObjectiveMode;
  direction: Direction;
}

export interface Protocol {
  id: string;
  sourceVideo: number | null;
  category: string;
  module: ModuleId;
  name: string;
  level: string;
  cue: string;
  head: string;
  eyes: string;
  background: BackgroundConfig;
  objective: ObjectiveConfig;
  frequencyHz: number;
  metronome: boolean;
}
