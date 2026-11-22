import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TownReading } from '../domain/TownReading'
import type { TownStores } from '../domain/TownStores'
import { type MutateTownDependencies, mutateTown } from './mutateTown'
import { readTownReading } from './readTownReading'

export type TownChange = (stores: TownStores, clock: Clock) => Promise<Result<Instant, DomainError>>

export const changeTown = (
  playerId: PlayerId,
  change: TownChange,
  dependencies: MutateTownDependencies,
): Promise<Result<TownReading, DomainError>> =>
  mutateTown(
    playerId,
    async (stores, clock) => {
      const readAt = await change(stores, clock)
      return readAt.ok ? readTownReading(playerId, readAt.value, stores.townsWithSchool) : readAt
    },
    dependencies,
  )
