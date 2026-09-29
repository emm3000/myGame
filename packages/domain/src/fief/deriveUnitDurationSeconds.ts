export const deriveUnitDurationSeconds = (durationSeconds: number, barracksLevel: number): number =>
  Math.ceil(durationSeconds / (1 + barracksLevel))
