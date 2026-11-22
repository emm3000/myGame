import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { TownCatalog } from '../ports/TownCatalog'
import type { TownNews } from '../ports/TownNews'
import type { TownRepository } from '../ports/TownRepository'
import { resolveStoredTown } from '../services/resolveStoredTown'
import { saveResolvedTown } from '../services/saveResolvedTown'
import type { ChangedTown } from '../Town'

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
  const resolved = await resolveStoredTown(playerId, towns, catalog, clock.now())
  if (!resolved.ok) {
    return resolved
  }
  const saved = await saveResolvedTown(resolved.value, towns, news)
  if (!saved.ok) {
    return saved
  }
  return ok(resolved.value)
}
