import type { DomainError } from '#DomainError'
import type { HeldCard } from '#learning/HeldCard'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { TownEvent } from '../../domain/TownEvent'
import type { TownId } from '../../domain/TownId'
import type { TownNews } from '../../domain/TownNews'
import type { LessonSlot } from '../domain/LessonSlot'
import type { LessonSlotRepository } from '../domain/LessonSlotRepository'

export type LessonSlotChange = {
  readonly entered: ReadonlyArray<HeldCard>
  readonly slot: LessonSlot
  readonly events: ReadonlyArray<TownEvent>
}

export type LessonSlotStores = {
  readonly cards: CardRepository
  readonly lessonSlots: LessonSlotRepository
  readonly news: TownNews
}

export const saveLessonSlot = async (
  playerId: PlayerId,
  townId: TownId,
  { entered, slot, events }: LessonSlotChange,
  { cards, lessonSlots, news }: LessonSlotStores,
): Promise<Result<void, DomainError>> => {
  for (const card of entered) {
    const saved = await cards.save(playerId, card)
    if (!saved.ok) {
      return saved
    }
  }
  const saved = await lessonSlots.save(townId, slot)
  if (!saved.ok) {
    return saved
  }
  return events.length === 0 ? ok(undefined) : news.record(townId, events)
}
