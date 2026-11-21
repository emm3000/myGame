import type { PlacementBand, TownOverview } from '@mygame/contracts'

export type LessonName =
  | { readonly kind: 'shelved'; readonly number: number }
  | { readonly kind: 'released'; readonly band: PlacementBand; readonly set: number }

export const lessonNumberOf = (lessonId: string, overview: TownOverview): number =>
  overview.lessons.findIndex(({ id }) => id === lessonId) + 1

export const lessonNameOf = (lessonId: string, overview: TownOverview): LessonName => {
  const released = overview.releasedLessons.find(({ id }) => id === lessonId)
  return released === undefined
    ? { kind: 'shelved', number: lessonNumberOf(lessonId, overview) }
    : { kind: 'released', band: released.band, set: released.position }
}
