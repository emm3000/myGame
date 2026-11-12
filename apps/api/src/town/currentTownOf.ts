import {
  type Clock,
  type DomainError,
  err,
  type Instant,
  type LessonSlot,
  ok,
  type PlayerId,
  type Result,
  resolveTown,
  type Town,
  type TownCatalog,
  type TownNews,
  type TownRepository,
} from '@mygame/domain'
import { laterOf } from '../time/laterOf'
import { type MutateTownDependencies, mutateTown } from './mutateTown'
import type { TownReader } from './TownReader'
import type { TownReading } from './TownReading'
import { townReadingOf } from './townReadingOf'

export type CurrentTownDependencies = MutateTownDependencies & {
  readonly towns: TownReader
  readonly townCatalog: TownCatalog
}

const discardingNews: TownNews = { record: async () => ok(undefined) }

const alreadyRead = (town: Town | undefined, towns: TownReader): TownRepository => ({
  holdsTown: (playerId) => towns.holdsTown(playerId),
  occupiedSites: () => towns.occupiedSites(),
  townOf: async () => ok(town),
  save: async () => ok(undefined),
})

const isLessonFinishedBy = (slot: LessonSlot, readAt: Instant): boolean =>
  slot.kind === 'busy' && slot.finishesAt.epochMilliseconds <= readAt.epochMilliseconds

const persistedResolveOf = (
  playerId: PlayerId,
  dependencies: CurrentTownDependencies,
): Promise<Result<TownReading, DomainError>> =>
  mutateTown(
    playerId,
    async (stores, clock) => {
      const changed = await resolveTown(playerId, {
        towns: stores.towns,
        news: stores.townNews,
        catalog: dependencies.townCatalog,
        clock,
      })
      return changed.ok ? townReadingOf(playerId, clock.now(), stores.towns) : changed
    },
    dependencies,
  )

export const currentTownOf = async (
  playerId: PlayerId,
  dependencies: CurrentTownDependencies,
): Promise<Result<TownReading, DomainError>> => {
  const stored = await dependencies.towns.townWithSchoolOf(playerId)
  if (!stored.ok) {
    return stored
  }
  const now = dependencies.clock.now()
  const readAt = stored.value === undefined ? now : laterOf(now, stored.value.town.storedAt)
  const readClock: Clock = { now: () => readAt }
  const dryRun = await resolveTown(playerId, {
    towns: alreadyRead(stored.value?.town, dependencies.towns),
    news: discardingNews,
    catalog: dependencies.townCatalog,
    clock: readClock,
  })
  if (!dryRun.ok) {
    return dryRun
  }
  if (stored.value === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  const isUnchanged =
    dryRun.value.events.length === 0 && !isLessonFinishedBy(stored.value.lessonSlot, readAt)
  return isUnchanged
    ? ok({ ...stored.value, town: dryRun.value.town, at: readAt })
    : persistedResolveOf(playerId, dependencies)
}
