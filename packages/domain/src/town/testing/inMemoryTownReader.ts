import type { Accounts } from '#account/domain/Accounts'
import type { DomainError } from '#DomainError'
import type { BandStartRepository } from '#holdout/domain/BandStartRepository'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { PlacementScore } from '#placement/domain/Placement'
import type { PlacementRepository } from '#placement/domain/PlacementRepository'
import { placementScoresOf } from '#placement/domain/placementScoresOf'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TownReader, TownWithSchool } from '../domain/TownReader'
import type { TownRepository } from '../domain/TownRepository'
import type { TipKind } from '../guidance/domain/TipKind'
import type { LessonSlotRepository } from '../school/domain/LessonSlotRepository'

export type TownReaderStores = {
  readonly accounts: Pick<Accounts, 'playerOf'>
  readonly towns: Pick<TownRepository, 'townOf'>
  readonly lessonSlots: Pick<LessonSlotRepository, 'lessonSlotOf'>
  readonly cards: Pick<CardRepository, 'cardsOf'>
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly placements: Pick<PlacementRepository, 'placementOf'>
  readonly guidanceDismissals: {
    dismissedAt(playerId: PlayerId): Promise<Instant | undefined>
  }
  readonly seenTips: { seenTipsOf(playerId: PlayerId): Promise<ReadonlyArray<TipKind>> }
}

type HeldSchool = Pick<TownWithSchool, 'cards' | 'bandStarts' | 'placementScores'>

const byBand = (left: PlacementScore, right: PlacementScore): number => left.band - right.band

const heldSchoolOf = async (
  playerId: PlayerId,
  stores: TownReaderStores,
): Promise<Result<HeldSchool, DomainError>> => {
  const cards = await stores.cards.cardsOf(playerId)
  if (!cards.ok) {
    return cards
  }
  const bandStarts = await stores.bandStarts.bandStartsOf(playerId)
  if (!bandStarts.ok) {
    return bandStarts
  }
  const placement = await stores.placements.placementOf(playerId)
  if (!placement.ok) {
    return placement
  }
  return ok({
    cards: cards.value,
    bandStarts: bandStarts.value,
    placementScores: [...placementScoresOf(placement.value)].sort(byBand),
  })
}

export const inMemoryTownReader = (stores: TownReaderStores): TownReader => ({
  townWithSchoolOf: async (playerId): Promise<Result<TownWithSchool | undefined, DomainError>> => {
    const player = await stores.accounts.playerOf(playerId)
    const town = await stores.towns.townOf(playerId)
    if (!town.ok) {
      return town
    }
    if (town.value === undefined || player === undefined) {
      return ok(undefined)
    }
    const lessonSlot = await stores.lessonSlots.lessonSlotOf(town.value.id)
    if (!lessonSlot.ok) {
      return lessonSlot
    }
    const school = await heldSchoolOf(playerId, stores)
    if (!school.ok) {
      return school
    }
    return ok({
      ...school.value,
      scaffold: player.scaffold,
      scaffoldVersion: player.scaffoldVersion,
      town: town.value,
      lessonSlot: lessonSlot.value,
      guidanceDismissedAt: await stores.guidanceDismissals.dismissedAt(playerId),
      seenTips: await stores.seenTips.seenTipsOf(playerId),
    })
  },
})
