import type { BackgroundConfig, ObjectiveConfig } from "../../types";

export function getBackgroundElapsed(
  background: BackgroundConfig,
  objective: ObjectiveConfig,
  elapsed: number,
) {
  if (objective.mode === "saccade" && background.type === "checkerboard") return 0;

  return elapsed;
}
