export type ExerciseKey =
  | "vor_x1_horizontal"
  | "vor_x1_vertical"
  | "vor_x2_horizontal"
  | "vor_x2_vertical"
  | "smooth_pursuit"
  | "saccades";

export type ExerciseMode = "fixed" | "moving" | "jump";
export type Axis = "horizontal" | "vertical" | "configurable";
export type SaccadeDirection = "horizontal" | "vertical" | "diagonal" | "random";
export type BackgroundKey = "plain" | "grid" | "stripes" | "busy";
export type DotColor = "red" | "blue" | "black" | "white";
export type SessionState = "idle" | "playing" | "paused" | "resting" | "done";
export type ClarityKey = "clear" | "blurry" | "lost";

export interface ExerciseDef {
  key: ExerciseKey;
  name: string;
  mode: ExerciseMode;
  axis: Axis;
  instruction: string;
  cue: string;
  hasMetronome: boolean;
}

export interface PresetDef {
  key: string;
  label: string;
  frequency: number;
  amplitude: number;
  duration: number;
  dotSize: number;
  totalSets: number;
  restDuration: number;
  background: BackgroundKey;
}

export interface HistoryRecord {
  id: string;
  date: string;
  exerciseKey: ExerciseKey;
  exerciseName: string;
  preset: string;
  frequency: number;
  amplitude: number;
  duration: number;
  dotSize: number;
  dotColor: DotColor;
  backgroundKey: BackgroundKey;
  totalSets: number;
  restDuration: number;
  saccadeMode: SaccadeDirection | null;
  symptomBefore: number;
  symptomAfter: number;
  clarity: ClarityKey;
  completed: boolean;
  recommendation: string;
}

export const EXERCISES: Record<ExerciseKey, ExerciseDef> = {
  vor_x1_horizontal: {
    key: "vor_x1_horizontal",
    name: "RVO x1 horizontal",
    mode: "fixed",
    axis: "horizontal",
    instruction:
      "Mantené la mirada fija en el punto. Mové la cabeza de izquierda a derecha siguiendo el ritmo del metrónomo.",
    cue: "← cabeza →",
    hasMetronome: true,
  },
  vor_x1_vertical: {
    key: "vor_x1_vertical",
    name: "RVO x1 vertical",
    mode: "fixed",
    axis: "vertical",
    instruction:
      "Mantené la mirada fija en el punto. Mové la cabeza arriba y abajo siguiendo el ritmo del metrónomo.",
    cue: "↑ cabeza ↓",
    hasMetronome: true,
  },
  vor_x2_horizontal: {
    key: "vor_x2_horizontal",
    name: "RVO x2 horizontal",
    mode: "moving",
    axis: "horizontal",
    instruction: "Seguí el punto con la mirada. Mové la cabeza en sentido contrario al punto.",
    cue: "punto → · cabeza ←",
    hasMetronome: false,
  },
  vor_x2_vertical: {
    key: "vor_x2_vertical",
    name: "RVO x2 vertical",
    mode: "moving",
    axis: "vertical",
    instruction: "Seguí el punto con la mirada. Mové la cabeza en sentido contrario al punto.",
    cue: "punto ↑ · cabeza ↓",
    hasMetronome: false,
  },
  smooth_pursuit: {
    key: "smooth_pursuit",
    name: "Seguimiento visual",
    mode: "moving",
    axis: "horizontal",
    instruction: "Seguí el punto solo con los ojos. La cabeza queda completamente quieta.",
    cue: "ojos siguen · cabeza quieta",
    hasMetronome: false,
  },
  saccades: {
    key: "saccades",
    name: "Sacadas visuales",
    mode: "jump",
    axis: "configurable",
    instruction: "Hacé movimientos oculares rápidos hacia el nuevo punto. La cabeza queda quieta.",
    cue: "mirada rápida · cabeza quieta",
    hasMetronome: false,
  },
};

export const PRESETS: Record<string, PresetDef> = {
  beginner: {
    key: "beginner",
    label: "Principiante",
    frequency: 0.4,
    amplitude: 20,
    duration: 20,
    dotSize: 50,
    totalSets: 2,
    restDuration: 40,
    background: "plain",
  },
  base: {
    key: "base",
    label: "Base clínica",
    frequency: 0.8,
    amplitude: 35,
    duration: 40,
    dotSize: 36,
    totalSets: 3,
    restDuration: 30,
    background: "grid",
  },
  advanced: {
    key: "advanced",
    label: "Avanzado",
    frequency: 1.2,
    amplitude: 50,
    duration: 60,
    dotSize: 28,
    totalSets: 4,
    restDuration: 25,
    background: "stripes",
  },
  athlete: {
    key: "athlete",
    label: "Deportivo",
    frequency: 1.6,
    amplitude: 60,
    duration: 75,
    dotSize: 24,
    totalSets: 5,
    restDuration: 20,
    background: "busy",
  },
};

export const SAFETY_KEY = "neurovisual_rvo_safety_ack_v1";
export const HISTORY_KEY = "neurovisual_rvo_history_v1";
export const MAX_HISTORY = 50;

export function safeGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
export function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function buildRecommendation(symptomAfter: number, clarity: ClarityKey): string {
  if (clarity === "lost") return "Bajá la velocidad hasta mantener el punto claro en todo momento.";
  if (symptomAfter >= 7) return "Síntomas altos. Reducí velocidad y amplitud un 30% en la próxima sesión.";
  if (symptomAfter >= 5) return "Próxima sesión: bajá velocidad o amplitud un 20%.";
  if (clarity === "blurry") return "El punto se volvió borroso: mantené este nivel hasta lograrlo claro.";
  if (symptomAfter <= 2 && clarity === "clear")
    return "Muy bien. Podés subir la velocidad o la duración levemente.";
  return "Nivel adecuado. Mantené los mismos parámetros.";
}

export function toCSV(records: HistoryRecord[]): string {
  const headers = [
    "id","date","exerciseKey","exerciseName","preset","frequency","amplitude","duration",
    "dotSize","dotColor","backgroundKey","totalSets","restDuration","saccadeMode",
    "symptomBefore","symptomAfter","clarity","completed","recommendation",
  ];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = records.map((r) => headers.map((h) => esc((r as any)[h])).join(","));
  return [headers.join(","), ...rows].join("\n");
}
