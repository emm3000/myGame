export const deriveLessonDurationSeconds = (
  durationSeconds: number,
  lessonPercent: number,
  studyPercent: number,
): number => Math.ceil((durationSeconds * lessonPercent * studyPercent) / 10_000)
