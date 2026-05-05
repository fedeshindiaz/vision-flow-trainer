export const MIN_FREQUENCY_HZ = 0.1;
export const METRONOME_LOOKAHEAD_MS = 25;
export const METRONOME_SCHEDULE_AHEAD_MS = 140;

export function normalizeFrequencyHz(frequencyHz: number) {
  return Math.max(MIN_FREQUENCY_HZ, frequencyHz);
}

export function getBeatIntervalMs(frequencyHz: number) {
  return 1000 / normalizeFrequencyHz(frequencyHz);
}

export function getBeatIntervalSeconds(frequencyHz: number) {
  return getBeatIntervalMs(frequencyHz) / 1000;
}

export function getScheduledBeatTimes(startTimeSeconds: number, frequencyHz: number, count: number) {
  const interval = getBeatIntervalSeconds(frequencyHz);

  return Array.from({ length: Math.max(0, count) }, (_, index) => startTimeSeconds + interval * index);
}

export function getBeatIndex(elapsedSeconds: number, frequencyHz: number) {
  return Math.floor(Math.max(0, elapsedSeconds) * normalizeFrequencyHz(frequencyHz));
}

export function getNextBeatElapsedMs(baseElapsedMs: number, frequencyHz: number) {
  const intervalMs = getBeatIntervalMs(frequencyHz);
  const safeElapsedMs = Math.max(0, baseElapsedMs);

  return (Math.floor(safeElapsedMs / intervalMs) + 1) * intervalMs;
}

export function getNextBeatAtMs(
  syncStartMs: number | null,
  syncBaseElapsedMs: number,
  nowMs: number,
  frequencyHz: number,
) {
  const intervalMs = getBeatIntervalMs(frequencyHz);

  if (syncStartMs === null) return nowMs + intervalMs;

  const elapsedMs = syncBaseElapsedMs + Math.max(0, nowMs - syncStartMs);
  const nextElapsedMs = getNextBeatElapsedMs(elapsedMs, frequencyHz);

  return syncStartMs + nextElapsedMs - syncBaseElapsedMs;
}

export function getBeatSyncedLinearFactor(elapsedSeconds: number, frequencyHz: number) {
  const beatPosition = Math.max(0, elapsedSeconds) * normalizeFrequencyHz(frequencyHz);
  const beatIndex = Math.floor(beatPosition);
  const beatProgress = beatPosition - beatIndex;
  const easedProgress = (1 - Math.cos(beatProgress * Math.PI)) / 2;

  return beatIndex % 2 === 0 ? -1 + easedProgress * 2 : 1 - easedProgress * 2;
}
