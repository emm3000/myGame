import type { Headword, HeldCard, Instant, LessonSlot, Town } from '@mygame/domain'

export type TownReading = {
  readonly town: Town
  readonly at: Instant
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldOutWords: ReadonlyArray<Headword>
}
