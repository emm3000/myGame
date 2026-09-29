export const deriveStudyDurationSeconds = (
  durationSeconds: number,
  libraryLevel: number,
  studyPercent: number,
): number => Math.ceil((durationSeconds * studyPercent) / (100 * (1 + libraryLevel)))
