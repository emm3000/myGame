import type { StoredScaffold } from '#account/domain/StoredScaffold'
import type { DomainError } from '#DomainError'
import type { BandStartRepository } from '#holdout/ports/BandStartRepository'
import type { CardRepository } from '#learning/ports/CardRepository'
import { ok, type Result } from '#Result'
import type { TownReader, TownWithSchool } from '../domain/TownReader'
import type { TownRepository } from '../domain/TownRepository'
import type { LessonSlotRepository } from '../school/ports/LessonSlotRepository'

export type TownReaderStores = {
  readonly towns: Pick<TownRepository, 'townOf'>
  readonly lessonSlots: Pick<LessonSlotRepository, 'lessonSlotOf'>
  readonly cards: Pick<CardRepository, 'cardsOf'>
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
}

export const inMemoryTownReader = (
  { towns, lessonSlots, cards, bandStarts }: TownReaderStores,
  scaffold: StoredScaffold,
): TownReader => ({
  townWithSchoolOf: async (playerId): Promise<Result<TownWithSchool | undefined, DomainError>> => {
    const town = await towns.townOf(playerId)
    if (!town.ok) {
      return town
    }
    if (town.value === undefined) {
      return ok(undefined)
    }
    const lessonSlot = await lessonSlots.lessonSlotOf(town.value.id)
    if (!lessonSlot.ok) {
      return lessonSlot
    }
    const heldCards = await cards.cardsOf(playerId)
    if (!heldCards.ok) {
      return heldCards
    }
    const starts = await bandStarts.bandStartsOf(playerId)
    if (!starts.ok) {
      return starts
    }
    return ok({
      ...scaffold,
      town: town.value,
      lessonSlot: lessonSlot.value,
      cards: heldCards.value,
      bandStarts: starts.value,
      placementScores: [],
      guidanceDismissedAt: undefined,
      seenTips: [],
    })
  },
})
