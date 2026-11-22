import type { DomainError } from '#DomainError'
import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import { laterOf } from '#time/laterOf'
import type { TownStores } from '../domain/TownStores'
import { settleSchoolLesson } from '../school/useCases/settleSchoolLesson'

export type TownMutation<T> = (stores: TownStores, clock: Clock) => Promise<Result<T, DomainError>>

export type MutateTownDependencies = {
  readonly unitOfWork: UnitOfWork<TownStores>
  readonly clock: Clock
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'> &
    Pick<BandCatalog, 'wordsOfBand'>
}

export const mutateTown = <T>(
  playerId: PlayerId,
  mutation: TownMutation<T>,
  { unitOfWork, clock, lessons }: MutateTownDependencies,
): Promise<Result<T, DomainError>> =>
  unitOfWork.transact(async (stores) => {
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
