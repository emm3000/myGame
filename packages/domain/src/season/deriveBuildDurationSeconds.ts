export const deriveBuildDurationSeconds = (durationSeconds: number, buildPercent: number): number =>
  Math.ceil((durationSeconds * buildPercent) / 100)
