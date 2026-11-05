import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { resolvedTownOf } from './resolvedTownOf'
import { saveResolvedTown } from './saveResolvedTown'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type ResolveTownDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const resolveTown = async (
  playerId: PlayerId,
  { towns, news, catalog, clock }: ResolveTownDependencies,
): Promise<Result<ChangedTown, DomainError>> => {
  const resolved = await resolvedTownOf(playerId, towns, catalog, clock.now())
  if (!resolved.ok) {
    return resolved
  }
  const saved = await saveResolvedTown(resolved.value, towns, news)
  if (!saved.ok) {
    return saved
  }
  return ok(resolved.value)
}
