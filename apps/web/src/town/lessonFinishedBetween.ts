import type { TownOverview } from '@mygame/contracts/town'

export function lessonFinishedBetween(
  previous: TownOverview,
  next: TownOverview,
): string | undefined {
  const { lessonSlot } = previous
  if (lessonSlot === null) {
    return undefined
  }
  const lesson = next.lessons.find(({ id }) => id === lessonSlot.lessonId)
  return lesson?.isStudied === true ? lesson.id : undefined
}
