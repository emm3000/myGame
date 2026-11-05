import type { DomainError } from '../DomainError'
import type { HeldCard } from '../learning/HeldCard'
import type { PlayerId } from '../player/PlayerId'
import type { CardRepository } from '../ports/CardRepository'
import { ok, type Result } from '../Result'
import type { LessonSlot } from './LessonSlot'
import type { LessonSlotRepository } from './LessonSlotRepository'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'
import type { TownNews } from './TownNews'

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
