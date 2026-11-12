import {
  type BandCatalog,
  type Clock,
  type DomainError,
  type LessonCatalog,
  type PlayerId,
  type Result,
  settleSchoolLesson,
} from '@mygame/domain'
import type { Transaction, TransactionStores } from '../adapters/postgres/postgresTransaction'
import { laterOf } from '../time/laterOf'

export type TownStores = Pick<
  TransactionStores,
  | 'accounts'
  | 'towns'
  | 'townNews'
  | 'lessonSlots'
  | 'cards'
  | 'pendingReviews'
  | 'reviewLog'
  | 'earnedSkills'
  | 'bandStarts'
  | 'placements'
  | 'regionMap'
  | 'cleanUps'
  | 'seenTips'
  | 'guidanceDismissals'
>

export type TownMutation<T> = (stores: TownStores, clock: Clock) => Promise<Result<T, DomainError>>

export type MutateTownDependencies = {
  readonly inTransaction: Transaction
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
