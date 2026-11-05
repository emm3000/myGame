import { type Clock, type DomainError, ok, type PlayerId, type Result } from '@mygame/domain'
import {
  resolveTown,
  type Town,
  type TownCatalog,
  type TownNews,
  type TownRepository,
} from '@mygame/domain/town'
import { laterOf } from '../time/laterOf'
import { type MutateTownDependencies, mutateTown } from './mutateTown'
import type { TownReader } from './TownReader'
import type { TownReading } from './TownReading'

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

const persistedResolveOf = (
  playerId: PlayerId,
  dependencies: CurrentTownDependencies,
): Promise<Result<TownReading, DomainError>> =>
  mutateTown(
    playerId,
    async ({ towns, townNews }, clock) => {
      const changed = await resolveTown(playerId, {
        towns,
        news: townNews,
        catalog: dependencies.townCatalog,
        clock,
      })
      return changed.ok ? ok({ town: changed.value.town, at: clock.now() }) : changed
    },
    dependencies,
  )

export const currentTownOf = async (
  playerId: PlayerId,
  dependencies: CurrentTownDependencies,
): Promise<Result<TownReading, DomainError>> => {
  const stored = await dependencies.towns.townOf(playerId)
  if (!stored.ok) {
    return stored
  }
  const now = dependencies.clock.now()
  const readAt = stored.value === undefined ? now : laterOf(now, stored.value.storedAt)
  const readClock: Clock = { now: () => readAt }
  const dryRun = await resolveTown(playerId, {
    towns: alreadyRead(stored.value, dependencies.towns),
    news: discardingNews,
    catalog: dependencies.townCatalog,
    clock: readClock,
  })
  if (!dryRun.ok) {
    return dryRun
  }
  if (dryRun.value.events.length === 0) {
    return ok({ town: dryRun.value.town, at: readAt })
  }
  return persistedResolveOf(playerId, dependencies)
}
