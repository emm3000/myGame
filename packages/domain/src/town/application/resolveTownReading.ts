import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import { laterOf } from '#time/laterOf'
import type { ReadOnlyTowns } from '../domain/ReadOnlyTowns'
import type { Town } from '../domain/Town'
import type { TownCatalog } from '../domain/TownCatalog'
import type { TownNews } from '../domain/TownNews'
import type { TownReader } from '../domain/TownReader'
import type { TownReading } from '../domain/TownReading'
import type { TownRepository } from '../domain/TownRepository'
import { isLessonFinishedBy } from '../school/isLessonFinishedBy'
import type { LessonSlot } from '../school/LessonSlot'
import { type MutateTownDependencies, mutateTown } from './mutateTown'
import { readTownReading } from './readTownReading'
import { resolveTown } from './resolveTown'

export type ResolveTownReadingDependencies = MutateTownDependencies & {
  readonly towns: ReadOnlyTowns
  readonly townsWithSchool: TownReader
  readonly townCatalog: TownCatalog
}

const discardingNews: TownNews = { record: async () => ok(undefined) }

const alreadyRead = (town: Town | undefined, towns: ReadOnlyTowns): TownRepository => ({
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

export const resolveTownReading = async (
  playerId: PlayerId,
  dependencies: ResolveTownReadingDependencies,
): Promise<Result<TownReading, DomainError>> => {
  const stored = await dependencies.townsWithSchool.townWithSchoolOf(playerId)
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
    dryRun.value.events.length === 0 && !isSlotFinishedBy(stored.value.lessonSlot, readAt)
  return isUnchanged
    ? ok({ ...stored.value, town: dryRun.value.town, at: readAt })
    : persistResolvedTown(playerId, dependencies)
}
