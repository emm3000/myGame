import type { ReadOnlyTowns, TownReader, TownReading } from '@mygame/domain'
import {
  type Clock,
  type DomainError,
  err,
  type Instant,
  isLessonFinishedBy,
  type LessonSlot,
  laterOf,
  type MutateTownDependencies,
  mutateTown,
  ok,
  type PlayerId,
  type Result,
  readTownReading,
  resolveTown,
  type Town,
  type TownCatalog,
  type TownNews,
  type TownRepository,
} from '@mygame/domain'

export type ResolveCurrentTownDependencies = MutateTownDependencies & {
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
  dependencies: ResolveCurrentTownDependencies,
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

export const resolveCurrentTown = async (
  playerId: PlayerId,
  dependencies: ResolveCurrentTownDependencies,
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
