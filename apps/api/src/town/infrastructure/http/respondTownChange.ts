import type { Clock, DomainError, Instant, PlayerId, Result, TownStores } from '@mygame/domain'
import { type MutateTownDependencies, mutateTown, readTownReading } from '@mygame/domain'
import type { Context } from 'hono'
import { type RespondTownReadingDependencies, respondTownReading } from './respondTownReading'

export type TownChange = (stores: TownStores, clock: Clock) => Promise<Result<Instant, DomainError>>

export type RespondTownChangeDependencies = MutateTownDependencies & RespondTownReadingDependencies

export const respondTownChange = async (
  c: Context,
  playerId: PlayerId,
  change: TownChange,
  dependencies: RespondTownChangeDependencies,
): Promise<Response> => {
  const changed = await mutateTown(
    playerId,
    async (stores, clock) => {
      const readAt = await change(stores, clock)
      return readAt.ok ? readTownReading(playerId, readAt.value, stores.townsWithSchool) : readAt
    },
    dependencies,
  )
  return respondTownReading(c, changed, dependencies)
}
