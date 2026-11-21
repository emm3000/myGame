import type { Clock, DomainError, PlayerId, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { type MutateTownDependencies, mutateTown } from '../../../application/mutateTown'
import type { TownStores } from '../../../application/ports/TownStores'

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
