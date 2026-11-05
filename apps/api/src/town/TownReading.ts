import type { HeldCard, Instant } from '@mygame/domain'
import type { LessonSlot, Town } from '@mygame/domain/town'

export type TownReading = {
  readonly town: Town
  readonly at: Instant
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
}
