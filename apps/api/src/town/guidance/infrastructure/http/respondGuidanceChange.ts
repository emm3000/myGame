import type { Clock, DomainError, PlayerId, Result, TownStores } from '@mygame/domain'
import { type MutateTownDependencies, mutateTown } from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'

export type GuidanceChange = (
  stores: TownStores,
  clock: Clock,
) => Promise<Result<void, DomainError>>

export const respondGuidanceChange = async (
  c: Context,
  playerId: PlayerId,
  change: GuidanceChange,
  dependencies: MutateTownDependencies,
): Promise<Response> => {
  const changed = await mutateTown(playerId, change, dependencies)
  return changed.ok ? c.body(null, 204) : respondRefusal(c, changed.error)
}
