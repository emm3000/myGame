import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { finishBuildingWork } from './finishBuildingWork'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownRepository } from './TownRepository'

export const resolvedTownOf = async (
  playerId: PlayerId,
  towns: TownRepository,
  catalog: TownCatalog,
  now: Instant,
): Promise<Result<ChangedTown, DomainError>> => {
  const stored = await towns.townOf(playerId)
  if (!stored.ok) {
    return stored
  }
  if (stored.value === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  const finished = finishBuildingWork(stored.value, catalog, now)
  if (!finished.ok) {
    return finished
  }
  const closed = finished.value.town.closeHiring(now)
  return ok({ town: closed.town, events: [...finished.value.events, ...closed.events] })
}
