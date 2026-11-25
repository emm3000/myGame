import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { ReadOnlyTowns } from '../domain/ReadOnlyTowns'
import { readInstantOf } from '../domain/readInstantOf'
import type { Town } from '../domain/Town'
import type { TownCatalog } from '../domain/TownCatalog'
import type { TownNews } from '../domain/TownNews'
import type { TownReader, TownWithSchool } from '../domain/TownReader'
import type { TownReading } from '../domain/TownReading'
import type { TownRepository } from '../domain/TownRepository'
import { isLessonFinishedBy } from '../school/domain/isLessonFinishedBy'
import type { LessonSlot } from '../school/domain/LessonSlot'
import { type MutateTownDependencies, mutateTown } from './mutateTown'
import { readTownReading } from './readTownReading'
import { resolveTown } from './resolveTown'

export type ResolveTownReadingDependencies = MutateTownDependencies & {
  readonly towns: ReadOnlyTowns
  readonly townsWithSchool: TownReader
  readonly townCatalog: TownCatalog
}

const discardingNews: TownNews = { record: async () => ok(undefined) }

const alreadyRead = (town: Town, towns: ReadOnlyTowns): TownRepository => ({
  holdsTown: (playerId) => towns.holdsTown(playerId),
  occupiedSites: () => towns.occupiedSites(),
  townOf: async () => ok(town),
  save: async () => ok(undefined),
})

const isSlotFinishedBy = (slot: LessonSlot, readAt: Instant): boolean =>
  slot.kind === 'busy' && isLessonFinishedBy(slot, readAt)

const persistResolvedTown = (
  playerId: PlayerId,
  dependencies: ResolveTownReadingDependencies,
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
      return changed.ok ? readTownReading(playerId, clock.now(), stores.townsWithSchool) : changed
    },
    dependencies,
  )

export const resolveStoredTownReading = async (
  playerId: PlayerId,
  stored: TownWithSchool,
  dependencies: ResolveTownReadingDependencies,
): Promise<Result<TownReading, DomainError>> => {
  const now = dependencies.clock.now()
  const readAt = readInstantOf(now, stored.town.storedAt)
  const readClock: Clock = { now: () => readAt }
  const dryRun = await resolveTown(playerId, {
    towns: alreadyRead(stored.town, dependencies.towns),
    news: discardingNews,
    catalog: dependencies.townCatalog,
    clock: readClock,
  })
  if (!dryRun.ok) {
    return dryRun
  }
  const isUnchanged =
    dryRun.value.events.length === 0 && !isSlotFinishedBy(stored.lessonSlot, readAt)
  return isUnchanged
    ? ok({ ...stored, town: dryRun.value.town, at: readAt })
    : persistResolvedTown(playerId, dependencies)
}
