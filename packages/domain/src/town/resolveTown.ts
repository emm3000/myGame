import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
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
  if (resolved.value.events.length === 0) {
    return resolved
  }
  const saved = await saveChangedTown(resolved.value, towns, news)
  if (!saved.ok) {
    return saved
  }
  return ok(resolved.value)
}
