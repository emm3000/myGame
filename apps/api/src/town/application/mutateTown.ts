import {
  type BandCatalog,
  type BandStartRepository,
  type CardRepository,
  type CleanUpRepository,
  type Clock,
  type DomainError,
  type EarnedSkillRepository,
  type LessonCatalog,
  type LessonSlotRepository,
  laterOf,
  type PendingReviewRepository,
  type PlacementRepository,
  type PlayerId,
  type RegionMapReader,
  type Result,
  type ReviewLog,
  settleSchoolLesson,
  type TownNews,
  type TownRepository,
} from '@mygame/domain'
import type { Accounts } from '../../account/application/ports/Accounts'
import type { Transaction } from '../../platform/application/ports/Transaction'
import type { GuidanceDismissals } from './ports/GuidanceDismissals'
import type { SeenTips } from './ports/SeenTips'
import type { TownNewsReader } from './ports/TownNewsReader'
import type { TownReader } from './ports/TownReader'

export type TownStores = {
  readonly accounts: Accounts
  readonly towns: TownRepository
  readonly townsWithSchool: TownReader
  readonly townNews: TownNews & TownNewsReader
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
  readonly earnedSkills: EarnedSkillRepository
  readonly bandStarts: BandStartRepository
  readonly placements: PlacementRepository
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpRepository
  readonly seenTips: SeenTips
  readonly guidanceDismissals: GuidanceDismissals
}

export type TownMutation<T> = (stores: TownStores, clock: Clock) => Promise<Result<T, DomainError>>

export type MutateTownDependencies = {
  readonly inTransaction: Transaction<TownStores>
  readonly clock: Clock
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'> &
    Pick<BandCatalog, 'wordsOfBand'>
}

export const mutateTown = <T>(
  playerId: PlayerId,
  mutation: TownMutation<T>,
  { inTransaction, clock, lessons }: MutateTownDependencies,
): Promise<Result<T, DomainError>> =>
  inTransaction(async (stores) => {
    await stores.accounts.lockPlayer(playerId)
    const locked = await stores.towns.townOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const mutatedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const mutationClock: Clock = { now: () => mutatedAt }
    const settled = await settleSchoolLesson(playerId, {
      towns: stores.towns,
      lessonSlots: stores.lessonSlots,
      cards: stores.cards,
      bandStarts: stores.bandStarts,
      lessons,
      bands: lessons,
      news: stores.townNews,
      clock: mutationClock,
    })
    if (!settled.ok) {
      return settled
    }
    return mutation(stores, mutationClock)
  })
