export const deriveHireDurationSeconds = (
  durationSeconds: number,
  officeLevel: number,
  hirePercent: number,
): number => Math.ceil((durationSeconds * hirePercent) / (100 * (1 + officeLevel)))
