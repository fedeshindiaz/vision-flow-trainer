import type { BackgroundConfig, ObjectiveConfig, SessionState } from "../types";

export const CAST_NAMESPACE = "urn:x-cast:com.onur.visionflow";
export const CAST_PROTOCOL_VERSION = 1;

export const castMessageTypes = [
  "INIT_STATE",
  "PATCH_STATE",
  "PLAY",
  "PAUSE",
  "RESET",
  "SKIP",
  "SET_PROTOCOL",
  "SET_BACKGROUND",
  "SET_OBJECTIVE",
  "SET_PARAMETER",
  "PING",
  "PONG",
  "RECEIVER_READY",
  "ERROR",
] as const;

export type CastMessageType = (typeof castMessageTypes)[number];

export interface SharedExerciseState {
  selectedProtocolId: string;
  selectedProtocolName: string;
  selectedProtocolCategory: string;
  background: BackgroundConfig;
  objective: ObjectiveConfig;
  frequencyHz: number;
  amplitude: number;
  targetSize: number;
  density: number;
  stripeSize: number;
  duration: number;
  sets: number;
  rest: number;
  running: boolean;
  sessionState: SessionState;
  timeLeft: number;
  currentSet: number;
  resetKey: number;
  metronomeEnabled: boolean;
  updatedAt: number;
  startedAt: number | null;
  pausedAt: number | null;
  accumulatedElapsedMs: number;
}

export type SharedExercisePatch = Partial<SharedExerciseState>;

export interface ReceiverReadyPayload {
  status: "waiting" | "connected" | "playing" | "resting" | "done";
  version: string;
}

export interface CastErrorPayload {
  code: string;
  message: string;
}

export interface CastMessage<TType extends CastMessageType = CastMessageType> {
  type: TType;
  version: number;
  sentAt: number;
  payload?: unknown;
}

export function createCastMessage<TType extends CastMessageType>(
  type: TType,
  payload?: unknown,
): CastMessage<TType> {
  return {
    type,
    version: CAST_PROTOCOL_VERSION,
    sentAt: Date.now(),
    payload,
  };
}

export function isCastMessageType(value: unknown): value is CastMessageType {
  return typeof value === "string" && castMessageTypes.includes(value as CastMessageType);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeCastMessage(input: unknown): CastMessage | null {
  try {
    const parsed = typeof input === "string" ? JSON.parse(input) : input;

    if (!isRecord(parsed) || !isCastMessageType(parsed.type)) return null;

    return {
      type: parsed.type,
      version: typeof parsed.version === "number" ? parsed.version : CAST_PROTOCOL_VERSION,
      sentAt: typeof parsed.sentAt === "number" ? parsed.sentAt : Date.now(),
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

export function sanitizeSharedExercisePatch(payload: unknown): SharedExercisePatch | null {
  if (!isRecord(payload)) return null;

  const patch: SharedExercisePatch = {};

  copyString(payload, patch, "selectedProtocolId");
  copyString(payload, patch, "selectedProtocolName");
  copyString(payload, patch, "selectedProtocolCategory");
  copyConfig(payload, patch, "background");
  copyConfig(payload, patch, "objective");
  copyNumber(payload, patch, "frequencyHz");
  copyNumber(payload, patch, "amplitude");
  copyNumber(payload, patch, "targetSize");
  copyNumber(payload, patch, "density");
  copyNumber(payload, patch, "stripeSize");
  copyNumber(payload, patch, "duration");
  copyNumber(payload, patch, "sets");
  copyNumber(payload, patch, "rest");
  copyBoolean(payload, patch, "running");
  copySessionState(payload, patch);
  copyNumber(payload, patch, "timeLeft");
  copyNumber(payload, patch, "currentSet");
  copyNumber(payload, patch, "resetKey");
  copyBoolean(payload, patch, "metronomeEnabled");
  copyNumber(payload, patch, "updatedAt");
  copyNullableNumber(payload, patch, "startedAt");
  copyNullableNumber(payload, patch, "pausedAt");
  copyNumber(payload, patch, "accumulatedElapsedMs");

  return Object.keys(patch).length ? patch : null;
}

export function computeVisualElapsedMs(state: Pick<SharedExerciseState, "running" | "sessionState" | "startedAt" | "accumulatedElapsedMs">) {
  const base = Math.max(0, state.accumulatedElapsedMs || 0);

  if (!state.running || state.sessionState !== "playing" || !state.startedAt) {
    return base;
  }

  return Math.max(0, base + Date.now() - state.startedAt);
}

export function createStatePatch(previous: SharedExerciseState | null, next: SharedExerciseState): SharedExercisePatch {
  if (!previous) return next;

  const patch: SharedExercisePatch = {};
  const keys = Object.keys(next) as Array<keyof SharedExerciseState>;

  keys.forEach((key) => {
    if (!sameValue(previous[key], next[key])) {
      patch[key] = next[key] as never;
    }
  });

  return patch;
}

function sameValue(left: unknown, right: unknown) {
  if (Object.is(left, right)) return true;
  if (isRecord(left) || isRecord(right)) return JSON.stringify(left) === JSON.stringify(right);
  return false;
}

function copyString(source: Record<string, unknown>, target: SharedExercisePatch, key: keyof SharedExerciseState) {
  if (typeof source[key] === "string") {
    target[key] = source[key] as never;
  }
}

function copyNumber(source: Record<string, unknown>, target: SharedExercisePatch, key: keyof SharedExerciseState) {
  if (typeof source[key] === "number" && Number.isFinite(source[key])) {
    target[key] = source[key] as never;
  }
}

function copyNullableNumber(source: Record<string, unknown>, target: SharedExercisePatch, key: keyof SharedExerciseState) {
  if (source[key] === null || (typeof source[key] === "number" && Number.isFinite(source[key]))) {
    target[key] = source[key] as never;
  }
}

function copyBoolean(source: Record<string, unknown>, target: SharedExercisePatch, key: keyof SharedExerciseState) {
  if (typeof source[key] === "boolean") {
    target[key] = source[key] as never;
  }
}

function copyConfig(source: Record<string, unknown>, target: SharedExercisePatch, key: "background" | "objective") {
  if (isRecord(source[key])) {
    target[key] = source[key] as never;
  }
}

function copySessionState(source: Record<string, unknown>, target: SharedExercisePatch) {
  const value = source.sessionState;

  if (value === "idle" || value === "playing" || value === "resting" || value === "done") {
    target.sessionState = value;
  }
}
