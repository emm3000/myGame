import type { PlacementBand, TownOverview } from '@mygame/contracts'
import { lessonNumberOf } from '../school/lessonCardOf'

export type LessonName =
  | { readonly kind: 'shelved'; readonly number: number }
  | { readonly kind: 'released'; readonly band: PlacementBand; readonly set: number }

export const lessonNameOf = (lessonId: string, overview: TownOverview): LessonName => {
  const released = overview.releasedLessons.find(({ id }) => id === lessonId)
  return released === undefined
    ? { kind: 'shelved', number: lessonNumberOf(lessonId, overview) }
    : { kind: 'released', band: released.band, set: released.position }
}
