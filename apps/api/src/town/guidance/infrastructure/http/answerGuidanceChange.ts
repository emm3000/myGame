import type { Clock, DomainError, PlayerId, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { type MutateTownDependencies, mutateTown } from '../../../application/mutateTown'
import type { TownStores } from '../../../application/ports/TownStores'

export type GuidanceChange = (
  stores: TownStores,
  clock: Clock,
) => Promise<Result<void, DomainError>>

export const answerGuidanceChange = async (
  c: Context,
  playerId: PlayerId,
  change: GuidanceChange,
  dependencies: MutateTownDependencies,
): Promise<Response> => {
  const changed = await mutateTown(playerId, change, dependencies)
  return changed.ok ? c.body(null, 204) : answerRefusal(c, changed.error)
}
