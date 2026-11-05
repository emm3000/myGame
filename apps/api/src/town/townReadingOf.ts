import { type DomainError, type Instant, ok, type Result } from '@mygame/domain'
import type { LessonSlotRepository, Town } from '@mygame/domain/town'
import type { CardReader } from '../learning/CardReader'
import type { TownReading } from './TownReading'

export type SchoolStores = {
  readonly lessonSlots: Pick<LessonSlotRepository, 'lessonSlotOf'>
  readonly cards: CardReader
}

export const townReadingOf = async (
  town: Town,
  at: Instant,
  { lessonSlots, cards }: SchoolStores,
): Promise<Result<TownReading, DomainError>> => {
  const lessonSlot = await lessonSlots.lessonSlotOf(town.id)
  if (!lessonSlot.ok) {
    return lessonSlot
  }
  const held = await cards.cardsOf(town.playerId)
  if (!held.ok) {
    return held
  }
  return ok({ town, at, lessonSlot: lessonSlot.value, cards: held.value })
}
