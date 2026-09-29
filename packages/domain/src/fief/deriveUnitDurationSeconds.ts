export const deriveUnitDurationSeconds = (
  durationSeconds: number,
  barracksLevel: number,
  trainPercent: number,
): number => Math.ceil((durationSeconds * trainPercent) / (100 * (1 + barracksLevel)))
