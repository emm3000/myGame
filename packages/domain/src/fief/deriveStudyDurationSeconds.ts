export const deriveStudyDurationSeconds = (durationSeconds: number, libraryLevel: number): number =>
  Math.ceil(durationSeconds / (1 + libraryLevel))
